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

type AzureCloudIntegrationConfig struct {
	SubscriptionID string `json:"subscriptionId"`
	TenantID       string `json:"tenantId"`
	ClientID       string `json:"clientId"`
	ClientSecret   string `json:"clientSecret"`
}

type GCPCloudIntegrationConfig struct {
	ProjectID          string `json:"projectId"`
	ServiceAccountJSON string `json:"serviceAccountJson"`
}

type AWSCloudIntegrationConfig struct {
	AccessKeyID     string `json:"accessKeyId"`
	SecretAccessKey string `json:"secretAccessKey"`
	Region          string `json:"region"`
}

type KubernetesIntegrationConfig struct {
	Name       string `json:"name"`
	KubeConfig string `json:"kubeconfig"`
	Context    string `json:"context"`
}

type GrafanaIntegrationConfig struct {
	URL    string `json:"url"`
	APIKey string `json:"apiKey"`
}

type GitHubIntegrationConfig struct {
	Token        string `json:"token"`
	Organization string `json:"organization,omitempty"`
}

type OpenAIIntegrationConfig struct {
	APIKey       string `json:"apiKey"`
	Organization string `json:"organization,omitempty"`
}

type GeminiIntegrationConfig struct {
	APIKey string `json:"apiKey"`
}

type ClaudeIntegrationConfig struct {
	APIKey string `json:"apiKey"`
}

type IntegrationType string

const (
	IntegrationTypeAzureDevOps IntegrationType = "azuredevops"
	IntegrationTypeGitHub      IntegrationType = "github"
	IntegrationTypeGitLab      IntegrationType = "gitlab"
	IntegrationTypeSonarQube   IntegrationType = "sonarqube"
	IntegrationTypeAzureCloud  IntegrationType = "azure"
	IntegrationTypeGCP         IntegrationType = "gcp"
	IntegrationTypeAWS         IntegrationType = "aws"
	IntegrationTypeKubernetes  IntegrationType = "kubernetes"
	IntegrationTypeGrafana     IntegrationType = "grafana"
	IntegrationTypeOpenAI      IntegrationType = "openai"
	IntegrationTypeGemini      IntegrationType = "gemini"
	IntegrationTypeClaude      IntegrationType = "claude"
)
