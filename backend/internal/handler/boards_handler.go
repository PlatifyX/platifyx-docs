package handler

import (
	"net/http"

	"github.com/PlatifyX/platifyx-core/internal/domain"
	"github.com/PlatifyX/platifyx-core/internal/service"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"github.com/gin-gonic/gin"
)

type BoardsHandler struct {
	service *service.BoardsService
	log     *logger.Logger
}

func NewBoardsHandler(svc *service.BoardsService, log *logger.Logger) *BoardsHandler {
	return &BoardsHandler{
		service: svc,
		log:     log,
	}
}

func (h *BoardsHandler) GetUnifiedBoard(c *gin.Context) {
	board, err := h.service.GetUnifiedBoard()
	if err != nil {
		h.log.Errorw("Failed to get unified board", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, board)
}

func (h *BoardsHandler) GetBoardBySource(c *gin.Context) {
	source := c.Param("source")
	if source == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "source parameter is required"})
		return
	}

	board, err := h.service.GetBoardBySource(domain.BoardSource(source))
	if err != nil {
		h.log.Errorw("Failed to get board by source", "error", err, "source", source)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, board)
}

