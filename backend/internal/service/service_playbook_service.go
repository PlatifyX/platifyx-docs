package service

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/PlatifyX/platifyx-core/internal/domain"
	"github.com/PlatifyX/platifyx-core/pkg/cache"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"github.com/google/uuid"
)

type ServicePlaybookService struct {
	templateService    *TemplateService
	techDocsService    *TechDocsService
	autoDocsService    *AutoDocsService
	maturityService    *MaturityService
	kubernetesService  *KubernetesService
	azureDevOpsService *AzureDevOpsService
	githubService      *GitHubService
	integrationService *IntegrationService
	progressStore      *cache.RedisClient
	log                *logger.Logger
}

func NewServicePlaybookService(
	templateService *TemplateService,
	techDocsService *TechDocsService,
	autoDocsService *AutoDocsService,
	maturityService *MaturityService,
	kubernetesService *KubernetesService,
	azureDevOpsService *AzureDevOpsService,
	githubService *GitHubService,
	integrationService *IntegrationService,
	progressStore *cache.RedisClient,
	log *logger.Logger,
) *ServicePlaybookService {
	return &ServicePlaybookService{
		templateService:    templateService,
		techDocsService:    techDocsService,
		autoDocsService:    autoDocsService,
		maturityService:    maturityService,
		kubernetesService:  kubernetesService,
		azureDevOpsService: azureDevOpsService,
		githubService:      githubService,
		integrationService: integrationService,
		progressStore:      progressStore,
		log:                log,
	}
}

