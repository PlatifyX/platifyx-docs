package service

import (
	"database/sql"

	"github.com/PlatifyX/platifyx-core/internal/config"
	"github.com/PlatifyX/platifyx-core/internal/domain"
	"github.com/PlatifyX/platifyx-core/internal/repository"
	"github.com/PlatifyX/platifyx-core/pkg/cache"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
)

type ServiceManager struct {
	CacheService           *CacheService
	MetricsService         *MetricsService
	KubernetesService      *KubernetesService
	AzureDevOpsService     *AzureDevOpsService
	SonarQubeService       *SonarQubeService
	IntegrationService     *IntegrationService
	FinOpsService          *FinOpsService
	TechDocsService        *TechDocsService
	ServiceTemplateService *ServiceTemplateService
	ServiceCatalogService  *ServiceCatalogService
	AIService                        *AIService
	DiagramService                   *DiagramService
	TemplateService                  *TemplateService
	UserService                      *UserService
	AuthService                      *AuthService
	EmailService                     *EmailService
	AutonomousRecommendationsService *AutonomousRecommendationsService
	TroubleshootingAssistantService   *TroubleshootingAssistantService
	AutonomousActionsService         *AutonomousActionsService
	MaturityService                  *MaturityService
	AutoDocsService                  *AutoDocsService
	ServicePlaybookService           *ServicePlaybookService
	BoardsService                    *BoardsService
	OrganizationService              *OrganizationService
	UserOrganizationService          *UserOrganizationService
	OrganizationUserService          *OrganizationUserService
	// User Management Repositories (exposed for handlers)
	UserRepository          *repository.UserRepository
	RoleRepository          *repository.RoleRepository
	TeamRepository          *repository.TeamRepository
	SSORepository           *repository.SSORepository
	AuditRepository         *repository.AuditRepository
	SessionRepository       *repository.SessionRepository
	PasswordResetRepository *repository.PasswordResetRepository
}

