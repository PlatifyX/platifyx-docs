package handler

import (
	"net/http"

	"github.com/PlatifyX/platifyx-core/internal/domain"
	"github.com/PlatifyX/platifyx-core/internal/service"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"github.com/gin-gonic/gin"
)

type SlackHandler struct {
	service *service.IntegrationService
	log     *logger.Logger
}

func NewSlackHandler(svc *service.IntegrationService, log *logger.Logger) *SlackHandler {
	return &SlackHandler{
		service: svc,
		log:     log,
	}
}

func (h *SlackHandler) SendMessage(c *gin.Context) {
	orgUUID := c.GetString("organization_uuid")
	if orgUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Organization UUID is required",
		})
		return
	}

	var input domain.SlackMessage

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	slackService, err := h.service.GetSlackService(orgUUID)
	if err != nil {
		h.log.Errorw("Failed to get Slack service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Slack integration not configured",
		})
		return
	}

	if err := slackService.SendMessage(input); err != nil {
		h.log.Errorw("Failed to send Slack message", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Message sent successfully",
	})
}

func (h *SlackHandler) SendSimpleMessage(c *gin.Context) {
	orgUUID := c.GetString("organization_uuid")
	if orgUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Organization UUID is required",
		})
		return
	}

	var input struct {
		Text string `json:"text" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	slackService, err := h.service.GetSlackService(orgUUID)
	if err != nil {
		h.log.Errorw("Failed to get Slack service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Slack integration not configured",
		})
		return
	}

	if err := slackService.SendSimpleMessage(input.Text); err != nil {
		h.log.Errorw("Failed to send simple Slack message", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Message sent successfully",
	})
}

func (h *SlackHandler) SendAlert(c *gin.Context) {
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

	slackService, err := h.service.GetSlackService(orgUUID)
	if err != nil {
		h.log.Errorw("Failed to get Slack service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Slack integration not configured",
		})
		return
	}

	color := input.Color
	if color == "" {
		color = "#36a64f" // Default green
	}

	if err := slackService.SendAlert(input.Title, input.Text, color); err != nil {
		h.log.Errorw("Failed to send Slack alert", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Alert sent successfully",
	})
}
