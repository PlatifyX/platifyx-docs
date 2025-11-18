package handler

import (
	"github.com/PlatifyX/platifyx-core/internal/service"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
)

type HandlerManager struct {
	HealthHandler       *HealthHandler
	ServiceHandler      *ServiceHandler
	MetricsHandler      *MetricsHandler
	KubernetesHandler   *KubernetesHandler
	AzureDevOpsHandler  *AzureDevOpsHandler
	IntegrationHandler  *IntegrationHandler
}

func NewHandlerManager(services *service.ServiceManager, log *logger.Logger) *HandlerManager {
	return &HandlerManager{
		HealthHandler:       NewHealthHandler(),
		ServiceHandler:      NewServiceHandler(services.ServiceService, log),
		MetricsHandler:      NewMetricsHandler(services.MetricsService, log),
		KubernetesHandler:   NewKubernetesHandler(services.KubernetesService, log),
		AzureDevOpsHandler:  NewAzureDevOpsHandler(services.IntegrationService, log),
		IntegrationHandler:  NewIntegrationHandler(services.IntegrationService, log),
	}
}
