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

	return &ServiceManager{
		ServiceService:      NewServiceService(),
		MetricsService:      NewMetricsService(),
		KubernetesService:   NewKubernetesService(),
		AzureDevOpsService:  azureDevOpsService,
		IntegrationService:  integrationService,
	}
}
