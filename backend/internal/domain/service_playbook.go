package domain

import "time"

type ServicePlaybookRequest struct {
	ServiceName      string            `json:"serviceName"`
	ServiceType      string            `json:"serviceType"` // "api", "frontend", "worker", "cronjob"
	Language         string            `json:"language"`   // "go", "node", "python", "java"
	Framework        string            `json:"framework,omitempty"`
	Description      string            `json:"description"`
	Team             string            `json:"team"`
	RepositoryURL    string            `json:"repositoryUrl,omitempty"`
	RepositorySource string           `json:"repositorySource,omitempty"` // "github", "azuredevops", "gitlab"
	Namespace        string            `json:"namespace,omitempty"`
	Environment      string            `json:"environment"` // "development", "staging", "production"
	Replicas         int               `json:"replicas,omitempty"`
	Resources        map[string]interface{} `json:"resources,omitempty"`
	Config           map[string]interface{} `json:"config,omitempty"`
}

type ServicePlaybookProgress struct {
	ID          string                 `json:"id"`
	Status      string                 `json:"status"` // "pending", "creating", "configuring", "completed", "failed"
	Progress    float64                `json:"progress"` // 0-100
	CurrentStep string                 `json:"currentStep"`
	ServiceName string                 `json:"serviceName"`
	Created     map[string]interface{} `json:"created,omitempty"`
	MaturityScore float64              `json:"maturityScore,omitempty"`
	Errors      []string               `json:"errors,omitempty"`
	CreatedAt   time.Time              `json:"createdAt"`
	UpdatedAt   time.Time              `json:"updatedAt"`
}

type CreatedServiceArtifacts struct {
	CodeGenerated      bool     `json:"codeGenerated"`
	PipelineCreated    bool     `json:"pipelineCreated"`
	DashboardCreated   bool     `json:"dashboardCreated"`
	AlertsConfigured   bool     `json:"alertsConfigured"`
	CostPanelCreated   bool     `json:"costPanelCreated"`
	DependenciesSet    bool     `json:"dependenciesSet"`
	PortalIntegrated   bool     `json:"portalIntegrated"`
	DocumentationGenerated bool `json:"documentationGenerated"`
}

