package service

import (
	"fmt"
	"strings"

	"github.com/PlatifyX/platifyx-core/internal/domain"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
)

type TemplateService struct {
	log *logger.Logger
}

func NewTemplateService(log *logger.Logger) *TemplateService {
	return &TemplateService{
		log: log,
	}
}

// ListTemplates returns available template types
func (s *TemplateService) ListTemplates() (*domain.ListTemplatesResponse, error) {
	templates := []domain.TemplateInfo{
		{
			Type:        domain.InfraTemplateTypeAPI,
			Name:        "API Service",
			Description: "REST API service with deployment, service, and optional ingress",
			Languages:   []string{domain.LanguageGo, domain.LanguageNodeJS, domain.LanguagePython, domain.LanguageJava},
			Icon:        "🌐",
		},
		{
			Type:        domain.InfraTemplateTypeFrontend,
			Name:        "Frontend Application",
			Description: "React/Vue/Angular SPA with Nginx deployment",
			Languages:   []string{"react", "vue", "angular", domain.LanguageNodeJS},
			Icon:        "💻",
		},
		{
			Type:        domain.InfraTemplateTypeWorker,
			Name:        "Background Worker",
			Description: "Background worker/consumer for Kafka, RabbitMQ, etc",
			Languages:   []string{domain.LanguageGo, domain.LanguageNodeJS, domain.LanguagePython},
			Icon:        "⚙️",
		},
		{
			Type:        domain.InfraTemplateTypeCronJob,
			Name:        "Scheduled Job",
			Description: "Kubernetes CronJob for scheduled tasks and batch processing",
			Languages:   []string{domain.LanguageGo, domain.LanguageNodeJS, domain.LanguagePython},
			Icon:        "⏰",
		},
		{
			Type:        domain.InfraTemplateTypeStatefulSet,
			Name:        "StatefulSet Service",
			Description: "Stateful application with persistent storage",
			Languages:   []string{domain.LanguageGo, domain.LanguageNodeJS, domain.LanguagePython, domain.LanguageJava},
			Icon:        "💾",
		},
		{
			Type:        domain.InfraTemplateTypeDatabase,
			Name:        "Database Deployment",
			Description: "PostgreSQL, MySQL, MongoDB with persistent volumes",
			Languages:   []string{"postgresql", "mysql", "mongodb", "redis"},
			Icon:        "🗄️",
		},
		{
			Type:        domain.InfraTemplateTypeMessaging,
			Name:        "Messaging Service",
			Description: "Kafka, RabbitMQ broker deployment",
			Languages:   []string{"kafka", "rabbitmq", "redis"},
			Icon:        "📨",
		},
		{
			Type:        domain.InfraTemplateTypeDeployment,
			Name:        "Generic Deployment",
			Description: "Generic deployment without service/ingress",
			Languages:   []string{domain.LanguageGo, domain.LanguageNodeJS, domain.LanguagePython, domain.LanguageJava, domain.LanguageDotNet},
			Icon:        "📦",
		},
	}

	return &domain.ListTemplatesResponse{
		Templates: templates,
	}, nil
}

