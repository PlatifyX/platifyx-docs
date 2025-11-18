package handler

import (
	"net/http"

	"github.com/PlatifyX/platifyx-core/internal/domain"
	"github.com/PlatifyX/platifyx-core/internal/service"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"github.com/gin-gonic/gin"
)

type ServiceTemplateHandler struct {
	service *service.ServiceTemplateService
	log     *logger.Logger
}

func NewServiceTemplateHandler(svc *service.ServiceTemplateService, log *logger.Logger) *ServiceTemplateHandler {
	return &ServiceTemplateHandler{
		service: svc,
		log:     log,
	}
}

// GetAllTemplates returns all available templates
func (h *ServiceTemplateHandler) GetAllTemplates(c *gin.Context) {
	templates, err := h.service.GetAllTemplates()
	if err != nil {
		h.log.Errorw("Failed to get templates", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"templates": templates,
		"total":     len(templates),
	})
}

// GetTemplateByID returns a specific template
func (h *ServiceTemplateHandler) GetTemplateByID(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Template ID is required",
		})
		return
	}

	template, err := h.service.GetTemplateByID(id)
	if err != nil {
		h.log.Errorw("Failed to get template", "error", err, "id", id)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	if template == nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Template not found",
		})
		return
	}

	c.JSON(http.StatusOK, template)
}

// CreateService creates a new service from a template
func (h *ServiceTemplateHandler) CreateService(c *gin.Context) {
	var req domain.CreateServiceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
		})
		return
	}

	if req.TemplateID == "" || req.ServiceName == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "templateId and serviceName are required",
		})
		return
	}

	service, err := h.service.CreateService(req)
	if err != nil {
		h.log.Errorw("Failed to create service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	h.log.Infow("Service created", "service", service.Name, "id", service.ID)

	c.JSON(http.StatusCreated, service)
}

// GetAllServices returns all created services
func (h *ServiceTemplateHandler) GetAllServices(c *gin.Context) {
	services, err := h.service.GetAllServices()
	if err != nil {
		h.log.Errorw("Failed to get services", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"services": services,
		"total":    len(services),
	})
}

// GetServiceByID returns a specific service
func (h *ServiceTemplateHandler) GetServiceByID(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Service ID is required",
		})
		return
	}

	service, err := h.service.GetServiceByID(id)
	if err != nil {
		h.log.Errorw("Failed to get service", "error", err, "id", id)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	if service == nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Service not found",
		})
		return
	}

	c.JSON(http.StatusOK, service)
}

// GetStats returns template statistics
func (h *ServiceTemplateHandler) GetStats(c *gin.Context) {
	stats, err := h.service.GetStats()
	if err != nil {
		h.log.Errorw("Failed to get stats", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// InitializeTemplates initializes default templates
func (h *ServiceTemplateHandler) InitializeTemplates(c *gin.Context) {
	if err := h.service.InitializeDefaultTemplates(); err != nil {
		h.log.Errorw("Failed to initialize templates", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Templates initialized successfully",
	})
}
