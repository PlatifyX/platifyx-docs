package handler

import (
	"net/http"

	"github.com/PlatifyX/platifyx-core/internal/service"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"github.com/gin-gonic/gin"
)

type AIHandler struct {
	service *service.AIService
	log     *logger.Logger
}

func NewAIHandler(svc *service.AIService, log *logger.Logger) *AIHandler {
	return &AIHandler{
		service: svc,
		log:     log,
	}
}

// GetProviders returns list of available AI providers
func (h *AIHandler) GetProviders(c *gin.Context) {
	orgUUID := c.GetString("organization_uuid")
	if orgUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Organization UUID is required",
		})
		return
	}

	providers, err := h.service.GetAvailableProviders(orgUUID)
	if err != nil {
		h.log.Errorw("Failed to get AI providers", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get AI providers",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"providers": providers,
		"total":     len(providers),
	})
}
