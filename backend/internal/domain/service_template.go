package domain

import "time"

// Service Template
type ServiceTemplate struct {
	ID          string                 `json:"id"`
	Name        string                 `json:"name"`
	Description string                 `json:"description"`
	Category    string                 `json:"category"` // api, microservice, library, frontend, etc.
	Language    string                 `json:"language"` // go, nodejs, python, java, etc.
	Framework   string                 `json:"framework,omitempty"` // gin, express, fastapi, spring, etc.
	Icon        string                 `json:"icon,omitempty"`
	Tags        []string               `json:"tags"`
	Parameters  []TemplateParameter    `json:"parameters"`
	Files       []TemplateFile         `json:"files"`
	CreatedAt   time.Time              `json:"createdAt"`
	UpdatedAt   time.Time              `json:"updatedAt"`
}

// Template Parameter
type TemplateParameter struct {
	Name        string      `json:"name"`
	Label       string      `json:"label"`
	Description string      `json:"description"`
	Type        string      `json:"type"` // string, number, boolean, select
	Required    bool        `json:"required"`
	Default     interface{} `json:"default,omitempty"`
	Options     []string    `json:"options,omitempty"` // For select type
	Validation  string      `json:"validation,omitempty"` // Regex or validation rule
}

// Template File
type TemplateFile struct {
	Path     string `json:"path"`
	Content  string `json:"content"`
	Template bool   `json:"template"` // If true, apply template variables
}

// Service Creation Request
type CreateServiceRequest struct {
	TemplateID   string                 `json:"templateId"`
	ServiceName  string                 `json:"serviceName"`
	Description  string                 `json:"description"`
	Repository   string                 `json:"repository,omitempty"` // Git repository URL
	Parameters   map[string]interface{} `json:"parameters"`
	CreateRepo   bool                   `json:"createRepo"`
	GitIntegration string               `json:"gitIntegration,omitempty"` // github, gitlab, etc.
}

// Created Service
type CreatedService struct {
	ID           string                 `json:"id"`
	Name         string                 `json:"name"`
	Description  string                 `json:"description"`
	Template     string                 `json:"template"`
	RepositoryURL string                `json:"repositoryUrl,omitempty"`
	LocalPath    string                 `json:"localPath,omitempty"`
	Parameters   map[string]interface{} `json:"parameters"`
	Status       string                 `json:"status"` // created, cloned, failed
	CreatedAt    time.Time              `json:"createdAt"`
	CreatedBy    string                 `json:"createdBy,omitempty"`
}

// Service Catalog Entry
type ServiceCatalogEntry struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Type        string    `json:"type"` // service, library, website
	Language    string    `json:"language"`
	Framework   string    `json:"framework,omitempty"`
	Owner       string    `json:"owner"`
	Repository  string    `json:"repository,omitempty"`
	Status      string    `json:"status"` // active, archived, deprecated
	Tags        []string  `json:"tags"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

// Template Categories
const (
	CategoryAPI         = "api"
	CategoryMicroservice = "microservice"
	CategoryLibrary     = "library"
	CategoryFrontend    = "frontend"
	CategoryBackend     = "backend"
	CategoryFullStack   = "fullstack"
	CategoryCLI         = "cli"
	CategoryInfra       = "infrastructure"
)

// Languages
const (
	LanguageGo         = "go"
	LanguageNodeJS     = "nodejs"
	LanguagePython     = "python"
	LanguageJava       = "java"
	LanguageTypeScript = "typescript"
	LanguageRust       = "rust"
	LanguageDotNet     = "dotnet"
)

// Template Stats
type TemplateStats struct {
	TotalTemplates   int            `json:"totalTemplates"`
	TotalServices    int            `json:"totalServices"`
	ByCategory       map[string]int `json:"byCategory"`
	ByLanguage       map[string]int `json:"byLanguage"`
	RecentlyCreated  int            `json:"recentlyCreated"` // Last 30 days
}
