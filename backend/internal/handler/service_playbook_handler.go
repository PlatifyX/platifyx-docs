package handler

import (
	"net/http"

	"github.com/PlatifyX/platifyx-core/internal/domain"
	"github.com/PlatifyX/platifyx-core/internal/service"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"github.com/gin-gonic/gin"
)

type ServicePlaybookHandler struct {
	service *service.ServicePlaybookService
	log     *logger.Logger
}

func NewServicePlaybookHandler(svc *service.ServicePlaybookService, log *logger.Logger) *ServicePlaybookHandler {
	return &ServicePlaybookHandler{
		service: svc,
		log:     log,
	}
}

func (h *ServicePlaybookHandler) CreateService(c *gin.Context) {
	var req struct {
		ServiceName      string                 `json:"serviceName"`
		ServiceType      string                 `json:"serviceType"`
		Language         string                 `json:"language"`
		Framework        string                 `json:"framework,omitempty"`
		Description      string                 `json:"description"`
		Team             string                 `json:"team"`
		RepositoryURL    string                 `json:"repositoryUrl,omitempty"`
		RepositorySource string                `json:"repositorySource,omitempty"`
		Namespace        string                 `json:"namespace,omitempty"`
		Environment      string                 `json:"environment"`
		Replicas         int                    `json:"replicas,omitempty"`
		Resources        map[string]interface{} `json:"resources,omitempty"`
		Config           map[string]interface{} `json:"config,omitempty"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.ServiceName == "" || req.ServiceType == "" || req.Language == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "serviceName, serviceType, and language are required"})
		return
	}

	playbookReq := domain.ServicePlaybookRequest{
		ServiceName:      req.ServiceName,
		ServiceType:      req.ServiceType,
		Language:         req.Language,
		Framework:        req.Framework,
		Description:      req.Description,
		Team:             req.Team,
		RepositoryURL:    req.RepositoryURL,
		RepositorySource: req.RepositorySource,
		Namespace:        req.Namespace,
		Environment:      req.Environment,
		Replicas:         req.Replicas,
		Resources:        req.Resources,
		Config:           req.Config,
	}

	orgUUID := c.GetString("organization_uuid")
	if orgUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Organization UUID is required",
		})
		return
	}

	progress, err := h.service.CreateServiceFromPlaybook(orgUUID, playbookReq)
	if err != nil {
		h.log.Errorw("Failed to create service from playbook", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, progress)
}

func (h *ServicePlaybookHandler) GetProgress(c *gin.Context) {
	progressID := c.Param("id")
	if progressID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "progress id is required"})
		return
	}

	progress, err := h.service.GetProgress(progressID)
	if err != nil {
		h.log.Errorw("Failed to get progress", "error", err, "progressId", progressID)
		c.JSON(http.StatusNotFound, gin.H{"error": "Progress not found"})
		return
	}

	c.JSON(http.StatusOK, progress)
}

