package handler

import (
	"net/http"

	"github.com/PlatifyX/platifyx-core/internal/service"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"github.com/gin-gonic/gin"
)

type ServiceCatalogHandler struct {
	serviceCatalogService *service.ServiceCatalogService
	log                   *logger.Logger
}

func NewServiceCatalogHandler(serviceCatalogSvc *service.ServiceCatalogService, log *logger.Logger) *ServiceCatalogHandler {
	return &ServiceCatalogHandler{
		serviceCatalogService: serviceCatalogSvc,
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
