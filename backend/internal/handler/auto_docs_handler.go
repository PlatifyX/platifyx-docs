package handler

import (
	"net/http"

	"github.com/PlatifyX/platifyx-core/internal/domain"
	"github.com/PlatifyX/platifyx-core/internal/service"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"github.com/gin-gonic/gin"
)

type AutoDocsHandler struct {
	service *service.AutoDocsService
	log     *logger.Logger
}

func NewAutoDocsHandler(svc *service.AutoDocsService, log *logger.Logger) *AutoDocsHandler {
	return &AutoDocsHandler{
		service: svc,
		log:     log,
	}
}

func (h *AutoDocsHandler) GenerateAutoDocs(c *gin.Context) {
	var req struct {
		RepositoryURL    string   `json:"repositoryUrl"`
		RepositorySource string   `json:"repositorySource"`
		IntegrationID    int      `json:"integrationId"`
		DocTypes         []string `json:"docTypes,omitempty"`
		ServiceName      string   `json:"serviceName"`
		Branch           string   `json:"branch,omitempty"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.RepositoryURL == "" || req.ServiceName == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "repositoryUrl and serviceName are required"})
		return
	}

	autoDocReq := domain.AutoDocRequest{
		RepositoryURL:    req.RepositoryURL,
		RepositorySource: domain.RepositorySource(req.RepositorySource),
		IntegrationID:    req.IntegrationID,
		ServiceName:      req.ServiceName,
		Branch:           req.Branch,
	}

	// Convert doc types
	if len(req.DocTypes) > 0 {
		for _, dt := range req.DocTypes {
			autoDocReq.DocTypes = append(autoDocReq.DocTypes, domain.DocType(dt))
		}
	}

	progress, err := h.service.GenerateAutoDocs(autoDocReq)
	if err != nil {
		h.log.Errorw("Failed to generate auto docs", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, progress)
}

func (h *AutoDocsHandler) GetProgress(c *gin.Context) {
	progressID := c.Param("id")
	if progressID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "progress id is required"})
		return
	}

	progress, err := h.service.GetProgress(progressID)
	if err != nil {
		h.log.Errorw("Failed to get progress", "error", err, "progressId", progressID)
		c.JSON(http.StatusNotFound, gin.H{"error": "Progress not found"})
		return
	}

	c.JSON(http.StatusOK, progress)
}

