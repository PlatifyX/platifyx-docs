package handler

import (
	"github.com/PlatifyX/platifyx-core/internal/domain"
	"github.com/PlatifyX/platifyx-core/internal/handler/base"
	"github.com/PlatifyX/platifyx-core/internal/service"
	"github.com/PlatifyX/platifyx-core/pkg/httperr"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"github.com/gin-gonic/gin"
)

type SlackHandler struct {
	*base.BaseHandler
	integrationService *service.IntegrationService
}

func NewSlackHandler(
	svc *service.IntegrationService,
	cache *service.CacheService,
	log *logger.Logger,
) *SlackHandler {
	return &SlackHandler{
		BaseHandler:        base.NewBaseHandler(cache, log),
		integrationService: svc,
	}
}

func (h *SlackHandler) SendMessage(c *gin.Context) {
	var input domain.SlackMessage

	if err := c.ShouldBindJSON(&input); err != nil {
		h.BadRequest(c, "Invalid request body")
		return
	}

	slackService, err := h.integrationService.GetSlackService()
	if err != nil {
		h.HandleError(c, httperr.ServiceUnavailable("Slack integration not configured"))
		return
	}

	if err := slackService.SendMessage(input); err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to send Slack message", err))
		return
	}

	h.Success(c, map[string]interface{}{
		"message": "Message sent successfully",
	})
}

func (h *SlackHandler) SendSimpleMessage(c *gin.Context) {
	var input struct {
		Text string `json:"text" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		h.BadRequest(c, "Invalid request body")
		return
	}

	slackService, err := h.integrationService.GetSlackService()
	if err != nil {
		h.HandleError(c, httperr.ServiceUnavailable("Slack integration not configured"))
		return
	}

	if err := slackService.SendSimpleMessage(input.Text); err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to send simple Slack message", err))
		return
	}

	h.Success(c, map[string]interface{}{
		"message": "Message sent successfully",
	})
}

func (h *SlackHandler) SendAlert(c *gin.Context) {
	var input struct {
		Title string `json:"title" binding:"required"`
		Text  string `json:"text" binding:"required"`
		Color string `json:"color"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		h.BadRequest(c, "Invalid request body")
		return
	}

	slackService, err := h.integrationService.GetSlackService()
	if err != nil {
		h.HandleError(c, httperr.ServiceUnavailable("Slack integration not configured"))
		return
	}

	color := input.Color
	if color == "" {
		color = "#36a64f" // Default green
	}

	if err := slackService.SendAlert(input.Title, input.Text, color); err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to send Slack alert", err))
		return
	}

	h.Success(c, map[string]interface{}{
		"message": "Alert sent successfully",
	})
}
