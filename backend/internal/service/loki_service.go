package service

import (
	"fmt"
	"time"

	"github.com/PlatifyX/platifyx-core/internal/domain"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"github.com/PlatifyX/platifyx-core/pkg/loki"
)

type LokiService struct {
	client *loki.Client
	log    *logger.Logger
}

func NewLokiService(config domain.LokiConfig, log *logger.Logger) *LokiService {
	return &LokiService{
		client: loki.NewClient(config),
		log:    log,
	}
}

// GetLabels retrieves all label names from Loki
func (s *LokiService) GetLabels() ([]string, error) {
	s.log.Info("Fetching Loki labels")

	labels, err := s.client.GetLabels()
	if err != nil {
		s.log.Errorw("Failed to fetch labels", "error", err)
		return nil, err
	}

	s.log.Infow("Fetched labels successfully", "count", len(labels))
	return labels, nil
}

// GetLabelValues retrieves all values for a specific label
func (s *LokiService) GetLabelValues(label string) ([]string, error) {
	s.log.Infow("Fetching label values", "label", label)

	values, err := s.client.GetLabelValues(label)
	if err != nil {
		s.log.Errorw("Failed to fetch label values", "error", err, "label", label)
		return nil, err
	}

	s.log.Infow("Fetched label values successfully", "label", label, "count", len(values))
	return values, nil
}

// QueryRange queries Loki for logs in a time range
func (s *LokiService) QueryRange(query string, start, end time.Time, limit int) (*domain.LokiQueryResult, error) {
	s.log.Infow("Querying Loki", "query", query, "start", start, "end", end, "limit", limit)

	result, err := s.client.QueryRange(query, start, end, limit)
	if err != nil {
		s.log.Errorw("Failed to query Loki", "error", err, "query", query)
		return nil, err
	}

	// Count total log lines
	totalLines := 0
	for _, stream := range result.Data.Result {
		totalLines += len(stream.Values)
	}

	s.log.Infow("Query successful", "streams", len(result.Data.Result), "lines", totalLines)
	return result, nil
}

// Query queries Loki for recent logs
func (s *LokiService) Query(query string, limit int) (*domain.LokiQueryResult, error) {
	s.log.Infow("Querying Loki (instant)", "query", query, "limit", limit)

	result, err := s.client.Query(query, limit)
	if err != nil {
		s.log.Errorw("Failed to query Loki", "error", err, "query", query)
		return nil, err
	}

	// Count total log lines
	totalLines := 0
	for _, stream := range result.Data.Result {
		totalLines += len(stream.Values)
	}

	s.log.Infow("Query successful", "streams", len(result.Data.Result), "lines", totalLines)
	return result, nil
}

// GetAppLabels retrieves all values for the 'app' label (for services)
func (s *LokiService) GetAppLabels() ([]string, error) {
	return s.GetLabelValues("app")
}

// GetLogsForApp retrieves recent logs for a specific app
func (s *LokiService) GetLogsForApp(app string, limit int, duration time.Duration) (*domain.LokiQueryResult, error) {
	query := fmt.Sprintf(`{app="%s"}`, app)
	end := time.Now()
	start := end.Add(-duration)

	return s.QueryRange(query, start, end, limit)
}

// TestConnection tests if the Loki server is reachable
func (s *LokiService) TestConnection() error {
	s.log.Info("Testing Loki connection")

	err := s.client.TestConnection()
	if err != nil {
		s.log.Errorw("Loki connection test failed", "error", err)
		return err
	}

	s.log.Info("Loki connection test successful")
	return nil
}
