package handler

import (
	"net/http"

	"github.com/PlatifyX/platifyx-core/internal/service"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"github.com/gin-gonic/gin"
)

type ServiceCatalogHandler struct {
	integrationService *service.IntegrationService
	log                *logger.Logger
}

func NewServiceCatalogHandler(integrationSvc *service.IntegrationService, log *logger.Logger) *ServiceCatalogHandler {
	return &ServiceCatalogHandler{
		integrationService: integrationSvc,
		log:                log,
	}
}

// getService creates a ServiceCatalogService with required dependencies
func (h *ServiceCatalogHandler) getService() (*service.ServiceCatalogService, error) {
	// Get Kubernetes service
	kubeConfig, err := h.integrationService.GetKubernetesConfig()
	if err != nil || kubeConfig == nil {
		return nil, err
	}

	kubeService, err := service.NewKubernetesService(*kubeConfig, h.log)
	if err != nil {
		return nil, err
	}

	// Get Azure DevOps service
	azureConfig, err := h.integrationService.GetAzureDevOpsConfig()
	if err != nil || azureConfig == nil {
		return nil, err
	}

	azureService := service.NewAzureDevOpsService(*azureConfig, h.log)

	// Create ServiceCatalogService
	// Note: serviceRepo will be injected by ServiceManager
	return nil, nil // Temporary - will be fixed
}

// SyncServices syncs services from Kubernetes to database
func (h *ServiceCatalogHandler) SyncServices(c *gin.Context) {
	h.log.Info("Starting manual service sync")

	svc, err := h.getService()
	if err != nil {
		h.log.Errorw("Failed to get service catalog service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to initialize service catalog",
		})
		return
	}

	if svc == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "Service catalog not configured - missing Kubernetes or Azure DevOps integration",
		})
		return
	}

	err = svc.SyncFromKubernetes()
	if err != nil {
		h.log.Errorw("Failed to sync services", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to sync services",
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
	// This will be implemented after fixing the architecture
	c.JSON(http.StatusOK, gin.H{
		"services": []interface{}{},
		"total":    0,
	})
}

// GetServiceStatus returns runtime status for a service
func (h *ServiceCatalogHandler) GetServiceStatus(c *gin.Context) {
	serviceName := c.Param("name")
	
	c.JSON(http.StatusOK, gin.H{
		"serviceName": serviceName,
		"message":     "Status endpoint - to be implemented",
	})
}
