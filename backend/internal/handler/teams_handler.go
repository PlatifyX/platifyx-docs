package handler

import (
	"github.com/PlatifyX/platifyx-core/internal/domain"
	"github.com/PlatifyX/platifyx-core/internal/handler/base"
	"github.com/PlatifyX/platifyx-core/internal/service"
	"github.com/PlatifyX/platifyx-core/pkg/httperr"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"github.com/gin-gonic/gin"
)

type TeamsHandler struct {
	*base.BaseHandler
	integrationService *service.IntegrationService
}

func NewTeamsHandler(
	svc *service.IntegrationService,
	cache *service.CacheService,
	log *logger.Logger,
) *TeamsHandler {
	return &TeamsHandler{
		BaseHandler:        base.NewBaseHandler(cache, log),
		integrationService: svc,
	}
}

func (h *TeamsHandler) SendMessage(c *gin.Context) {
	var input domain.TeamsMessage

	if err := c.ShouldBindJSON(&input); err != nil {
		h.BadRequest(c, "Invalid request body")
		return
	}

	teamsService, err := h.integrationService.GetTeamsService()
	if err != nil {
		h.HandleError(c, httperr.ServiceUnavailable("Teams integration not configured"))
		return
	}

	if err := teamsService.SendMessage(input); err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to send Teams message", err))
		return
	}

	h.Success(c, map[string]interface{}{
		"message": "Message sent successfully",
	})
}

func (h *TeamsHandler) SendSimpleMessage(c *gin.Context) {
	var input struct {
		Title string `json:"title" binding:"required"`
		Text  string `json:"text" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		h.BadRequest(c, "Invalid request body")
		return
	}

	teamsService, err := h.integrationService.GetTeamsService()
	if err != nil {
		h.HandleError(c, httperr.ServiceUnavailable("Teams integration not configured"))
		return
	}

	if err := teamsService.SendSimpleMessage(input.Title, input.Text); err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to send simple Teams message", err))
		return
	}

	h.Success(c, map[string]interface{}{
		"message": "Message sent successfully",
	})
}

func (h *TeamsHandler) SendAlert(c *gin.Context) {
	var input struct {
		Title string `json:"title" binding:"required"`
		Text  string `json:"text" binding:"required"`
		Color string `json:"color"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		h.BadRequest(c, "Invalid request body")
		return
	}

	teamsService, err := h.integrationService.GetTeamsService()
	if err != nil {
		h.HandleError(c, httperr.ServiceUnavailable("Teams integration not configured"))
		return
	}

	color := input.Color
	if color == "" {
		color = "0078D7" // Default Microsoft blue
	}

	if err := teamsService.SendAlert(input.Title, input.Text, color); err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to send Teams alert", err))
		return
	}

	h.Success(c, map[string]interface{}{
		"message": "Alert sent successfully",
	})
}
