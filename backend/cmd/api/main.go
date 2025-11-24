package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/PlatifyX/platifyx-core/internal/config"
	"github.com/PlatifyX/platifyx-core/internal/handler"
	"github.com/PlatifyX/platifyx-core/internal/middleware"
	"github.com/PlatifyX/platifyx-core/internal/repository"
	"github.com/PlatifyX/platifyx-core/internal/service"
	"github.com/PlatifyX/platifyx-core/pkg/database"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.Load()

	log := logger.NewLogger(cfg.Environment)
	defer log.Sync()

	log.Info("Starting PlatifyX Core API",
		"version", cfg.Version,
		"environment", cfg.Environment,
		"port", cfg.Port,
	)

	// Connect to PostgreSQL
	db, err := database.NewPostgresConnection(cfg.DatabaseURL)
	if err != nil {
		log.Fatal("Failed to connect to database", "error", err)
	}
	defer db.Close()

	log.Info("Connected to PostgreSQL database")

	// Run migrations
	if err := database.RunMigrations(db, "migrations"); err != nil {
		log.Fatal("Failed to run migrations", "error", err)
	}

	log.Info("Migrations completed successfully")

	orgRepo := repository.NewOrganizationRepository(db)
	
	platifyxOrgUUID := "ebb73e53-aa9e-4a9c-bc0c-531934c519e6"
	platifyxOrg, err := orgRepo.GetByUUID(platifyxOrgUUID)
	if err == nil && platifyxOrg != nil {
		nodeDB, err := database.NewPostgresConnection(platifyxOrg.DatabaseAddressWrite)
		if err == nil {
			defer nodeDB.Close()
			orgService := service.NewOrganizationService(orgRepo, db, log)
			schemaName := strings.ReplaceAll(platifyxOrgUUID, "-", "_")
			var count int
			err = nodeDB.QueryRow(`
				SELECT COUNT(*) 
				FROM information_schema.schemata 
				WHERE schema_name = $1
			`, schemaName).Scan(&count)
			if err == nil && count == 0 {
				err = orgService.CreateSchemaInNodeDB(nodeDB, platifyxOrgUUID)
				if err != nil {
					log.Warnw("Failed to create schema for PlatifyX organization", "error", err)
				} else {
					log.Info("Created schema for PlatifyX organization in node database")
				}
			} else if err == nil && count > 0 {
				log.Info("Schema for PlatifyX organization already exists")
			}
		}
	}

	serviceManager := service.NewServiceManager(cfg, log, db)
	handlerManager := handler.NewHandlerManager(serviceManager, log)

	userOrgRepo := repository.NewUserOrganizationRepository(db)

	router := setupRouter(cfg, handlerManager, serviceManager, log, orgRepo, userOrgRepo)

	srv := &http.Server{
		Addr:         fmt.Sprintf(":%s", cfg.Port),
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		log.Info("Server listening", "address", srv.Addr)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal("Failed to start server", "error", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Info("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal("Server forced to shutdown", "error", err)
	}

	log.Info("Server exited")
}

func setupRouter(cfg *config.Config, handlers *handler.HandlerManager, services *service.ServiceManager, log *logger.Logger, orgRepo *repository.OrganizationRepository, userOrgRepo *repository.UserOrganizationRepository) *gin.Engine {
	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.New()

	router.Use(middleware.Logger(log))
	router.Use(middleware.Recovery(log))
	router.Use(middleware.CORS(cfg.AllowedOrigins))

	v1 := router.Group("/api/v1")
	{
		v1.GET("/health", handlers.HealthHandler.Check)
		v1.GET("/ready", handlers.HealthHandler.Ready)

		// Service Catalog (discovered from Kubernetes)
		serviceCatalog := v1.Group("/service-catalog")
		serviceCatalog.Use(middleware.OrganizationMiddleware(orgRepo, userOrgRepo, log))
		{
			serviceCatalog.POST("/sync", handlers.ServiceCatalogHandler.SyncServices)
			serviceCatalog.GET("", handlers.ServiceCatalogHandler.ListServices)
			serviceCatalog.GET("/:name/status", handlers.ServiceCatalogHandler.GetServiceStatus)
			serviceCatalog.POST("/metrics", handlers.ServiceCatalogHandler.GetServicesMetrics)
		}

		metrics := v1.Group("/metrics")
		{
			metrics.GET("/dashboard", handlers.MetricsHandler.GetDashboard)
			metrics.GET("/dora", handlers.MetricsHandler.GetDORA)
		}

		kubernetes := v1.Group("/kubernetes")
		kubernetes.Use(middleware.OrganizationMiddleware(orgRepo, userOrgRepo, log))
		{
			kubernetes.GET("/cluster", handlers.KubernetesHandler.GetClusterInfo)
			kubernetes.GET("/pods", handlers.KubernetesHandler.ListPods)
			kubernetes.GET("/deployments", handlers.KubernetesHandler.ListDeployments)
			kubernetes.GET("/services", handlers.KubernetesHandler.ListServices)
			kubernetes.GET("/namespaces", handlers.KubernetesHandler.ListNamespaces)
			kubernetes.GET("/nodes", handlers.KubernetesHandler.ListNodes)
		}

		ci := v1.Group("/ci")
		ci.Use(middleware.OrganizationMiddleware(orgRepo, userOrgRepo, log))
		{
			ci.GET("/stats", handlers.AzureDevOpsHandler.GetStats)

			ci.GET("/pipelines", handlers.AzureDevOpsHandler.ListPipelines)
			ci.GET("/pipelines/:id/runs", handlers.AzureDevOpsHandler.ListPipelineRuns)

			ci.GET("/builds", handlers.AzureDevOpsHandler.ListBuilds)
			ci.GET("/builds/:id", handlers.AzureDevOpsHandler.GetBuild)
			ci.GET("/builds/:id/logs", handlers.AzureDevOpsHandler.GetBuildLogs)
			ci.POST("/builds", handlers.AzureDevOpsHandler.QueueBuild)

			ci.GET("/releases", handlers.AzureDevOpsHandler.ListReleases)
			ci.GET("/releases/:id", handlers.AzureDevOpsHandler.GetRelease)
			ci.POST("/releases/approve", handlers.AzureDevOpsHandler.ApproveRelease)
			ci.POST("/releases/reject", handlers.AzureDevOpsHandler.RejectRelease)

			ci.GET("/repositories", handlers.AzureDevOpsHandler.ListRepositories)
			ci.GET("/repositories/stats", handlers.AzureDevOpsHandler.GetRepositoriesStats)
		}

		quality := v1.Group("/quality")
		quality.Use(middleware.OrganizationMiddleware(orgRepo, userOrgRepo, log))
		{
			quality.GET("/stats", handlers.SonarQubeHandler.GetStats)

			quality.GET("/projects", handlers.SonarQubeHandler.ListProjects)
			quality.GET("/projects/:key", handlers.SonarQubeHandler.GetProjectDetails)

			quality.GET("/issues", handlers.SonarQubeHandler.ListIssues)
		}

		finops := v1.Group("/finops")
		finops.Use(middleware.OrganizationMiddleware(orgRepo, userOrgRepo, log))
		{
			finops.GET("/stats", handlers.FinOpsHandler.GetStats)
			finops.GET("/costs", handlers.FinOpsHandler.ListCosts)
			finops.GET("/resources", handlers.FinOpsHandler.ListResources)
			finops.GET("/aws/monthly", handlers.FinOpsHandler.GetAWSMonthlyCosts)
			finops.GET("/aws/by-service", handlers.FinOpsHandler.GetAWSCostsByService)
			finops.GET("/aws/forecast", handlers.FinOpsHandler.GetAWSCostForecast)
			finops.GET("/aws/by-tag", handlers.FinOpsHandler.GetAWSCostsByTag)
			finops.GET("/aws/reservation-utilization", handlers.FinOpsHandler.GetAWSReservationUtilization)
			finops.GET("/aws/savings-plans-utilization", handlers.FinOpsHandler.GetAWSSavingsPlansUtilization)
		}

		observability := v1.Group("/observability")
		observability.Use(middleware.OrganizationMiddleware(orgRepo, userOrgRepo, log))
		{
			observability.GET("/stats", handlers.GrafanaHandler.GetStats)
			observability.GET("/health", handlers.GrafanaHandler.GetHealth)

			observability.GET("/dashboards", handlers.GrafanaHandler.SearchDashboards)
			observability.GET("/dashboards/:uid", handlers.GrafanaHandler.GetDashboardByUID)

			observability.GET("/alerts", handlers.GrafanaHandler.GetAlerts)

			observability.GET("/datasources", handlers.GrafanaHandler.GetDataSources)
			observability.GET("/datasources/:id", handlers.GrafanaHandler.GetDataSourceByID)

			observability.GET("/organizations", handlers.GrafanaHandler.GetOrganizations)
			observability.GET("/organization", handlers.GrafanaHandler.GetCurrentOrganization)

			observability.GET("/users", handlers.GrafanaHandler.GetUsers)

			observability.GET("/folders", handlers.GrafanaHandler.GetFolders)
			observability.GET("/folders/:uid", handlers.GrafanaHandler.GetFolderByUID)

			observability.GET("/annotations", handlers.GrafanaHandler.GetAnnotations)

			// Loki logs endpoints
			observability.GET("/logs/labels", handlers.LokiHandler.GetLabels)
			observability.GET("/logs/labels/:label/values", handlers.LokiHandler.GetLabelValues)
			observability.GET("/logs/apps", handlers.LokiHandler.GetAppLabels)
			observability.GET("/logs/query", handlers.LokiHandler.QueryLogs)
			observability.GET("/logs/apps/:app", handlers.LokiHandler.GetLogsForApp)
		}

		// Grafana endpoints (alias for some observability endpoints)
		grafana := v1.Group("/grafana")
		grafana.Use(middleware.OrganizationMiddleware(orgRepo, userOrgRepo, log))
		{
			grafana.GET("/stats", handlers.GrafanaHandler.GetStats)
			grafana.GET("/config", handlers.GrafanaHandler.GetConfig)
			grafana.GET("/dashboards", handlers.GrafanaHandler.SearchDashboards)
			grafana.GET("/dashboards/:uid", handlers.GrafanaHandler.GetDashboardByUID)
		}

		code := v1.Group("/code")
		code.Use(middleware.OrganizationMiddleware(orgRepo, userOrgRepo, log))
		{
			code.GET("/stats", handlers.GitHubHandler.GetStats)
			code.GET("/user", handlers.GitHubHandler.GetAuthenticatedUser)

			code.GET("/repositories", handlers.GitHubHandler.ListRepositories)
			code.GET("/repositories/:owner/:repo", handlers.GitHubHandler.GetRepository)

			code.GET("/repositories/:owner/:repo/commits", handlers.GitHubHandler.ListCommits)
			code.GET("/repositories/:owner/:repo/pulls", handlers.GitHubHandler.ListPullRequests)
			code.GET("/repositories/:owner/:repo/issues", handlers.GitHubHandler.ListIssues)
			code.GET("/repositories/:owner/:repo/branches", handlers.GitHubHandler.ListBranches)
			code.GET("/repositories/:owner/:repo/actions/runs", handlers.GitHubHandler.ListWorkflowRuns)

			code.GET("/organizations/:org", handlers.GitHubHandler.GetOrganization)
		}

		techdocs := v1.Group("/techdocs")
		{
			techdocs.GET("/tree", handlers.TechDocsHandler.GetTree)
			techdocs.GET("/document", handlers.TechDocsHandler.GetDocument)
			techdocs.POST("/document", handlers.TechDocsHandler.SaveDocument)
			techdocs.DELETE("/document", handlers.TechDocsHandler.DeleteDocument)
			techdocs.POST("/folder", handlers.TechDocsHandler.CreateFolder)
			techdocs.GET("/list", handlers.TechDocsHandler.ListDocuments)

			// AI-powered features
			techdocs.POST("/generate", handlers.TechDocsHandler.GenerateDocumentation)
			techdocs.GET("/progress/:id", handlers.TechDocsHandler.GetProgress)
			techdocs.POST("/improve", handlers.TechDocsHandler.ImproveDocumentation)
			techdocs.POST("/chat", handlers.TechDocsHandler.ChatAboutDocumentation)
			techdocs.POST("/diagram", handlers.TechDocsHandler.GenerateDiagram)
		}

		ai := v1.Group("/ai")
		ai.Use(middleware.OrganizationMiddleware(orgRepo, userOrgRepo, log))
		{
			ai.GET("/providers", handlers.AIHandler.GetProviders)
		}

		autonomous := v1.Group("/autonomous")
		{
			autonomous.GET("/recommendations", handlers.AutonomousHandler.GetRecommendations)
			autonomous.POST("/troubleshoot", handlers.AutonomousHandler.Troubleshoot)
			autonomous.POST("/actions/execute", handlers.AutonomousHandler.ExecuteAction)
			autonomous.GET("/actions/config", handlers.AutonomousHandler.GetConfig)
			autonomous.PUT("/actions/config", handlers.AutonomousHandler.UpdateConfig)
		}

		maturity := v1.Group("/maturity")
		{
			maturity.GET("/service/metrics", handlers.MaturityHandler.GetServiceMetrics)
			maturity.GET("/team/:team/scorecard", handlers.MaturityHandler.GetTeamScorecard)
			maturity.GET("/teams/scorecards", handlers.MaturityHandler.GetAllTeamScorecards)
		}

		autodocs := v1.Group("/autodocs")
		{
			autodocs.POST("/generate", handlers.AutoDocsHandler.GenerateAutoDocs)
			autodocs.GET("/progress/:id", handlers.AutoDocsHandler.GetProgress)
		}

		playbook := v1.Group("/playbook")
		{
			playbook.POST("/service/create", handlers.ServicePlaybookHandler.CreateService)
			playbook.GET("/service/progress/:id", handlers.ServicePlaybookHandler.GetProgress)
		}

		boards := v1.Group("/boards")
		{
			boards.GET("/unified", handlers.BoardsHandler.GetUnifiedBoard)
			boards.GET("/source/:source", handlers.BoardsHandler.GetBoardBySource)
		}

		organizations := v1.Group("/organizations")
		{
			organizations.GET("", handlers.OrganizationHandler.List)
			organizations.GET("/:uuid", handlers.OrganizationHandler.GetByUUID)
			organizations.POST("", handlers.OrganizationHandler.Create)
			organizations.PUT("/:uuid", handlers.OrganizationHandler.Update)
			organizations.DELETE("/:uuid", handlers.OrganizationHandler.Delete)

			organizations.GET("/:uuid/users", handlers.UserOrganizationHandler.GetOrganizationUsers)
			organizations.POST("/:uuid/users", handlers.UserOrganizationHandler.AddUserToOrganization)
			organizations.PUT("/:uuid/users/:userId/role", handlers.UserOrganizationHandler.UpdateUserRole)
			organizations.DELETE("/:uuid/users/:userId", handlers.UserOrganizationHandler.RemoveUserFromOrganization)

			orgUsers := organizations.Group("/:uuid/node-users")
			orgUsers.Use(middleware.OrganizationMiddleware(orgRepo, userOrgRepo, log))
			{
				orgUsers.GET("", handlers.OrganizationUserHandler.ListUsers)
				orgUsers.GET("/:userId", handlers.OrganizationUserHandler.GetUser)
				orgUsers.POST("", handlers.OrganizationUserHandler.CreateUser)
				orgUsers.PUT("/:userId", handlers.OrganizationUserHandler.UpdateUser)
				orgUsers.DELETE("/:userId", handlers.OrganizationUserHandler.DeleteUser)
			}
		}

		users := v1.Group("/users")
		{
			users.GET("/:userId/organizations", handlers.UserOrganizationHandler.GetUserOrganizations)
		}

		me := v1.Group("/me")
		me.Use(middleware.AuthMiddleware(services.AuthService))
		{
			me.GET("/organizations", handlers.UserOrganizationHandler.GetMyOrganizations)
		}

		integrations := v1.Group("/integrations")
		integrations.Use(middleware.OrganizationMiddleware(orgRepo, userOrgRepo, log))
		{
			integrations.GET("", handlers.IntegrationHandler.List)
			integrations.GET("/:id", handlers.IntegrationHandler.GetByID)
			integrations.POST("", handlers.IntegrationHandler.Create)
			integrations.PUT("/:id", handlers.IntegrationHandler.Update)
			integrations.DELETE("/:id", handlers.IntegrationHandler.Delete)
			integrations.POST("/test/azuredevops", handlers.IntegrationHandler.TestAzureDevOps)
			integrations.POST("/test/sonarqube", handlers.IntegrationHandler.TestSonarQube)
			integrations.POST("/test/azure", handlers.IntegrationHandler.TestAzureCloud)
			integrations.POST("/test/gcp", handlers.IntegrationHandler.TestGCP)
			integrations.POST("/test/aws", handlers.IntegrationHandler.TestAWS)
			integrations.POST("/test/kubernetes", handlers.IntegrationHandler.TestKubernetes)
			integrations.POST("/test/grafana", handlers.IntegrationHandler.TestGrafana)
			integrations.POST("/test/github", handlers.IntegrationHandler.TestGitHub)
			integrations.POST("/test/openai", handlers.IntegrationHandler.TestOpenAI)
			integrations.POST("/test/gemini", handlers.IntegrationHandler.TestGemini)
			integrations.POST("/test/claude", handlers.IntegrationHandler.TestClaude)
			integrations.POST("/test/jira", handlers.IntegrationHandler.TestJira)
			integrations.POST("/test/slack", handlers.IntegrationHandler.TestSlack)
			integrations.POST("/test/teams", handlers.IntegrationHandler.TestTeams)
			integrations.POST("/test/argocd", handlers.IntegrationHandler.TestArgoCD)
			integrations.POST("/test/prometheus", handlers.IntegrationHandler.TestPrometheus)
			integrations.POST("/test/loki", handlers.IntegrationHandler.TestLoki)
			integrations.POST("/test/vault", handlers.IntegrationHandler.TestVault)
			integrations.POST("/test/awssecrets", handlers.IntegrationHandler.TestAWSSecrets)
			integrations.GET("/azuredevops/projects", handlers.IntegrationHandler.ListAzureDevOpsProjects)
		}

		jira := v1.Group("/jira")
		jira.Use(middleware.OrganizationMiddleware(orgRepo, userOrgRepo, log))
		{
			jira.GET("/stats", handlers.JiraHandler.GetStats)
			jira.GET("/user", handlers.JiraHandler.GetCurrentUser)
			jira.GET("/projects", handlers.JiraHandler.GetProjects)
			jira.GET("/issues", handlers.JiraHandler.SearchIssues)
			jira.GET("/issues/:key", handlers.JiraHandler.GetIssue)
			jira.GET("/boards", handlers.JiraHandler.GetBoards)
			jira.GET("/boards/:boardId/sprints", handlers.JiraHandler.GetSprints)
		}

		slack := v1.Group("/slack")
		slack.Use(middleware.OrganizationMiddleware(orgRepo, userOrgRepo, log))
		{
			slack.POST("/message", handlers.SlackHandler.SendMessage)
			slack.POST("/simple", handlers.SlackHandler.SendSimpleMessage)
			slack.POST("/alert", handlers.SlackHandler.SendAlert)
		}

		teams := v1.Group("/teams")
		teams.Use(middleware.OrganizationMiddleware(orgRepo, userOrgRepo, log))
		{
			teams.POST("/message", handlers.TeamsHandler.SendMessage)
			teams.POST("/simple", handlers.TeamsHandler.SendSimpleMessage)
			teams.POST("/alert", handlers.TeamsHandler.SendAlert)
		}

		argocd := v1.Group("/argocd")
		argocd.Use(middleware.OrganizationMiddleware(orgRepo, userOrgRepo, log))
		{
			argocd.GET("/stats", handlers.ArgoCDHandler.GetStats)
			argocd.GET("/applications", handlers.ArgoCDHandler.GetApplications)
			argocd.GET("/applications/:name", handlers.ArgoCDHandler.GetApplication)
			argocd.POST("/applications/:name/sync", handlers.ArgoCDHandler.SyncApplication)
			argocd.POST("/applications/:name/refresh", handlers.ArgoCDHandler.RefreshApplication)
			argocd.POST("/applications/:name/rollback", handlers.ArgoCDHandler.RollbackApplication)
			argocd.DELETE("/applications/:name", handlers.ArgoCDHandler.DeleteApplication)
			argocd.GET("/projects", handlers.ArgoCDHandler.GetProjects)
			argocd.GET("/projects/:name", handlers.ArgoCDHandler.GetProject)
			argocd.GET("/clusters", handlers.ArgoCDHandler.GetClusters)
		}

		prometheus := v1.Group("/prometheus")
		prometheus.Use(middleware.OrganizationMiddleware(orgRepo, userOrgRepo, log))
		{
			prometheus.GET("/stats", handlers.PrometheusHandler.GetStats)
			prometheus.GET("/query", handlers.PrometheusHandler.Query)
			prometheus.GET("/query_range", handlers.PrometheusHandler.QueryRange)
			prometheus.GET("/targets", handlers.PrometheusHandler.GetTargets)
			prometheus.GET("/alerts", handlers.PrometheusHandler.GetAlerts)
			prometheus.GET("/rules", handlers.PrometheusHandler.GetRules)
			prometheus.GET("/label/:label/values", handlers.PrometheusHandler.GetLabelValues)
			prometheus.GET("/series", handlers.PrometheusHandler.GetSeries)
			prometheus.GET("/metadata", handlers.PrometheusHandler.GetMetadata)
			prometheus.GET("/buildinfo", handlers.PrometheusHandler.GetBuildInfo)
		}

		vault := v1.Group("/vault")
		vault.Use(middleware.OrganizationMiddleware(orgRepo, userOrgRepo, log))
		{
			vault.GET("/stats", handlers.VaultHandler.GetStats)
			vault.GET("/health", handlers.VaultHandler.GetHealth)
			vault.GET("/kv/read", handlers.VaultHandler.ReadKVSecret)
			vault.GET("/kv/list", handlers.VaultHandler.ListKVSecrets)
			vault.POST("/kv/write", handlers.VaultHandler.WriteKVSecret)
			vault.DELETE("/kv/delete", handlers.VaultHandler.DeleteKVSecret)
		}

		awssecrets := v1.Group("/awssecrets")
		awssecrets.Use(middleware.OrganizationMiddleware(orgRepo, userOrgRepo, log))
		{
			awssecrets.GET("/stats", handlers.AWSSecretsHandler.GetStats)
			awssecrets.GET("/list", handlers.AWSSecretsHandler.ListSecrets)
			awssecrets.GET("/secret/:name", handlers.AWSSecretsHandler.GetSecret)
			awssecrets.GET("/describe/:name", handlers.AWSSecretsHandler.DescribeSecret)
			awssecrets.POST("/create", handlers.AWSSecretsHandler.CreateSecret)
			awssecrets.PUT("/update/:name", handlers.AWSSecretsHandler.UpdateSecret)
			awssecrets.DELETE("/delete/:name", handlers.AWSSecretsHandler.DeleteSecret)
		}

		templates := v1.Group("/templates")
		{
			templates.GET("", handlers.ServiceTemplateHandler.GetAllTemplates)
			templates.GET("/:id", handlers.ServiceTemplateHandler.GetTemplateByID)
			templates.GET("/stats", handlers.ServiceTemplateHandler.GetStats)
			templates.POST("/initialize", handlers.ServiceTemplateHandler.InitializeTemplates)
		}

		serviceTemplates := v1.Group("/service-templates")
		{
			serviceTemplates.GET("", handlers.ServiceTemplateHandler.GetAllServices)
			serviceTemplates.GET("/:id", handlers.ServiceTemplateHandler.GetServiceByID)
			serviceTemplates.POST("/create", handlers.ServiceTemplateHandler.CreateService)
		}

		// Infrastructure templates (Backstage-style)
		infraTemplates := v1.Group("/infrastructure-templates")
		{
			infraTemplates.GET("", handlers.TemplateHandler.ListTemplates)
			infraTemplates.POST("/generate", handlers.TemplateHandler.GenerateTemplate)
			infraTemplates.POST("/preview", handlers.TemplateHandler.PreviewTemplate)
		}

		// Settings - User Management System
		settings := v1.Group("/settings")
		{
			// Users
			settings.GET("/users", handlers.SettingsHandler.ListUsers)
			settings.GET("/users/stats", handlers.SettingsHandler.GetUserStats)
			settings.GET("/users/:id", handlers.SettingsHandler.GetUser)
			settings.POST("/users", handlers.SettingsHandler.CreateUser)
			settings.PUT("/users/:id", handlers.SettingsHandler.UpdateUser)
			settings.DELETE("/users/:id", handlers.SettingsHandler.DeleteUser)

			// Roles
			settings.GET("/roles", handlers.SettingsHandler.ListRoles)
			settings.GET("/roles/:id", handlers.SettingsHandler.GetRole)
			settings.POST("/roles", handlers.SettingsHandler.CreateRole)
			settings.PUT("/roles/:id", handlers.SettingsHandler.UpdateRole)
			settings.DELETE("/roles/:id", handlers.SettingsHandler.DeleteRole)

			// Permissions
			settings.GET("/permissions", handlers.SettingsHandler.ListPermissions)

			// Teams
			settings.GET("/teams", handlers.SettingsHandler.ListTeams)
			settings.GET("/teams/:id", handlers.SettingsHandler.GetTeam)
			settings.POST("/teams", handlers.SettingsHandler.CreateTeam)
			settings.PUT("/teams/:id", handlers.SettingsHandler.UpdateTeam)
			settings.DELETE("/teams/:id", handlers.SettingsHandler.DeleteTeam)
			settings.POST("/teams/:id/members", handlers.SettingsHandler.AddTeamMember)
			settings.DELETE("/teams/:id/members/:userId", handlers.SettingsHandler.RemoveTeamMember)

			// SSO
			settings.GET("/sso", handlers.SettingsHandler.ListSSOConfigs)
			settings.GET("/sso/:provider", handlers.SettingsHandler.GetSSOConfig)
			settings.POST("/sso", handlers.SettingsHandler.CreateOrUpdateSSOConfig)
			settings.DELETE("/sso/:provider", handlers.SettingsHandler.DeleteSSOConfig)

			// Audit
			settings.GET("/audit", handlers.SettingsHandler.ListAuditLogs)
			settings.GET("/audit/stats", handlers.SettingsHandler.GetAuditStats)
		}

		// Authentication
		auth := v1.Group("/auth")
		{
			// Login endpoint com rate limiting apenas em produção
			if cfg.Environment == "production" {
				auth.POST("/login",
					middleware.RateLimiter(services.CacheService, middleware.DefaultLoginRateLimiter()),
					handlers.AuthHandler.Login,
				)
			} else {
				auth.POST("/login", handlers.AuthHandler.Login)
			}

			auth.POST("/logout", handlers.AuthHandler.Logout)
			auth.POST("/refresh", handlers.AuthHandler.RefreshToken)
			auth.GET("/me", handlers.AuthHandler.Me)
			auth.POST("/change-password", handlers.AuthHandler.ChangePassword)

			// Password reset com rate limiting apenas em produção
			if cfg.Environment == "production" {
				auth.POST("/forgot-password",
					middleware.RateLimiter(services.CacheService, middleware.DefaultPasswordResetRateLimiter()),
					handlers.AuthHandler.ForgotPassword,
				)
				auth.POST("/reset-password",
					middleware.RateLimiter(services.CacheService, middleware.DefaultPasswordResetRateLimiter()),
					handlers.AuthHandler.ResetPassword,
				)
			} else {
				auth.POST("/forgot-password", handlers.AuthHandler.ForgotPassword)
				auth.POST("/reset-password", handlers.AuthHandler.ResetPassword)
			}

			// SSO Login com rate limiting apenas em produção
			if cfg.Environment == "production" {
				auth.GET("/sso/:provider",
					middleware.IPBasedRateLimiter(services.CacheService, 10),
					handlers.SSOHandler.LoginWithSSO,
				)
			} else {
				auth.GET("/sso/:provider", handlers.SSOHandler.LoginWithSSO)
			}
			auth.GET("/callback/:provider", handlers.SSOHandler.CallbackSSO)
		}
	}

	return router
}
