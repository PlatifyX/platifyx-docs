package domain

import (
	"time"
)

// User represents a system user
type User struct {
	ID           int        `json:"id"`
	Email        string     `json:"email"`
	Name         string     `json:"name"`
	PasswordHash string     `json:"-"` // Never expose password hash in JSON
	AvatarURL    *string    `json:"avatarUrl,omitempty"`
	Provider     *string    `json:"provider,omitempty"` // google, microsoft, local
	ProviderID   *string    `json:"providerId,omitempty"`
	IsActive     bool       `json:"isActive"`
	LastLoginAt  *time.Time `json:"lastLoginAt,omitempty"`
	CreatedAt    time.Time  `json:"createdAt"`
	UpdatedAt    time.Time  `json:"updatedAt"`
	Roles        []Role     `json:"roles,omitempty"`
}

// Role represents a user role/profile
type Role struct {
	ID          int          `json:"id"`
	Name        string       `json:"name"`
	DisplayName string       `json:"displayName"`
	Description *string      `json:"description,omitempty"`
	IsSystem    bool         `json:"isSystem"`
	CreatedAt   time.Time    `json:"createdAt"`
	UpdatedAt   time.Time    `json:"updatedAt"`
	Permissions []Permission `json:"permissions,omitempty"`
}

// Permission represents a granular permission
type Permission struct {
	ID          int       `json:"id"`
	Resource    string    `json:"resource"`
	Action      string    `json:"action"`
	Description *string   `json:"description,omitempty"`
	CreatedAt   time.Time `json:"createdAt"`
}

// AuditLog represents an audit log entry
type AuditLog struct {
	ID         int       `json:"id"`
	UserID     *int      `json:"userId,omitempty"`
	Action     string    `json:"action"`
	Resource   string    `json:"resource"`
	ResourceID *int      `json:"resourceId,omitempty"`
	Details    *string   `json:"details,omitempty"`
	IPAddress  *string   `json:"ipAddress,omitempty"`
	UserAgent  *string   `json:"userAgent,omitempty"`
	CreatedAt  time.Time `json:"createdAt"`
}

// UserRole represents the assignment of a role to a user
type UserRole struct {
	UserID     int       `json:"userId"`
	RoleID     int       `json:"roleId"`
	AssignedAt time.Time `json:"assignedAt"`
	AssignedBy *int      `json:"assignedBy,omitempty"`
}

// RolePermission represents the assignment of a permission to a role
type RolePermission struct {
	RoleID       int       `json:"roleId"`
	PermissionID int       `json:"permissionId"`
	CreatedAt    time.Time `json:"createdAt"`
}

// CreateUserRequest represents a request to create a new user
type CreateUserRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Name     string `json:"name" binding:"required"`
	Password string `json:"password" binding:"required,min=8"`
	RoleIDs  []int  `json:"roleIds"`
}

// UpdateUserRequest represents a request to update a user
type UpdateUserRequest struct {
	Name      *string `json:"name"`
	Email     *string `json:"email" binding:"omitempty,email"`
	IsActive  *bool   `json:"isActive"`
	AvatarURL *string `json:"avatarUrl"`
	RoleIDs   []int   `json:"roleIds"`
}

// CreateRoleRequest represents a request to create a new role
type CreateRoleRequest struct {
	Name          string  `json:"name" binding:"required"`
	DisplayName   string  `json:"displayName" binding:"required"`
	Description   *string `json:"description"`
	PermissionIDs []int   `json:"permissionIds"`
}

// UpdateRoleRequest represents a request to update a role
type UpdateRoleRequest struct {
	DisplayName   *string `json:"displayName"`
	Description   *string `json:"description"`
	PermissionIDs []int   `json:"permissionIds"`
}

// LoginRequest represents a login request
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// LoginResponse represents a login response
type LoginResponse struct {
	Token     string `json:"token"`
	User      User   `json:"user"`
	ExpiresAt int64  `json:"expiresAt"`
}

// ChangePasswordRequest represents a password change request
type ChangePasswordRequest struct {
	OldPassword string `json:"oldPassword" binding:"required"`
	NewPassword string `json:"newPassword" binding:"required,min=8"`
}

// AssignRolesRequest represents a request to assign roles to a user
type AssignRolesRequest struct {
	RoleIDs []int `json:"roleIds" binding:"required"`
}

// AssignPermissionsRequest represents a request to assign permissions to a role
type AssignPermissionsRequest struct {
	PermissionIDs []int `json:"permissionIds" binding:"required"`
}

// UserStats represents user statistics
type UserStats struct {
	TotalUsers   int `json:"totalUsers"`
	ActiveUsers  int `json:"activeUsers"`
	TotalRoles   int `json:"totalRoles"`
	TotalActions int `json:"totalActions"` // from audit logs
}

// HasPermission checks if a user has a specific permission
func (u *User) HasPermission(resource, action string) bool {
	for _, role := range u.Roles {
		for _, perm := range role.Permissions {
			if perm.Resource == resource && perm.Action == action {
				return true
			}
		}
	}
	return false
}

// HasRole checks if a user has a specific role
func (u *User) HasRole(roleName string) bool {
	for _, role := range u.Roles {
		if role.Name == roleName {
			return true
		}
	}
	return false
}

// IsAdmin checks if a user is an administrator
func (u *User) IsAdmin() bool {
	return u.HasRole("admin")
}