// GenerateTemplate generates all files for a new service
func (s *TemplateService) GenerateTemplate(req domain.CreateTemplateRequest) (*domain.TemplateResponse, error) {
	s.log.Infow("Generating template", "squad", req.Squad, "app", req.AppName, "type", req.TemplateType)

	if err := req.Validate(); err != nil {
		return nil, fmt.Errorf("invalid request: %w", err)
	}

	files := make(map[string]string)
	instructions := []string{}

	// Generate CI pipeline
	files["ci/pipeline.yml"] = s.generatePipeline(req)

	// Generate CD files for both environments
	for _, env := range []string{"stage", "prod"} {
		prefix := fmt.Sprintf("cd/%s", env)

		// Generate deployment/cronjob
		if req.TemplateType == domain.InfraTemplateTypeCronJob {
			files[fmt.Sprintf("%s/cronjob.yaml", prefix)] = s.generateCronJob(req, env)
		} else {
			files[fmt.Sprintf("%s/deployment.yaml", prefix)] = s.generateDeployment(req, env)
		}

		// Generate service (only for API type or if explicitly needed)
		if req.TemplateType == domain.InfraTemplateTypeAPI {
			files[fmt.Sprintf("%s/service.yaml", prefix)] = s.generateService(req, env)
		}

		// Generate ingress if requested
		if req.UseIngress {
			files[fmt.Sprintf("%s/ingress.yaml", prefix)] = s.generateIngress(req, env)
		}

		// Generate secret if requested
		if req.UseSecret {
			files[fmt.Sprintf("%s/secret.yaml", prefix)] = s.generateSecret(req, env)
		}
	}

	// Generate Dockerfile template
	files["Dockerfile"] = s.generateDockerfile(req)

	// Generate README
	files["README.md"] = s.generateREADME(req)

	// Generate .gitignore
	files[".gitignore"] = s.generateGitignore(req)

	// Add setup instructions
	instructions = s.generateInstructions(req)

	response := &domain.TemplateResponse{
		RepositoryName: req.GetRepositoryName(),
		Files:          files,
		Instructions:   instructions,
		Metadata: map[string]interface{}{
			"squad":    req.Squad,
			"appName":  req.AppName,
			"language": req.Language,
			"type":     req.TemplateType,
		},
	}

	s.log.Infow("Template generated successfully", "repository", response.RepositoryName, "files", len(files))
	return response, nil
}

// generatePipeline generates ci/pipeline.yml
func (s *TemplateService) generatePipeline(req domain.CreateTemplateRequest) string {
	var sb strings.Builder

	repoName := req.GetRepositoryName()
	images := append([]string{}, req.DockerImages...)
	if len(images) == 0 {
		// Default images based on language
		switch req.Language {
		case domain.LanguageGo:
			images = []string{fmt.Sprintf("alpine:3.12.1,golang:%s-alpine3.20", req.Version)}
		case domain.LanguageNodeJS:
			images = []string{fmt.Sprintf("node:%s-alpine", req.Version)}
		case domain.LanguagePython:
			images = []string{fmt.Sprintf("python:%s-slim", req.Version)}
		default:
			images = []string{"alpine:3.12.1"}
		}
	}

	sb.WriteString(fmt.Sprintf(`name: $(Build.BuildId)

trigger:
  branches:
    include:
      - stage
  paths:
    exclude:
      - cd/*
      - ci/*
      - Dockerfile

variables:
  - group: variables
  - name: appname
    value: '%s'
  - name: apppath
    value: '%s'
  - name: Dockerfile
    value: 'Dockerfile'
  - name: microservices
    value: 'yes'
  - name: monorepo
    value: '%s'
  - name: language
    value: '%s'
  - name: version
    value: '%s'
  - name: testun
    value: '%s'
  - name: infra
    value: 'kube'
  - name: image
    value: '%s'
  - name: squad
    value: '%s'

resources:
  repositories:
    - repository: pipeline
      type: git
      name: Joker/pipeline
      ref: refs/heads/main
      endpoint: azure-devops-indecx

stages:
  - template: kubernetes.yml@pipeline
`, repoName, req.AppPath, boolToYesNo(req.IsMonorepo), req.Language, req.Version,
		boolToYesNo(req.HasTests), strings.Join(images, ","), req.Squad))

	return sb.String()
}

