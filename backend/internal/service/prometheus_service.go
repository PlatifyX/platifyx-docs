package service

import (
	"time"

	"github.com/PlatifyX/platifyx-core/internal/domain"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"github.com/PlatifyX/platifyx-core/pkg/prometheus"
)

type PrometheusService struct {
	client *prometheus.Client
	log    *logger.Logger
}

func NewPrometheusService(config domain.PrometheusConfig, log *logger.Logger) *PrometheusService {
	client := prometheus.NewClient(config.URL, config.Username, config.Password)
	return &PrometheusService{
		client: client,
		log:    log,
	}
}

// GetStats aggregates statistics from Prometheus
func (s *PrometheusService) GetStats() (*domain.PrometheusStats, error) {
	stats := &domain.PrometheusStats{}

	// Get targets
	targets, err := s.client.GetTargets()
	if err != nil {
		s.log.Warnw("Failed to get targets for stats", "error", err)
	} else if targets != nil && targets.Data.ActiveTargets != nil {
		stats.TotalTargets = len(targets.Data.ActiveTargets)
		for _, target := range targets.Data.ActiveTargets {
			if target.Health == "up" {
				stats.UpTargets++
			} else {
				stats.DownTargets++
			}
		}
	}

	// Get alerts
	alerts, err := s.client.GetAlerts()
	if err != nil {
		s.log.Warnw("Failed to get alerts for stats", "error", err)
	} else if alerts != nil && alerts.Data.Alerts != nil {
		stats.TotalAlerts = len(alerts.Data.Alerts)
		for _, alert := range alerts.Data.Alerts {
			if alert.State == "firing" {
				stats.FiringAlerts++
			} else if alert.State == "pending" {
				stats.PendingAlerts++
			}
		}
	}

	// Get rules
	rules, err := s.client.GetRules()
	if err != nil {
		s.log.Warnw("Failed to get rules for stats", "error", err)
	} else if rules != nil && rules.Data.Groups != nil {
		stats.TotalRuleGroups = len(rules.Data.Groups)
		for _, group := range rules.Data.Groups {
			stats.TotalRules += len(group.Rules)
		}
	}

	// Get build info for version
	buildInfo, err := s.client.GetBuildInfo()
	if err != nil {
		s.log.Warnw("Failed to get build info for stats", "error", err)
	} else if buildInfo != nil && buildInfo.Data != nil {
		if version, ok := buildInfo.Data["version"]; ok {
			stats.Version = version
		}
	}

	return stats, nil
}

// Query executes a PromQL query
func (s *PrometheusService) Query(query string, timestamp *time.Time) (*domain.PrometheusQueryResult, error) {
	s.log.Infow("Executing Prometheus query", "query", query)
	return s.client.Query(query, timestamp)
}

// QueryRange executes a PromQL range query
func (s *PrometheusService) QueryRange(query string, start, end time.Time, step string) (*domain.PrometheusQueryResult, error) {
	s.log.Infow("Executing Prometheus range query", "query", query, "start", start, "end", end, "step", step)
	return s.client.QueryRange(query, start, end, step)
}

// GetTargets returns all targets
func (s *PrometheusService) GetTargets() (*domain.PrometheusTargetsResult, error) {
	return s.client.GetTargets()
}

// GetAlerts returns all alerts
func (s *PrometheusService) GetAlerts() (*domain.PrometheusAlertsResult, error) {
	return s.client.GetAlerts()
}

// GetRules returns all rules
func (s *PrometheusService) GetRules() (*domain.PrometheusRulesResult, error) {
	return s.client.GetRules()
}

// GetLabelValues returns all values for a label
func (s *PrometheusService) GetLabelValues(labelName string) (*domain.PrometheusLabelValuesResult, error) {
	return s.client.GetLabelValues(labelName)
}

// GetSeries returns series matching label selectors
func (s *PrometheusService) GetSeries(matches []string, start, end *time.Time) (*domain.PrometheusSeriesResult, error) {
	return s.client.GetSeries(matches, start, end)
}

// GetMetadata returns metadata about metrics
func (s *PrometheusService) GetMetadata(metric string) (*domain.PrometheusMetadataResult, error) {
	return s.client.GetMetadata(metric)
}

// GetBuildInfo returns build information
func (s *PrometheusService) GetBuildInfo() (*domain.PrometheusBuildInfoResult, error) {
	return s.client.GetBuildInfo()
}

// TestConnection tests the connection to Prometheus
func (s *PrometheusService) TestConnection() error {
	return s.client.TestConnection()
}
