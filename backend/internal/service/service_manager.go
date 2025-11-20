package service

import (
	"database/sql"

	"github.com/PlatifyX/platifyx-core/internal/config"
	"github.com/PlatifyX/platifyx-core/internal/repository"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
)

type ServiceManager struct {
	MetricsService         *MetricsService
	KubernetesService      *KubernetesService
	AzureDevOpsService     *AzureDevOpsService
	SonarQubeService       *SonarQubeService
	IntegrationService     *IntegrationService
	FinOpsService          *FinOpsService
	TechDocsService        *TechDocsService
	ServiceTemplateService *ServiceTemplateService
	ServiceCatalogService  *ServiceCatalogService
	AIService              *AIService
	DiagramService         *DiagramService
}

func NewServiceManager(cfg *config.Config, log *logger.Logger, db *sql.DB) *ServiceManager {
	// Initialize repository layer
	integrationRepo := repository.NewIntegrationRepository(db)
	serviceRepo := repository.NewServiceRepository(db)

	// Initialize integration service
	integrationService := NewIntegrationService(integrationRepo, log)

	// Get Azure DevOps config from database
	var azureDevOpsService *AzureDevOpsService
	azureDevOpsConfig, err := integrationService.GetAzureDevOpsConfig()
	if err == nil && azureDevOpsConfig != nil {
		azureDevOpsService = NewAzureDevOpsService(*azureDevOpsConfig, log)
	}

	// Get Kubernetes config from database
	var kubernetesService *KubernetesService
	k8sConfig, err := integrationService.GetKubernetesConfig()
	if err == nil && k8sConfig != nil {
		kubernetesService, err = NewKubernetesService(*k8sConfig, log)
		if err != nil {
			log.Errorw("Failed to initialize Kubernetes service", "error", err)
			kubernetesService = nil
		}
	}

	// Get GitHub config from database
	var githubService *GitHubService
	githubConfig, err := integrationService.GetGitHubConfig()
	if err == nil && githubConfig != nil {
		log.Infow("Initializing GitHub service",
			"organization", githubConfig.Organization,
			"hasToken", githubConfig.Token != "",
		)
		githubService = NewGitHubService(*githubConfig, log)
	} else {
		log.Warnw("GitHub integration not configured or disabled",
			"error", err,
		)
	}

	// Get SonarQube config from database
	var sonarQubeService *SonarQubeService
	sonarQubeConfig, err := integrationService.GetSonarQubeConfig()
	if err == nil && sonarQubeConfig != nil {
		sonarQubeService = NewSonarQubeService(*sonarQubeConfig, log)
	}

	// Initialize ServiceCatalog service
	var serviceCatalogService *ServiceCatalogService
	if kubernetesService != nil {
		serviceCatalogService = NewServiceCatalogService(serviceRepo, kubernetesService, azureDevOpsService, githubService, log)
	}

	// Initialize FinOps service
	finOpsService := NewFinOpsService(integrationService, log)

	// Initialize AI services
	aiService := NewAIService(integrationService, log)
	diagramService := NewDiagramService(aiService, log)

	// Initialize TechDocs service with AI capabilities
	techDocsService := NewTechDocsService("docs", aiService, diagramService, githubService, log)

	// Initialize ServiceTemplate service
	serviceTemplateRepo := repository.NewServiceTemplateRepository(db)
	serviceTemplateService := NewServiceTemplateService(serviceTemplateRepo, log)

	return &ServiceManager{
		MetricsService:         NewMetricsService(),
		KubernetesService:      kubernetesService,
		AzureDevOpsService:     azureDevOpsService,
		SonarQubeService:       sonarQubeService,
		IntegrationService:     integrationService,
		FinOpsService:          finOpsService,
		TechDocsService:        techDocsService,
		ServiceTemplateService: serviceTemplateService,
		ServiceCatalogService:  serviceCatalogService,
		AIService:              aiService,
		DiagramService:         diagramService,
	}
}