// generateDeployment generates deployment.yaml
func (s *TemplateService) generateDeployment(req domain.CreateTemplateRequest, env string) string {
	var sb strings.Builder

	resourceName := req.GetResourceName(env)
	nodeGroup := fmt.Sprintf("%s-app", env)

	sb.WriteString(fmt.Sprintf(`apiVersion: apps/v1
kind: Deployment
metadata:
  name: %s
  namespace: %s
  labels:
    app: %s
  annotations:
    reloader.stakater.com/auto: "true"
spec:
  replicas: %d
  selector:
    matchLabels:
      app: %s
  template:
    metadata:
      labels:
        app: %s
    spec:
      containers:
        - name: %s
          image: 850995575072.dkr.ecr.us-east-1.amazonaws.com/%s:latest
          ports:
            - name: http
              containerPort: %d
          resources:
            limits:
              memory: "%s"
              cpu: "%s"
            requests:
              memory: "%s"
              cpu: "%s"`,
		resourceName, req.Squad, resourceName, req.Replicas, resourceName, resourceName,
		resourceName, resourceName, req.Port, req.MemoryLimit, req.CPULimit,
		req.MemoryRequest, req.CPURequest))

	// Add envFrom if using secrets
	if req.UseSecret {
		sb.WriteString(fmt.Sprintf(`
          envFrom:
            - secretRef:
                name: %s`, resourceName))
	}

	sb.WriteString(`
          imagePullPolicy: IfNotPresent
      dnsPolicy: ClusterFirst
      affinity:
        nodeAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            nodeSelectorTerms:
              - matchExpressions:
                  - key: eks.amazonaws.com/nodegroup
                    operator: In
                    values:
                      - ` + nodeGroup + `
      tolerations:
        - key: "` + nodeGroup + `"
          operator: "Equal"
          value: "yes"
          effect: "NoSchedule"
`)

	return sb.String()
}

// generateCronJob generates cronjob.yaml
func (s *TemplateService) generateCronJob(req domain.CreateTemplateRequest, env string) string {
	var sb strings.Builder

	resourceName := req.GetResourceName(env)
	nodeGroup := fmt.Sprintf("%s-app", env)

	sb.WriteString(fmt.Sprintf(`apiVersion: batch/v1
kind: CronJob
metadata:
  name: %s
  namespace: %s
  labels:
    app: %s
spec:
  schedule: "%s"
  concurrencyPolicy: Forbid
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 3
  jobTemplate:
    spec:
      template:
        metadata:
          labels:
            app: %s
        spec:
          restartPolicy: OnFailure
          containers:
            - name: %s
              image: 850995575072.dkr.ecr.us-east-1.amazonaws.com/%s:latest
              resources:
                limits:
                  memory: "%s"
                  cpu: "%s"
                requests:
                  memory: "%s"
                  cpu: "%s"`,
		resourceName, req.Squad, resourceName, req.CronSchedule, resourceName,
		resourceName, resourceName, req.MemoryLimit, req.CPULimit,
		req.MemoryRequest, req.CPURequest))

	if req.UseSecret {
		sb.WriteString(fmt.Sprintf(`
              envFrom:
                - secretRef:
                    name: %s`, resourceName))
	}

	sb.WriteString(`
              imagePullPolicy: IfNotPresent
          affinity:
            nodeAffinity:
              requiredDuringSchedulingIgnoredDuringExecution:
                nodeSelectorTerms:
                  - matchExpressions:
                      - key: eks.amazonaws.com/nodegroup
                        operator: In
                        values:
                          - ` + nodeGroup + `
          tolerations:
            - key: "` + nodeGroup + `"
              operator: "Equal"
              value: "yes"
              effect: "NoSchedule"
`)

	return sb.String()
}

// generateService generates service.yaml
func (s *TemplateService) generateService(req domain.CreateTemplateRequest, env string) string {
	resourceName := req.GetResourceName(env)

	return fmt.Sprintf(`apiVersion: v1
kind: Service
metadata:
  name: %s
  namespace: %s
  labels:
    app: %s
spec:
  type: ClusterIP
  ports:
    - port: 80
      targetPort: http
      protocol: TCP
      name: http
  selector:
    app: %s
`, resourceName, req.Squad, resourceName, resourceName)
}

// generateIngress generates ingress.yaml
func (s *TemplateService) generateIngress(req domain.CreateTemplateRequest, env string) string {
	resourceName := req.GetResourceName(env)
	host := req.IngressHost
	if env == "stage" {
		host = fmt.Sprintf("stage-%s", host)
	}

	return fmt.Sprintf(`apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: %s
  namespace: %s
  labels:
    app: %s
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  tls:
    - hosts:
        - %s
      secretName: %s-tls
  rules:
    - host: %s
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: %s
                port:
                  number: 80
`, resourceName, req.Squad, resourceName, host, resourceName, host, resourceName)
}

