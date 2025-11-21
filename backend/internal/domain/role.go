package domain

import "time"

// Role representa um papel/perfil no sistema
type Role struct {
	ID          string    `json:"id" db:"id"`
	Name        string    `json:"name" db:"name"`
	DisplayName string    `json:"display_name" db:"display_name"`
	Description *string   `json:"description,omitempty" db:"description"`
	IsSystem    bool      `json:"is_system" db:"is_system"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`

	// Relacionamentos
	Permissions []Permission `json:"permissions,omitempty" db:"-"`
}

// Permission representa uma permissão no sistema
type Permission struct {
	ID          string    `json:"id" db:"id"`
	Resource    string    `json:"resource" db:"resource"`
	Action      string    `json:"action" db:"action"`
	Description *string   `json:"description,omitempty" db:"description"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
}

// CreateRoleRequest representa o request para criar um role
type CreateRoleRequest struct {
	Name          string   `json:"name" binding:"required"`
	DisplayName   string   `json:"display_name" binding:"required"`
	Description   *string  `json:"description,omitempty"`
	PermissionIDs []string `json:"permission_ids,omitempty"`
}

// UpdateRoleRequest representa o request para atualizar um role
type UpdateRoleRequest struct {
	DisplayName   *string  `json:"display_name,omitempty"`
	Description   *string  `json:"description,omitempty"`
	PermissionIDs []string `json:"permission_ids,omitempty"`
}

// RoleListResponse representa a resposta de listagem de roles
type RoleListResponse struct {
	Roles []Role `json:"roles"`
	Total int    `json:"total"`
}

// PermissionListResponse representa a resposta de listagem de permissões
type PermissionListResponse struct {
	Permissions []Permission `json:"permissions"`
	Total       int          `json:"total"`
}

// UserPermissions representa as permissões efetivas de um usuário
type UserPermissions struct {
	UserID      string              `json:"user_id"`
	Roles       []Role              `json:"roles"`
	Permissions []Permission        `json:"permissions"`
	PermissionMap map[string][]string `json:"permission_map"` // resource -> actions
}

// HasPermission verifica se o usuário tem uma permissão específica
func (up *UserPermissions) HasPermission(resource, action string) bool {
	if actions, ok := up.PermissionMap[resource]; ok {
		for _, a := range actions {
			if a == action || a == "manage" {
				return true
			}
		}
	}
	return false
}

// IsAdmin verifica se o usuário tem o role de admin
func (up *UserPermissions) IsAdmin() bool {
	for _, role := range up.Roles {
		if role.Name == "admin" {
			return true
		}
	}
	return false
}
