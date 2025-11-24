package domain

import "time"

type Organization struct {
	UUID                string    `json:"uuid" db:"uuid"`
	Name                string    `json:"name" db:"name"`
	SSOActive           bool      `json:"ssoActive" db:"sso_active"`
	DatabaseAddressWrite string   `json:"databaseAddressWrite" db:"database_address_write"`
	DatabaseAddressRead  string   `json:"databaseAddressRead" db:"database_address_read"`
	CreatedAt           time.Time `json:"createdAt" db:"created_at"`
	UpdatedAt           time.Time `json:"updatedAt" db:"updated_at"`
}

type CreateOrganizationRequest struct {
	Name                string `json:"name" binding:"required"`
	SSOActive           bool   `json:"ssoActive"`
	DatabaseAddressWrite string `json:"databaseAddressWrite"`
	DatabaseAddressRead  string `json:"databaseAddressRead"`
}

type UpdateOrganizationRequest struct {
	Name                string `json:"name"`
	SSOActive           *bool  `json:"ssoActive"`
	DatabaseAddressWrite string `json:"databaseAddressWrite"`
	DatabaseAddressRead  string `json:"databaseAddressRead"`
}

