package service

import (
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"time"

	"github.com/PlatifyX/platifyx-core/internal/domain"
	"github.com/PlatifyX/platifyx-core/internal/repository"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrUserNotActive      = errors.New("user not active")
	ErrInvalidToken       = errors.New("invalid token")
)

type AuthService struct {
	userRepo    *repository.UserRepository
	sessionRepo *repository.SessionRepository
	auditRepo   *repository.AuditRepository
	jwtSecret   string
}

func NewAuthService(
	userRepo *repository.UserRepository,
	sessionRepo *repository.SessionRepository,
	auditRepo *repository.AuditRepository,
	jwtSecret string,
) *AuthService {
	return &AuthService{
		userRepo:    userRepo,
		sessionRepo: sessionRepo,
		auditRepo:   auditRepo,
		jwtSecret:   jwtSecret,
	}
}

// Login autentica um usuário
func (s *AuthService) Login(req domain.LoginRequest, ipAddress, userAgent string) (*domain.LoginResponse, error) {
	// Buscar usuário por email
	user, err := s.userRepo.GetByEmail(req.Email)
	if err != nil {
		s.logAudit(nil, req.Email, "user.login", "user", nil, ipAddress, userAgent, "failure")
		return nil, ErrInvalidCredentials
	}

	// Verificar se o usuário está ativo
	if !user.IsActive {
		s.logAudit(&user.ID, req.Email, "user.login", "user", &user.ID, ipAddress, userAgent, "failure")
		return nil, ErrUserNotActive
	}

	// Verificar senha (só para usuários não-SSO)
	if user.IsSSO {
		return nil, errors.New("SSO users must login through their provider")
	}

	if user.PasswordHash == nil || !s.checkPasswordHash(req.Password, *user.PasswordHash) {
		s.logAudit(&user.ID, req.Email, "user.login", "user", &user.ID, ipAddress, userAgent, "failure")
		return nil, ErrInvalidCredentials
	}

	// Gerar tokens
	token, refreshToken, expiresIn, err := s.generateTokens(user.ID)
	if err != nil {
		return nil, err
	}

	// Criar sessão
	session := &domain.Session{
		UserID:       user.ID,
		Token:        token,
		RefreshToken: &refreshToken,
		IPAddress:    &ipAddress,
		UserAgent:    &userAgent,
		ExpiresAt:    time.Now().Add(time.Duration(expiresIn) * time.Second),
	}

	if err := s.sessionRepo.Create(session); err != nil {
		return nil, err
	}

	// Atualizar último login
	s.userRepo.UpdateLastLogin(user.ID)

	// Log de auditoria
	s.logAudit(&user.ID, user.Email, "user.login", "user", &user.ID, ipAddress, userAgent, "success")

	// Carregar roles e teams
	user.Roles, _ = s.userRepo.GetUserRoles(user.ID)
	user.Teams, _ = s.userRepo.GetUserTeams(user.ID)

	return &domain.LoginResponse{
		User:         *user,
		Token:        token,
		RefreshToken: refreshToken,
		ExpiresIn:    expiresIn,
	}, nil
}

// Logout faz logout de um usuário
func (s *AuthService) Logout(token string) error {
	return s.sessionRepo.Delete(token)
}

// RefreshToken renova um token
func (s *AuthService) RefreshToken(req domain.RefreshTokenRequest) (*domain.RefreshTokenResponse, error) {
	session, err := s.sessionRepo.GetByRefreshToken(req.RefreshToken)
	if err != nil {
		return nil, ErrInvalidToken
	}

	// Verificar se a sessão expirou
	if session.ExpiresAt.Before(time.Now()) {
		s.sessionRepo.Delete(session.Token)
		return nil, errors.New("session expired")
	}

	// Gerar novos tokens
	token, refreshToken, expiresIn, err := s.generateTokens(session.UserID)
	if err != nil {
		return nil, err
	}

	// Atualizar sessão
	session.Token = token
	session.RefreshToken = &refreshToken
	session.ExpiresAt = time.Now().Add(time.Duration(expiresIn) * time.Second)

	if err := s.sessionRepo.Update(session); err != nil {
		return nil, err
	}

	return &domain.RefreshTokenResponse{
		Token:        token,
		RefreshToken: refreshToken,
		ExpiresIn:    expiresIn,
	}, nil
}

