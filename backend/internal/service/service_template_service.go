package service

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"text/template"
	"time"

	"github.com/PlatifyX/platifyx-core/internal/domain"
	"github.com/PlatifyX/platifyx-core/internal/repository"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"github.com/google/uuid"
)

type ServiceTemplateService struct {
	repo *repository.ServiceTemplateRepository
	log  *logger.Logger
}

func NewServiceTemplateService(repo *repository.ServiceTemplateRepository, log *logger.Logger) *ServiceTemplateService {
	return &ServiceTemplateService{
		repo: repo,
		log:  log,
	}
}

// GetAllTemplates returns all available templates
func (s *ServiceTemplateService) GetAllTemplates() ([]domain.ServiceTemplate, error) {
	return s.repo.GetAll()
}

// GetTemplateByID returns a specific template
func (s *ServiceTemplateService) GetTemplateByID(id string) (*domain.ServiceTemplate, error) {
	return s.repo.GetByID(id)
}

// CreateService creates a new service from a template
func (s *ServiceTemplateService) CreateService(req domain.CreateServiceRequest) (*domain.CreatedService, error) {
	// Get template
	tmpl, err := s.repo.GetByID(req.TemplateID)
	if err != nil {
		return nil, fmt.Errorf("failed to get template: %w", err)
	}
	if tmpl == nil {
		return nil, fmt.Errorf("template not found: %s", req.TemplateID)
	}

	// Validate required parameters
	if err := s.validateParameters(tmpl, req.Parameters); err != nil {
		return nil, err
	}

	// Create service record
	service := &domain.CreatedService{
		ID:          uuid.New().String(),
		Name:        req.ServiceName,
		Description: req.Description,
		Template:    tmpl.Name,
		Parameters:  req.Parameters,
		Status:      "created",
		CreatedAt:   time.Now(),
	}

	// Generate files locally
	localPath, err := s.generateFiles(tmpl, req)
	if err != nil {
		service.Status = "failed"
		s.repo.CreateService(service)
		return nil, fmt.Errorf("failed to generate files: %w", err)
	}

	service.LocalPath = localPath

	// Save service record
	if err := s.repo.CreateService(service); err != nil {
		return nil, fmt.Errorf("failed to save service: %w", err)
	}

	s.log.Infow("Service created successfully",
		"service", service.Name,
		"template", tmpl.Name,
		"path", localPath,
	)

	return service, nil
}

// validateParameters checks if all required parameters are provided
func (s *ServiceTemplateService) validateParameters(tmpl *domain.ServiceTemplate, params map[string]interface{}) error {
	for _, param := range tmpl.Parameters {
		if param.Required {
			if val, ok := params[param.Name]; !ok || val == nil || val == "" {
				return fmt.Errorf("required parameter missing: %s", param.Name)
			}
		}
	}
	return nil
}

// generateFiles creates the service files from template
func (s *ServiceTemplateService) generateFiles(tmpl *domain.ServiceTemplate, req domain.CreateServiceRequest) (string, error) {
	// Create base directory
	baseDir := filepath.Join("/tmp", "generated-services", req.ServiceName)
	if err := os.MkdirAll(baseDir, 0755); err != nil {
		return "", fmt.Errorf("failed to create base directory: %w", err)
	}

	// Prepare template data
	data := s.prepareTemplateData(req)

	// Generate each file
	for _, file := range tmpl.Files {
		filePath := filepath.Join(baseDir, file.Path)

		// Create directory if needed
		dir := filepath.Dir(filePath)
		if err := os.MkdirAll(dir, 0755); err != nil {
			return "", fmt.Errorf("failed to create directory %s: %w", dir, err)
		}

		// Process template content if needed
		content := file.Content
		if file.Template {
			processed, err := s.processTemplate(file.Content, data)
			if err != nil {
				return "", fmt.Errorf("failed to process template %s: %w", file.Path, err)
			}
			content = processed
		}

		// Write file
		if err := os.WriteFile(filePath, []byte(content), 0644); err != nil {
			return "", fmt.Errorf("failed to write file %s: %w", filePath, err)
		}
	}

	s.log.Infow("Files generated successfully", "path", baseDir, "fileCount", len(tmpl.Files))
	return baseDir, nil
}

// prepareTemplateData prepares data for template processing
func (s *ServiceTemplateService) prepareTemplateData(req domain.CreateServiceRequest) map[string]interface{} {
	data := make(map[string]interface{})
	data["ServiceName"] = req.ServiceName
	data["Description"] = req.Description
	data["Repository"] = req.Repository

	// Add all custom parameters
	for k, v := range req.Parameters {
		// Capitalize first letter for template usage
		key := strings.ToUpper(k[:1]) + k[1:]
		data[key] = v
	}

	return data
}

// processTemplate processes a template string with data
func (s *ServiceTemplateService) processTemplate(tmplStr string, data map[string]interface{}) (string, error) {
	tmpl, err := template.New("content").Parse(tmplStr)
	if err != nil {
		return "", err
	}

	var result strings.Builder
	if err := tmpl.Execute(&result, data); err != nil {
		return "", err
	}

	return result.String(), nil
}

// GetAllServices returns all created services
func (s *ServiceTemplateService) GetAllServices() ([]domain.CreatedService, error) {
	return s.repo.GetAllServices()
}

// GetServiceByID returns a specific service
func (s *ServiceTemplateService) GetServiceByID(id string) (*domain.CreatedService, error) {
	return s.repo.GetServiceByID(id)
}

