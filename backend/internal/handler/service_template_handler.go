package handler

import (
	"github.com/PlatifyX/platifyx-core/internal/domain"
	"github.com/PlatifyX/platifyx-core/internal/handler/base"
	"github.com/PlatifyX/platifyx-core/internal/service"
	"github.com/PlatifyX/platifyx-core/pkg/httperr"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"github.com/gin-gonic/gin"
)

type ServiceTemplateHandler struct {
	*base.BaseHandler
	templateService *service.ServiceTemplateService
}

func NewServiceTemplateHandler(
	svc *service.ServiceTemplateService,
	cache *service.CacheService,
	log *logger.Logger,
) *ServiceTemplateHandler {
	return &ServiceTemplateHandler{
		BaseHandler:     base.NewBaseHandler(cache, log),
		templateService: svc,
	}
}

// GetAllTemplates returns all available templates
func (h *ServiceTemplateHandler) GetAllTemplates(c *gin.Context) {
	cacheKey := service.BuildKey("service", "templates")

	h.WithCache(c, cacheKey, service.CacheDuration15Minutes, func() (interface{}, error) {
		templates, err := h.templateService.GetAllTemplates()
		if err != nil {
			return nil, httperr.InternalErrorWrap("Failed to get templates", err)
		}
		return map[string]interface{}{
			"templates": templates,
			"total":     len(templates),
		}, nil
	})
}

// GetTemplateByID returns a specific template
func (h *ServiceTemplateHandler) GetTemplateByID(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		h.BadRequest(c, "Template ID is required")
		return
	}

	template, err := h.templateService.GetTemplateByID(id)
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get template", err))
		return
	}

	if template == nil {
		h.NotFound(c, "Template not found")
		return
	}

	h.Success(c, template)
}

// CreateService creates a new service from a template
func (h *ServiceTemplateHandler) CreateService(c *gin.Context) {
	var req domain.CreateServiceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.BadRequest(c, "Invalid request body")
		return
	}

	if req.TemplateID == "" || req.ServiceName == "" {
		h.BadRequest(c, "templateId and serviceName are required")
		return
	}

	service, err := h.templateService.CreateService(req)
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to create service", err))
		return
	}

	h.GetLogger().Infow("Service created", "service", service.Name, "id", service.ID)

	h.Created(c, service)
}

// GetAllServices returns all created services
func (h *ServiceTemplateHandler) GetAllServices(c *gin.Context) {
	services, err := h.templateService.GetAllServices()
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get services", err))
		return
	}

	h.Success(c, map[string]interface{}{
		"services": services,
		"total":    len(services),
	})
}

// GetServiceByID returns a specific service
func (h *ServiceTemplateHandler) GetServiceByID(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		h.BadRequest(c, "Service ID is required")
		return
	}

	service, err := h.templateService.GetServiceByID(id)
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get service", err))
		return
	}

	if service == nil {
		h.NotFound(c, "Service not found")
		return
	}

	h.Success(c, service)
}

// GetStats returns template statistics
func (h *ServiceTemplateHandler) GetStats(c *gin.Context) {
	cacheKey := service.BuildKey("service", "template", "stats")

	h.WithCache(c, cacheKey, service.CacheDuration5Minutes, func() (interface{}, error) {
		return h.templateService.GetStats()
	})
}

// InitializeTemplates initializes default templates
func (h *ServiceTemplateHandler) InitializeTemplates(c *gin.Context) {
	if err := h.templateService.InitializeDefaultTemplates(); err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to initialize templates", err))
		return
	}

	h.Success(c, map[string]interface{}{
		"message": "Templates initialized successfully",
	})
}
