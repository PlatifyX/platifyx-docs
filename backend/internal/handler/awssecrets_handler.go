package handler

import (
	"fmt"

	"github.com/PlatifyX/platifyx-core/internal/handler/base"
	"github.com/PlatifyX/platifyx-core/internal/service"
	"github.com/PlatifyX/platifyx-core/pkg/httperr"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"github.com/gin-gonic/gin"
)

type AWSSecretsHandler struct {
	*base.BaseHandler
	service *service.IntegrationService
}

func NewAWSSecretsHandler(
	svc *service.IntegrationService,
	cache *service.CacheService,
	log *logger.Logger,
) *AWSSecretsHandler {
	return &AWSSecretsHandler{
		BaseHandler: base.NewBaseHandler(cache, log),
		service:     svc,
	}
}

func (h *AWSSecretsHandler) GetStats(c *gin.Context) {
	awsSecretsService, err := h.getAWSSecretsServiceFromRequest(c)
	if err != nil {
		h.HandleError(c, err)
		return
	}

	stats, err := awsSecretsService.GetStats(c.Request.Context())
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get AWS Secrets stats", err))
		return
	}

	h.Success(c, stats)
}

// Helper method to get AWS Secrets service from request
func (h *AWSSecretsHandler) getAWSSecretsServiceFromRequest(c *gin.Context) (*service.AWSSecretsService, error) {
	integrationIDStr := c.Query("integrationId")

	if integrationIDStr != "" {
		// Use specific integration by ID
		var integrationID int
		if _, err := fmt.Sscanf(integrationIDStr, "%d", &integrationID); err != nil {
			return nil, httperr.BadRequest("Invalid integration ID")
		}

		awsSecretsService, err := h.service.GetAWSSecretsServiceByID(integrationID)
		if err != nil {
			return nil, httperr.InternalErrorWrap("Failed to get AWS Secrets service", err)
		}
		return awsSecretsService, nil
	}

	// Use default integration (for backward compatibility)
	awsSecretsService, err := h.service.GetAWSSecretsService()
	if err != nil {
		return nil, httperr.InternalErrorWrap("Failed to get AWS Secrets service", err)
	}
	if awsSecretsService == nil {
		return nil, httperr.ServiceUnavailable("AWS Secrets Manager integration not configured")
	}

	return awsSecretsService, nil
}

func (h *AWSSecretsHandler) ListSecrets(c *gin.Context) {
	awsSecretsService, err := h.getAWSSecretsServiceFromRequest(c)
	if err != nil {
		h.HandleError(c, err)
		return
	}

	secrets, err := awsSecretsService.ListSecrets(c.Request.Context())
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to list AWS secrets", err))
		return
	}

	h.Success(c, map[string]interface{}{
		"secrets": secrets,
		"total":   len(secrets),
	})
}

func (h *AWSSecretsHandler) GetSecret(c *gin.Context) {
	secretName := c.Param("name")
	if secretName == "" {
		h.BadRequest(c, "Secret name is required")
		return
	}

	awsSecretsService, err := h.getAWSSecretsServiceFromRequest(c)
	if err != nil {
		h.HandleError(c, err)
		return
	}

	secret, err := awsSecretsService.GetSecret(c.Request.Context(), secretName)
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get AWS secret", err))
		return
	}

	h.Success(c, secret)
}

func (h *AWSSecretsHandler) CreateSecret(c *gin.Context) {
	var req struct {
		Name         string            `json:"name"`
		Description  string            `json:"description"`
		SecretString string            `json:"secretString"`
		Tags         map[string]string `json:"tags"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		h.BadRequest(c, "Invalid request body")
		return
	}

	if req.Name == "" || req.SecretString == "" {
		h.BadRequest(c, "name and secretString are required")
		return
	}

	awsSecretsService, err := h.getAWSSecretsServiceFromRequest(c)
	if err != nil {
		h.HandleError(c, err)
		return
	}

	if err := awsSecretsService.CreateSecret(c.Request.Context(), req.Name, req.Description, req.SecretString, req.Tags); err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to create AWS secret", err))
		return
	}

	h.Success(c, map[string]string{
		"message": "Secret created successfully",
	})
}

func (h *AWSSecretsHandler) UpdateSecret(c *gin.Context) {
	secretName := c.Param("name")
	if secretName == "" {
		h.BadRequest(c, "Secret name is required")
		return
	}

	var req struct {
		SecretString string `json:"secretString"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		h.BadRequest(c, "Invalid request body")
		return
	}

	if req.SecretString == "" {
		h.BadRequest(c, "secretString is required")
		return
	}

	awsSecretsService, err := h.getAWSSecretsServiceFromRequest(c)
	if err != nil {
		h.HandleError(c, err)
		return
	}

	if err := awsSecretsService.UpdateSecret(c.Request.Context(), secretName, req.SecretString); err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to update AWS secret", err))
		return
	}

	h.Success(c, map[string]string{
		"message": "Secret updated successfully",
	})
}

func (h *AWSSecretsHandler) DeleteSecret(c *gin.Context) {
	secretName := c.Param("name")
	if secretName == "" {
		h.BadRequest(c, "Secret name is required")
		return
	}

	awsSecretsService, err := h.getAWSSecretsServiceFromRequest(c)
	if err != nil {
		h.HandleError(c, err)
		return
	}

	forceDelete := c.DefaultQuery("force", "false") == "true"

	if err := awsSecretsService.DeleteSecret(c.Request.Context(), secretName, forceDelete); err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to delete AWS secret", err))
		return
	}

	h.Success(c, map[string]string{
		"message": "Secret deleted successfully",
	})
}

func (h *AWSSecretsHandler) DescribeSecret(c *gin.Context) {
	secretName := c.Param("name")
	if secretName == "" {
		h.BadRequest(c, "Secret name is required")
		return
	}

	awsSecretsService, err := h.getAWSSecretsServiceFromRequest(c)
	if err != nil {
		h.HandleError(c, err)
		return
	}

	secret, err := awsSecretsService.DescribeSecret(c.Request.Context(), secretName)
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to describe AWS secret", err))
		return
	}

	h.Success(c, secret)
}

// GetAWSIntegrations returns all AWS integrations
func (h *AWSSecretsHandler) GetAWSIntegrations(c *gin.Context) {
	integrations, err := h.service.GetAllAWSIntegrations()
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get AWS integrations", err))
		return
	}

	h.Success(c, integrations)
}
