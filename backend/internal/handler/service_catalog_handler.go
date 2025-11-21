package handler

import (
	"github.com/PlatifyX/platifyx-core/internal/handler/base"
	"github.com/PlatifyX/platifyx-core/internal/service"
	"github.com/PlatifyX/platifyx-core/pkg/httperr"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"github.com/gin-gonic/gin"
)

type ServiceCatalogHandler struct {
	*base.BaseHandler
	serviceCatalogService *service.ServiceCatalogService
	sonarQubeService      *service.SonarQubeService
	azureDevOpsService    *service.AzureDevOpsService
	integrationService    *service.IntegrationService
}

func NewServiceCatalogHandler(
	serviceCatalogSvc *service.ServiceCatalogService,
	sonarQubeSvc *service.SonarQubeService,
	azureDevOpsSvc *service.AzureDevOpsService,
	integrationSvc *service.IntegrationService,
	cache *service.CacheService,
	log *logger.Logger,
) *ServiceCatalogHandler {
	return &ServiceCatalogHandler{
		BaseHandler:           base.NewBaseHandler(cache, log),
		serviceCatalogService: serviceCatalogSvc,
		sonarQubeService:      sonarQubeSvc,
		azureDevOpsService:    azureDevOpsSvc,
		integrationService:    integrationSvc,
	}
}

// SyncServices syncs services from Kubernetes to database
func (h *ServiceCatalogHandler) SyncServices(c *gin.Context) {
	h.GetLogger().Infow("Starting manual service sync")

	if h.serviceCatalogService == nil {
		h.HandleError(c, httperr.ServiceUnavailable("Service catalog not configured - missing Kubernetes or Azure DevOps integration"))
		return
	}

	err := h.serviceCatalogService.SyncFromKubernetes()
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to sync services", err))
		return
	}

	h.Success(c, map[string]interface{}{
		"message": "Services synced successfully",
	})
}

// ListServices returns all services from database
func (h *ServiceCatalogHandler) ListServices(c *gin.Context) {
	if h.serviceCatalogService == nil {
		h.HandleError(c, httperr.ServiceUnavailable("Service catalog not configured"))
		return
	}

	services, err := h.serviceCatalogService.GetAll()
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to list services", err))
		return
	}

	h.Success(c, map[string]interface{}{
		"services": services,
		"total":    len(services),
	})
}

// GetServiceStatus returns runtime status for a service
func (h *ServiceCatalogHandler) GetServiceStatus(c *gin.Context) {
	serviceName := c.Param("name")

	if h.serviceCatalogService == nil {
		h.HandleError(c, httperr.ServiceUnavailable("Service catalog not configured"))
		return
	}

	status, err := h.serviceCatalogService.GetServiceStatus(serviceName)
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get service status", err))
		return
	}

	h.Success(c, status)
}

// GetServicesMetrics returns aggregated metrics (SonarQube + last build) for multiple services
func (h *ServiceCatalogHandler) GetServicesMetrics(c *gin.Context) {
	var request struct {
		ServiceNames []string `json:"serviceNames"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		h.BadRequest(c, "Invalid request body")
		return
	}

	h.GetLogger().Infow("Fetching metrics for services",
		"serviceNames", request.ServiceNames,
		"count", len(request.ServiceNames),
		"hasSonarQube", h.sonarQubeService != nil,
		"hasAzureDevOps", h.azureDevOpsService != nil,
	)

	if h.serviceCatalogService == nil {
		h.HandleError(c, httperr.ServiceUnavailable("Service catalog not configured"))
		return
	}

	// Get all Azure DevOps configurations to fetch builds from all integrations
	var azureDevOpsServices []*service.AzureDevOpsService
	if h.integrationService != nil {
		configs, err := h.integrationService.GetAllAzureDevOpsConfigs()
		if err == nil && len(configs) > 0 {
			h.GetLogger().Infow("Creating Azure DevOps services for all integrations", "count", len(configs))
			for _, config := range configs {
				azureDevOpsServices = append(azureDevOpsServices, service.NewAzureDevOpsService(*config, h.GetLogger()))
			}
		}
	}

	metrics := h.serviceCatalogService.GetMultipleServiceMetrics(request.ServiceNames, h.sonarQubeService, azureDevOpsServices)

	h.GetLogger().Infow("Returning metrics", "metricsCount", len(metrics))

	h.Success(c, map[string]interface{}{
		"metrics": metrics,
	})
}
