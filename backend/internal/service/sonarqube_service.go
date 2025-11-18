package service

import (
	"github.com/PlatifyX/platifyx-core/internal/domain"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"github.com/PlatifyX/platifyx-core/pkg/sonarqube"
)

type SonarQubeService struct {
	client *sonarqube.Client
	log    *logger.Logger
}

func NewSonarQubeService(config domain.SonarQubeConfig, log *logger.Logger) *SonarQubeService {
	return &SonarQubeService{
		client: sonarqube.NewClient(config),
		log:    log,
	}
}

func (s *SonarQubeService) GetProjects() ([]domain.SonarProject, error) {
	s.log.Info("Fetching SonarQube projects")

	projects, err := s.client.GetProjects()
	if err != nil {
		s.log.Errorw("Failed to fetch projects", "error", err)
		return nil, err
	}

	s.log.Infow("Fetched projects successfully", "count", len(projects))
	return projects, nil
}

func (s *SonarQubeService) GetProjectMeasures(projectKey string) (*domain.SonarProjectDetails, error) {
	s.log.Infow("Fetching project measures", "projectKey", projectKey)

	measures, err := s.client.GetProjectMeasures(projectKey)
	if err != nil {
		s.log.Errorw("Failed to fetch project measures", "error", err, "projectKey", projectKey)
		return nil, err
	}

	s.log.Info("Fetched project measures successfully")
	return measures, nil
}

func (s *SonarQubeService) GetIssues(projectKey string, severities []string, types []string, limit int) ([]domain.SonarIssue, error) {
	s.log.Infow("Fetching issues", "projectKey", projectKey, "limit", limit)

	issues, err := s.client.GetIssues(projectKey, severities, types, limit)
	if err != nil {
		s.log.Errorw("Failed to fetch issues", "error", err, "projectKey", projectKey)
		return nil, err
	}

	s.log.Infow("Fetched issues successfully", "count", len(issues))
	return issues, nil
}

func (s *SonarQubeService) GetQualityGateStatus(projectKey string) (*domain.ProjectQualityGateStatus, error) {
	s.log.Infow("Fetching quality gate status", "projectKey", projectKey)

	status, err := s.client.GetQualityGateStatus(projectKey)
	if err != nil {
		s.log.Errorw("Failed to fetch quality gate status", "error", err, "projectKey", projectKey)
		return nil, err
	}

	s.log.Info("Fetched quality gate status successfully")
	return status, nil
}
