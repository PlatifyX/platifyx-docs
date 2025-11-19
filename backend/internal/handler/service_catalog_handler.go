package handler

import (
	"net/http"

	"github.com/PlatifyX/platifyx-core/internal/service"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"github.com/gin-gonic/gin"
)

type ServiceCatalogHandler struct {
	serviceCatalogService *service.ServiceCatalogService
	sonarQubeService      *service.SonarQubeService
	azureDevOpsService    *service.AzureDevOpsService
	integrationService    *service.IntegrationService
	log                   *logger.Logger
}

func NewServiceCatalogHandler(serviceCatalogSvc *service.ServiceCatalogService, sonarQubeSvc *service.SonarQubeService, azureDevOpsSvc *service.AzureDevOpsService, integrationSvc *service.IntegrationService, log *logger.Logger) *ServiceCatalogHandler {
	return &ServiceCatalogHandler{
		serviceCatalogService: serviceCatalogSvc,
		sonarQubeService:      sonarQubeSvc,
		azureDevOpsService:    azureDevOpsSvc,
		integrationService:    integrationSvc,
		log:                   log,
	}
}

// SyncServices syncs services from Kubernetes to database
func (h *ServiceCatalogHandler) SyncServices(c *gin.Context) {
	h.log.Info("Starting manual service sync")

	if h.serviceCatalogService == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "Service catalog not configured - missing Kubernetes or Azure DevOps integration",
		})
		return
	}

	err := h.serviceCatalogService.SyncFromKubernetes()
	if err != nil {
		h.log.Errorw("Failed to sync services", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to sync services",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Services synced successfully",
	})
}

// ListServices returns all services from database
func (h *ServiceCatalogHandler) ListServices(c *gin.Context) {
	if h.serviceCatalogService == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "Service catalog not configured",
		})
		return
	}

	services, err := h.serviceCatalogService.GetAll()
	if err != nil {
		h.log.Errorw("Failed to list services", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to list services",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"services": services,
		"total":    len(services),
	})
}

// GetServiceStatus returns runtime status for a service
func (h *ServiceCatalogHandler) GetServiceStatus(c *gin.Context) {
	serviceName := c.Param("name")

	if h.serviceCatalogService == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "Service catalog not configured",
		})
		return
	}

	status, err := h.serviceCatalogService.GetServiceStatus(serviceName)
	if err != nil {
		h.log.Errorw("Failed to get service status", "error", err, "service", serviceName)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get service status",
		})
		return
	}

	c.JSON(http.StatusOK, status)
}

// GetServicesMetrics returns aggregated metrics (SonarQube + last build) for multiple services
func (h *ServiceCatalogHandler) GetServicesMetrics(c *gin.Context) {
	var request struct {
		ServiceNames []string `json:"serviceNames"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		h.log.Errorw("Failed to bind request", "error", err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
		})
		return
	}

	h.log.Infow("Fetching metrics for services",
		"serviceNames", request.ServiceNames,
		"count", len(request.ServiceNames),
		"hasSonarQube", h.sonarQubeService != nil,
		"hasAzureDevOps", h.azureDevOpsService != nil,
	)

	if h.serviceCatalogService == nil {
		h.log.Error("Service catalog not configured")
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "Service catalog not configured",
		})
		return
	}

	// Get all Azure DevOps configurations to fetch builds from all integrations
	var azureDevOpsServices []*service.AzureDevOpsService
	if h.integrationService != nil {
		configs, err := h.integrationService.GetAllAzureDevOpsConfigs()
		if err == nil && len(configs) > 0 {
			h.log.Infow("Creating Azure DevOps services for all integrations", "count", len(configs))
			for _, config := range configs {
				azureDevOpsServices = append(azureDevOpsServices, service.NewAzureDevOpsService(*config, h.log))
			}
		}
	}

	metrics := h.serviceCatalogService.GetMultipleServiceMetrics(request.ServiceNames, h.sonarQubeService, azureDevOpsServices)

	h.log.Infow("Returning metrics", "metricsCount", len(metrics))

	c.JSON(http.StatusOK, gin.H{
		"metrics": metrics,
	})
}
