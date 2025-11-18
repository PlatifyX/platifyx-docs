package handler

import (
	"net/http"

	"github.com/PlatifyX/platifyx-core/internal/service"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"github.com/gin-gonic/gin"
)

type TechDocsHandler struct {
	service *service.TechDocsService
	log     *logger.Logger
}

func NewTechDocsHandler(svc *service.TechDocsService, log *logger.Logger) *TechDocsHandler {
	return &TechDocsHandler{
		service: svc,
		log:     log,
	}
}

func (h *TechDocsHandler) GetTree(c *gin.Context) {
	tree, err := h.service.GetDocumentTree()
	if err != nil {
		h.log.Errorw("Failed to get document tree", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"tree": tree,
	})
}

func (h *TechDocsHandler) GetDocument(c *gin.Context) {
	path := c.Query("path")
	if path == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "path parameter is required",
		})
		return
	}

	doc, err := h.service.GetDocument(path)
	if err != nil {
		h.log.Errorw("Failed to get document", "error", err, "path", path)
		if err.Error() == "document not found" {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Document not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, doc)
}

func (h *TechDocsHandler) SaveDocument(c *gin.Context) {
	var input struct {
		Path    string `json:"path" binding:"required"`
		Content string `json:"content" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	if err := h.service.SaveDocument(input.Path, input.Content); err != nil {
		h.log.Errorw("Failed to save document", "error", err, "path", input.Path)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Document saved successfully",
	})
}

func (h *TechDocsHandler) DeleteDocument(c *gin.Context) {
	path := c.Query("path")
	if path == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "path parameter is required",
		})
		return
	}

	if err := h.service.DeleteDocument(path); err != nil {
		h.log.Errorw("Failed to delete document", "error", err, "path", path)
		if err.Error() == "document not found" {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Document not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Document deleted successfully",
	})
}

func (h *TechDocsHandler) CreateFolder(c *gin.Context) {
	var input struct {
		Path string `json:"path" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	if err := h.service.CreateFolder(input.Path); err != nil {
		h.log.Errorw("Failed to create folder", "error", err, "path", input.Path)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Folder created successfully",
	})
}

func (h *TechDocsHandler) ListDocuments(c *gin.Context) {
	path := c.DefaultQuery("path", "")

	docs, err := h.service.ListDocuments(path)
	if err != nil {
		h.log.Errorw("Failed to list documents", "error", err, "path", path)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"documents": docs,
		"total":     len(docs),
	})
}
