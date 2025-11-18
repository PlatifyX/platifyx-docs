package handler

import (
	"net/http"
	"strconv"

	"github.com/PlatifyX/platifyx-core/internal/service"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"github.com/gin-gonic/gin"
)

type IntegrationHandler struct {
	service *service.IntegrationService
	log     *logger.Logger
}

func NewIntegrationHandler(svc *service.IntegrationService, log *logger.Logger) *IntegrationHandler {
	return &IntegrationHandler{
		service: svc,
		log:     log,
	}
}

func (h *IntegrationHandler) List(c *gin.Context) {
	integrations, err := h.service.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch integrations",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"integrations": integrations,
		"total":        len(integrations),
	})
}

func (h *IntegrationHandler) GetByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid integration ID",
		})
		return
	}

	integration, err := h.service.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Integration not found",
		})
		return
	}

	c.JSON(http.StatusOK, integration)
}

func (h *IntegrationHandler) Update(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid integration ID",
		})
		return
	}

	var input struct {
		Enabled bool                   `json:"enabled"`
		Config  map[string]interface{} `json:"config"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	if err := h.service.Update(id, input.Enabled, input.Config); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update integration",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Integration updated successfully",
	})
}
