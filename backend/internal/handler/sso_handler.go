package handler

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/PlatifyX/platifyx-core/internal/domain"
	"github.com/PlatifyX/platifyx-core/internal/repository"
	"github.com/PlatifyX/platifyx-core/internal/service"
	"github.com/gin-gonic/gin"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"golang.org/x/oauth2/microsoft"
)

type SSOHandler struct {
	ssoRepo      *repository.SSORepository
	userRepo     *repository.UserRepository
	authService  *service.AuthService
	cacheService *service.CacheService
	frontendURL  string
}

func NewSSOHandler(
	ssoRepo *repository.SSORepository,
	userRepo *repository.UserRepository,
	authService *service.AuthService,
	cacheService *service.CacheService,
	frontendURL string,
) *SSOHandler {
	return &SSOHandler{
		ssoRepo:      ssoRepo,
		userRepo:     userRepo,
		authService:  authService,
		cacheService: cacheService,
		frontendURL:  frontendURL,
	}
}

// LoginWithSSO inicia o fluxo OAuth2
func (h *SSOHandler) LoginWithSSO(c *gin.Context) {
	provider := c.Param("provider")

	// Buscar configuração do SSO
	config, err := h.ssoRepo.GetByProvider(provider)
	if err != nil || !config.Enabled {
		c.JSON(http.StatusBadRequest, gin.H{"error": "SSO provider not configured or disabled"})
		return
	}

	// Criar OAuth2 config
	oauth2Config := h.getOAuth2Config(config)
	if oauth2Config == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid SSO configuration"})
		return
	}

	// Gerar state token criptográfico único para segurança (prevenção CSRF)
	state := h.generateStateToken()

	// Armazenar state no cache com TTL de 5 minutos
	if h.cacheService != nil {
		cacheKey := fmt.Sprintf("sso:state:%s", state)
		if err := h.cacheService.Set(cacheKey, provider, 5*time.Minute); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to initialize SSO session"})
			return
		}
	}

	// Redirecionar para página de autenticação do provider
	url := oauth2Config.AuthCodeURL(state, oauth2.AccessTypeOffline)
	c.Redirect(http.StatusTemporaryRedirect, url)
}

// CallbackSSO processa o retorno do OAuth2
func (h *SSOHandler) CallbackSSO(c *gin.Context) {
	provider := c.Param("provider")
	code := c.Query("code")
	state := c.Query("state")

	if code == "" {
		frontendCallback := fmt.Sprintf("%s/login?error=Missing+authorization+code", h.frontendURL)
		c.Redirect(http.StatusTemporaryRedirect, frontendCallback)
		return
	}

	// Validar state token (prevenção CSRF)
	if state != "" && h.cacheService != nil {
		cacheKey := fmt.Sprintf("sso:state:%s", state)
		storedProvider, err := h.cacheService.Get(cacheKey)

		if err != nil || storedProvider != provider {
			// State inválido ou expirado - possível ataque CSRF
			frontendCallback := fmt.Sprintf("%s/login?error=Invalid+SSO+session", h.frontendURL)
			c.Redirect(http.StatusTemporaryRedirect, frontendCallback)
			return
		}

		// Deletar state do cache para prevenir reuso
		h.cacheService.Delete(cacheKey)
	}

	// Buscar configuração do SSO
	config, err := h.ssoRepo.GetByProvider(provider)
	if err != nil || !config.Enabled {
		c.JSON(http.StatusBadRequest, gin.H{"error": "SSO provider not configured or disabled"})
		return
	}

	// Criar OAuth2 config
	oauth2Config := h.getOAuth2Config(config)
	if oauth2Config == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid SSO configuration"})
		return
	}

	// Trocar code por token
	token, err := oauth2Config.Exchange(context.Background(), code)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to exchange token"})
		return
	}

	// Buscar informações do usuário
	userInfo, err := h.fetchUserInfo(provider, token.AccessToken)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user info"})
		return
	}

	// Validar domínio permitido
	if len(config.AllowedDomains) > 0 {
		emailDomain := strings.Split(userInfo.Email, "@")[1]
		allowed := false
		for _, domain := range config.AllowedDomains {
			if domain == emailDomain {
				allowed = true
				break
			}
		}
		if !allowed {
			c.JSON(http.StatusForbidden, gin.H{"error": "Email domain not allowed"})
			return
		}
	}

	// Buscar ou criar usuário
	user, err := h.userRepo.GetByEmail(userInfo.Email)
	if err != nil {
		// Criar novo usuário SSO
		user = &domain.User{
			Email:       userInfo.Email,
			Name:        userInfo.Name,
			AvatarURL:   &userInfo.Picture,
			IsSSO:       true,
			SSOProvider: &provider,
			IsActive:    true,
		}

		if err := h.userRepo.Create(user); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
			return
		}
	} else {
		// Atualizar informações do usuário existente
		if !user.IsSSO {
			c.JSON(http.StatusBadRequest, gin.H{"error": "User exists with local authentication"})
			return
		}

		if !user.IsActive {
			c.JSON(http.StatusForbidden, gin.H{"error": "User account is disabled"})
			return
		}

		// Atualizar último login
		user.LastLoginAt = &time.Time{}
		*user.LastLoginAt = time.Now()
		h.userRepo.Update(user)
	}

	// Fazer login via SSO
	ipAddress := c.ClientIP()
	userAgent := c.GetHeader("User-Agent")

	loginResp, err := h.authService.LoginWithSSO(user.ID, ipAddress, userAgent)
	if err != nil {
		frontendCallback := fmt.Sprintf("%s/login?error=%s", h.frontendURL, err.Error())
		c.Redirect(http.StatusTemporaryRedirect, frontendCallback)
		return
	}

	// Redirecionar para o frontend com o token
	frontendCallback := fmt.Sprintf("%s/auth/callback/%s?token=%s",
		h.frontendURL, provider, loginResp.Token)
	c.Redirect(http.StatusTemporaryRedirect, frontendCallback)
}

