package domain

import "time"

// IntegrationRequest representa uma solicitação de nova integração
type IntegrationRequest struct {
	ID               string    `json:"id" db:"id"`
	UserID           string    `json:"user_id" db:"user_id"`
	UserEmail        string    `json:"user_email" db:"user_email"`
	UserName         string    `json:"user_name" db:"user_name"`
	Name             string    `json:"name" db:"name"`
	Description      string    `json:"description" db:"description"`
	UseCase          string    `json:"use_case" db:"use_case"`
	Website          *string   `json:"website,omitempty" db:"website"`
	APIDocumentation *string   `json:"api_documentation,omitempty" db:"api_documentation"`
	Priority         string    `json:"priority" db:"priority"` // 'low', 'medium', 'high'
	Status           string    `json:"status" db:"status"`     // 'pending', 'reviewing', 'approved', 'rejected', 'implemented'
	CreatedAt        time.Time `json:"created_at" db:"created_at"`
	UpdatedAt        time.Time `json:"updated_at" db:"updated_at"`
}

// CreateIntegrationRequestInput representa o input para criar uma solicitação
type CreateIntegrationRequestInput struct {
	Name             string  `json:"name" binding:"required"`
	Description      string  `json:"description" binding:"required"`
	UseCase          string  `json:"useCase" binding:"required"`
	Website          *string `json:"website,omitempty"`
	APIDocumentation *string `json:"apiDocumentation,omitempty"`
	Priority         string  `json:"priority" binding:"required,oneof=low medium high"`
}

// IntegrationRequestListResponse representa a resposta de listagem
type IntegrationRequestListResponse struct {
	Requests []IntegrationRequest `json:"requests"`
	Total    int                  `json:"total"`
}
