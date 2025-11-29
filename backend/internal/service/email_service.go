package service

import (
	"fmt"
	"os"

	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"github.com/sendgrid/sendgrid-go"
	"github.com/sendgrid/sendgrid-go/helpers/mail"
)

type EmailService struct {
	log       *logger.Logger
	apiKey    string
	fromEmail string
	fromName  string
}

func NewEmailService(log *logger.Logger) *EmailService {
	return &EmailService{
		log:       log,
		apiKey:    os.Getenv("SENDGRID_API_KEY"),
		fromEmail: getEnvOrDefault("SENDGRID_FROM_EMAIL", "noreply@platifyx.com"),
		fromName:  getEnvOrDefault("SENDGRID_FROM_NAME", "PlatifyX"),
	}
}

func getEnvOrDefault(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}

// SendIntegrationRequest envia email de solicitação de nova integração
func (s *EmailService) SendIntegrationRequest(data IntegrationRequestData) error {
	if s.apiKey == "" {
		s.log.Warn("SENDGRID_API_KEY not configured, skipping email send")
		return nil
	}

	from := mail.NewEmail(s.fromName, s.fromEmail)

	// Email para equipe PlatifyX
	toEmail := getEnvOrDefault("INTEGRATION_REQUEST_EMAIL", "integrations@platifyx.com")
	to := mail.NewEmail("PlatifyX Team", toEmail)

	subject := fmt.Sprintf("Nova Solicitação de Integração: %s (Prioridade: %s)", data.Name, data.Priority)

	plainTextContent := fmt.Sprintf(`
Nova solicitação de integração recebida!

Nome da Integração: %s
Descrição: %s
Caso de Uso: %s
Website: %s
Documentação da API: %s
Prioridade: %s

Solicitado por: %s (%s)
Data: %s
	`,
		data.Name,
		data.Description,
		data.UseCase,
		formatOptionalField(data.Website),
		formatOptionalField(data.APIDocumentation),
		data.Priority,
		data.UserName,
		data.UserEmail,
		data.CreatedAt.Format("02/01/2006 15:04:05"),
	)

	htmlContent := fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
	<style>
		body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
		.container { max-width: 600px; margin: 0 auto; padding: 20px; }
		.header { background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
		.content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
		.field { margin-bottom: 20px; }
		.label { font-weight: bold; color: #555; margin-bottom: 5px; }
		.value { background: white; padding: 10px; border-radius: 4px; border-left: 3px solid #667eea; }
		.priority-high { border-left-color: #ef4444; }
		.priority-medium { border-left-color: #f59e0b; }
		.priority-low { border-left-color: #10b981; }
		.footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
	</style>
</head>
<body>
	<div class="container">
		<div class="header">
			<h1>🔗 Nova Solicitação de Integração</h1>
		</div>
		<div class="content">
			<div class="field">
				<div class="label">Nome da Integração</div>
				<div class="value priority-%s">%s</div>
			</div>

			<div class="field">
				<div class="label">Descrição</div>
				<div class="value">%s</div>
			</div>

			<div class="field">
				<div class="label">Caso de Uso</div>
				<div class="value">%s</div>
			</div>

			<div class="field">
				<div class="label">Website</div>
				<div class="value">%s</div>
			</div>

			<div class="field">
				<div class="label">Documentação da API</div>
				<div class="value">%s</div>
			</div>

			<div class="field">
				<div class="label">Prioridade</div>
				<div class="value priority-%s"><strong style="text-transform: uppercase;">%s</strong></div>
			</div>

			<div class="footer">
				<p><strong>Solicitado por:</strong> %s (%s)</p>
				<p><strong>Data:</strong> %s</p>
			</div>
		</div>
	</div>
</body>
</html>
	`,
		data.Priority,
		data.Name,
		data.Description,
		data.UseCase,
		formatOptionalFieldHTML(data.Website),
		formatOptionalFieldHTML(data.APIDocumentation),
		data.Priority,
		data.Priority,
		data.UserName,
		data.UserEmail,
		data.CreatedAt.Format("02/01/2006 às 15:04:05"),
	)

	message := mail.NewSingleEmail(from, subject, to, plainTextContent, htmlContent)
	client := sendgrid.NewSendClient(s.apiKey)

	response, err := client.Send(message)
	if err != nil {
		s.log.Errorw("Failed to send integration request email", "error", err)
		return fmt.Errorf("failed to send email: %w", err)
	}

	if response.StatusCode >= 400 {
		s.log.Errorw("SendGrid returned error status",
			"status_code", response.StatusCode,
			"body", response.Body,
		)
		return fmt.Errorf("sendgrid error: %s", response.Body)
	}

	s.log.Infow("Integration request email sent successfully",
		"integration_name", data.Name,
		"priority", data.Priority,
		"status_code", response.StatusCode,
	)

	return nil
}

func formatOptionalField(value *string) string {
	if value == nil || *value == "" {
		return "Não informado"
	}
	return *value
}

func formatOptionalFieldHTML(value *string) string {
	if value == nil || *value == "" {
		return "<em>Não informado</em>"
	}
	return *value
}
