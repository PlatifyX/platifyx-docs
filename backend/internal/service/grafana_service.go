package service

import (
	"github.com/PlatifyX/platifyx-core/internal/domain"
	"github.com/PlatifyX/platifyx-core/pkg/grafana"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
)

type GrafanaService struct {
	client *grafana.Client
	log    *logger.Logger
}

func NewGrafanaService(config domain.GrafanaConfig, log *logger.Logger) *GrafanaService {
	return &GrafanaService{
		client: grafana.NewClient(config),
		log:    log,
	}
}

func (s *GrafanaService) GetHealth() (*domain.GrafanaHealth, error) {
	s.log.Info("Fetching Grafana health")

	health, err := s.client.GetHealth()
	if err != nil {
		s.log.Errorw("Failed to fetch Grafana health", "error", err)
		return nil, err
	}

	s.log.Info("Fetched Grafana health successfully")
	return health, nil
}

func (s *GrafanaService) SearchDashboards(query string, tags []string) ([]domain.GrafanaDashboard, error) {
	s.log.Infow("Searching Grafana dashboards", "query", query, "tags", tags)

	dashboards, err := s.client.SearchDashboards(query, tags)
	if err != nil {
		s.log.Errorw("Failed to search dashboards", "error", err, "query", query)
		return nil, err
	}

	s.log.Infow("Searched dashboards successfully", "count", len(dashboards))
	return dashboards, nil
}

func (s *GrafanaService) GetDashboardByUID(uid string) (*domain.GrafanaDashboard, error) {
	s.log.Infow("Fetching Grafana dashboard by UID", "uid", uid)

	dashboard, err := s.client.GetDashboardByUID(uid)
	if err != nil {
		s.log.Errorw("Failed to fetch dashboard", "error", err, "uid", uid)
		return nil, err
	}

	s.log.Infow("Fetched dashboard successfully", "uid", uid, "title", dashboard.Title)
	return dashboard, nil
}

func (s *GrafanaService) GetAlerts() ([]domain.GrafanaAlert, error) {
	s.log.Info("Fetching Grafana alerts")

	alerts, err := s.client.GetAlerts()
	if err != nil {
		s.log.Errorw("Failed to fetch alerts", "error", err)
		return nil, err
	}

	s.log.Infow("Fetched alerts successfully", "count", len(alerts))
	return alerts, nil
}

func (s *GrafanaService) GetAlertsByState(state string) ([]domain.GrafanaAlert, error) {
	s.log.Infow("Fetching Grafana alerts by state", "state", state)

	alerts, err := s.client.GetAlertsByState(state)
	if err != nil {
		s.log.Errorw("Failed to fetch alerts by state", "error", err, "state", state)
		return nil, err
	}

	s.log.Infow("Fetched alerts by state successfully", "count", len(alerts), "state", state)
	return alerts, nil
}

func (s *GrafanaService) GetDataSources() ([]domain.GrafanaDataSource, error) {
	s.log.Info("Fetching Grafana data sources")

	datasources, err := s.client.GetDataSources()
	if err != nil {
		s.log.Errorw("Failed to fetch data sources", "error", err)
		return nil, err
	}

	s.log.Infow("Fetched data sources successfully", "count", len(datasources))
	return datasources, nil
}

func (s *GrafanaService) GetDataSourceByID(id int) (*domain.GrafanaDataSource, error) {
	s.log.Infow("Fetching Grafana data source by ID", "id", id)

	datasource, err := s.client.GetDataSourceByID(id)
	if err != nil {
		s.log.Errorw("Failed to fetch data source", "error", err, "id", id)
		return nil, err
	}

	s.log.Infow("Fetched data source successfully", "id", id, "name", datasource.Name)
	return datasource, nil
}

func (s *GrafanaService) GetOrganizations() ([]domain.GrafanaOrganization, error) {
	s.log.Info("Fetching Grafana organizations")

	orgs, err := s.client.GetOrganizations()
	if err != nil {
		s.log.Errorw("Failed to fetch organizations", "error", err)
		return nil, err
	}

	s.log.Infow("Fetched organizations successfully", "count", len(orgs))
	return orgs, nil
}

func (s *GrafanaService) GetCurrentOrganization() (*domain.GrafanaOrganization, error) {
	s.log.Info("Fetching current Grafana organization")

	org, err := s.client.GetCurrentOrganization()
	if err != nil {
		s.log.Errorw("Failed to fetch current organization", "error", err)
		return nil, err
	}

	s.log.Infow("Fetched current organization successfully", "name", org.Name)
	return org, nil
}

func (s *GrafanaService) GetUsers() ([]domain.GrafanaUser, error) {
	s.log.Info("Fetching Grafana users")

	users, err := s.client.GetUsers()
	if err != nil {
		s.log.Errorw("Failed to fetch users", "error", err)
		return nil, err
	}

	s.log.Infow("Fetched users successfully", "count", len(users))
	return users, nil
}

func (s *GrafanaService) GetFolders() ([]domain.GrafanaFolder, error) {
	s.log.Info("Fetching Grafana folders")

	folders, err := s.client.GetFolders()
	if err != nil {
		s.log.Errorw("Failed to fetch folders", "error", err)
		return nil, err
	}

	s.log.Infow("Fetched folders successfully", "count", len(folders))
	return folders, nil
}

func (s *GrafanaService) GetFolderByUID(uid string) (*domain.GrafanaFolder, error) {
	s.log.Infow("Fetching Grafana folder by UID", "uid", uid)

	folder, err := s.client.GetFolderByUID(uid)
	if err != nil {
		s.log.Errorw("Failed to fetch folder", "error", err, "uid", uid)
		return nil, err
	}

	s.log.Infow("Fetched folder successfully", "uid", uid, "title", folder.Title)
	return folder, nil
}

func (s *GrafanaService) GetAnnotations(dashboardID int, from, to int64, tags []string) ([]domain.GrafanaAnnotation, error) {
	s.log.Infow("Fetching Grafana annotations", "dashboardID", dashboardID, "from", from, "to", to, "tags", tags)

	annotations, err := s.client.GetAnnotations(dashboardID, from, to, tags)
	if err != nil {
		s.log.Errorw("Failed to fetch annotations", "error", err)
		return nil, err
	}

	s.log.Infow("Fetched annotations successfully", "count", len(annotations))
	return annotations, nil
}

func (s *GrafanaService) GetStats() map[string]interface{} {
	dashboards, err := s.SearchDashboards("", []string{})
	if err != nil {
		return map[string]interface{}{
			"error": err.Error(),
		}
	}

	alerts, err := s.GetAlerts()
	if err != nil {
		return map[string]interface{}{
			"totalDashboards": len(dashboards),
			"error":           err.Error(),
		}
	}

	datasources, err := s.GetDataSources()
	if err != nil {
		return map[string]interface{}{
			"totalDashboards": len(dashboards),
			"totalAlerts":     len(alerts),
			"error":           err.Error(),
		}
	}

	// Count alerts by state
	alertingCount := 0
	okCount := 0
	pausedCount := 0
	for _, alert := range alerts {
		switch alert.State {
		case "alerting":
			alertingCount++
		case "ok":
			okCount++
		case "paused":
			pausedCount++
		}
	}

	return map[string]interface{}{
		"totalDashboards":  len(dashboards),
		"totalAlerts":      len(alerts),
		"alertingCount":    alertingCount,
		"okCount":          okCount,
		"pausedCount":      pausedCount,
		"totalDataSources": len(datasources),
	}
}
