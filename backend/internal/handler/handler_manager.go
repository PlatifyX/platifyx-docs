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
	TemplateHandler        *TemplateHandler
	SSOSettingsHandler     *SSOSettingsHandler
	RBACHandler            *RBACHandler
}

func NewHandlerManager(services *service.ServiceManager, log *logger.Logger) *HandlerManager {
	return &HandlerManager{
		HealthHandler:          NewHealthHandler(services.CacheService, log),
		MetricsHandler:         NewMetricsHandler(services.MetricsService, services.CacheService, log),
		KubernetesHandler:      NewKubernetesHandler(services.KubernetesService, services.CacheService, log),
		AzureDevOpsHandler:     NewAzureDevOpsHandler(services.IntegrationService, services.CacheService, log),
		SonarQubeHandler:       NewSonarQubeHandler(services.IntegrationService, services.CacheService, log),
		IntegrationHandler:     NewIntegrationHandler(services.IntegrationService, services.CacheService, log),
		FinOpsHandler:          NewFinOpsHandler(services.FinOpsService, services.CacheService, log),
		GrafanaHandler:         NewGrafanaHandler(services.IntegrationService, services.CacheService, log),
		GitHubHandler:          NewGitHubHandler(services.IntegrationService, services.CacheService, log),
		TechDocsHandler:        NewTechDocsHandler(services.TechDocsService, services.CacheService, log),
		JiraHandler:            NewJiraHandler(services.IntegrationService, services.CacheService, log),
		SlackHandler:           NewSlackHandler(services.IntegrationService, services.CacheService, log),
		TeamsHandler:           NewTeamsHandler(services.IntegrationService, services.CacheService, log),
		ArgoCDHandler:          NewArgoCDHandler(services.IntegrationService, services.CacheService, log),
		PrometheusHandler:      NewPrometheusHandler(services.IntegrationService, services.CacheService, log),
		LokiHandler:            NewLokiHandler(services.IntegrationService, services.CacheService, log),
		VaultHandler:           NewVaultHandler(services.IntegrationService, services.CacheService, log),
		AWSSecretsHandler:      NewAWSSecretsHandler(services.IntegrationService, services.CacheService, log),
		ServiceTemplateHandler: NewServiceTemplateHandler(services.ServiceTemplateService, services.CacheService, log),
		ServiceCatalogHandler:  NewServiceCatalogHandler(services.ServiceCatalogService, services.SonarQubeService, services.AzureDevOpsService, services.IntegrationService, services.CacheService, log),
		AIHandler:              NewAIHandler(services.AIService, services.CacheService, log),
		TemplateHandler:        NewTemplateHandler(services.TemplateService, services.CacheService, log),
		SSOSettingsHandler:     NewSSOSettingsHandler(services.SSOSettingsService, services.CacheService, log),
		RBACHandler:            NewRBACHandler(services.RBACService, services.CacheService, log),
	}
}
