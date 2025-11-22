package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/PlatifyX/platifyx-core/internal/config"
	"github.com/PlatifyX/platifyx-core/internal/handler"
	"github.com/PlatifyX/platifyx-core/internal/middleware"
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

	serviceManager := service.NewServiceManager(cfg, log, db)
	handlerManager := handler.NewHandlerManager(serviceManager, log)

	router := setupRouter(cfg, handlerManager, log)

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

func setupRouter(cfg *config.Config, handlers *handler.HandlerManager, log *logger.Logger) *gin.Engine {
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
		{
			kubernetes.GET("/cluster", handlers.KubernetesHandler.GetClusterInfo)
			kubernetes.GET("/pods", handlers.KubernetesHandler.ListPods)
			kubernetes.GET("/deployments", handlers.KubernetesHandler.ListDeployments)
			kubernetes.GET("/services", handlers.KubernetesHandler.ListServices)
			kubernetes.GET("/namespaces", handlers.KubernetesHandler.ListNamespaces)
			kubernetes.GET("/nodes", handlers.KubernetesHandler.ListNodes)
		}

		ci := v1.Group("/ci")
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
		{
			quality.GET("/stats", handlers.SonarQubeHandler.GetStats)

			quality.GET("/projects", handlers.SonarQubeHandler.ListProjects)
			quality.GET("/projects/:key", handlers.SonarQubeHandler.GetProjectDetails)

			quality.GET("/issues", handlers.SonarQubeHandler.ListIssues)
		}

		finops := v1.Group("/finops")
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
		{
			grafana.GET("/stats", handlers.GrafanaHandler.GetStats)
			grafana.GET("/config", handlers.GrafanaHandler.GetConfig)
			grafana.GET("/dashboards", handlers.GrafanaHandler.SearchDashboards)
			grafana.GET("/dashboards/:uid", handlers.GrafanaHandler.GetDashboardByUID)
		}

		code := v1.Group("/code")
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
		{
			ai.GET("/providers", handlers.AIHandler.GetProviders)
		}

		integrations := v1.Group("/integrations")
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
		{
			slack.POST("/message", handlers.SlackHandler.SendMessage)
			slack.POST("/simple", handlers.SlackHandler.SendSimpleMessage)
			slack.POST("/alert", handlers.SlackHandler.SendAlert)
		}

		teams := v1.Group("/teams")
		{
			teams.POST("/message", handlers.TeamsHandler.SendMessage)
			teams.POST("/simple", handlers.TeamsHandler.SendSimpleMessage)
			teams.POST("/alert", handlers.TeamsHandler.SendAlert)
		}

		argocd := v1.Group("/argocd")
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
		{
			vault.GET("/stats", handlers.VaultHandler.GetStats)
			vault.GET("/health", handlers.VaultHandler.GetHealth)
			vault.GET("/kv/read", handlers.VaultHandler.ReadKVSecret)
			vault.GET("/kv/list", handlers.VaultHandler.ListKVSecrets)
			vault.POST("/kv/write", handlers.VaultHandler.WriteKVSecret)
			vault.DELETE("/kv/delete", handlers.VaultHandler.DeleteKVSecret)
		}

		awssecrets := v1.Group("/awssecrets")
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
			auth.POST("/login", handlers.AuthHandler.Login)
			auth.POST("/logout", handlers.AuthHandler.Logout)
			auth.POST("/refresh", handlers.AuthHandler.RefreshToken)
			auth.GET("/me", handlers.AuthHandler.Me)
			auth.POST("/change-password", handlers.AuthHandler.ChangePassword)
			auth.POST("/forgot-password", handlers.AuthHandler.ForgotPassword)
			auth.POST("/reset-password", handlers.AuthHandler.ResetPassword)

			// SSO Login
			auth.GET("/sso/:provider", handlers.SSOHandler.LoginWithSSO)
			auth.GET("/callback/:provider", handlers.SSOHandler.CallbackSSO)
		}
	}

	return router
}
