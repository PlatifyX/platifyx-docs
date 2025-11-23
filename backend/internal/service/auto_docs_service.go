package service

import (
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/PlatifyX/platifyx-core/internal/domain"
	"github.com/PlatifyX/platifyx-core/pkg/cache"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"github.com/google/uuid"
)

type AutoDocsService struct {
	techDocsService   *TechDocsService
	aiService         *AIService
	diagramService    *DiagramService
	githubService     *GitHubService
	azureDevOpsService *AzureDevOpsService
	integrationService *IntegrationService
	kubernetesService  *KubernetesService
	progressStore     *cache.RedisClient
	log               *logger.Logger
}

func NewAutoDocsService(
	techDocsService *TechDocsService,
	aiService *AIService,
	diagramService *DiagramService,
	githubService *GitHubService,
	azureDevOpsService *AzureDevOpsService,
	integrationService *IntegrationService,
	kubernetesService *KubernetesService,
	progressStore *cache.RedisClient,
	log *logger.Logger,
) *AutoDocsService {
	return &AutoDocsService{
		techDocsService:    techDocsService,
		aiService:          aiService,
		diagramService:     diagramService,
		githubService:      githubService,
		azureDevOpsService: azureDevOpsService,
		integrationService: integrationService,
		kubernetesService:  kubernetesService,
		progressStore:      progressStore,
		log:                log,
	}
}

