package service

import (
	"github.com/PlatifyX/platifyx-core/internal/config"
	"github.com/PlatifyX/platifyx-core/internal/domain"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
)

type ServiceManager struct {
	ServiceService     *ServiceService
	MetricsService     *MetricsService
	KubernetesService  *KubernetesService
	AzureDevOpsService *AzureDevOpsService
}

func NewServiceManager(cfg *config.Config, log *logger.Logger) *ServiceManager {
	var azureDevOpsService *AzureDevOpsService
	if cfg.AzureDevOpsOrganization != "" && cfg.AzureDevOpsProject != "" && cfg.AzureDevOpsPAT != "" {
		azureDevOpsConfig := domain.AzureDevOpsConfig{
			Organization: cfg.AzureDevOpsOrganization,
			Project:      cfg.AzureDevOpsProject,
			PAT:          cfg.AzureDevOpsPAT,
		}
		azureDevOpsService = NewAzureDevOpsService(azureDevOpsConfig, log)
	}

	return &ServiceManager{
		ServiceService:     NewServiceService(),
		MetricsService:     NewMetricsService(),
		KubernetesService:  NewKubernetesService(),
		AzureDevOpsService: azureDevOpsService,
	}
}
