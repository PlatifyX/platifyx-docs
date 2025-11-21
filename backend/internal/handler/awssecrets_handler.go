package handler

import (
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
	awsSecretsService, err := h.service.GetAWSSecretsService()
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get AWS Secrets service", err))
		return
	}
	if awsSecretsService == nil {
		h.HandleError(c, httperr.ServiceUnavailable("AWS Secrets Manager integration not configured"))
		return
	}

	stats, err := awsSecretsService.GetStats(c.Request.Context())
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get AWS Secrets stats", err))
		return
	}

	h.Success(c, stats)
}

func (h *AWSSecretsHandler) ListSecrets(c *gin.Context) {
	awsSecretsService, err := h.service.GetAWSSecretsService()
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get AWS Secrets service", err))
		return
	}
	if awsSecretsService == nil {
		h.HandleError(c, httperr.ServiceUnavailable("AWS Secrets Manager integration not configured"))
		return
	}

	secrets, err := awsSecretsService.ListSecrets(c.Request.Context())
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to list AWS secrets", err))
		return
	}

	// Type assert to get the length
	secretsList, ok := secrets.([]interface{})
	total := 0
	if ok {
		total = len(secretsList)
	}

	h.Success(c, map[string]interface{}{
		"secrets": secrets,
		"total":   total,
	})
}

func (h *AWSSecretsHandler) GetSecret(c *gin.Context) {
	secretName := c.Param("name")
	if secretName == "" {
		h.BadRequest(c, "Secret name is required")
		return
	}

	awsSecretsService, err := h.service.GetAWSSecretsService()
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get AWS Secrets service", err))
		return
	}
	if awsSecretsService == nil {
		h.HandleError(c, httperr.ServiceUnavailable("AWS Secrets Manager integration not configured"))
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

	awsSecretsService, err := h.service.GetAWSSecretsService()
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get AWS Secrets service", err))
		return
	}
	if awsSecretsService == nil {
		h.HandleError(c, httperr.ServiceUnavailable("AWS Secrets Manager integration not configured"))
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

	awsSecretsService, err := h.service.GetAWSSecretsService()
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get AWS Secrets service", err))
		return
	}
	if awsSecretsService == nil {
		h.HandleError(c, httperr.ServiceUnavailable("AWS Secrets Manager integration not configured"))
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

	awsSecretsService, err := h.service.GetAWSSecretsService()
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get AWS Secrets service", err))
		return
	}
	if awsSecretsService == nil {
		h.HandleError(c, httperr.ServiceUnavailable("AWS Secrets Manager integration not configured"))
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

	awsSecretsService, err := h.service.GetAWSSecretsService()
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to get AWS Secrets service", err))
		return
	}
	if awsSecretsService == nil {
		h.HandleError(c, httperr.ServiceUnavailable("AWS Secrets Manager integration not configured"))
		return
	}

	secret, err := awsSecretsService.DescribeSecret(c.Request.Context(), secretName)
	if err != nil {
		h.HandleError(c, httperr.InternalErrorWrap("Failed to describe AWS secret", err))
		return
	}

	h.Success(c, secret)
}