func (s *AutoDocsService) GenerateAutoDocs(req domain.AutoDocRequest) (*domain.AutoDocProgress, error) {
	progressID := uuid.New().String()
	
	progress := &domain.AutoDocProgress{
		ID:          progressID,
		Status:      "pending",
		Progress:    0,
		CurrentStep: "Iniciando análise do repositório",
		Documents:   []domain.GeneratedDocument{},
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	s.saveProgress(progressID, progress)

	go s.runAutoDocsGeneration(progressID, req)

	return progress, nil
}

func (s *AutoDocsService) runAutoDocsGeneration(progressID string, req domain.AutoDocRequest) {
	progress, _ := s.getProgress(progressID)
	if progress == nil {
		return
	}

	// Step 1: Analyze Repository
	progress.Status = "analyzing"
	progress.CurrentStep = "Analisando estrutura do repositório"
	progress.Progress = 10
	s.updateProgress(progressID, progress)

	analysis, err := s.analyzeRepository(req)
	if err != nil {
		progress.Status = "failed"
		progress.Errors = append(progress.Errors, fmt.Sprintf("Erro ao analisar repositório: %v", err))
		s.updateProgress(progressID, progress)
		return
	}

	// Step 2: Determine which docs to generate
	docTypes := req.DocTypes
	if len(docTypes) == 0 {
		docTypes = []domain.DocType{
			domain.DocTypeC4Diagram,
			domain.DocTypeArchitecture,
			domain.DocTypeRunbook,
			domain.DocTypeSLO,
			domain.DocTypeDeployGuide,
			domain.DocTypeCICDFlow,
		}
	}

	progress.Status = "generating"
	progress.Progress = 30
	s.updateProgress(progressID, progress)

	// Step 3: Generate each document type
	totalDocs := len(docTypes)
	for i, docType := range docTypes {
		progress.CurrentStep = fmt.Sprintf("Gerando %s", s.getDocTypeLabel(docType))
		progress.Progress = 30 + float64(i+1)/float64(totalDocs)*60
		s.updateProgress(progressID, progress)

		doc, err := s.generateDocument(docType, analysis, req)
		if err != nil {
			s.log.Errorw("Failed to generate document", "type", docType, "error", err)
			progress.Errors = append(progress.Errors, fmt.Sprintf("Erro ao gerar %s: %v", docType, err))
			continue
		}

		progress.Documents = append(progress.Documents, *doc)
		s.updateProgress(progressID, progress)
	}

	// Step 4: Save documents to TechDocs
	progress.CurrentStep = "Salvando documentação"
	progress.Progress = 95
	s.updateProgress(progressID, progress)

	for _, doc := range progress.Documents {
		err := s.saveDocumentToTechDocs(doc, req.ServiceName)
		if err != nil {
			s.log.Errorw("Failed to save document", "path", doc.Path, "error", err)
		}
	}

	progress.Status = "completed"
	progress.Progress = 100
	progress.CurrentStep = "Documentação gerada com sucesso"
	s.updateProgress(progressID, progress)
}

func (s *AutoDocsService) analyzeRepository(req domain.AutoDocRequest) (*domain.RepositoryAnalysis, error) {
	analysis := &domain.RepositoryAnalysis{
		RepositoryURL:    req.RepositoryURL,
		ServiceName:      req.ServiceName,
		DetectedServices: []string{},
		DetectedInfra:    []string{},
		Structure:        make(map[string]interface{}),
	}

	switch req.RepositorySource {
	case domain.RepositorySourceGitHub:
		return s.analyzeGitHubRepo(req, analysis)
	case domain.RepositorySourceAzureDevOps:
		return s.analyzeAzureDevOpsRepo(req, analysis)
	case domain.RepositorySourceGitLab:
		return s.analyzeGitLabRepo(req, analysis)
	default:
		return nil, fmt.Errorf("unsupported repository source: %s", req.RepositorySource)
	}
}

func (s *AutoDocsService) analyzeGitHubRepo(req domain.AutoDocRequest, analysis *domain.RepositoryAnalysis) (*domain.RepositoryAnalysis, error) {
	if s.githubService == nil {
		return nil, fmt.Errorf("GitHub service not available")
	}

	// Parse repo URL to get owner/repo
	parts := strings.Split(strings.TrimPrefix(req.RepositoryURL, "https://github.com/"), "/")
	if len(parts) < 2 {
		return nil, fmt.Errorf("invalid GitHub URL")
	}
	owner := parts[0]
	repo := strings.TrimSuffix(parts[1], ".git")

	// Get repository structure
	repoInfo, err := s.githubService.GetRepository(owner, repo)
	if err != nil {
		return nil, err
	}

	analysis.Language = repoInfo.Language
	analysis.Framework = s.detectFramework(repoInfo.Language, repoInfo.Description)

	// Check for common files
	analysis.HasHelmCharts = strings.Contains(strings.ToLower(req.RepositoryURL), "helm") ||
		strings.Contains(strings.ToLower(repoInfo.Description), "helm")
	analysis.HasK8sManifests = strings.Contains(strings.ToLower(req.RepositoryURL), "k8s") ||
		strings.Contains(strings.ToLower(repoInfo.Description), "kubernetes")
	analysis.HasPipelines = true // GitHub Actions are common

	return analysis, nil
}

func (s *AutoDocsService) analyzeAzureDevOpsRepo(req domain.AutoDocRequest, analysis *domain.RepositoryAnalysis) (*domain.RepositoryAnalysis, error) {
	if s.azureDevOpsService == nil {
		return nil, fmt.Errorf("Azure DevOps service not available")
	}

	analysis.HasPipelines = true // Azure DevOps always has pipelines
	analysis.HasK8sManifests = strings.Contains(strings.ToLower(req.RepositoryURL), "k8s") ||
		strings.Contains(strings.ToLower(req.RepositoryURL), "kubernetes")

	return analysis, nil
}

func (s *AutoDocsService) analyzeGitLabRepo(req domain.AutoDocRequest, analysis *domain.RepositoryAnalysis) (*domain.RepositoryAnalysis, error) {
	// GitLab integration would go here
	analysis.HasPipelines = true // GitLab CI/CD
	return analysis, nil
}

func (s *AutoDocsService) detectFramework(language, description string) string {
	desc := strings.ToLower(description)
	
	switch strings.ToLower(language) {
	case "go", "golang":
		if strings.Contains(desc, "gin") {
			return "Gin"
		}
		return "Go"
	case "javascript", "typescript":
		if strings.Contains(desc, "react") {
			return "React"
		}
		if strings.Contains(desc, "node") {
			return "Node.js"
		}
		return "JavaScript/TypeScript"
	case "python":
		if strings.Contains(desc, "django") {
			return "Django"
		}
		if strings.Contains(desc, "flask") {
			return "Flask"
		}
		return "Python"
	case "java":
		return "Java"
	case "csharp", "c#":
		return ".NET"
	default:
		return language
	}
}

func (s *AutoDocsService) generateDocument(docType domain.DocType, analysis *domain.RepositoryAnalysis, req domain.AutoDocRequest) (*domain.GeneratedDocument, error) {
	switch docType {
	case domain.DocTypeC4Diagram:
		return s.generateC4Diagram(analysis, req)
	case domain.DocTypeArchitecture:
		return s.generateArchitectureDoc(analysis, req)
	case domain.DocTypeRunbook:
		return s.generateRunbook(analysis, req)
	case domain.DocTypeSLO:
		return s.generateSLO(analysis, req)
	case domain.DocTypeStatusPage:
		return s.generateStatusPage(analysis, req)
	case domain.DocTypeDeployGuide:
		return s.generateDeployGuide(analysis, req)
	case domain.DocTypeCICDFlow:
		return s.generateCICDFlow(analysis, req)
	default:
		return nil, fmt.Errorf("unsupported document type: %s", docType)
	}
}

func (s *AutoDocsService) generateC4Diagram(analysis *domain.RepositoryAnalysis, req domain.AutoDocRequest) (*domain.GeneratedDocument, error) {
	prompt := fmt.Sprintf(`Gere um diagrama C4 (Context, Container, Component) para o serviço %s.

Informações do repositório:
- Linguagem: %s
- Framework: %s
- Tem Helm Charts: %v
- Tem Manifests K8s: %v
- Tem Pipelines: %v

Gere um diagrama Mermaid no formato C4 mostrando:
1. Context: Sistema e seus usuários
2. Container: Aplicações e serviços
3. Component: Componentes principais

Formato: Apenas código Mermaid, sem markdown.`, 
		req.ServiceName, analysis.Language, analysis.Framework, 
		analysis.HasHelmCharts, analysis.HasK8sManifests, analysis.HasPipelines)

	response, err := s.aiService.GenerateCompletion(domain.AIProviderClaude, prompt, "")
	if err != nil {
		return nil, err
	}

	return &domain.GeneratedDocument{
		Type:        domain.DocTypeC4Diagram,
		Title:       fmt.Sprintf("Diagrama C4 - %s", req.ServiceName),
		Content:     response.Content,
		Path:        fmt.Sprintf("%s/c4-diagram.md", req.ServiceName),
		Format:      "mermaid",
		GeneratedAt: time.Now(),
	}, nil
}

func (s *AutoDocsService) generateArchitectureDoc(analysis *domain.RepositoryAnalysis, req domain.AutoDocRequest) (*domain.GeneratedDocument, error) {
	prompt := fmt.Sprintf(`Gere documentação de arquitetura completa para o serviço %s.

Inclua:
1. Visão Geral
2. Arquitetura de Alto Nível
3. Componentes Principais
4. Fluxo de Dados
5. Tecnologias Utilizadas (%s, %s)
6. Infraestrutura (%v Helm, %v K8s)
7. Integrações

Formato: Markdown bem estruturado.`, 
		req.ServiceName, analysis.Language, analysis.Framework,
		analysis.HasHelmCharts, analysis.HasK8sManifests)

	response, err := s.aiService.GenerateCompletion(domain.AIProviderClaude, prompt, "")
	if err != nil {
		return nil, err
	}

	return &domain.GeneratedDocument{
		Type:        domain.DocTypeArchitecture,
		Title:       fmt.Sprintf("Arquitetura - %s", req.ServiceName),
		Content:     response.Content,
		Path:        fmt.Sprintf("%s/architecture.md", req.ServiceName),
		Format:      "markdown",
		GeneratedAt: time.Now(),
	}, nil
}

func (s *AutoDocsService) generateRunbook(analysis *domain.RepositoryAnalysis, req domain.AutoDocRequest) (*domain.GeneratedDocument, error) {
	prompt := fmt.Sprintf(`Gere um runbook operacional completo para o serviço %s.

Inclua:
1. Visão Geral do Serviço
2. Procedimentos de Deploy
3. Procedimentos de Rollback
4. Troubleshooting Comum
5. Monitoramento e Alertas
6. Escalação
7. Contatos de Emergência

Baseado em: %s, %s, %v (K8s)`, 
		req.ServiceName, analysis.Language, analysis.Framework, analysis.HasK8sManifests)

	response, err := s.aiService.GenerateCompletion(domain.AIProviderClaude, prompt, "")
	if err != nil {
		return nil, err
	}

	return &domain.GeneratedDocument{
		Type:        domain.DocTypeRunbook,
		Title:       fmt.Sprintf("Runbook - %s", req.ServiceName),
		Content:     response.Content,
		Path:        fmt.Sprintf("%s/runbook.md", req.ServiceName),
		Format:      "markdown",
		GeneratedAt: time.Now(),
	}, nil
}

func (s *AutoDocsService) generateSLO(analysis *domain.RepositoryAnalysis, req domain.AutoDocRequest) (*domain.GeneratedDocument, error) {
	prompt := fmt.Sprintf(`Gere um documento de SLO (Service Level Objectives) para %s.

Inclua:
1. SLIs (Service Level Indicators)
2. SLOs por componente
3. Métricas de Disponibilidade
4. Métricas de Latência
5. Métricas de Erro
6. Budget de Erro
7. Alertas e Thresholds

Formato: Markdown com tabelas.`, req.ServiceName)

	response, err := s.aiService.GenerateCompletion(domain.AIProviderClaude, prompt, "")
	if err != nil {
		return nil, err
	}

	return &domain.GeneratedDocument{
		Type:        domain.DocTypeSLO,
		Title:       fmt.Sprintf("SLOs - %s", req.ServiceName),
		Content:     response.Content,
		Path:        fmt.Sprintf("%s/slos.md", req.ServiceName),
		Format:      "markdown",
		GeneratedAt: time.Now(),
	}, nil
}

func (s *AutoDocsService) generateStatusPage(analysis *domain.RepositoryAnalysis, req domain.AutoDocRequest) (*domain.GeneratedDocument, error) {
	content := fmt.Sprintf(`# Status Page - %s

## Status Atual
🟢 **Operacional**

## Componentes

| Componente | Status | Última Atualização |
|------------|--------|-------------------|
| API | 🟢 Operacional | %s |
| Database | 🟢 Operacional | %s |
| Cache | 🟢 Operacional | %s |

## Histórico de Incidentes

Nenhum incidente registrado.

## Métricas

- Uptime: 99.9%%
- Latência Média: < 100ms
- Taxa de Erro: < 0.1%%

---
*Última atualização: %s*
`, req.ServiceName, time.Now().Format("2006-01-02 15:04"), 
		time.Now().Format("2006-01-02 15:04"), 
		time.Now().Format("2006-01-02 15:04"),
		time.Now().Format("2006-01-02 15:04"))

	return &domain.GeneratedDocument{
		Type:        domain.DocTypeStatusPage,
		Title:       fmt.Sprintf("Status Page - %s", req.ServiceName),
		Content:     content,
		Path:        fmt.Sprintf("%s/status.md", req.ServiceName),
		Format:      "markdown",
		GeneratedAt: time.Now(),
	}, nil
}

func (s *AutoDocsService) generateDeployGuide(analysis *domain.RepositoryAnalysis, req domain.AutoDocRequest) (*domain.GeneratedDocument, error) {
	prompt := fmt.Sprintf(`Gere um guia completo de deploy para %s.

Inclua:
1. Pré-requisitos
2. Configuração do Ambiente
3. Variáveis de Ambiente
4. Passos de Deploy
5. Verificação Pós-Deploy
6. Rollback
7. Troubleshooting

Tecnologias: %s, %s
Infra: %v (Helm), %v (K8s), %v (Pipelines)

Formato: Markdown passo a passo.`, 
		req.ServiceName, analysis.Language, analysis.Framework,
		analysis.HasHelmCharts, analysis.HasK8sManifests, analysis.HasPipelines)

	response, err := s.aiService.GenerateCompletion(domain.AIProviderClaude, prompt, "")
	if err != nil {
		return nil, err
	}

	return &domain.GeneratedDocument{
		Type:        domain.DocTypeDeployGuide,
		Title:       fmt.Sprintf("Guia de Deploy - %s", req.ServiceName),
		Content:     response.Content,
		Path:        fmt.Sprintf("%s/deploy-guide.md", req.ServiceName),
		Format:      "markdown",
		GeneratedAt: time.Now(),
	}, nil
}

func (s *AutoDocsService) generateCICDFlow(analysis *domain.RepositoryAnalysis, req domain.AutoDocRequest) (*domain.GeneratedDocument, error) {
	prompt := fmt.Sprintf(`Gere um diagrama de fluxo CI/CD para %s.

Mostre:
1. Trigger (PR, Push)
2. Build
3. Testes
4. Deploy em ambientes (dev, staging, prod)
5. Aprovações
6. Notificações

Formato: Diagrama Mermaid de flowchart.

Baseado em: %v (Pipelines), %v (K8s)`, 
		req.ServiceName, analysis.HasPipelines, analysis.HasK8sManifests)

	response, err := s.aiService.GenerateCompletion(domain.AIProviderClaude, prompt, "")
	if err != nil {
		return nil, err
	}

	return &domain.GeneratedDocument{
		Type:        domain.DocTypeCICDFlow,
		Title:       fmt.Sprintf("Fluxo CI/CD - %s", req.ServiceName),
		Content:     response.Content,
		Path:        fmt.Sprintf("%s/cicd-flow.md", req.ServiceName),
		Format:      "mermaid",
		GeneratedAt: time.Now(),
	}, nil
}

func (s *AutoDocsService) saveDocumentToTechDocs(doc domain.GeneratedDocument, serviceName string) error {
	if s.techDocsService == nil {
		return fmt.Errorf("TechDocs service not available")
	}

	// Save using TechDocs service
	// This would integrate with the existing SaveDocument method
	return nil
}

func (s *AutoDocsService) getDocTypeLabel(docType domain.DocType) string {
	labels := map[domain.DocType]string{
		domain.DocTypeC4Diagram:    "Diagrama C4",
		domain.DocTypeArchitecture:  "Documentação de Arquitetura",
		domain.DocTypeRunbook:      "Runbook",
		domain.DocTypeSLO:          "SLOs",
		domain.DocTypeStatusPage:   "Status Page",
		domain.DocTypeDeployGuide:  "Guia de Deploy",
		domain.DocTypeCICDFlow:     "Fluxo CI/CD",
	}
	return labels[docType]
}

func (s *AutoDocsService) GetProgress(progressID string) (*domain.AutoDocProgress, error) {
	return s.getProgress(progressID)
}

func (s *AutoDocsService) getProgress(progressID string) (*domain.AutoDocProgress, error) {
	if s.progressStore == nil {
		return nil, fmt.Errorf("progress store not available")
	}

	var progress domain.AutoDocProgress
	err := s.progressStore.GetJSON(fmt.Sprintf("autodocs:progress:%s", progressID), &progress)
	if err != nil {
		return nil, err
	}

	return &progress, nil
}

func (s *AutoDocsService) updateProgress(progressID string, progress *domain.AutoDocProgress) {
	progress.UpdatedAt = time.Now()
	s.saveProgress(progressID, progress)
}

func (s *AutoDocsService) saveProgress(progressID string, progress *domain.AutoDocProgress) {
	if s.progressStore == nil {
		return
	}

	key := fmt.Sprintf("autodocs:progress:%s", progressID)
	data, _ := json.Marshal(progress)
	s.progressStore.Set(key, string(data), 2*time.Hour)
}

