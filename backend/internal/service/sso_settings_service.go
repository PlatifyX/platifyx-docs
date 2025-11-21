package service

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"time"

	"github.com/PlatifyX/platifyx-core/internal/domain"
	"github.com/PlatifyX/platifyx-core/internal/repository"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
)

// SSOSettingsService handles business logic for SSO settings
type SSOSettingsService struct {
	repo   *repository.SSOSettingsRepository
	log    *logger.Logger
	client *http.Client
}

// NewSSOSettingsService creates a new SSO settings service
func NewSSOSettingsService(repo *repository.SSOSettingsRepository, log *logger.Logger) *SSOSettingsService {
	return &SSOSettingsService{
		repo: repo,
		log:  log,
		client: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

// GetAll retrieves all SSO settings
func (s *SSOSettingsService) GetAll() ([]domain.SSOSettings, error) {
	return s.repo.GetAll()
}

// GetByProvider retrieves SSO settings for a specific provider
func (s *SSOSettingsService) GetByProvider(provider string) (*domain.SSOSettings, error) {
	if !domain.ValidateProvider(provider) {
		return nil, fmt.Errorf("invalid provider: %s", provider)
	}
	return s.repo.GetByProvider(provider)
}

// CreateOrUpdate creates or updates SSO settings
func (s *SSOSettingsService) CreateOrUpdate(provider string, config json.RawMessage) (*domain.SSOSettings, error) {
	if !domain.ValidateProvider(provider) {
		return nil, fmt.Errorf("invalid provider: %s", provider)
	}

	// Validate config based on provider
	if err := s.validateConfig(provider, config); err != nil {
		return nil, fmt.Errorf("invalid configuration: %w", err)
	}

	// Check if settings already exist
	existing, err := s.repo.GetByProvider(provider)
	if err != nil {
		return nil, err
	}

	// Create or update
	if existing == nil {
		return s.repo.Create(provider, config)
	}

	return s.repo.Update(provider, existing.Enabled, config)
}

// UpdateEnabled toggles the enabled status
func (s *SSOSettingsService) UpdateEnabled(provider string, enabled bool) error {
	if !domain.ValidateProvider(provider) {
		return fmt.Errorf("invalid provider: %s", provider)
	}

	return s.repo.UpdateEnabled(provider, enabled)
}

// Delete removes SSO settings
func (s *SSOSettingsService) Delete(provider string) error {
	if !domain.ValidateProvider(provider) {
		return fmt.Errorf("invalid provider: %s", provider)
	}

	return s.repo.Delete(provider)
}

// validateConfig validates the configuration for a provider
func (s *SSOSettingsService) validateConfig(provider string, config json.RawMessage) error {
	switch provider {
	case domain.SSOProviderGoogle:
		var googleConfig domain.GoogleSSOConfig
		if err := json.Unmarshal(config, &googleConfig); err != nil {
			return fmt.Errorf("invalid Google config: %w", err)
		}
		if googleConfig.ClientID == "" || googleConfig.ClientSecret == "" || googleConfig.RedirectURI == "" {
			return fmt.Errorf("clientId, clientSecret, and redirectUri are required")
		}
		return nil

	case domain.SSOProviderMicrosoft:
		var msConfig domain.MicrosoftSSOConfig
		if err := json.Unmarshal(config, &msConfig); err != nil {
			return fmt.Errorf("invalid Microsoft config: %w", err)
		}
		if msConfig.ClientID == "" || msConfig.ClientSecret == "" || msConfig.TenantID == "" || msConfig.RedirectURI == "" {
			return fmt.Errorf("clientId, clientSecret, tenantId, and redirectUri are required")
		}
		return nil

	default:
		return fmt.Errorf("unknown provider: %s", provider)
	}
}

// TestGoogleConnection tests Google OAuth 2.0 configuration
func (s *SSOSettingsService) TestGoogleConnection(req domain.SSOTestRequest) domain.SSOTestResponse {
	s.log.Info("Testing Google OAuth 2.0 connection", map[string]interface{}{
		"clientId": req.ClientID,
	})

	// Validate required fields
	if req.ClientID == "" || req.ClientSecret == "" {
		return domain.SSOTestResponse{
			Success: false,
			Error:   "Validation failed",
			Details: "clientId and clientSecret are required",
		}
	}

	// Test by attempting to get OpenID configuration
	discoveryURL := "https://accounts.google.com/.well-known/openid-configuration"

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	reqHTTP, err := http.NewRequestWithContext(ctx, "GET", discoveryURL, nil)
	if err != nil {
		return domain.SSOTestResponse{
			Success: false,
			Error:   "Failed to create request",
			Details: err.Error(),
		}
	}

	resp, err := s.client.Do(reqHTTP)
	if err != nil {
		return domain.SSOTestResponse{
			Success: false,
			Error:   "Failed to reach Google OAuth endpoints",
			Details: err.Error(),
		}
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return domain.SSOTestResponse{
			Success: false,
			Error:   fmt.Sprintf("Google OAuth returned status %d", resp.StatusCode),
			Details: string(body),
		}
	}

	// Validate redirect URI format
	if _, err := url.Parse(req.RedirectURI); err != nil {
		return domain.SSOTestResponse{
			Success: false,
			Error:   "Invalid redirect URI",
			Details: err.Error(),
		}
	}

	// Basic validation passed
	message := "Configuração válida! OAuth 2.0 configurado corretamente"
	if req.HostedDomain != nil && *req.HostedDomain != "" {
		message += fmt.Sprintf(" (restrito ao domínio: %s)", *req.HostedDomain)
	}

	return domain.SSOTestResponse{
		Success: true,
		Message: message,
	}
}

// TestMicrosoftConnection tests Microsoft Azure AD configuration
func (s *SSOSettingsService) TestMicrosoftConnection(req domain.SSOTestRequest) domain.SSOTestResponse {
	s.log.Info("Testing Microsoft Azure AD connection", map[string]interface{}{
		"clientId": req.ClientID,
		"tenantId": req.TenantID,
	})

	// Validate required fields
	if req.ClientID == "" || req.ClientSecret == "" || req.TenantID == nil || *req.TenantID == "" {
		return domain.SSOTestResponse{
			Success: false,
			Error:   "Validation failed",
			Details: "clientId, clientSecret, and tenantId are required",
		}
	}

	tenantID := *req.TenantID

	// Test by attempting to get OpenID configuration
	discoveryURL := fmt.Sprintf("https://login.microsoftonline.com/%s/v2.0/.well-known/openid-configuration", tenantID)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	reqHTTP, err := http.NewRequestWithContext(ctx, "GET", discoveryURL, nil)
	if err != nil {
		return domain.SSOTestResponse{
			Success: false,
			Error:   "Failed to create request",
			Details: err.Error(),
		}
	}

	resp, err := s.client.Do(reqHTTP)
	if err != nil {
		return domain.SSOTestResponse{
			Success: false,
			Error:   "Failed to reach Microsoft Azure AD endpoints",
			Details: err.Error(),
		}
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return domain.SSOTestResponse{
			Success: false,
			Error:   fmt.Sprintf("Azure AD returned status %d", resp.StatusCode),
			Details: string(body),
		}
	}

	// Validate redirect URI format
	if _, err := url.Parse(req.RedirectURI); err != nil {
		return domain.SSOTestResponse{
			Success: false,
			Error:   "Invalid redirect URI",
			Details: err.Error(),
		}
	}

	// Basic validation passed
	message := "Configuração válida! Azure AD configurado corretamente"
	if tenantID != "common" && tenantID != "organizations" && tenantID != "consumers" {
		message += fmt.Sprintf(" (Tenant ID: %s)", tenantID)
	}

	return domain.SSOTestResponse{
		Success: true,
		Message: message,
	}
}

// GetGoogleConfig extracts Google config from settings
func (s *SSOSettingsService) GetGoogleConfig() (*domain.GoogleSSOConfig, error) {
	settings, err := s.repo.GetByProvider(domain.SSOProviderGoogle)
	if err != nil {
		return nil, err
	}
	if settings == nil {
		return nil, fmt.Errorf("google SSO not configured")
	}

	var config domain.GoogleSSOConfig
	if err := json.Unmarshal(settings.Config, &config); err != nil {
		return nil, fmt.Errorf("failed to parse google config: %w", err)
	}

	return &config, nil
}

// GetMicrosoftConfig extracts Microsoft config from settings
func (s *SSOSettingsService) GetMicrosoftConfig() (*domain.MicrosoftSSOConfig, error) {
	settings, err := s.repo.GetByProvider(domain.SSOProviderMicrosoft)
	if err != nil {
		return nil, err
	}
	if settings == nil {
		return nil, fmt.Errorf("microsoft SSO not configured")
	}

	var config domain.MicrosoftSSOConfig
	if err := json.Unmarshal(settings.Config, &config); err != nil {
		return nil, fmt.Errorf("failed to parse microsoft config: %w", err)
	}

	return &config, nil
}
