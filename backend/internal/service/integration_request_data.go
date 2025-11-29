package service

import "time"

// IntegrationRequestData representa os dados para envio de email
type IntegrationRequestData struct {
	Name             string
	Description      string
	UseCase          string
	Website          *string
	APIDocumentation *string
	Priority         string
	UserName         string
	UserEmail        string
	CreatedAt        time.Time
}
