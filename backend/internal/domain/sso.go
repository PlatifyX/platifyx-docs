package domain

import (
	"encoding/json"
	"time"
)

// SSOConfig representa a configuração de um provedor SSO
type SSOConfig struct {
	ID            string          `json:"id" db:"id"`
	Provider      string          `json:"provider" db:"provider"` // 'google', 'microsoft'
	Enabled       bool            `json:"enabled" db:"enabled"`
	ClientID      string          `json:"client_id" db:"client_id"`
	ClientSecret  string          `json:"-" db:"client_secret"` // Não expor no JSON
	TenantID      *string         `json:"tenant_id,omitempty" db:"tenant_id"` // Para Microsoft
	RedirectURI   string          `json:"redirect_uri" db:"redirect_uri"`
	AllowedDomains []string       `json:"allowed_domains,omitempty" db:"-"`
	AllowedDomainsJSON string     `json:"-" db:"allowed_domains"` // Armazenamento no DB
	Config        json.RawMessage `json:"config,omitempty" db:"config"`
	CreatedAt     time.Time       `json:"created_at" db:"created_at"`
	UpdatedAt     time.Time       `json:"updated_at" db:"updated_at"`
}

// CreateSSOConfigRequest representa o request para criar/atualizar SSO config
type CreateSSOConfigRequest struct {
	Provider       string   `json:"provider" binding:"required"`
	Enabled        bool     `json:"enabled"`
	ClientID       string   `json:"client_id" binding:"required"`
	ClientSecret   string   `json:"client_secret" binding:"required"`
	TenantID       *string  `json:"tenant_id,omitempty"`
	RedirectURI    string   `json:"redirect_uri" binding:"required"`
	AllowedDomains []string `json:"allowed_domains,omitempty"`
}

// UpdateSSOConfigRequest representa o request para atualizar SSO config
type UpdateSSOConfigRequest struct {
	Enabled        *bool    `json:"enabled,omitempty"`
	ClientID       *string  `json:"client_id,omitempty"`
	ClientSecret   *string  `json:"client_secret,omitempty"`
	TenantID       *string  `json:"tenant_id,omitempty"`
	RedirectURI    *string  `json:"redirect_uri,omitempty"`
	AllowedDomains []string `json:"allowed_domains,omitempty"`
}

// SSOListResponse representa a resposta de listagem de configurações SSO
type SSOListResponse struct {
	Configs []SSOConfig `json:"configs"`
	Total   int         `json:"total"`
}

// SSOAuthRequest representa o request de autenticação SSO
type SSOAuthRequest struct {
	Provider string `json:"provider" binding:"required"`
	Code     string `json:"code" binding:"required"`
	State    string `json:"state,omitempty"`
}

// SSOAuthResponse representa a resposta de autenticação SSO
type SSOAuthResponse struct {
	User         User   `json:"user"`
	Token        string `json:"token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int    `json:"expires_in"`
}

// SSOUserInfo representa as informações do usuário retornadas pelo provedor SSO
type SSOUserInfo struct {
	ID       string `json:"id"`
	Email    string `json:"email"`
	Name     string `json:"name"`
	Picture  string `json:"picture"`
	Provider string `json:"provider"`
}
