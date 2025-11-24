package handler

import (
	"net/http"

	"github.com/PlatifyX/platifyx-core/internal/service"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"github.com/gin-gonic/gin"
)

type ArgoCDHandler struct {
	service *service.IntegrationService
	log     *logger.Logger
}

func NewArgoCDHandler(svc *service.IntegrationService, log *logger.Logger) *ArgoCDHandler {
	return &ArgoCDHandler{
		service: svc,
		log:     log,
	}
}

func (h *ArgoCDHandler) GetStats(c *gin.Context) {
	orgUUID := c.GetString("organization_uuid")
	if orgUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Organization UUID is required",
		})
		return
	}

	argoCDService, err := h.service.GetArgoCDService(orgUUID)
	if err != nil {
		h.log.Errorw("Failed to get ArgoCD service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "ArgoCD integration not configured",
		})
		return
	}

	stats, err := argoCDService.GetStats()
	if err != nil {
		h.log.Errorw("Failed to get ArgoCD stats", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, stats)
}

func (h *ArgoCDHandler) GetApplications(c *gin.Context) {
	orgUUID := c.GetString("organization_uuid")
	if orgUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Organization UUID is required",
		})
		return
	}

	argoCDService, err := h.service.GetArgoCDService(orgUUID)
	if err != nil {
		h.log.Errorw("Failed to get ArgoCD service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "ArgoCD integration not configured",
		})
		return
	}

	apps, err := argoCDService.GetApplications()
	if err != nil {
		h.log.Errorw("Failed to get ArgoCD applications", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"applications": apps,
		"total":        len(apps),
	})
}

func (h *ArgoCDHandler) GetApplication(c *gin.Context) {
	orgUUID := c.GetString("organization_uuid")
	if orgUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Organization UUID is required",
		})
		return
	}

	argoCDService, err := h.service.GetArgoCDService(orgUUID)
	if err != nil {
		h.log.Errorw("Failed to get ArgoCD service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "ArgoCD integration not configured",
		})
		return
	}

	name := c.Param("name")
	if name == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Application name is required",
		})
		return
	}

	app, err := argoCDService.GetApplication(name)
	if err != nil {
		h.log.Errorw("Failed to get ArgoCD application", "error", err, "name", name)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, app)
}

func (h *ArgoCDHandler) SyncApplication(c *gin.Context) {
	orgUUID := c.GetString("organization_uuid")
	if orgUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Organization UUID is required",
		})
		return
	}

	argoCDService, err := h.service.GetArgoCDService(orgUUID)
	if err != nil {
		h.log.Errorw("Failed to get ArgoCD service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "ArgoCD integration not configured",
		})
		return
	}

	name := c.Param("name")
	if name == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Application name is required",
		})
		return
	}

	var req struct {
		Revision string `json:"revision"`
		Prune    bool   `json:"prune"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
		})
		return
	}

	if err := argoCDService.SyncApplication(name, req.Revision, req.Prune); err != nil {
		h.log.Errorw("Failed to sync ArgoCD application", "error", err, "name", name)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Application sync initiated successfully",
	})
}

func (h *ArgoCDHandler) GetProjects(c *gin.Context) {
	orgUUID := c.GetString("organization_uuid")
	if orgUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Organization UUID is required",
		})
		return
	}

	argoCDService, err := h.service.GetArgoCDService(orgUUID)
	if err != nil {
		h.log.Errorw("Failed to get ArgoCD service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "ArgoCD integration not configured",
		})
		return
	}

	projects, err := argoCDService.GetProjects()
	if err != nil {
		h.log.Errorw("Failed to get ArgoCD projects", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"projects": projects,
		"total":    len(projects),
	})
}

func (h *ArgoCDHandler) GetProject(c *gin.Context) {
	orgUUID := c.GetString("organization_uuid")
	if orgUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Organization UUID is required",
		})
		return
	}

	argoCDService, err := h.service.GetArgoCDService(orgUUID)
	if err != nil {
		h.log.Errorw("Failed to get ArgoCD service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "ArgoCD integration not configured",
		})
		return
	}

	name := c.Param("name")
	if name == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Project name is required",
		})
		return
	}

	project, err := argoCDService.GetProject(name)
	if err != nil {
		h.log.Errorw("Failed to get ArgoCD project", "error", err, "name", name)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, project)
}

func (h *ArgoCDHandler) GetClusters(c *gin.Context) {
	orgUUID := c.GetString("organization_uuid")
	if orgUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Organization UUID is required",
		})
		return
	}

	argoCDService, err := h.service.GetArgoCDService(orgUUID)
	if err != nil {
		h.log.Errorw("Failed to get ArgoCD service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "ArgoCD integration not configured",
		})
		return
	}

	clusters, err := argoCDService.GetClusters()
	if err != nil {
		h.log.Errorw("Failed to get ArgoCD clusters", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"clusters": clusters,
		"total":    len(clusters),
	})
}

func (h *ArgoCDHandler) RefreshApplication(c *gin.Context) {
	orgUUID := c.GetString("organization_uuid")
	if orgUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Organization UUID is required",
		})
		return
	}

	argoCDService, err := h.service.GetArgoCDService(orgUUID)
	if err != nil {
		h.log.Errorw("Failed to get ArgoCD service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "ArgoCD integration not configured",
		})
		return
	}

	name := c.Param("name")
	if name == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Application name is required",
		})
		return
	}

	if err := argoCDService.RefreshApplication(name); err != nil {
		h.log.Errorw("Failed to refresh ArgoCD application", "error", err, "name", name)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Application refreshed successfully",
	})
}

func (h *ArgoCDHandler) DeleteApplication(c *gin.Context) {
	orgUUID := c.GetString("organization_uuid")
	if orgUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Organization UUID is required",
		})
		return
	}

	argoCDService, err := h.service.GetArgoCDService(orgUUID)
	if err != nil {
		h.log.Errorw("Failed to get ArgoCD service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "ArgoCD integration not configured",
		})
		return
	}

	name := c.Param("name")
	if name == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Application name is required",
		})
		return
	}

	cascade := c.DefaultQuery("cascade", "false") == "true"

	if err := argoCDService.DeleteApplication(name, cascade); err != nil {
		h.log.Errorw("Failed to delete ArgoCD application", "error", err, "name", name)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Application deleted successfully",
	})
}

func (h *ArgoCDHandler) RollbackApplication(c *gin.Context) {
	orgUUID := c.GetString("organization_uuid")
	if orgUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Organization UUID is required",
		})
		return
	}

	argoCDService, err := h.service.GetArgoCDService(orgUUID)
	if err != nil {
		h.log.Errorw("Failed to get ArgoCD service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "ArgoCD integration not configured",
		})
		return
	}

	name := c.Param("name")
	if name == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Application name is required",
		})
		return
	}

	var req struct {
		Revision string `json:"revision"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
		})
		return
	}

	if req.Revision == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Revision is required",
		})
		return
	}

	if err := argoCDService.RollbackApplication(name, req.Revision); err != nil {
		h.log.Errorw("Failed to rollback ArgoCD application", "error", err, "name", name)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Application rollback initiated successfully",
	})
}
