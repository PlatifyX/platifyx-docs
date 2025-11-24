package handler

import (
	"net/http"

	"github.com/PlatifyX/platifyx-core/internal/domain"
	"github.com/PlatifyX/platifyx-core/internal/service"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"github.com/gin-gonic/gin"
)

type AutonomousHandler struct {
	recommendationsService *service.AutonomousRecommendationsService
	troubleshootingService  *service.TroubleshootingAssistantService
	actionsService          *service.AutonomousActionsService
	log                     *logger.Logger
}

func NewAutonomousHandler(
	recommendationsService *service.AutonomousRecommendationsService,
	troubleshootingService *service.TroubleshootingAssistantService,
	actionsService *service.AutonomousActionsService,
	log *logger.Logger,
) *AutonomousHandler {
	return &AutonomousHandler{
		recommendationsService: recommendationsService,
		troubleshootingService:  troubleshootingService,
		actionsService:          actionsService,
		log:                    log,
	}
}

func (h *AutonomousHandler) GetRecommendations(c *gin.Context) {
	orgUUID := c.GetString("organization_uuid")
	if orgUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Organization UUID is required",
		})
		return
	}

	recommendations, err := h.recommendationsService.GenerateRecommendations(orgUUID)
	if err != nil {
		h.log.Errorw("Failed to generate recommendations", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"recommendations": recommendations,
		"total":           len(recommendations),
	})
}

func (h *AutonomousHandler) Troubleshoot(c *gin.Context) {
	orgUUID := c.GetString("organization_uuid")
	if orgUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Organization UUID is required",
		})
		return
	}

	var req struct {
		Question    string                 `json:"question"`
		Context     map[string]interface{} `json:"context,omitempty"`
		ServiceName string                 `json:"serviceName,omitempty"`
		Deployment  string                 `json:"deployment,omitempty"`
		Namespace   string                 `json:"namespace,omitempty"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	troubleshootingReq := domain.TroubleshootingRequest{
		Question:    req.Question,
		Context:     req.Context,
		ServiceName: req.ServiceName,
		Deployment:  req.Deployment,
		Namespace:   req.Namespace,
	}

	response, err := h.troubleshootingService.Troubleshoot(orgUUID, troubleshootingReq)
	if err != nil {
		h.log.Errorw("Failed to troubleshoot", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}

func (h *AutonomousHandler) ExecuteAction(c *gin.Context) {
	var action struct {
		Type        string                 `json:"type"`
		Description string                 `json:"description"`
		Command     string                 `json:"command,omitempty"`
		APIEndpoint string                 `json:"apiEndpoint,omitempty"`
		Parameters  map[string]interface{} `json:"parameters,omitempty"`
		AutoExecute bool                   `json:"autoExecute"`
	}

	if err := c.ShouldBindJSON(&action); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID := c.GetString("user_id")
	if userID == "" {
		userID = "system"
	}

	recommendedAction := domain.RecommendedAction{
		Type:        action.Type,
		Description: action.Description,
		Command:     action.Command,
		APIEndpoint: action.APIEndpoint,
		Parameters:  action.Parameters,
		AutoExecute: action.AutoExecute,
	}

	result, err := h.actionsService.ExecuteAction(recommendedAction, userID)
	if err != nil {
		h.log.Errorw("Failed to execute action", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

func (h *AutonomousHandler) GetConfig(c *gin.Context) {
	config := h.actionsService.GetConfig()
	c.JSON(http.StatusOK, config)
}

func (h *AutonomousHandler) UpdateConfig(c *gin.Context) {
	var config domain.AutonomousConfig
	if err := c.ShouldBindJSON(&config); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	h.actionsService.UpdateConfig(&config)
	c.JSON(http.StatusOK, gin.H{"message": "Config updated successfully", "config": config})
}