// getOAuth2Config retorna a configuração OAuth2 para o provider
func (h *SSOHandler) getOAuth2Config(config *domain.SSOConfig) *oauth2.Config {
	var endpoint oauth2.Endpoint

	switch config.Provider {
	case "google":
		endpoint = google.Endpoint
	case "microsoft":
		tenantID := "common"
		if config.TenantID != nil && *config.TenantID != "" {
			tenantID = *config.TenantID
		}
		endpoint = microsoft.AzureADEndpoint(tenantID)
	default:
		return nil
	}

	return &oauth2.Config{
		ClientID:     config.ClientID,
		ClientSecret: config.ClientSecret,
		RedirectURL:  config.RedirectURI,
		Scopes:       h.getScopes(config.Provider),
		Endpoint:     endpoint,
	}
}

// getScopes retorna os scopes necessários por provider
func (h *SSOHandler) getScopes(provider string) []string {
	switch provider {
	case "google":
		return []string{
			"https://www.googleapis.com/auth/userinfo.email",
			"https://www.googleapis.com/auth/userinfo.profile",
		}
	case "microsoft":
		return []string{
			"openid",
			"profile",
			"email",
			"User.Read",
		}
	default:
		return []string{}
	}
}

// UserInfo representa as informações básicas do usuário retornadas pelo SSO
type UserInfo struct {
	Email   string `json:"email"`
	Name    string `json:"name"`
	Picture string `json:"picture"`
}

// fetchUserInfo busca informações do usuário do provider
func (h *SSOHandler) fetchUserInfo(provider, accessToken string) (*UserInfo, error) {
	var userInfoURL string

	switch provider {
	case "google":
		userInfoURL = "https://www.googleapis.com/oauth2/v2/userinfo"
	case "microsoft":
		userInfoURL = "https://graph.microsoft.com/v1.0/me"
	default:
		return nil, fmt.Errorf("unsupported provider")
	}

	req, err := http.NewRequest("GET", userInfoURL, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+accessToken)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to fetch user info: %s", resp.Status)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	// Parse response baseado no provider
	switch provider {
	case "google":
		var googleUser struct {
			Email   string `json:"email"`
			Name    string `json:"name"`
			Picture string `json:"picture"`
		}
		if err := json.Unmarshal(body, &googleUser); err != nil {
			return nil, err
		}
		return &UserInfo{
			Email:   googleUser.Email,
			Name:    googleUser.Name,
			Picture: googleUser.Picture,
		}, nil

	case "microsoft":
		var msUser struct {
			Mail        string `json:"mail"`
			DisplayName string `json:"displayName"`
			ID          string `json:"id"`
		}
		if err := json.Unmarshal(body, &msUser); err != nil {
			return nil, err
		}
		return &UserInfo{
			Email:   msUser.Mail,
			Name:    msUser.DisplayName,
			Picture: fmt.Sprintf("https://graph.microsoft.com/v1.0/users/%s/photo/$value", msUser.ID),
		}, nil

	default:
		return nil, fmt.Errorf("unsupported provider")
	}
}

// generateStateToken gera um token aleatório criptográfico de 32 bytes
func (h *SSOHandler) generateStateToken() string {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		// Fallback para timestamp se random falhar
		return fmt.Sprintf("%d", time.Now().UnixNano())
	}
	return hex.EncodeToString(b)
}
