package domain

import (
	"encoding/json"
	"time"
)

// SSOSettings represents Single Sign-On provider configuration
type SSOSettings struct {
	ID        int             `json:"id"`
	Provider  string          `json:"provider"` // google, microsoft
	Enabled   bool            `json:"enabled"`
	Config    json.RawMessage `json:"config"`
	CreatedAt time.Time       `json:"createdAt"`
	UpdatedAt time.Time       `json:"updatedAt"`
}

// GoogleSSOConfig represents Google OAuth 2.0 configuration
type GoogleSSOConfig struct {
	ClientID     string  `json:"clientId"`
	ClientSecret string  `json:"clientSecret"`
	HostedDomain *string `json:"hostedDomain,omitempty"` // Optional: restrict to specific domain
	RedirectURI  string  `json:"redirectUri"`
}

// MicrosoftSSOConfig represents Microsoft Azure AD configuration
type MicrosoftSSOConfig struct {
	ClientID     string `json:"clientId"`
	ClientSecret string `json:"clientSecret"`
	TenantID     string `json:"tenantId"` // "common" or specific tenant ID
	RedirectURI  string `json:"redirectUri"`
}

// SSOProvider constants
const (
	SSOProviderGoogle    = "google"
	SSOProviderMicrosoft = "microsoft"
)

// ValidateProvider checks if the provider is valid
func ValidateProvider(provider string) bool {
	return provider == SSOProviderGoogle || provider == SSOProviderMicrosoft
}

// SSOTestRequest represents a test connection request
type SSOTestRequest struct {
	ClientID     string  `json:"clientId" binding:"required"`
	ClientSecret string  `json:"clientSecret" binding:"required"`
	TenantID     *string `json:"tenantId,omitempty"`      // For Microsoft
	HostedDomain *string `json:"hostedDomain,omitempty"`  // For Google
	RedirectURI  string  `json:"redirectUri" binding:"required"`
}

// SSOTestResponse represents the result of a connection test
type SSOTestResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Error   string `json:"error,omitempty"`
	Details string `json:"details,omitempty"`
}
