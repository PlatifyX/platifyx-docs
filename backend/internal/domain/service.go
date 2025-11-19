package domain

import "time"

// Service represents a microservice in the catalog
type Service struct {
	ID               int       `json:"id" db:"id"`
	Name             string    `json:"name" db:"name"`
	Squad            string    `json:"squad" db:"squad"`
	Application      string    `json:"application" db:"application"`
	Language         string    `json:"language" db:"language"`
	Version          string    `json:"version" db:"version"`
	RepositoryType   string    `json:"repositoryType" db:"repository_type"`
	RepositoryURL    string    `json:"repositoryUrl" db:"repository_url"`
	SonarQubeProject string    `json:"sonarqubeProject" db:"sonarqube_project"`
	Namespace        string    `json:"namespace" db:"namespace"`
	Microservices    bool      `json:"microservices" db:"microservices"`
	Monorepo         bool      `json:"monorepo" db:"monorepo"`
	TestUnit         bool      `json:"testUnit" db:"test_unit"`
	Infra            string    `json:"infra" db:"infra"`
	HasStage         bool      `json:"hasStage" db:"has_stage"`
	HasProd          bool      `json:"hasProd" db:"has_prod"`
	CreatedAt        time.Time `json:"createdAt" db:"created_at"`
	UpdatedAt        time.Time `json:"updatedAt" db:"updated_at"`
}

// ServiceStatus represents the runtime status of a service
type ServiceStatus struct {
	ServiceName    string            `json:"serviceName"`
	StageStatus    *DeploymentStatus `json:"stageStatus,omitempty"`
	ProdStatus     *DeploymentStatus `json:"prodStatus,omitempty"`
	SonarQubeStats *SonarQubeStats   `json:"sonarQubeStats,omitempty"`
}

// DeploymentStatus represents the status of a deployment in K8s
type DeploymentStatus struct {
	Environment       string `json:"environment"`
	Status            string `json:"status"` // Running, Failed, Pending
	Replicas          int32  `json:"replicas"`
	AvailableReplicas int32  `json:"availableReplicas"`
	Image             string `json:"image"`
	LastDeployed      string `json:"lastDeployed,omitempty"`
}

// SonarQubeStats represents quality metrics from SonarQube
type SonarQubeStats struct {
	QualityGate     string  `json:"qualityGate"`
	Bugs            int     `json:"bugs"`
	Vulnerabilities int     `json:"vulnerabilities"`
	CodeSmells      int     `json:"codeSmells"`
	Coverage        float64 `json:"coverage"`
	Duplications    float64 `json:"duplications"`
}

// PipelineVariable represents a variable from Azure DevOps pipeline.yml
type PipelineVariable struct {
	Name  string `yaml:"name"`
	Value string `yaml:"value"`
}
