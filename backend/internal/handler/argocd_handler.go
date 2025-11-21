package handler

import (
	"github.com/PlatifyX/platifyx-core/internal/handler/base"
	"github.com/PlatifyX/platifyx-core/internal/service"
	"github.com/PlatifyX/platifyx-core/pkg/httperr"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"github.com/gin-gonic/gin"
)

type ArgoCDHandler struct {
	*base.BaseHandler
	service *service.IntegrationService
}

func NewArgoCDHandler(
	svc *service.IntegrationService,
	cache *service.CacheService,
	log *logger.Logger,
) *ArgoCDHandler {
	return &ArgoCDHandler{
		BaseHandler: base.NewBaseHandler(cache, log),
		service:     svc,
	}
}

func (h *ArgoCDHandler) GetStats(c *gin.Context) {
	argoCDService, err := h.service.GetArgoCDService()
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get ArgoCD service", err))
		return
	}
	if argoCDService == nil {
		h.HandleError(c, httperr.ServiceUnavailable("ArgoCD integration not configured"))
		return
	}

	stats, err := argoCDService.GetStats()
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get ArgoCD stats", err))
		return
	}

	h.Success(c, stats)
}

func (h *ArgoCDHandler) GetApplications(c *gin.Context) {
	argoCDService, err := h.service.GetArgoCDService()
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get ArgoCD service", err))
		return
	}
	if argoCDService == nil {
		h.HandleError(c, httperr.ServiceUnavailable("ArgoCD integration not configured"))
		return
	}

	apps, err := argoCDService.GetApplications()
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get ArgoCD applications", err))
		return
	}

	h.Success(c, map[string]interface{}{
		"applications": apps,
		"total":        len(apps),
	})
}

func (h *ArgoCDHandler) GetApplication(c *gin.Context) {
	name := c.Param("name")
	if name == "" {
		h.BadRequest(c, "Application name is required")
		return
	}

	argoCDService, err := h.service.GetArgoCDService()
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get ArgoCD service", err))
		return
	}
	if argoCDService == nil {
		h.HandleError(c, httperr.ServiceUnavailable("ArgoCD integration not configured"))
		return
	}

	app, err := argoCDService.GetApplication(name)
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get ArgoCD application", err))
		return
	}

	h.Success(c, app)
}

func (h *ArgoCDHandler) SyncApplication(c *gin.Context) {
	name := c.Param("name")
	if name == "" {
		h.BadRequest(c, "Application name is required")
		return
	}

	var req struct {
		Revision string `json:"revision"`
		Prune    bool   `json:"prune"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		h.BadRequest(c, "Invalid request body")
		return
	}

	argoCDService, err := h.service.GetArgoCDService()
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get ArgoCD service", err))
		return
	}
	if argoCDService == nil {
		h.HandleError(c, httperr.ServiceUnavailable("ArgoCD integration not configured"))
		return
	}

	if err := argoCDService.SyncApplication(name, req.Revision, req.Prune); err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to sync ArgoCD application", err))
		return
	}

	h.Success(c, map[string]string{
		"message": "Application sync initiated successfully",
	})
}

func (h *ArgoCDHandler) GetProjects(c *gin.Context) {
	argoCDService, err := h.service.GetArgoCDService()
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get ArgoCD service", err))
		return
	}
	if argoCDService == nil {
		h.HandleError(c, httperr.ServiceUnavailable("ArgoCD integration not configured"))
		return
	}

	projects, err := argoCDService.GetProjects()
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get ArgoCD projects", err))
		return
	}

	h.Success(c, map[string]interface{}{
		"projects": projects,
		"total":    len(projects),
	})
}

func (h *ArgoCDHandler) GetProject(c *gin.Context) {
	name := c.Param("name")
	if name == "" {
		h.BadRequest(c, "Project name is required")
		return
	}

	argoCDService, err := h.service.GetArgoCDService()
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get ArgoCD service", err))
		return
	}
	if argoCDService == nil {
		h.HandleError(c, httperr.ServiceUnavailable("ArgoCD integration not configured"))
		return
	}

	project, err := argoCDService.GetProject(name)
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get ArgoCD project", err))
		return
	}

	h.Success(c, project)
}

func (h *ArgoCDHandler) GetClusters(c *gin.Context) {
	argoCDService, err := h.service.GetArgoCDService()
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get ArgoCD service", err))
		return
	}
	if argoCDService == nil {
		h.HandleError(c, httperr.ServiceUnavailable("ArgoCD integration not configured"))
		return
	}

	clusters, err := argoCDService.GetClusters()
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get ArgoCD clusters", err))
		return
	}

	h.Success(c, map[string]interface{}{
		"clusters": clusters,
		"total":    len(clusters),
	})
}

func (h *ArgoCDHandler) RefreshApplication(c *gin.Context) {
	name := c.Param("name")
	if name == "" {
		h.BadRequest(c, "Application name is required")
		return
	}

	argoCDService, err := h.service.GetArgoCDService()
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get ArgoCD service", err))
		return
	}
	if argoCDService == nil {
		h.HandleError(c, httperr.ServiceUnavailable("ArgoCD integration not configured"))
		return
	}

	if err := argoCDService.RefreshApplication(name); err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to refresh ArgoCD application", err))
		return
	}

	h.Success(c, map[string]string{
		"message": "Application refreshed successfully",
	})
}

func (h *ArgoCDHandler) DeleteApplication(c *gin.Context) {
	name := c.Param("name")
	if name == "" {
		h.BadRequest(c, "Application name is required")
		return
	}

	argoCDService, err := h.service.GetArgoCDService()
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get ArgoCD service", err))
		return
	}
	if argoCDService == nil {
		h.HandleError(c, httperr.ServiceUnavailable("ArgoCD integration not configured"))
		return
	}

	cascade := c.DefaultQuery("cascade", "false") == "true"

	if err := argoCDService.DeleteApplication(name, cascade); err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to delete ArgoCD application", err))
		return
	}

	h.Success(c, map[string]string{
		"message": "Application deleted successfully",
	})
}

func (h *ArgoCDHandler) RollbackApplication(c *gin.Context) {
	name := c.Param("name")
	if name == "" {
		h.BadRequest(c, "Application name is required")
		return
	}

	var req struct {
		Revision string `json:"revision"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		h.BadRequest(c, "Invalid request body")
		return
	}

	if req.Revision == "" {
		h.BadRequest(c, "Revision is required")
		return
	}

	argoCDService, err := h.service.GetArgoCDService()
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get ArgoCD service", err))
		return
	}
	if argoCDService == nil {
		h.HandleError(c, httperr.ServiceUnavailable("ArgoCD integration not configured"))
		return
	}

	if err := argoCDService.RollbackApplication(name, req.Revision); err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to rollback ArgoCD application", err))
		return
	}

	h.Success(c, map[string]string{
		"message": "Application rollback initiated successfully",
	})
}
