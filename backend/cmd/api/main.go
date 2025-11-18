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
	router.Use(middleware.CORS())

	v1 := router.Group("/api/v1")
	{
		v1.GET("/health", handlers.HealthHandler.Check)
		v1.GET("/ready", handlers.HealthHandler.Ready)

		services := v1.Group("/services")
		{
			services.GET("", handlers.ServiceHandler.List)
			services.GET("/:id", handlers.ServiceHandler.GetByID)
			services.POST("", handlers.ServiceHandler.Create)
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
			integrations.GET("/azuredevops/projects", handlers.IntegrationHandler.ListAzureDevOpsProjects)
		}
	}

	return router
}
