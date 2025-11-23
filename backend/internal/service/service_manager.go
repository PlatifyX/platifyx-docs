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
	AutonomousRecommendationsService *AutonomousRecommendationsService
	TroubleshootingAssistantService   *TroubleshootingAssistantService
	AutonomousActionsService         *AutonomousActionsService
	MaturityService                  *MaturityService
	AutoDocsService                  *AutoDocsService
	ServicePlaybookService           *ServicePlaybookService
	BoardsService                    *BoardsService
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

	// Get Kubernetes config from database
	var kubernetesService *KubernetesService
	k8sConfig, err := integrationService.GetKubernetesConfig()
	if err == nil && k8sConfig != nil {
		kubernetesService, err = NewKubernetesService(*k8sConfig, log)
		if err != nil {
			log.Errorw("Failed to initialize Kubernetes service", "error", err)
			kubernetesService = nil
		}
	}

	// Get GitHub config from database
	var githubService *GitHubService
	githubConfig, err := integrationService.GetGitHubConfig()
	if err == nil && githubConfig != nil {
		log.Infow("Initializing GitHub service",
			"organization", githubConfig.Organization,
			"hasToken", githubConfig.Token != "",
		)
		githubService = NewGitHubService(*githubConfig, log)
	} else {
		log.Warnw("GitHub integration not configured or disabled",
			"error", err,
		)
	}

	// Get SonarQube config from database
	var sonarQubeService *SonarQubeService
	sonarQubeConfig, err := integrationService.GetSonarQubeConfig()
	if err == nil && sonarQubeConfig != nil {
		sonarQubeService = NewSonarQubeService(*sonarQubeConfig, log)
	}

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

	// Get Azure DevOps config from database (with cache support)
	var azureDevOpsService *AzureDevOpsService
	azureDevOpsConfig, err := integrationService.GetAzureDevOpsConfig()
	if err == nil && azureDevOpsConfig != nil {
		if redisClient != nil {
			azureDevOpsService = NewAzureDevOpsServiceWithCache(*azureDevOpsConfig, redisClient, log)
			log.Info("Azure DevOps service initialized with cache")
		} else {
			azureDevOpsService = NewAzureDevOpsService(*azureDevOpsConfig, log)
			log.Info("Azure DevOps service initialized without cache")
		}
	}

	// Initialize ServiceCatalog service (with cache support)
	var serviceCatalogService *ServiceCatalogService
	if kubernetesService != nil {
		serviceCatalogService = NewServiceCatalogService(serviceRepo, integrationRepo, kubernetesService, azureDevOpsService, githubService, redisClient, log)
	}

	// Initialize FinOps service
	finOpsService := NewFinOpsService(integrationService, log)

	// Initialize AI services
	aiService := NewAIService(integrationService, log)
	diagramService := NewDiagramService(aiService, log)

	techDocsService := NewTechDocsService("docs", aiService, diagramService, githubService, redisClient, log)

	// Initialize ServiceTemplate service
	serviceTemplateRepo := repository.NewServiceTemplateRepository(db)
	serviceTemplateService := NewServiceTemplateService(serviceTemplateRepo, log)

	// Get AWS Secrets Manager config from database
	var awsSecretsService *AWSSecretsService
	awsSecretsConfig, err := integrationService.GetAWSSecretsConfig()
	if err == nil && awsSecretsConfig != nil {
		log.Infow("Initializing AWS Secrets Manager service",
			"region", awsSecretsConfig.Region,
			"hasAccessKey", awsSecretsConfig.AccessKeyID != "",
		)
		awsSecretsService, err = NewAWSSecretsService(*awsSecretsConfig, log)
		if err != nil {
			log.Errorw("Failed to initialize AWS Secrets Manager service", "error", err)
			awsSecretsService = nil
		}
	} else {
		log.Warnw("AWS Secrets Manager integration not configured or disabled",
			"error", err,
		)
	}

	// Initialize Infrastructure Template service (for Backstage-style templates)
	templateService := NewTemplateService(log, awsSecretsService)

	// Initialize User Management services
	userService := NewUserService(userRepo, auditRepo)
	authService := NewAuthService(userRepo, sessionRepo, auditRepo, passwordResetRepo, cfg.JWTSecret)

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
		AutonomousRecommendationsService: autonomousRecommendationsService,
		TroubleshootingAssistantService:   troubleshootingAssistantService,
		AutonomousActionsService:         autonomousActionsService,
		MaturityService:                  maturityService,
		AutoDocsService:                  autoDocsService,
		ServicePlaybookService:           servicePlaybookService,
		BoardsService:                    boardsService,
		UserRepository:                  userRepo,
		RoleRepository:          roleRepo,
		TeamRepository:          teamRepo,
		SSORepository:           ssoRepo,
		AuditRepository:         auditRepo,
		SessionRepository:       sessionRepo,
		PasswordResetRepository: passwordResetRepo,
	}
}
