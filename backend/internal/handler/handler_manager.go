package handler

import (
	"github.com/PlatifyX/platifyx-core/internal/service"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
)

type HandlerManager struct {
	HealthHandler          *HealthHandler
	MetricsHandler         *MetricsHandler
	KubernetesHandler      *KubernetesHandler
	AzureDevOpsHandler     *AzureDevOpsHandler
	SonarQubeHandler       *SonarQubeHandler
	IntegrationHandler     *IntegrationHandler
	FinOpsHandler          *FinOpsHandler
	GrafanaHandler         *GrafanaHandler
	GitHubHandler          *GitHubHandler
	TechDocsHandler        *TechDocsHandler
	JiraHandler            *JiraHandler
	SlackHandler           *SlackHandler
	TeamsHandler           *TeamsHandler
	ArgoCDHandler          *ArgoCDHandler
	PrometheusHandler      *PrometheusHandler
	LokiHandler            *LokiHandler
	VaultHandler           *VaultHandler
	AWSSecretsHandler      *AWSSecretsHandler
	ServiceTemplateHandler *ServiceTemplateHandler
	ServiceCatalogHandler  *ServiceCatalogHandler
	AIHandler              *AIHandler
}

func NewHandlerManager(services *service.ServiceManager, log *logger.Logger) *HandlerManager {
	return &HandlerManager{
		HealthHandler:          NewHealthHandler(),
		MetricsHandler:         NewMetricsHandler(services.MetricsService, log),
		KubernetesHandler:      NewKubernetesHandler(services.KubernetesService, log),
		AzureDevOpsHandler:     NewAzureDevOpsHandler(services.IntegrationService, log),
		SonarQubeHandler:       NewSonarQubeHandler(services.IntegrationService, log),
		IntegrationHandler:     NewIntegrationHandler(services.IntegrationService, log),
		FinOpsHandler:          NewFinOpsHandler(services.FinOpsService, log),
		GrafanaHandler:         NewGrafanaHandler(services.IntegrationService, log),
		GitHubHandler:          NewGitHubHandler(services.IntegrationService, log),
		TechDocsHandler:        NewTechDocsHandler(services.TechDocsService, log),
		JiraHandler:            NewJiraHandler(services.IntegrationService, log),
		SlackHandler:           NewSlackHandler(services.IntegrationService, log),
		TeamsHandler:           NewTeamsHandler(services.IntegrationService, log),
		ArgoCDHandler:          NewArgoCDHandler(services.IntegrationService, log),
		PrometheusHandler:      NewPrometheusHandler(services.IntegrationService, log),
		LokiHandler:            NewLokiHandler(services.IntegrationService, log),
		VaultHandler:           NewVaultHandler(services.IntegrationService, log),
		AWSSecretsHandler:      NewAWSSecretsHandler(services.IntegrationService, log),
		ServiceTemplateHandler: NewServiceTemplateHandler(services.ServiceTemplateService, log),
		ServiceCatalogHandler:  NewServiceCatalogHandler(services.ServiceCatalogService, services.SonarQubeService, services.AzureDevOpsService, services.IntegrationService, log),
		AIHandler:              NewAIHandler(services.AIService, log),
	}
}