// generateSecret generates secret.yaml
func (s *TemplateService) generateSecret(req domain.CreateTemplateRequest, env string) string {
	resourceName := req.GetResourceName(env)
	vaultName := "vaultstageexternalsecret"
	if env == "prod" {
		vaultName = "vaultproductionexternalsecret"
	}

	return fmt.Sprintf(`apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: %s
  namespace: %s
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: %s
    kind: SecretStore
  target:
    name: %s
    creationPolicy: Owner
  dataFrom:
    - extract:
        key: %s
`, resourceName, req.Squad, vaultName, resourceName, resourceName)
}

// generateDockerfile generates basic Dockerfile
func (s *TemplateService) generateDockerfile(req domain.CreateTemplateRequest) string {
	switch req.Language {
	case domain.LanguageGo:
		return s.generateGoDockerfile(req)
	case domain.LanguageNodeJS, domain.LanguageTypeScript:
		return s.generateNodeDockerfile(req)
	case domain.LanguagePython:
		return s.generatePythonDockerfile(req)
	default:
		return "# TODO: Add Dockerfile for " + string(req.Language)
	}
}

func (s *TemplateService) generateGoDockerfile(req domain.CreateTemplateRequest) string {
	return fmt.Sprintf(`# Build stage
FROM golang:%s-alpine AS builder

WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

# Runtime stage
FROM alpine:3.12.1

RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Copy binary from builder
COPY --from=builder /app/main .

EXPOSE %d

CMD ["./main"]
`, req.Version, req.Port)
}

func (s *TemplateService) generateNodeDockerfile(req domain.CreateTemplateRequest) string {
	return fmt.Sprintf(`FROM node:%s-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source
COPY . .

# Build if needed (for TypeScript)
# RUN npm run build

EXPOSE %d

CMD ["node", "index.js"]
`, req.Version, req.Port)
}

func (s *TemplateService) generatePythonDockerfile(req domain.CreateTemplateRequest) string {
	return fmt.Sprintf(`FROM python:%s-slim

WORKDIR /app

# Copy requirements
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy source
COPY . .

EXPOSE %d

CMD ["python", "main.py"]
`, req.Version, req.Port)
}

