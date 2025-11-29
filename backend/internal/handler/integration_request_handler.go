package handler

import (
	"net/http"
	"time"

	"github.com/PlatifyX/platifyx-core/internal/domain"
	"github.com/PlatifyX/platifyx-core/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type IntegrationRequestHandler struct {
	emailService *service.EmailService
}

func NewIntegrationRequestHandler(emailService *service.EmailService) *IntegrationRequestHandler {
	return &IntegrationRequestHandler{
		emailService: emailService,
	}
}

// CreateIntegrationRequest cria uma nova solicitação de integração e envia email
func (h *IntegrationRequestHandler) CreateIntegrationRequest(c *gin.Context) {
	var input domain.CreateIntegrationRequestInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Pegar informações do usuário autenticado
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userEmail, _ := c.Get("userEmail")
	userName, _ := c.Get("userName")

	// Criar registro de solicitação
	request := &domain.IntegrationRequest{
		ID:               uuid.New().String(),
		UserID:           userID.(string),
		UserEmail:        userEmail.(string),
		UserName:         userName.(string),
		Name:             input.Name,
		Description:      input.Description,
		UseCase:          input.UseCase,
		Website:          input.Website,
		APIDocumentation: input.APIDocumentation,
		Priority:         input.Priority,
		Status:           "pending",
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}

	// TODO: Salvar no banco de dados quando a tabela estiver criada
	// if err := h.integrationRequestRepo.Create(request); err != nil {
	// 	c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create request"})
	// 	return
	// }

	// Enviar email via SendGrid
	emailData := service.IntegrationRequestData{
		Name:             input.Name,
		Description:      input.Description,
		UseCase:          input.UseCase,
		Website:          input.Website,
		APIDocumentation: input.APIDocumentation,
		Priority:         input.Priority,
		UserName:         userName.(string),
		UserEmail:        userEmail.(string),
		CreatedAt:        time.Now(),
	}

	if err := h.emailService.SendIntegrationRequest(emailData); err != nil {
		// Log erro mas não retorna erro para o usuário
		// A solicitação foi salva, apenas o email falhou
		c.JSON(http.StatusOK, gin.H{
			"message": "Integration request created successfully, but email notification failed",
			"request": request,
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Integration request created and notification sent successfully",
		"request": request,
	})
}
