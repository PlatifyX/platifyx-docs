package domain

import "time"

type OrganizationUser struct {
	ID          string     `json:"id" db:"id"`
	Email       string     `json:"email" db:"email"`
	Name        string     `json:"name" db:"name"`
	AvatarURL   *string    `json:"avatarUrl,omitempty" db:"avatar_url"`
	PasswordHash *string   `json:"-" db:"password_hash"`
	IsActive    bool       `json:"isActive" db:"is_active"`
	IsSSO       bool       `json:"isSso" db:"is_sso"`
	SSOProvider *string    `json:"ssoProvider,omitempty" db:"sso_provider"`
	SSOID       *string    `json:"ssoId,omitempty" db:"sso_id"`
	LastLoginAt *time.Time `json:"lastLoginAt,omitempty" db:"last_login_at"`
	CreatedAt   time.Time  `json:"createdAt" db:"created_at"`
	UpdatedAt   time.Time  `json:"updatedAt" db:"updated_at"`
}

type CreateOrganizationUserRequest struct {
	Email       string  `json:"email" binding:"required"`
	Name        string  `json:"name" binding:"required"`
	Password    *string `json:"password"`
	AvatarURL   *string `json:"avatarUrl"`
	IsSSO       bool    `json:"isSso"`
	SSOProvider *string `json:"ssoProvider"`
	SSOID       *string `json:"ssoId"`
}

type UpdateOrganizationUserRequest struct {
	Name      *string `json:"name"`
	AvatarURL *string `json:"avatarUrl"`
	IsActive  *bool   `json:"isActive"`
	Password  *string `json:"password"`
}

