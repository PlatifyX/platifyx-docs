package domain

import "time"

// OpenVPNUser representa um usuário do OpenVPN
type OpenVPNUser struct {
	ID        string    `json:"id"`
	Username  string    `json:"username"`
	Email     string    `json:"email,omitempty"`
	Enabled   bool      `json:"enabled"`
	CreatedAt time.Time `json:"createdAt,omitempty"`
	UpdatedAt time.Time `json:"updatedAt,omitempty"`
}

// CreateOpenVPNUserRequest representa a requisição para criar um usuário
type CreateOpenVPNUserRequest struct {
	Username string `json:"username" binding:"required"`
	Email    string `json:"email,omitempty"`
	Password string `json:"password,omitempty"`
}

// UpdateOpenVPNUserRequest representa a requisição para atualizar um usuário
type UpdateOpenVPNUserRequest struct {
	Email    string `json:"email,omitempty"`
	Enabled  *bool  `json:"enabled,omitempty"`
	Password string `json:"password,omitempty"`
}
