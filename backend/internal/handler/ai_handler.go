package handler

import (
	"github.com/PlatifyX/platifyx-core/internal/handler/base"
	"github.com/PlatifyX/platifyx-core/internal/service"
	"github.com/PlatifyX/platifyx-core/pkg/httperr"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"github.com/gin-gonic/gin"
)

type AIHandler struct {
	*base.BaseHandler
	service *service.AIService
}

func NewAIHandler(
	svc *service.AIService,
	cache *service.CacheService,
	log *logger.Logger,
) *AIHandler {
	return &AIHandler{
		BaseHandler: base.NewBaseHandler(cache, log),
		service:     svc,
	}
}

// GetProviders returns list of available AI providers
func (h *AIHandler) GetProviders(c *gin.Context) {
	providers, err := h.service.GetAvailableProviders()
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get AI providers", err))
		return
	}

	h.Success(c, map[string]interface{}{
		"providers": providers,
		"total":     len(providers),
	})
}
