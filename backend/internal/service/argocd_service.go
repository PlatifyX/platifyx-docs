package service

import (
	"fmt"

	"github.com/PlatifyX/platifyx-core/internal/domain"
	"github.com/PlatifyX/platifyx-core/pkg/argocd"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
)

type ArgoCDService struct {
	client *argocd.Client
	log    *logger.Logger
}

func NewArgoCDService(config domain.ArgoCDConfig, log *logger.Logger) *ArgoCDService {
	client := argocd.NewClient(config.ServerURL, config.AuthToken, config.Insecure)
	return &ArgoCDService{
		client: client,
		log:    log,
	}
}

// GetStats aggregates statistics from ArgoCD
func (s *ArgoCDService) GetStats() (*domain.ArgoCDStats, error) {
	apps, err := s.client.GetApplications()
	if err != nil {
		return nil, fmt.Errorf("failed to get applications: %w", err)
	}

	projects, err := s.client.GetProjects()
	if err != nil {
		s.log.Warnw("Failed to get projects for stats", "error", err)
		// Don't fail entirely if projects fail
	}

	clusters, err := s.client.GetClusters()
	if err != nil {
		s.log.Warnw("Failed to get clusters for stats", "error", err)
		// Don't fail entirely if clusters fail
	}

	stats := &domain.ArgoCDStats{
		TotalApplications: len(apps),
		TotalProjects:     len(projects),
		TotalClusters:     len(clusters),
	}

	// Count applications by health and sync status
	for _, app := range apps {
		switch app.Status.Health.Status {
		case "Healthy":
			stats.HealthyApps++
		case "Degraded":
			stats.DegradedApps++
		case "Progressing":
			stats.ProgressingApps++
		}

		switch app.Status.Sync.Status {
		case "Synced":
			stats.SyncedApps++
		case "OutOfSync":
			stats.OutOfSyncApps++
		}
	}

	return stats, nil
}

// GetApplications returns all applications
func (s *ArgoCDService) GetApplications() ([]domain.ArgoCDApplication, error) {
	return s.client.GetApplications()
}

// GetApplication returns a specific application
func (s *ArgoCDService) GetApplication(name string) (*domain.ArgoCDApplication, error) {
	return s.client.GetApplication(name)
}

// SyncApplication triggers a sync for an application
func (s *ArgoCDService) SyncApplication(name string, revision string, prune bool) error {
	s.log.Infow("Syncing application", "name", name, "revision", revision, "prune", prune)
	return s.client.SyncApplication(name, revision, prune)
}

// GetProjects returns all projects
func (s *ArgoCDService) GetProjects() ([]domain.ArgoCDProject, error) {
	return s.client.GetProjects()
}

// GetProject returns a specific project
func (s *ArgoCDService) GetProject(name string) (*domain.ArgoCDProject, error) {
	return s.client.GetProject(name)
}

// GetClusters returns all clusters
func (s *ArgoCDService) GetClusters() ([]domain.ArgoCDCluster, error) {
	return s.client.GetClusters()
}

// RefreshApplication refreshes an application
func (s *ArgoCDService) RefreshApplication(name string) error {
	s.log.Infow("Refreshing application", "name", name)
	return s.client.RefreshApplication(name)
}

// DeleteApplication deletes an application
func (s *ArgoCDService) DeleteApplication(name string, cascade bool) error {
	s.log.Infow("Deleting application", "name", name, "cascade", cascade)
	return s.client.DeleteApplication(name, cascade)
}

// RollbackApplication rolls back an application
func (s *ArgoCDService) RollbackApplication(name string, revision string) error {
	s.log.Infow("Rolling back application", "name", name, "revision", revision)
	return s.client.RollbackApplication(name, revision)
}

// TestConnection tests the connection to ArgoCD
func (s *ArgoCDService) TestConnection() error {
	return s.client.TestConnection()
}