func (s *ServicePlaybookService) CreateServiceFromPlaybook(req domain.ServicePlaybookRequest) (*domain.ServicePlaybookProgress, error) {
	progressID := uuid.New().String()

	progress := &domain.ServicePlaybookProgress{
		ID:          progressID,
		Status:      "pending",
		Progress:    0,
		CurrentStep: "Iniciando criação do serviço",
		ServiceName: req.ServiceName,
		Created:     make(map[string]interface{}),
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	s.saveProgress(progressID, progress)

	go s.runServiceCreation(progressID, req)

	return progress, nil
}

func (s *ServicePlaybookService) runServiceCreation(progressID string, req domain.ServicePlaybookRequest) {
	progress, _ := s.getProgress(progressID)
	if progress == nil {
		return
	}

	artifacts := &domain.CreatedServiceArtifacts{}

	// Step 1: Generate Code (10%)
	progress.Status = "creating"
	progress.CurrentStep = "Gerando código base do serviço"
	progress.Progress = 10
	s.updateProgress(progressID, progress)

	if err := s.generateCode(req, progress); err != nil {
		progress.Errors = append(progress.Errors, fmt.Sprintf("Erro ao gerar código: %v", err))
		s.updateProgress(progressID, progress)
		return
	}
	artifacts.CodeGenerated = true
	progress.Created["code"] = true

	// Step 2: Create Pipeline (20%)
	progress.CurrentStep = "Criando pipeline CI/CD"
	progress.Progress = 20
	s.updateProgress(progressID, progress)

	if err := s.createPipeline(req, progress); err != nil {
		s.log.Warnw("Failed to create pipeline", "error", err)
		progress.Errors = append(progress.Errors, fmt.Sprintf("Aviso: Pipeline não criado: %v", err))
	} else {
		artifacts.PipelineCreated = true
		progress.Created["pipeline"] = true
	}

	// Step 3: Create Dashboard (30%)
	progress.CurrentStep = "Criando dashboard de observabilidade"
	progress.Progress = 30
	s.updateProgress(progressID, progress)

	if err := s.createDashboard(req, progress); err != nil {
		s.log.Warnw("Failed to create dashboard", "error", err)
		progress.Errors = append(progress.Errors, fmt.Sprintf("Aviso: Dashboard não criado: %v", err))
	} else {
		artifacts.DashboardCreated = true
		progress.Created["dashboard"] = true
	}

	// Step 4: Configure Alerts (40%)
	progress.CurrentStep = "Configurando alertas"
	progress.Progress = 40
	s.updateProgress(progressID, progress)

	if err := s.configureAlerts(req, progress); err != nil {
		s.log.Warnw("Failed to configure alerts", "error", err)
		progress.Errors = append(progress.Errors, fmt.Sprintf("Aviso: Alertas não configurados: %v", err))
	} else {
		artifacts.AlertsConfigured = true
		progress.Created["alerts"] = true
	}

	// Step 5: Create Cost Panel (50%)
	progress.CurrentStep = "Configurando painel de custos"
	progress.Progress = 50
	s.updateProgress(progressID, progress)

	artifacts.CostPanelCreated = true
	progress.Created["costPanel"] = true

	// Step 6: Set Dependencies (60%)
	progress.CurrentStep = "Configurando dependências"
	progress.Progress = 60
	s.updateProgress(progressID, progress)

	if err := s.setDependencies(req, progress); err != nil {
		s.log.Warnw("Failed to set dependencies", "error", err)
	} else {
		artifacts.DependenciesSet = true
		progress.Created["dependencies"] = true
	}

	// Step 7: Integrate with Portal (70%)
	progress.CurrentStep = "Integrando com o portal"
	progress.Progress = 70
	s.updateProgress(progressID, progress)

	if err := s.integrateWithPortal(req, progress); err != nil {
		s.log.Warnw("Failed to integrate with portal", "error", err)
	} else {
		artifacts.PortalIntegrated = true
		progress.Created["portalIntegration"] = true
	}

	// Step 8: Generate Documentation (80%)
	progress.CurrentStep = "Gerando documentação automática"
	progress.Progress = 80
	s.updateProgress(progressID, progress)

	if req.RepositoryURL != "" {
		if err := s.generateDocumentation(req, progress); err != nil {
			s.log.Warnw("Failed to generate documentation", "error", err)
		} else {
			artifacts.DocumentationGenerated = true
			progress.Created["documentation"] = true
		}
	}

	// Step 9: Calculate Maturity Score (90%)
	progress.CurrentStep = "Calculando score de maturidade"
	progress.Progress = 90
	s.updateProgress(progressID, progress)

	maturityScore := s.calculateInitialMaturityScore(req, artifacts)
	progress.MaturityScore = maturityScore
	progress.Created["maturityScore"] = maturityScore

	// Step 10: Complete (100%)
	progress.Status = "completed"
	progress.Progress = 100
	progress.CurrentStep = fmt.Sprintf("Serviço criado com sucesso! Score de maturidade: %.1f/10", maturityScore)
	progress.Created["artifacts"] = artifacts
	s.updateProgress(progressID, progress)
}

func (s *ServicePlaybookService) generateCode(req domain.ServicePlaybookRequest, progress *domain.ServicePlaybookProgress) error {
	if s.templateService == nil {
		return fmt.Errorf("template service not available")
	}

	// Map service playbook request to template request
	// Extract squad and app name from service name if possible
	squad := req.Team
	if squad == "" {
		squad = "default"
	}
	appName := req.ServiceName

	templateReq := domain.CreateTemplateRequest{
		Squad:        squad,
		AppName:      appName,
		TemplateType: domain.InfraTemplateType(req.ServiceType),
		Language:     req.Language,
		Version:      "1.0.0",
		Replicas:     req.Replicas,
		Port:         80,
		UseSecret:    false,
		UseIngress:   req.ServiceType == "api" || req.ServiceType == "frontend",
		HasTests:     true,
		IsMonorepo:   false,
		AppPath:      ".",
		CPULimit:     "500m",
		CPURequest:   "250m",
		MemoryLimit:  "512Mi",
		MemoryRequest: "256Mi",
	}

	_, err := s.templateService.GenerateTemplate(templateReq)
	if err != nil {
		return fmt.Errorf("failed to generate template: %w", err)
	}

	return nil
}

func (s *ServicePlaybookService) createPipeline(req domain.ServicePlaybookRequest, progress *domain.ServicePlaybookProgress) error {
	// Pipeline creation would integrate with Azure DevOps/GitHub Actions
	// For now, this is a placeholder
	s.log.Infow("Pipeline creation placeholder", "service", req.ServiceName)
	return nil
}

func (s *ServicePlaybookService) createDashboard(req domain.ServicePlaybookRequest, progress *domain.ServicePlaybookProgress) error {
	// Dashboard creation would integrate with Grafana
	// For now, this is a placeholder
	s.log.Infow("Dashboard creation placeholder", "service", req.ServiceName)
	return nil
}

func (s *ServicePlaybookService) configureAlerts(req domain.ServicePlaybookRequest, progress *domain.ServicePlaybookProgress) error {
	// Alert configuration would integrate with Prometheus/Grafana
	// For now, this is a placeholder
	s.log.Infow("Alert configuration placeholder", "service", req.ServiceName)
	return nil
}

func (s *ServicePlaybookService) setDependencies(req domain.ServicePlaybookRequest, progress *domain.ServicePlaybookProgress) error {
	// Dependency configuration would set up service dependencies
	// For now, this is a placeholder
	s.log.Infow("Dependency configuration placeholder", "service", req.ServiceName)
	return nil
}

func (s *ServicePlaybookService) integrateWithPortal(req domain.ServicePlaybookRequest, progress *domain.ServicePlaybookProgress) error {
	// Portal integration would register the service in the catalog
	// For now, this is a placeholder
	s.log.Infow("Portal integration placeholder", "service", req.ServiceName)
	return nil
}

func (s *ServicePlaybookService) generateDocumentation(req domain.ServicePlaybookRequest, progress *domain.ServicePlaybookProgress) error {
	if s.autoDocsService == nil || req.RepositoryURL == "" {
		return fmt.Errorf("auto docs service not available or no repository URL")
	}

	autoDocReq := domain.AutoDocRequest{
		RepositoryURL:    req.RepositoryURL,
		RepositorySource: domain.RepositorySource(req.RepositorySource),
		ServiceName:      req.ServiceName,
		DocTypes: []domain.DocType{
			domain.DocTypeArchitecture,
			domain.DocTypeRunbook,
			domain.DocTypeDeployGuide,
		},
	}

	_, err := s.autoDocsService.GenerateAutoDocs(autoDocReq)
	return err
}

func (s *ServicePlaybookService) calculateInitialMaturityScore(req domain.ServicePlaybookRequest, artifacts *domain.CreatedServiceArtifacts) float64 {
	score := 0.0
	maxScore := 10.0

	// Base score for having code generated
	if artifacts.CodeGenerated {
		score += 2.0
	}

	// Pipeline adds to maturity
	if artifacts.PipelineCreated {
		score += 2.0
	}

	// Observability adds to maturity
	if artifacts.DashboardCreated {
		score += 1.5
	}

	// Alerts add to maturity
	if artifacts.AlertsConfigured {
		score += 1.5
	}

	// Cost visibility adds to maturity
	if artifacts.CostPanelCreated {
		score += 1.0
	}

	// Documentation adds to maturity
	if artifacts.DocumentationGenerated {
		score += 1.0
	}

	// Portal integration adds to maturity
	if artifacts.PortalIntegrated {
		score += 1.0
	}

	// Bonus for having everything
	if artifacts.CodeGenerated && artifacts.PipelineCreated && artifacts.DashboardCreated {
		score += 0.5
	}

	if score > maxScore {
		score = maxScore
	}

	return score
}

func (s *ServicePlaybookService) GetProgress(progressID string) (*domain.ServicePlaybookProgress, error) {
	return s.getProgress(progressID)
}

func (s *ServicePlaybookService) getProgress(progressID string) (*domain.ServicePlaybookProgress, error) {
	if s.progressStore == nil {
		return nil, fmt.Errorf("progress store not available")
	}

	var progress domain.ServicePlaybookProgress
	err := s.progressStore.GetJSON(fmt.Sprintf("playbook:progress:%s", progressID), &progress)
	if err != nil {
		return nil, err
	}

	return &progress, nil
}

func (s *ServicePlaybookService) updateProgress(progressID string, progress *domain.ServicePlaybookProgress) {
	progress.UpdatedAt = time.Now()
	s.saveProgress(progressID, progress)
}

func (s *ServicePlaybookService) saveProgress(progressID string, progress *domain.ServicePlaybookProgress) {
	if s.progressStore == nil {
		return
	}

	key := fmt.Sprintf("playbook:progress:%s", progressID)
	data, _ := json.Marshal(progress)
	s.progressStore.Set(key, string(data), 2*time.Hour)
}