// generateREADME generates README.md
func (s *TemplateService) generateREADME(req domain.CreateTemplateRequest) string {
	repoName := req.GetRepositoryName()
	var sb strings.Builder

	sb.WriteString(fmt.Sprintf("# %s\n\n", repoName))
	sb.WriteString(fmt.Sprintf("%s service for %s squad.\n\n", strings.Title(string(req.TemplateType)), req.Squad))

	sb.WriteString("## Stack\n\n")
	sb.WriteString(fmt.Sprintf("- **Language**: %s %s\n", req.Language, req.Version))
	sb.WriteString(fmt.Sprintf("- **Type**: %s\n", req.TemplateType))
	sb.WriteString(fmt.Sprintf("- **Squad**: %s\n\n", req.Squad))

	sb.WriteString("## Structure\n\n")
	sb.WriteString("- `ci/pipeline.yml` - Azure DevOps CI pipeline\n")
	sb.WriteString("- `cd/prod/` - Production Kubernetes manifests\n")
	sb.WriteString("- `cd/stage/` - Staging Kubernetes manifests\n")
	sb.WriteString("- `Dockerfile` - Container image definition\n\n")

	sb.WriteString("## Deployment\n\n")
	sb.WriteString("### Branches\n\n")
	sb.WriteString("- `main` → Production\n")
	sb.WriteString("- `stage` → Staging\n\n")

	sb.WriteString("### Environments\n\n")
	sb.WriteString(fmt.Sprintf("- **Production**: Namespace `%s`, Node Group `prod-app`\n", req.Squad))
	sb.WriteString(fmt.Sprintf("- **Staging**: Namespace `%s`, Node Group `stage-app`\n\n", req.Squad))

	sb.WriteString("## Resources\n\n")
	sb.WriteString(fmt.Sprintf("- **CPU**: %s (request) / %s (limit)\n", req.CPURequest, req.CPULimit))
	sb.WriteString(fmt.Sprintf("- **Memory**: %s (request) / %s (limit)\n", req.MemoryRequest, req.MemoryLimit))
	sb.WriteString(fmt.Sprintf("- **Replicas**: %d\n", req.Replicas))
	sb.WriteString(fmt.Sprintf("- **Port**: %d\n\n", req.Port))

	sb.WriteString("## Secrets\n\n")
	sb.WriteString("Secrets are managed via AWS Secrets Manager and External Secrets Operator.\n\n")
	sb.WriteString(fmt.Sprintf("- **Production**: `vaultproductionexternalsecret/%s-prod`\n", repoName))
	sb.WriteString(fmt.Sprintf("- **Staging**: `vaultstageexternalsecret/%s-stage`\n\n", repoName))

	sb.WriteString("## Development\n\n")
	sb.WriteString("### Prerequisites\n\n")
	sb.WriteString(fmt.Sprintf("- %s %s\n\n", req.Language, req.Version))

	sb.WriteString("### Running Locally\n\n")
	sb.WriteString("```bash\n")
	sb.WriteString("# TODO: Add local development instructions\n")
	sb.WriteString("```\n\n")

	sb.WriteString("## CI/CD\n\n")
	sb.WriteString("Pipeline runs automatically on push to `stage` or `main` branches.\n\n")

	sb.WriteString("## Monitoring\n\n")
	sb.WriteString(fmt.Sprintf("- **SonarQube**: Project key `%s`\n", repoName))
	sb.WriteString("- **Logs**: Check CloudWatch or your logging solution\n")
	sb.WriteString("- **Metrics**: Available in Prometheus/Grafana\n\n")

	sb.WriteString("## Contact\n\n")
	sb.WriteString(fmt.Sprintf("Squad: **%s**\n", req.Squad))

	return sb.String()
}

// generateGitignore generates .gitignore
func (s *TemplateService) generateGitignore(req domain.CreateTemplateRequest) string {
	switch req.Language {
	case domain.LanguageGo:
		return `# Binaries
*.exe
*.exe~
*.dll
*.so
*.dylib
bin/
dist/

# Test binary
*.test

# Output of the go coverage tool
*.out

# Go workspace
go.work

# IDE
.idea/
.vscode/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Env
.env
.env.local
`
	case domain.LanguageNodeJS, domain.LanguageTypeScript:
		return `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Build
dist/
build/
*.tsbuildinfo

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Env
.env
.env.local
`
	case domain.LanguagePython:
		return `# Byte-compiled
__pycache__/
*.py[cod]
*$py.class

# Virtual env
venv/
env/
ENV/

# IDE
.idea/
.vscode/
*.swp

# OS
.DS_Store
Thumbs.db

# Env
.env
.env.local
`
	default:
		return "# Add your .gitignore patterns here\n"
	}
}

// generateInstructions generates setup instructions
func (s *TemplateService) generateInstructions(req domain.CreateTemplateRequest) []string {
	repoName := req.GetRepositoryName()

	instructions := []string{
		fmt.Sprintf("1. Create repository '%s' in Azure DevOps", repoName),
		"2. Clone the repository locally",
		"3. Copy all generated files to the repository",
		"4. Create the pipeline in Azure DevOps using ci/pipeline.yml",
	}

	if req.UseSecret {
		instructions = append(instructions, []string{
			fmt.Sprintf("5. Create secrets in AWS Secrets Manager:"),
			fmt.Sprintf("   - Production: %s-prod", repoName),
			fmt.Sprintf("   - Staging: %s-stage", repoName),
		}...)
	}

	instructions = append(instructions, []string{
		fmt.Sprintf("6. Create SonarQube project with key: %s", repoName),
		"7. Push to 'stage' branch to trigger first deployment",
		"8. After validation, merge to 'main' for production deployment",
	}...)

	return instructions
}

// boolToYesNo converts bool to "yes"/"no"
func boolToYesNo(b bool) string {
	if b {
		return "yes"
	}
	return "no"
}