func NewServiceManager(cfg *config.Config, log *logger.Logger, db *sql.DB) *ServiceManager {
	// Initialize repository layer
	integrationRepo := repository.NewIntegrationRepository(db)
	serviceRepo := repository.NewServiceRepository(db)

	// Initialize user management repositories
	userRepo := repository.NewUserRepository(db)
	roleRepo := repository.NewRoleRepository(db)
	teamRepo := repository.NewTeamRepository(db)
	ssoRepo := repository.NewSSORepository(db)
	auditRepo := repository.NewAuditRepository(db)
	sessionRepo := repository.NewSessionRepository(db)
	passwordResetRepo := repository.NewPasswordResetRepository(db)

	// Initialize integration service
	integrationService := NewIntegrationService(integrationRepo, log)

	// Kubernetes, GitHub, and SonarQube services are now initialized on-demand per organization
	// They cannot be initialized here during startup as they require organizationUUID
	var kubernetesService *KubernetesService
	var githubService *GitHubService
	var sonarQubeService *SonarQubeService
	log.Info("Kubernetes, GitHub, and SonarQube services will be initialized on-demand per organization")

	// Initialize Cache Service (Redis) - must be before ServiceCatalog and AzureDevOps
	var cacheService *CacheService
	var redisClient *cache.RedisClient
	if cfg.RedisEnabled && cfg.CacheEnabled {
		redisConfig := domain.RedisConfig{
			Host:     cfg.RedisHost,
			Port:     cfg.RedisPort,
			Password: cfg.RedisPass,
			DB:       cfg.RedisDB,
		}

		cache, err := NewCacheService(redisConfig, log)
		if err != nil {
			log.Warnw("Failed to initialize cache service, continuing without cache", "error", err)
		} else {
			cacheService = cache
			redisClient = cache.redis
			log.Infow("Cache service initialized successfully",
				"host", cfg.RedisHost,
				"port", cfg.RedisPort,
				"db", cfg.RedisDB,
			)
		}
	} else {
		log.Infow("Cache disabled",
			"redisEnabled", cfg.RedisEnabled,
			"cacheEnabled", cfg.CacheEnabled,
		)
	}

	// Azure DevOps service is now initialized on-demand per organization
	var azureDevOpsService *AzureDevOpsService
	log.Info("Azure DevOps service will be initialized on-demand per organization")

	// Initialize ServiceCatalog service (with cache support)
	// ServiceCatalogService can work without KubernetesService for listing services (GetAll)
	// KubernetesService will be created dynamically per organization when needed for sync
	serviceCatalogService := NewServiceCatalogService(serviceRepo, integrationRepo, nil, nil, nil, redisClient, log)

	// Initialize FinOps service
	finOpsService := NewFinOpsService(integrationService, log)

	// Initialize AI services
	aiService := NewAIService(integrationService, log)
	diagramService := NewDiagramService(aiService, log)

	techDocsService := NewTechDocsService("docs", aiService, diagramService, githubService, redisClient, log)

	// Initialize ServiceTemplate service
	serviceTemplateRepo := repository.NewServiceTemplateRepository(db)
	serviceTemplateService := NewServiceTemplateService(serviceTemplateRepo, log)

	// AWS Secrets Manager service is now initialized on-demand per organization
	var awsSecretsService *AWSSecretsService
	log.Info("AWS Secrets Manager service will be initialized on-demand per organization")

	// Initialize Infrastructure Template service (for Backstage-style templates)
	templateService := NewTemplateService(log, awsSecretsService)

	// Initialize User Management services
	userService := NewUserService(userRepo, auditRepo)
	authService := NewAuthService(userRepo, sessionRepo, auditRepo, passwordResetRepo, cfg.JWTSecret)
	emailService := NewEmailService(log)

	// Initialize Autonomous Engineering services
	autonomousRecommendationsService := NewAutonomousRecommendationsService(
		aiService,
		kubernetesService,
		finOpsService,
		azureDevOpsService,
		log,
	)

	troubleshootingAssistantService := NewTroubleshootingAssistantService(
		aiService,
		kubernetesService,
		azureDevOpsService,
		log,
	)

	autonomousActionsService := NewAutonomousActionsService(
		kubernetesService,
		azureDevOpsService,
		log,
	)

	maturityService := NewMaturityService(
		kubernetesService,
		azureDevOpsService,
		sonarQubeService,
		finOpsService,
		aiService,
		log,
	)

	autoDocsService := NewAutoDocsService(
		techDocsService,
		aiService,
		diagramService,
		githubService,
		azureDevOpsService,
		integrationService,
		kubernetesService,
		redisClient,
		log,
	)

	servicePlaybookService := NewServicePlaybookService(
		templateService,
		techDocsService,
		autoDocsService,
		maturityService,
		kubernetesService,
		azureDevOpsService,
		githubService,
		integrationService,
		redisClient,
		log,
	)

	boardsService := NewBoardsService(
		azureDevOpsService,
		githubService,
		integrationService,
		log,
	)

	organizationRepo := repository.NewOrganizationRepository(db)
	organizationService := NewOrganizationService(organizationRepo, db, log)

	userOrgRepo := repository.NewUserOrganizationRepository(db)
	userOrganizationService := NewUserOrganizationService(userOrgRepo, userRepo, organizationRepo, log)

	orgUserRepo := repository.NewOrganizationUserRepository(db)
	organizationUserService := NewOrganizationUserService(orgUserRepo, log)

	return &ServiceManager{
		CacheService:           cacheService,
		MetricsService:         NewMetricsService(),
		KubernetesService:      kubernetesService,
		AzureDevOpsService:     azureDevOpsService,
		SonarQubeService:       sonarQubeService,
		IntegrationService:     integrationService,
		FinOpsService:          finOpsService,
		TechDocsService:        techDocsService,
		ServiceTemplateService: serviceTemplateService,
		ServiceCatalogService:  serviceCatalogService,
		AIService:              aiService,
		DiagramService:         diagramService,
		TemplateService:        templateService,
		UserService:                      userService,
		AuthService:                      authService,
		EmailService:                     emailService,
		AutonomousRecommendationsService: autonomousRecommendationsService,
		TroubleshootingAssistantService:   troubleshootingAssistantService,
		AutonomousActionsService:         autonomousActionsService,
		MaturityService:                  maturityService,
		AutoDocsService:                  autoDocsService,
		ServicePlaybookService:           servicePlaybookService,
		BoardsService:                    boardsService,
		OrganizationService:             organizationService,
		UserOrganizationService:         userOrganizationService,
		OrganizationUserService:         organizationUserService,
		UserRepository:                  userRepo,
		RoleRepository:          roleRepo,
		TeamRepository:          teamRepo,
		SSORepository:           ssoRepo,
		AuditRepository:         auditRepo,
		SessionRepository:       sessionRepo,
		PasswordResetRepository: passwordResetRepo,
	}
}
