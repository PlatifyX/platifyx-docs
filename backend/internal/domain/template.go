package domain

import "fmt"

// TemplateType represents the type of template
type TemplateType string

const (
	TemplateTypeAPI        TemplateType = "api"
	TemplateTypeWorker     TemplateType = "worker"
	TemplateTypeCronJob    TemplateType = "cronjob"
	TemplateTypeDeployment TemplateType = "deployment"
)

// Language represents programming language
type Language string

const (
	LanguageGo         Language = "go"
	LanguageNodeJS     Language = "nodejs"
	LanguagePython     Language = "python"
	LanguageJava       Language = "java"
	LanguageDotNet     Language = "dotnet"
	LanguageTypeScript Language = "typescript"
)

// CreateTemplateRequest represents a request to create a new service from template
type CreateTemplateRequest struct {
	Squad         string       `json:"squad" binding:"required"`        // e.g., "cxm"
	AppName       string       `json:"appName" binding:"required"`      // e.g., "distribution"
	TemplateType  TemplateType `json:"templateType" binding:"required"` // api, worker, cronjob, etc
	Language      Language     `json:"language" binding:"required"`     // go, nodejs, python, etc
	Version       string       `json:"version" binding:"required"`      // e.g., "1.23.0"
	Port          int          `json:"port"`                            // Container port (default: 80)
	UseSecret     bool         `json:"useSecret"`                       // Whether to use external secret
	UseIngress    bool         `json:"useIngress"`                      // Whether to use ingress
	IngressHost   string       `json:"ingressHost,omitempty"`           // Ingress hostname if useIngress=true
	HasTests      bool         `json:"hasTests"`                        // Whether has unit tests
	IsMonorepo    bool         `json:"isMonorepo"`                      // Whether is a monorepo
	AppPath       string       `json:"appPath"`                         // Path to app in repo (default: ".")
	CPULimit      string       `json:"cpuLimit"`                        // e.g., "500m"
	CPURequest    string       `json:"cpuRequest"`                      // e.g., "250m"
	MemoryLimit   string       `json:"memoryLimit"`                     // e.g., "512Mi"
	MemoryRequest string       `json:"memoryRequest"`                   // e.g., "256Mi"
	Replicas      int          `json:"replicas"`                        // Number of replicas
	CronSchedule  string       `json:"cronSchedule,omitempty"`          // For cronjobs only
	DockerImages  []string     `json:"dockerImages,omitempty"`          // Additional docker images
}

// TemplateResponse represents the generated template files
type TemplateResponse struct {
	RepositoryName string                 `json:"repositoryName"` // e.g., "cxm-distribution"
	Files          map[string]string      `json:"files"`          // path -> content
	Instructions   []string               `json:"instructions"`   // Setup instructions
	Metadata       map[string]interface{} `json:"metadata"`       // Additional metadata
}

// TemplateFile represents a single generated file
type TemplateFile struct {
	Path    string `json:"path"`
	Content string `json:"content"`
}

// ListTemplatesResponse represents available templates
type ListTemplatesResponse struct {
	Templates []TemplateInfo `json:"templates"`
}

// TemplateInfo represents template metadata
type TemplateInfo struct {
	Type        TemplateType `json:"type"`
	Name        string       `json:"name"`
	Description string       `json:"description"`
	Languages   []Language   `json:"languages"`
	Icon        string       `json:"icon,omitempty"`
}

// ValidateTemplateRequest validates and normalizes the request
func (r *CreateTemplateRequest) Validate() error {
	// Set defaults
	if r.Port == 0 {
		r.Port = 80
	}
	if r.AppPath == "" {
		r.AppPath = "."
	}
	if r.CPULimit == "" {
		r.CPULimit = "500m"
	}
	if r.CPURequest == "" {
		r.CPURequest = "250m"
	}
	if r.MemoryLimit == "" {
		r.MemoryLimit = "512Mi"
	}
	if r.MemoryRequest == "" {
		r.MemoryRequest = "256Mi"
	}
	if r.Replicas == 0 {
		r.Replicas = 1
	}

	// Validate cronjob schedule
	if r.TemplateType == TemplateTypeCronJob && r.CronSchedule == "" {
		return fmt.Errorf("cronSchedule is required for cronjob type")
	}

	// Validate ingress host
	if r.UseIngress && r.IngressHost == "" {
		return fmt.Errorf("ingressHost is required when useIngress is true")
	}

	return nil
}

// GetRepositoryName returns the full repository name
func (r *CreateTemplateRequest) GetRepositoryName() string {
	return fmt.Sprintf("%s-%s", r.Squad, r.AppName)
}

// GetResourceName returns the resource name for a given environment
func (r *CreateTemplateRequest) GetResourceName(env string) string {
	return fmt.Sprintf("%s-%s-%s", r.Squad, r.AppName, env)
}
