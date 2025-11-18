package service

import (
	"database/sql"

	"github.com/PlatifyX/platifyx-core/internal/config"
	"github.com/PlatifyX/platifyx-core/internal/repository"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
)

type ServiceManager struct {
	ServiceService      *ServiceService
	MetricsService      *MetricsService
	KubernetesService   *KubernetesService
	AzureDevOpsService  *AzureDevOpsService
	IntegrationService  *IntegrationService
	FinOpsService       *FinOpsService
	TechDocsService     *TechDocsService
}

func NewServiceManager(cfg *config.Config, log *logger.Logger, db *sql.DB) *ServiceManager {
	// Initialize repository layer
	integrationRepo := repository.NewIntegrationRepository(db)

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

	// Initialize FinOps service
	finOpsService := NewFinOpsService(integrationService, log)

	// Initialize TechDocs service
	techDocsService := NewTechDocsService("docs", log)

	return &ServiceManager{
		ServiceService:      NewServiceService(),
		MetricsService:      NewMetricsService(),
		KubernetesService:   kubernetesService,
		AzureDevOpsService:  azureDevOpsService,
		IntegrationService:  integrationService,
		FinOpsService:       finOpsService,
		TechDocsService:     techDocsService,
	}
}
