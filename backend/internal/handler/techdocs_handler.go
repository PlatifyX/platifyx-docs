package handler

import (
	"net/http"
	"strings"

	"github.com/PlatifyX/platifyx-core/internal/domain"
	"github.com/PlatifyX/platifyx-core/internal/handler/base"
	"github.com/PlatifyX/platifyx-core/internal/service"
	"github.com/PlatifyX/platifyx-core/pkg/httperr"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"github.com/gin-gonic/gin"
)

type TechDocsHandler struct {
	*base.BaseHandler
	techDocsService *service.TechDocsService
}

func NewTechDocsHandler(
	svc *service.TechDocsService,
	cache *service.CacheService,
	log *logger.Logger,
) *TechDocsHandler {
	return &TechDocsHandler{
		BaseHandler:     base.NewBaseHandler(cache, log),
		techDocsService: svc,
	}
}

func (h *TechDocsHandler) GetTree(c *gin.Context) {
	cacheKey := service.BuildKey("techdocs", "tree")

	h.WithCache(c, cacheKey, service.CacheDuration5Minutes, func() (interface{}, error) {
		tree, err := h.techDocsService.GetDocumentTree()
		if err != nil {
			return nil, httperr.InternalErrorWrap("Failed to get document tree", err)
		}
		return map[string]interface{}{
			"tree": tree,
		}, nil
	})
}

func (h *TechDocsHandler) GetDocument(c *gin.Context) {
	path := c.Query("path")
	if path == "" {
		h.BadRequest(c, "path parameter is required")
		return
	}

	doc, err := h.techDocsService.GetDocument(path)
	if err != nil {
		if err.Error() == "document not found" {
			h.NotFound(c, "Document not found")
			return
		}
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get document", err))
		return
	}

	h.Success(c, doc)
}

func (h *TechDocsHandler) SaveDocument(c *gin.Context) {
	var input struct {
		Path    string `json:"path" binding:"required"`
		Content string `json:"content" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		h.BadRequest(c, "Invalid request body")
		return
	}

	if err := h.techDocsService.SaveDocument(input.Path, input.Content); err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to save document", err))
		return
	}

	h.Success(c, map[string]interface{}{
		"message": "Document saved successfully",
	})
}

func (h *TechDocsHandler) DeleteDocument(c *gin.Context) {
	path := c.Query("path")
	if path == "" {
		h.BadRequest(c, "path parameter is required")
		return
	}

	if err := h.techDocsService.DeleteDocument(path); err != nil {
		if err.Error() == "document not found" {
			h.NotFound(c, "Document not found")
			return
		}
		h.HandleError(c, httperr.InternalErrorWrap("Failed to delete document", err))
		return
	}

	h.Success(c, map[string]interface{}{
		"message": "Document deleted successfully",
	})
}

func (h *TechDocsHandler) CreateFolder(c *gin.Context) {
	var input struct {
		Path string `json:"path" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		h.BadRequest(c, "Invalid request body")
		return
	}

	if err := h.techDocsService.CreateFolder(input.Path); err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to create folder", err))
		return
	}

	h.Success(c, map[string]interface{}{
		"message": "Folder created successfully",
	})
}

func (h *TechDocsHandler) ListDocuments(c *gin.Context) {
	path := c.DefaultQuery("path", "")

	docs, err := h.techDocsService.ListDocuments(path)
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to list documents", err))
		return
	}

	h.Success(c, map[string]interface{}{
		"documents": docs,
		"total":     len(docs),
	})
}

// GenerateDocumentation generates documentation using AI
func (h *TechDocsHandler) GenerateDocumentation(c *gin.Context) {
	var req domain.AIGenerateDocRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		h.BadRequest(c, "Invalid request body")
		return
	}

	progress, err := h.techDocsService.GenerateDocumentation(req)
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to generate documentation", err))
		return
	}

	c.JSON(http.StatusAccepted, map[string]interface{}{
		"progress": progress,
	})
}

func (h *TechDocsHandler) GetProgress(c *gin.Context) {
	progressID := c.Param("id")
	if progressID == "" {
		h.BadRequest(c, "progress id is required")
		return
	}

	progress, err := h.techDocsService.GetDocumentationProgress(progressID)
	if err != nil {
		if strings.Contains(strings.ToLower(err.Error()), "not found") {
			h.NotFound(c, "Progress not found")
			return
		}
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get documentation progress", err))
		return
	}

	h.Success(c, map[string]interface{}{
		"progress": progress,
	})
}

// ImproveDocumentation improves existing documentation using AI
func (h *TechDocsHandler) ImproveDocumentation(c *gin.Context) {
	var req domain.AIImproveDocRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		h.BadRequest(c, "Invalid request body")
		return
	}

	response, err := h.techDocsService.ImproveDocumentation(req)
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to improve documentation", err))
		return
	}

	h.Success(c, response)
}

// ChatAboutDocumentation provides Q&A about documentation
func (h *TechDocsHandler) ChatAboutDocumentation(c *gin.Context) {
	var req domain.AIChatRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		h.BadRequest(c, "Invalid request body")
		return
	}

	response, err := h.techDocsService.ChatAboutDocumentation(req)
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to process chat", err))
		return
	}

	h.Success(c, response)
}

// GenerateDiagram generates a diagram using AI
func (h *TechDocsHandler) GenerateDiagram(c *gin.Context) {
	var req domain.GenerateDiagramRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		h.BadRequest(c, "Invalid request body")
		return
	}

	response, err := h.techDocsService.GenerateDiagram(req)
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to generate diagram", err))
		return
	}

	h.Success(c, response)
}
