package domain

import "time"

type DocType string

const (
	DocTypeC4Diagram      DocType = "c4_diagram"
	DocTypeArchitecture   DocType = "architecture"
	DocTypeRunbook        DocType = "runbook"
	DocTypeSLO            DocType = "slo"
	DocTypeStatusPage     DocType = "status_page"
	DocTypeDeployGuide    DocType = "deploy_guide"
	DocTypeCICDFlow      DocType = "cicd_flow"
)

type RepositorySource string

const (
	RepositorySourceGitHub      RepositorySource = "github"
	RepositorySourceAzureDevOps RepositorySource = "azuredevops"
	RepositorySourceGitLab      RepositorySource = "gitlab"
)

type AutoDocRequest struct {
	RepositoryURL    string          `json:"repositoryUrl"`
	RepositorySource RepositorySource `json:"repositorySource"`
	IntegrationID    int             `json:"integrationId"`
	DocTypes         []DocType       `json:"docTypes"` // Empty = generate all
	ServiceName      string          `json:"serviceName"`
	Branch            string          `json:"branch,omitempty"` // Default: main/master
}

type AutoDocProgress struct {
	ID          string                 `json:"id"`
	Status      string                 `json:"status"` // "pending", "analyzing", "generating", "completed", "failed"
	Progress    float64                `json:"progress"` // 0-100
	CurrentStep string                 `json:"currentStep"`
	Documents   []GeneratedDocument    `json:"documents"`
	Errors      []string               `json:"errors,omitempty"`
	CreatedAt   time.Time              `json:"createdAt"`
	UpdatedAt   time.Time              `json:"updatedAt"`
}

type GeneratedDocument struct {
	Type        DocType `json:"type"`
	Title       string  `json:"title"`
	Content     string  `json:"content"`
	Path        string  `json:"path"`
	Format      string  `json:"format"` // "markdown", "mermaid", "yaml"
	GeneratedAt time.Time `json:"generatedAt"`
}

type RepositoryAnalysis struct {
	RepositoryURL    string                 `json:"repositoryUrl"`
	ServiceName      string                 `json:"serviceName"`
	Language         string                 `json:"language"`
	Framework        string                 `json:"framework"`
	HasHelmCharts    bool                   `json:"hasHelmCharts"`
	HasK8sManifests  bool                   `json:"hasK8sManifests"`
	HasPipelines     bool                   `json:"hasPipelines"`
	HasPolicies      bool                   `json:"hasPolicies"`
	Structure        map[string]interface{} `json:"structure"`
	DetectedServices []string               `json:"detectedServices"`
	DetectedInfra    []string               `json:"detectedInfra"`
}

