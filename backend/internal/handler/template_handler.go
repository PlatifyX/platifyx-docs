package handler

import (
	"net/http"

	"github.com/PlatifyX/platifyx-core/internal/domain"
	"github.com/PlatifyX/platifyx-core/internal/service"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"github.com/gin-gonic/gin"
)

type TemplateHandler struct {
	service *service.TemplateService
	log     *logger.Logger
}

func NewTemplateHandler(svc *service.TemplateService, log *logger.Logger) *TemplateHandler {
	return &TemplateHandler{
		service: svc,
		log:     log,
	}
}

// ListTemplates returns available template types
// GET /api/templates
func (h *TemplateHandler) ListTemplates(c *gin.Context) {
	templates, err := h.service.ListTemplates()
	if err != nil {
		h.log.Errorw("Failed to list templates", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, templates)
}

// GenerateTemplate generates a new service from template
// POST /api/templates/generate
func (h *TemplateHandler) GenerateTemplate(c *gin.Context) {
	var req domain.CreateTemplateRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		h.log.Errorw("Invalid request", "error", err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	h.log.Infow("Generating template", "squad", req.Squad, "app", req.AppName, "type", req.TemplateType)

	response, err := h.service.GenerateTemplate(req)
	if err != nil {
		h.log.Errorw("Failed to generate template", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	h.log.Infow("Template generated successfully", "repository", response.RepositoryName, "files", len(response.Files))
	c.JSON(http.StatusOK, response)
}

// PreviewTemplate generates template preview without saving
// POST /api/templates/preview
func (h *TemplateHandler) PreviewTemplate(c *gin.Context) {
	var req domain.CreateTemplateRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		h.log.Errorw("Invalid request", "error", err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	response, err := h.service.GenerateTemplate(req)
	if err != nil {
		h.log.Errorw("Failed to preview template", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	// Return just file list and instructions for preview
	c.JSON(http.StatusOK, gin.H{
		"repositoryName": response.RepositoryName,
		"fileCount":      len(response.Files),
		"files":          getFileList(response.Files),
		"instructions":   response.Instructions,
		"metadata":       response.Metadata,
	})
}

// getFileList returns just the file paths from the files map
func getFileList(files map[string]string) []string {
	list := make([]string, 0, len(files))
	for path := range files {
		list = append(list, path)
	}
	return list
}
