package domain

import "time"

// User representa um usuário do sistema
type User struct {
	ID          string     `json:"id" db:"id"`
	Email       string     `json:"email" db:"email"`
	Name        string     `json:"name" db:"name"`
	AvatarURL   *string    `json:"avatar_url,omitempty" db:"avatar_url"`
	PasswordHash *string   `json:"-" db:"password_hash"` // Não expor no JSON
	IsActive    bool       `json:"is_active" db:"is_active"`
	IsSSO       bool       `json:"is_sso" db:"is_sso"`
	SSOProvider *string    `json:"sso_provider,omitempty" db:"sso_provider"`
	SSOID       *string    `json:"sso_id,omitempty" db:"sso_id"`
	LastLoginAt *time.Time `json:"last_login_at,omitempty" db:"last_login_at"`
	CreatedAt   time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at" db:"updated_at"`

	// Relacionamentos (carregados separadamente)
	Roles []Role `json:"roles,omitempty" db:"-"`
	Teams []Team `json:"teams,omitempty" db:"-"`
}

// UserWithPassword é usado para criação de usuários com senha
type UserWithPassword struct {
	User
	Password string `json:"password,omitempty"`
}

// CreateUserRequest representa o request para criar um usuário
type CreateUserRequest struct {
	Email    string   `json:"email" binding:"required,email"`
	Name     string   `json:"name" binding:"required"`
	Password *string  `json:"password,omitempty"` // Opcional se for SSO
	IsSSO    bool     `json:"is_sso"`
	RoleIDs  []string `json:"role_ids,omitempty"`
	TeamIDs  []string `json:"team_ids,omitempty"`
}

// UpdateUserRequest representa o request para atualizar um usuário
type UpdateUserRequest struct {
	Name      *string  `json:"name,omitempty"`
	AvatarURL *string  `json:"avatar_url,omitempty"`
	IsActive  *bool    `json:"is_active,omitempty"`
	RoleIDs   []string `json:"role_ids,omitempty"`
	TeamIDs   []string `json:"team_ids,omitempty"`
}

// UserListResponse representa a resposta de listagem de usuários
type UserListResponse struct {
	Users []User `json:"users"`
	Total int    `json:"total"`
	Page  int    `json:"page"`
	Size  int    `json:"size"`
}

// UserFilter representa os filtros para busca de usuários
type UserFilter struct {
	Search     string `form:"search"`
	IsActive   *bool  `form:"is_active"`
	IsSSO      *bool  `form:"is_sso"`
	RoleID     string `form:"role_id"`
	TeamID     string `form:"team_id"`
	Page       int    `form:"page"`
	Size       int    `form:"size"`
}