// ValidateToken valida um token JWT
func (s *AuthService) ValidateToken(tokenString string) (string, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(s.jwtSecret), nil
	})

	if err != nil {
		return "", err
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		userID, ok := claims["user_id"].(string)
		if !ok {
			return "", ErrInvalidToken
		}

		// Verificar se a sessão existe e é válida
		valid, err := s.sessionRepo.IsValid(tokenString)
		if err != nil || !valid {
			return "", ErrInvalidToken
		}

		return userID, nil
	}

	return "", ErrInvalidToken
}

// GetUserFromToken retorna o usuário a partir do token
func (s *AuthService) GetUserFromToken(tokenString string) (*domain.User, error) {
	userID, err := s.ValidateToken(tokenString)
	if err != nil {
		return nil, err
	}

	return s.userRepo.GetByID(userID)
}

// ChangePassword altera a senha de um usuário
func (s *AuthService) ChangePassword(userID string, req domain.ChangePasswordRequest) error {
	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return err
	}

	// Verificar senha antiga
	if user.PasswordHash == nil || !s.checkPasswordHash(req.OldPassword, *user.PasswordHash) {
		return errors.New("invalid old password")
	}

	// Hash da nova senha
	newPasswordHash, err := s.hashPassword(req.NewPassword)
	if err != nil {
		return err
	}

	// Atualizar senha
	if err := s.userRepo.UpdatePassword(userID, newPasswordHash); err != nil {
		return err
	}

	// Invalidar todas as sessões do usuário (força novo login)
	s.sessionRepo.DeleteUserSessions(userID)

	// Log de auditoria
	s.logAudit(&userID, user.Email, "user.password_changed", "user", &userID, "", "", "success")

	return nil
}

// generateTokens gera JWT token e refresh token
func (s *AuthService) generateTokens(userID string) (string, string, int, error) {
	expiresIn := 3600 * 24 // 24 horas

	// JWT Token
	claims := jwt.MapClaims{
		"user_id": userID,
		"exp":     time.Now().Add(time.Duration(expiresIn) * time.Second).Unix(),
		"iat":     time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(s.jwtSecret))
	if err != nil {
		return "", "", 0, err
	}

	// Refresh Token (random string)
	refreshToken, err := s.generateRandomToken(32)
	if err != nil {
		return "", "", 0, err
	}

	return tokenString, refreshToken, expiresIn, nil
}

// hashPassword faz hash da senha usando bcrypt
func (s *AuthService) hashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}

// checkPasswordHash verifica se a senha corresponde ao hash
func (s *AuthService) checkPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

// generateRandomToken gera um token aleatório
func (s *AuthService) generateRandomToken(length int) (string, error) {
	bytes := make([]byte, length)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(bytes), nil
}

// logAudit registra um log de auditoria
func (s *AuthService) logAudit(userID *string, userEmail, action, resource string, resourceID *string, ipAddress, userAgent, status string) {
	log := &domain.AuditLog{
		UserID:     userID,
		UserEmail:  userEmail,
		Action:     action,
		Resource:   resource,
		ResourceID: resourceID,
		Status:     status,
	}

	if ipAddress != "" {
		log.IPAddress = &ipAddress
	}

	if userAgent != "" {
		log.UserAgent = &userAgent
	}

	s.auditRepo.Create(log)
}

// CleanupExpiredSessions limpa sessões expiradas
func (s *AuthService) CleanupExpiredSessions() (int64, error) {
	return s.sessionRepo.DeleteExpiredSessions()
}
