package handler

import (
	"net/http"

	"github.com/PlatifyX/platifyx-core/internal/service"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"github.com/gin-gonic/gin"
)

type FinOpsHandler struct {
	service *service.FinOpsService
	log     *logger.Logger
}

func NewFinOpsHandler(service *service.FinOpsService, log *logger.Logger) *FinOpsHandler {
	return &FinOpsHandler{
		service: service,
		log:     log,
	}
}

// GetStats returns aggregated cost statistics
func (h *FinOpsHandler) GetStats(c *gin.Context) {
	provider := c.Query("provider")     // azure, gcp, aws, or empty for all
	integration := c.Query("integration") // specific integration name

	stats, err := h.service.GetStats(provider, integration)
	if err != nil {
		h.log.Errorw("Failed to get FinOps stats", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// ListCosts returns detailed cost breakdown
func (h *FinOpsHandler) ListCosts(c *gin.Context) {
	provider := c.Query("provider")
	integration := c.Query("integration")

	costs, err := h.service.GetAllCosts(provider, integration)
	if err != nil {
		h.log.Errorw("Failed to list costs", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, costs)
}

// ListResources returns all cloud resources
func (h *FinOpsHandler) ListResources(c *gin.Context) {
	provider := c.Query("provider")
	integration := c.Query("integration")

	resources, err := h.service.GetAllResources(provider, integration)
	if err != nil {
		h.log.Errorw("Failed to list resources", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, resources)
}
