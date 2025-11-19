package handler

import (
	"net/http"

	"github.com/PlatifyX/platifyx-core/internal/service"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"github.com/gin-gonic/gin"
)

type AWSSecretsHandler struct {
	service *service.IntegrationService
	log     *logger.Logger
}

func NewAWSSecretsHandler(svc *service.IntegrationService, log *logger.Logger) *AWSSecretsHandler {
	return &AWSSecretsHandler{
		service: svc,
		log:     log,
	}
}

func (h *AWSSecretsHandler) GetStats(c *gin.Context) {
	awsSecretsService, err := h.service.GetAWSSecretsService()
	if err != nil {
		h.log.Errorw("Failed to get AWS Secrets service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "AWS Secrets Manager integration not configured",
		})
		return
	}

	stats, err := awsSecretsService.GetStats(c.Request.Context())
	if err != nil {
		h.log.Errorw("Failed to get AWS Secrets stats", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, stats)
}

func (h *AWSSecretsHandler) ListSecrets(c *gin.Context) {
	awsSecretsService, err := h.service.GetAWSSecretsService()
	if err != nil {
		h.log.Errorw("Failed to get AWS Secrets service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "AWS Secrets Manager integration not configured",
		})
		return
	}

	secrets, err := awsSecretsService.ListSecrets(c.Request.Context())
	if err != nil {
		h.log.Errorw("Failed to list AWS secrets", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"secrets": secrets,
		"total":   len(secrets),
	})
}

func (h *AWSSecretsHandler) GetSecret(c *gin.Context) {
	awsSecretsService, err := h.service.GetAWSSecretsService()
	if err != nil {
		h.log.Errorw("Failed to get AWS Secrets service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "AWS Secrets Manager integration not configured",
		})
		return
	}

	secretName := c.Param("name")
	if secretName == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Secret name is required",
		})
		return
	}

	secret, err := awsSecretsService.GetSecret(c.Request.Context(), secretName)
	if err != nil {
		h.log.Errorw("Failed to get AWS secret", "error", err, "name", secretName)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, secret)
}

func (h *AWSSecretsHandler) CreateSecret(c *gin.Context) {
	awsSecretsService, err := h.service.GetAWSSecretsService()
	if err != nil {
		h.log.Errorw("Failed to get AWS Secrets service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "AWS Secrets Manager integration not configured",
		})
		return
	}

	var req struct {
		Name         string            `json:"name"`
		Description  string            `json:"description"`
		SecretString string            `json:"secretString"`
		Tags         map[string]string `json:"tags"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
		})
		return
	}

	if req.Name == "" || req.SecretString == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "name and secretString are required",
		})
		return
	}

	if err := awsSecretsService.CreateSecret(c.Request.Context(), req.Name, req.Description, req.SecretString, req.Tags); err != nil {
		h.log.Errorw("Failed to create AWS secret", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Secret created successfully",
	})
}

func (h *AWSSecretsHandler) UpdateSecret(c *gin.Context) {
	awsSecretsService, err := h.service.GetAWSSecretsService()
	if err != nil {
		h.log.Errorw("Failed to get AWS Secrets service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "AWS Secrets Manager integration not configured",
		})
		return
	}

	secretName := c.Param("name")
	if secretName == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Secret name is required",
		})
		return
	}

	var req struct {
		SecretString string `json:"secretString"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
		})
		return
	}

	if req.SecretString == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "secretString is required",
		})
		return
	}

	if err := awsSecretsService.UpdateSecret(c.Request.Context(), secretName, req.SecretString); err != nil {
		h.log.Errorw("Failed to update AWS secret", "error", err, "name", secretName)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Secret updated successfully",
	})
}

func (h *AWSSecretsHandler) DeleteSecret(c *gin.Context) {
	awsSecretsService, err := h.service.GetAWSSecretsService()
	if err != nil {
		h.log.Errorw("Failed to get AWS Secrets service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "AWS Secrets Manager integration not configured",
		})
		return
	}

	secretName := c.Param("name")
	if secretName == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Secret name is required",
		})
		return
	}

	forceDelete := c.DefaultQuery("force", "false") == "true"

	if err := awsSecretsService.DeleteSecret(c.Request.Context(), secretName, forceDelete); err != nil {
		h.log.Errorw("Failed to delete AWS secret", "error", err, "name", secretName)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Secret deleted successfully",
	})
}

func (h *AWSSecretsHandler) DescribeSecret(c *gin.Context) {
	awsSecretsService, err := h.service.GetAWSSecretsService()
	if err != nil {
		h.log.Errorw("Failed to get AWS Secrets service", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "AWS Secrets Manager integration not configured",
		})
		return
	}

	secretName := c.Param("name")
	if secretName == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Secret name is required",
		})
		return
	}

	secret, err := awsSecretsService.DescribeSecret(c.Request.Context(), secretName)
	if err != nil {
		h.log.Errorw("Failed to describe AWS secret", "error", err, "name", secretName)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, secret)
}
