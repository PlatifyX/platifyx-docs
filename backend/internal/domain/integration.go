package domain

import (
	"encoding/json"
	"time"
)

type Integration struct {
	ID               int             `json:"id"`
	Name             string          `json:"name"`
	Type             string          `json:"type"`
	Enabled          bool            `json:"enabled"`
	Config           json.RawMessage  `json:"config"`
	OrganizationUUID *string         `json:"organizationUuid,omitempty" db:"organization_uuid"`
	CreatedAt        time.Time       `json:"createdAt"`
	UpdatedAt        time.Time       `json:"updatedAt"`
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

type JiraIntegrationConfig struct {
	URL      string `json:"url"`
	Email    string `json:"email"`
	APIToken string `json:"apiToken"`
}

type SlackIntegrationConfig struct {
	WebhookURL string `json:"webhookUrl"`
	BotToken   string `json:"botToken,omitempty"`
}

type TeamsIntegrationConfig struct {
	WebhookURL string `json:"webhookUrl"`
}

type ArgoCDIntegrationConfig struct {
	ServerURL string `json:"serverUrl"`
	AuthToken string `json:"authToken"`
	Insecure  bool   `json:"insecure,omitempty"`
}

type PrometheusIntegrationConfig struct {
	URL      string `json:"url"`
	Username string `json:"username,omitempty"`
	Password string `json:"password,omitempty"`
}

type LokiIntegrationConfig struct {
	URL      string `json:"url"`
	Username string `json:"username,omitempty"`
	Password string `json:"password,omitempty"`
}

type VaultIntegrationConfig struct {
	Address   string `json:"address"`
	Token     string `json:"token"`
	Namespace string `json:"namespace,omitempty"`
}

type AWSSecretsIntegrationConfig struct {
	AccessKeyID     string `json:"accessKeyId"`
	SecretAccessKey string `json:"secretAccessKey"`
	Region          string `json:"region"`
	SessionToken    string `json:"sessionToken,omitempty"`
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
	IntegrationTypeJira        IntegrationType = "jira"
	IntegrationTypeSlack       IntegrationType = "slack"
	IntegrationTypeTeams       IntegrationType = "teams"
	IntegrationTypeArgoCD      IntegrationType = "argocd"
	IntegrationTypePrometheus  IntegrationType = "prometheus"
	IntegrationTypeLoki        IntegrationType = "loki"
	IntegrationTypeVault       IntegrationType = "vault"
	IntegrationTypeAWSSecrets  IntegrationType = "awssecrets"
)