// GetStats returns template statistics
func (s *ServiceTemplateService) GetStats() (*domain.TemplateStats, error) {
	templates, err := s.repo.GetAll()
	if err != nil {
		return nil, err
	}

	services, err := s.repo.GetAllServices()
	if err != nil {
		return nil, err
	}

	stats := &domain.TemplateStats{
		TotalTemplates: len(templates),
		TotalServices:  len(services),
		ByCategory:     make(map[string]int),
		ByLanguage:     make(map[string]int),
	}

	// Count by category and language
	for _, t := range templates {
		stats.ByCategory[t.Category]++
		stats.ByLanguage[t.Language]++
	}

	// Count recently created (last 30 days)
	thirtyDaysAgo := time.Now().AddDate(0, 0, -30)
	for _, svc := range services {
		if svc.CreatedAt.After(thirtyDaysAgo) {
			stats.RecentlyCreated++
		}
	}

	return stats, nil
}

// InitializeDefaultTemplates creates default templates if they don't exist
func (s *ServiceTemplateService) InitializeDefaultTemplates() error {
	templates := s.getDefaultTemplates()

	for _, tmpl := range templates {
		existing, err := s.repo.GetByID(tmpl.ID)
		if err != nil {
			return err
		}
		if existing == nil {
			if err := s.repo.Create(&tmpl); err != nil {
				return fmt.Errorf("failed to create template %s: %w", tmpl.Name, err)
			}
			s.log.Infow("Created default template", "template", tmpl.Name)
		}
	}

	return nil
}

// getDefaultTemplates returns a set of default templates
func (s *ServiceTemplateService) getDefaultTemplates() []domain.ServiceTemplate {
	now := time.Now()

	return []domain.ServiceTemplate{
		{
			ID:          "go-api-gin",
			Name:        "Go API with Gin",
			Description: "RESTful API using Go and Gin framework",
			Category:    domain.CategoryAPI,
			Language:    domain.LanguageGo,
			Framework:   "gin",
			Icon:        "🔷",
			Tags:        []string{"api", "rest", "go", "gin"},
			Parameters: []domain.TemplateParameter{
				{Name: "port", Label: "Port", Description: "API port", Type: "number", Required: true, Default: 8080},
				{Name: "packageName", Label: "Package Name", Description: "Go package name", Type: "string", Required: true},
			},
			Files: []domain.TemplateFile{
				{Path: "main.go", Template: true, Content: goMainTemplate},
				{Path: "go.mod", Template: true, Content: goModTemplate},
				{Path: "README.md", Template: true, Content: readmeTemplate},
			},
			CreatedAt: now,
			UpdatedAt: now,
		},
		{
			ID:          "nodejs-express-api",
			Name:        "Node.js API with Express",
			Description: "RESTful API using Node.js and Express",
			Category:    domain.CategoryAPI,
			Language:    domain.LanguageNodeJS,
			Framework:   "express",
			Icon:        "🟢",
			Tags:        []string{"api", "rest", "nodejs", "express"},
			Parameters: []domain.TemplateParameter{
				{Name: "port", Label: "Port", Description: "API port", Type: "number", Required: true, Default: 3000},
			},
			Files: []domain.TemplateFile{
				{Path: "index.js", Template: true, Content: nodeIndexTemplate},
				{Path: "package.json", Template: true, Content: packageJSONTemplate},
				{Path: "README.md", Template: true, Content: readmeTemplate},
			},
			CreatedAt: now,
			UpdatedAt: now,
		},
		{
			ID:          "python-fastapi",
			Name:        "Python API with FastAPI",
			Description: "RESTful API using Python and FastAPI",
			Category:    domain.CategoryAPI,
			Language:    domain.LanguagePython,
			Framework:   "fastapi",
			Icon:        "🐍",
			Tags:        []string{"api", "rest", "python", "fastapi"},
			Parameters: []domain.TemplateParameter{
				{Name: "port", Label: "Port", Description: "API port", Type: "number", Required: true, Default: 8000},
			},
			Files: []domain.TemplateFile{
				{Path: "main.py", Template: true, Content: pythonMainTemplate},
				{Path: "requirements.txt", Template: true, Content: requirementsTemplate},
				{Path: "README.md", Template: true, Content: readmeTemplate},
			},
			CreatedAt: now,
			UpdatedAt: now,
		},
	}
}

// Template content constants
const goMainTemplate = `package main

import (
	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "ok",
			"service": "{{.ServiceName}}",
		})
	})

	r.Run(":{{.Port}}")
}
`

const goModTemplate = `module {{.PackageName}}

go 1.21

require github.com/gin-gonic/gin v1.9.1
`

const nodeIndexTemplate = `const express = require('express');
const app = express();
const PORT = process.env.PORT || {{.Port}};

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: '{{.ServiceName}}'
  });
});

app.listen(PORT, () => {
  console.log(\`{{.ServiceName}} listening on port \${PORT}\`);
});
`

const packageJSONTemplate = `{
  "name": "{{.ServiceName}}",
  "version": "1.0.0",
  "description": "{{.Description}}",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "express": "^4.18.2"
  }
}
`

const pythonMainTemplate = `from fastapi import FastAPI

app = FastAPI()

@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "{{.ServiceName}}"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port={{.Port}})
`

const requirementsTemplate = `fastapi==0.104.1
uvicorn==0.24.0
`

const readmeTemplate = `# {{.ServiceName}}

{{.Description}}

## Getting Started

This service was generated from a template.

### Prerequisites

- Check the requirements for your stack

### Running

Follow the instructions for your language/framework.
`
