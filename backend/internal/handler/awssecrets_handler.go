package handler

import (
	"fmt"
	"net/http"
	"strconv"

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

func (h *AWSSecretsHandler) getIntegrationID(c *gin.Context) (int, error) {
	integrationID := c.Query("integration_id")
	if integrationID == "" {
		return 0, fmt.Errorf("integration_id parameter is required")
	}

	id, err := strconv.Atoi(integrationID)
	if err != nil {
		return 0, fmt.Errorf("invalid integration_id")
	}

	return id, nil
}

func (h *AWSSecretsHandler) GetStats(c *gin.Context) {
	integrationID, err := h.getIntegrationID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	awsSecretsService, err := h.service.GetAWSSecretsServiceByID(integrationID)
	if err != nil {
		h.log.Errorw("Failed to get AWS Secrets service", "error", err, "integration_id", integrationID)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
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
	integrationID, err := h.getIntegrationID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	awsSecretsService, err := h.service.GetAWSSecretsServiceByID(integrationID)
	if err != nil {
		h.log.Errorw("Failed to get AWS Secrets service", "error", err, "integration_id", integrationID)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
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
	integrationID, err := h.getIntegrationID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	awsSecretsService, err := h.service.GetAWSSecretsServiceByID(integrationID)
	if err != nil {
		h.log.Errorw("Failed to get AWS Secrets service", "error", err, "integration_id", integrationID)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
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
	integrationID, err := h.getIntegrationID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	awsSecretsService, err := h.service.GetAWSSecretsServiceByID(integrationID)
	if err != nil {
		h.log.Errorw("Failed to get AWS Secrets service", "error", err, "integration_id", integrationID)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	var req struct {
		Name         string            `json:"name"`
		Description  string            `json:"description"`
		SecretString string            `json:"secretString"`
		SecretValue  string            `json:"secret_value"`
		Tags         map[string]string `json:"tags"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
		})
		return
	}

	secretValue := req.SecretString
	if secretValue == "" {
		secretValue = req.SecretValue
	}

	if req.Name == "" || secretValue == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "name and secret value are required",
		})
		return
	}

	if err := awsSecretsService.CreateSecret(c.Request.Context(), req.Name, req.Description, secretValue, req.Tags); err != nil {
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
	integrationID, err := h.getIntegrationID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	awsSecretsService, err := h.service.GetAWSSecretsServiceByID(integrationID)
	if err != nil {
		h.log.Errorw("Failed to get AWS Secrets service", "error", err, "integration_id", integrationID)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
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
		SecretValue  string `json:"secret_value"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
		})
		return
	}

	secretValue := req.SecretString
	if secretValue == "" {
		secretValue = req.SecretValue
	}

	if secretValue == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "secret value is required",
		})
		return
	}

	if err := awsSecretsService.UpdateSecret(c.Request.Context(), secretName, secretValue); err != nil {
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
	integrationID, err := h.getIntegrationID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	awsSecretsService, err := h.service.GetAWSSecretsServiceByID(integrationID)
	if err != nil {
		h.log.Errorw("Failed to get AWS Secrets service", "error", err, "integration_id", integrationID)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
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
	integrationID, err := h.getIntegrationID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	awsSecretsService, err := h.service.GetAWSSecretsServiceByID(integrationID)
	if err != nil {
		h.log.Errorw("Failed to get AWS Secrets service", "error", err, "integration_id", integrationID)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
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
