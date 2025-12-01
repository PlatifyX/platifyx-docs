package handler

import (
	"github.com/PlatifyX/platifyx-core/internal/config"
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
	IntegrationRequestHandler *IntegrationRequestHandler
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
	OpenVPNHandler         *OpenVPNHandler
	ServiceTemplateHandler *ServiceTemplateHandler
	ServiceCatalogHandler  *ServiceCatalogHandler
	AIHandler              *AIHandler
	TemplateHandler        *TemplateHandler
	SettingsHandler        *SettingsHandler
	AuthHandler            *AuthHandler
	SSOHandler             *SSOHandler
	AutonomousHandler      *AutonomousHandler
	MaturityHandler        *MaturityHandler
	AutoDocsHandler        *AutoDocsHandler
	ServicePlaybookHandler *ServicePlaybookHandler
	BoardsHandler          *BoardsHandler
	OrganizationHandler    *OrganizationHandler
	UserOrganizationHandler *UserOrganizationHandler
	OrganizationUserHandler *OrganizationUserHandler
}

func NewHandlerManager(cfg *config.Config, services *service.ServiceManager, log *logger.Logger) *HandlerManager {
	return &HandlerManager{
		HealthHandler:          NewHealthHandler(),
		MetricsHandler:         NewMetricsHandler(services.MetricsService, log),
		KubernetesHandler:      NewKubernetesHandler(services.IntegrationService, log),
		AzureDevOpsHandler:     NewAzureDevOpsHandler(services.IntegrationService, log),
		SonarQubeHandler:       NewSonarQubeHandler(services.IntegrationService, services.CacheService, log),
		IntegrationHandler:     NewIntegrationHandler(services.IntegrationService, services.CacheService, log),
		IntegrationRequestHandler: NewIntegrationRequestHandler(services.EmailService),
		FinOpsHandler:          NewFinOpsHandler(services.FinOpsService, services.CacheService, log),
		GrafanaHandler:         NewGrafanaHandler(services.IntegrationService, services.CacheService, log),
		GitHubHandler:          NewGitHubHandler(services.IntegrationService, services.CacheService, log),
		TechDocsHandler:        NewTechDocsHandler(services.TechDocsService, log),
		JiraHandler:            NewJiraHandler(services.IntegrationService, log),
		SlackHandler:           NewSlackHandler(services.IntegrationService, log),
		TeamsHandler:           NewTeamsHandler(services.IntegrationService, log),
		ArgoCDHandler:          NewArgoCDHandler(services.IntegrationService, log),
		PrometheusHandler:      NewPrometheusHandler(services.IntegrationService, log),
		LokiHandler:            NewLokiHandler(services.IntegrationService, log),
		VaultHandler:           NewVaultHandler(services.IntegrationService, log),
		AWSSecretsHandler:      NewAWSSecretsHandler(services.IntegrationService, log),
		OpenVPNHandler:         NewOpenVPNHandler(services.IntegrationService, log),
		ServiceTemplateHandler: NewServiceTemplateHandler(services.ServiceTemplateService, log),
		ServiceCatalogHandler:  NewServiceCatalogHandler(services.ServiceCatalogService, services.SonarQubeService, services.AzureDevOpsService, services.IntegrationService, log),
		AIHandler:              NewAIHandler(services.AIService, log),
		TemplateHandler:        NewTemplateHandler(services.TemplateService, log),
		SettingsHandler:        NewSettingsHandler(services.UserService, services.UserRepository, services.RoleRepository, services.TeamRepository, services.AuditRepository, services.SSORepository),
		AuthHandler:            NewAuthHandler(services.AuthService, services.UserService),
		SSOHandler:             NewSSOHandler(services.SSORepository, services.UserRepository, services.AuthService, services.CacheService, cfg.FrontendURL),
		AutonomousHandler:      NewAutonomousHandler(services.AutonomousRecommendationsService, services.TroubleshootingAssistantService, services.AutonomousActionsService, log),
		MaturityHandler:        NewMaturityHandler(services.MaturityService, log),
		AutoDocsHandler:        NewAutoDocsHandler(services.AutoDocsService, log),
		ServicePlaybookHandler: NewServicePlaybookHandler(services.ServicePlaybookService, log),
		BoardsHandler:          NewBoardsHandler(services.BoardsService, log),
		OrganizationHandler:    NewOrganizationHandler(services.OrganizationService, log),
		UserOrganizationHandler: NewUserOrganizationHandler(services.UserOrganizationService, log),
		OrganizationUserHandler: NewOrganizationUserHandler(services.OrganizationUserService, log),
	}
}
