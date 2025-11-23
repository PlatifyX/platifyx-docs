package handler

import (
	"net/http"

	"github.com/PlatifyX/platifyx-core/internal/service"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"github.com/gin-gonic/gin"
)

type MaturityHandler struct {
	service *service.MaturityService
	log     *logger.Logger
}

func NewMaturityHandler(svc *service.MaturityService, log *logger.Logger) *MaturityHandler {
	return &MaturityHandler{
		service: svc,
		log:     log,
	}
}

func (h *MaturityHandler) GetServiceMetrics(c *gin.Context) {
	serviceName := c.Query("service")
	if serviceName == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "service parameter is required"})
		return
	}

	metrics, err := h.service.CalculateServiceMetrics(serviceName)
	if err != nil {
		h.log.Errorw("Failed to calculate service metrics", "error", err, "service", serviceName)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"service": serviceName,
		"metrics": metrics,
		"total":   len(metrics),
	})
}

func (h *MaturityHandler) GetTeamScorecard(c *gin.Context) {
	teamName := c.Param("team")
	if teamName == "" {
		teamName = c.Query("team")
	}
	if teamName == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "team parameter is required"})
		return
	}

	scorecard, err := h.service.CalculateTeamMaturityScorecard(teamName)
	if err != nil {
		h.log.Errorw("Failed to calculate team scorecard", "error", err, "team", teamName)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, scorecard)
}

func (h *MaturityHandler) GetAllTeamScorecards(c *gin.Context) {
	// This would fetch all teams and calculate scorecards
	// For now, return a placeholder
	c.JSON(http.StatusOK, gin.H{
		"teams": []interface{}{},
		"total": 0,
		"message": "Feature coming soon - will list all teams with their scorecards",
	})
}

