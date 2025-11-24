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

	orgUUID := c.GetString("organization_uuid")
	if orgUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Organization UUID is required",
		})
		return
	}

	kubeConfig, err := h.integrationService.GetKubernetesConfig(orgUUID)
	if err != nil || kubeConfig == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "Kubernetes integration not configured for this organization",
		})
		return
	}

	kubeService, err := service.NewKubernetesService(*kubeConfig, h.log)
	if err != nil {
		h.log.Errorw("Failed to create Kubernetes service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to initialize Kubernetes service",
		})
		return
	}

	if h.serviceCatalogService == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "Service catalog not configured - missing Kubernetes or Azure DevOps integration",
		})
		return
	}

	err = h.serviceCatalogService.SyncFromKubernetesWithServiceAndOrg(kubeService, orgUUID)
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

	orgUUID := c.GetString("organization_uuid")
	if orgUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Organization UUID is required",
		})
		return
	}

	if h.serviceCatalogService == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "Service catalog not configured",
		})
		return
	}

	// Get Kubernetes config dynamically
	kubeConfig, err := h.integrationService.GetKubernetesConfig(orgUUID)
	if err != nil || kubeConfig == nil {
		// Return empty status if Kubernetes is not configured
		c.JSON(http.StatusOK, gin.H{
			"serviceName": serviceName,
		})
		return
	}

	kubeService, err := service.NewKubernetesService(*kubeConfig, h.log)
	if err != nil {
		h.log.Errorw("Failed to create Kubernetes service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to initialize Kubernetes service",
		})
		return
	}

	status, err := h.serviceCatalogService.GetServiceStatusWithKubeService(serviceName, kubeService)
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
	orgUUID := c.GetString("organization_uuid")
	if orgUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Organization UUID is required",
		})
		return
	}

	var azureDevOpsServices []*service.AzureDevOpsService
	if h.integrationService != nil {
		configs, err := h.integrationService.GetAllAzureDevOpsConfigs(orgUUID)
		if err == nil && len(configs) > 0 {
			h.log.Infow("Creating Azure DevOps services for all integrations", "count", len(configs))
			for _, config := range configs {
				azureDevOpsServices = append(azureDevOpsServices, service.NewAzureDevOpsService(*config, h.log))
			}
		}
	}

	// Get all SonarQube configurations to fetch metrics from all integrations
	var sonarQubeServices []*service.SonarQubeService
	if h.integrationService != nil {
		configs, err := h.integrationService.GetAllSonarQubeConfigs(orgUUID)
		if err == nil && len(configs) > 0 {
			h.log.Infow("Creating SonarQube services for all integrations", "count", len(configs))
			for _, config := range configs {
				sonarQubeServices = append(sonarQubeServices, service.NewSonarQubeService(*config, h.log))
			}
		}
	}

	metrics := h.serviceCatalogService.GetMultipleServiceMetrics(request.ServiceNames, sonarQubeServices, azureDevOpsServices)

	h.log.Infow("Returning metrics", "metricsCount", len(metrics))

	c.JSON(http.StatusOK, gin.H{
		"metrics": metrics,
	})
}
