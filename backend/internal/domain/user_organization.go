package domain

import "time"

type UserOrganization struct {
	ID             string    `json:"id" db:"id"`
	UserID         string    `json:"userId" db:"user_id"`
	OrganizationUUID string  `json:"organizationUuid" db:"organization_uuid"`
	Role           string    `json:"role" db:"role"`
	CreatedAt      time.Time `json:"createdAt" db:"created_at"`
	UpdatedAt      time.Time `json:"updatedAt" db:"updated_at"`
}

type UserOrganizationWithDetails struct {
	UserOrganization
	User         *User         `json:"user,omitempty"`
	Organization *Organization `json:"organization,omitempty"`
}

type AddUserToOrganizationRequest struct {
	UserID string `json:"userId" binding:"required"`
	Role   string `json:"role"`
}

type UpdateUserOrganizationRoleRequest struct {
	Role string `json:"role" binding:"required"`
}


