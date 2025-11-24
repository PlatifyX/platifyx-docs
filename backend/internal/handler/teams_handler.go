package handler

import (
	"net/http"

	"github.com/PlatifyX/platifyx-core/internal/domain"
	"github.com/PlatifyX/platifyx-core/internal/service"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"github.com/gin-gonic/gin"
)

type TeamsHandler struct {
	service *service.IntegrationService
	log     *logger.Logger
}

func NewTeamsHandler(svc *service.IntegrationService, log *logger.Logger) *TeamsHandler {
	return &TeamsHandler{
		service: svc,
		log:     log,
	}
}

func (h *TeamsHandler) SendMessage(c *gin.Context) {
	orgUUID := c.GetString("organization_uuid")
	if orgUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Organization UUID is required",
		})
		return
	}

	var input domain.TeamsMessage

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	teamsService, err := h.service.GetTeamsService(orgUUID)
	if err != nil {
		h.log.Errorw("Failed to get Teams service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Teams integration not configured",
		})
		return
	}

	if err := teamsService.SendMessage(input); err != nil {
		h.log.Errorw("Failed to send Teams message", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Message sent successfully",
	})
}

func (h *TeamsHandler) SendSimpleMessage(c *gin.Context) {
	orgUUID := c.GetString("organization_uuid")
	if orgUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Organization UUID is required",
		})
		return
	}

	var input struct {
		Title string `json:"title" binding:"required"`
		Text  string `json:"text" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	teamsService, err := h.service.GetTeamsService(orgUUID)
	if err != nil {
		h.log.Errorw("Failed to get Teams service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Teams integration not configured",
		})
		return
	}

	if err := teamsService.SendSimpleMessage(input.Title, input.Text); err != nil {
		h.log.Errorw("Failed to send simple Teams message", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Message sent successfully",
	})
}

func (h *TeamsHandler) SendAlert(c *gin.Context) {
	orgUUID := c.GetString("organization_uuid")
	if orgUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Organization UUID is required",
		})
		return
	}

	var input struct {
		Title string `json:"title" binding:"required"`
		Text  string `json:"text" binding:"required"`
		Color string `json:"color"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	teamsService, err := h.service.GetTeamsService(orgUUID)
	if err != nil {
		h.log.Errorw("Failed to get Teams service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Teams integration not configured",
		})
		return
	}

	color := input.Color
	if color == "" {
		color = "0078D7" // Default Microsoft blue
	}

	if err := teamsService.SendAlert(input.Title, input.Text, color); err != nil {
		h.log.Errorw("Failed to send Teams alert", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Alert sent successfully",
	})
}
