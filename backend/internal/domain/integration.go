package domain

import (
	"encoding/json"
	"time"
)

type Integration struct {
	ID        int             `json:"id"`
	Name      string          `json:"name"`
	Type      string          `json:"type"`
	Enabled   bool            `json:"enabled"`
	Config    json.RawMessage `json:"config"`
	CreatedAt time.Time       `json:"createdAt"`
	UpdatedAt time.Time       `json:"updatedAt"`
}

type AzureDevOpsIntegrationConfig struct {
	Organization string `json:"organization"`
	Project      string `json:"project"`
	PAT          string `json:"pat"`
}

type SonarQubeIntegrationConfig struct {
	URL   string `json:"url"`
	Token string `json:"token"`
}

type IntegrationType string

const (
	IntegrationTypeAzureDevOps IntegrationType = "azuredevops"
	IntegrationTypeGitHub      IntegrationType = "github"
	IntegrationTypeGitLab      IntegrationType = "gitlab"
	IntegrationTypeSonarQube   IntegrationType = "sonarqube"
)
