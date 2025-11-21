package handler

import (
	"github.com/PlatifyX/platifyx-core/internal/domain"
	"github.com/PlatifyX/platifyx-core/internal/handler/base"
	"github.com/PlatifyX/platifyx-core/internal/service"
	"github.com/PlatifyX/platifyx-core/pkg/httperr"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"github.com/gin-gonic/gin"
)

type TemplateHandler struct {
	*base.BaseHandler
	templateService *service.TemplateService
}

func NewTemplateHandler(
	svc *service.TemplateService,
	cache *service.CacheService,
	log *logger.Logger,
) *TemplateHandler {
	return &TemplateHandler{
		BaseHandler:     base.NewBaseHandler(cache, log),
		templateService: svc,
	}
}

// ListTemplates returns available template types
// GET /api/templates
func (h *TemplateHandler) ListTemplates(c *gin.Context) {
	cacheKey := service.BuildKey("templates", "list")

	h.WithCache(c, cacheKey, service.CacheDuration15Minutes, func() (interface{}, error) {
		templates, err := h.templateService.ListTemplates()
		if err != nil {
			return nil, httperr.InternalErrorWrap("Failed to list templates", err)
		}
		return templates, nil
	})
}

// GenerateTemplate generates a new service from template
// POST /api/templates/generate
func (h *TemplateHandler) GenerateTemplate(c *gin.Context) {
	var req domain.CreateTemplateRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		h.BadRequest(c, "Invalid request body")
		return
	}

	h.GetLogger().Infow("Generating template", "squad", req.Squad, "app", req.AppName, "type", req.TemplateType)

	response, err := h.templateService.GenerateTemplate(req)
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to generate template", err))
		return
	}

	h.GetLogger().Infow("Template generated successfully", "repository", response.RepositoryName, "files", len(response.Files))
	h.Success(c, response)
}

// PreviewTemplate generates template preview without saving
// POST /api/templates/preview
func (h *TemplateHandler) PreviewTemplate(c *gin.Context) {
	var req domain.CreateTemplateRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		h.BadRequest(c, "Invalid request body")
		return
	}

	response, err := h.templateService.GenerateTemplate(req)
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to preview template", err))
		return
	}

	// Return just file list and instructions for preview
	h.Success(c, map[string]interface{}{
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
