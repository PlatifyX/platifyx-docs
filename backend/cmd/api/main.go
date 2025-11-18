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
			kubernetes.GET("/clusters", handlers.KubernetesHandler.ListClusters)
			kubernetes.GET("/pods", handlers.KubernetesHandler.ListPods)
		}

		if handlers.AzureDevOpsHandler != nil {
			azuredevops := v1.Group("/azuredevops")
			{
				azuredevops.GET("/stats", handlers.AzureDevOpsHandler.GetStats)

				azuredevops.GET("/pipelines", handlers.AzureDevOpsHandler.ListPipelines)
				azuredevops.GET("/pipelines/:id/runs", handlers.AzureDevOpsHandler.ListPipelineRuns)

				azuredevops.GET("/builds", handlers.AzureDevOpsHandler.ListBuilds)
				azuredevops.GET("/builds/:id", handlers.AzureDevOpsHandler.GetBuild)

				azuredevops.GET("/releases", handlers.AzureDevOpsHandler.ListReleases)
				azuredevops.GET("/releases/:id", handlers.AzureDevOpsHandler.GetRelease)
			}
		}

		integrations := v1.Group("/integrations")
		{
			integrations.GET("", handlers.IntegrationHandler.List)
			integrations.GET("/:id", handlers.IntegrationHandler.GetByID)
			integrations.PUT("/:id", handlers.IntegrationHandler.Update)
		}
	}

	return router
}
