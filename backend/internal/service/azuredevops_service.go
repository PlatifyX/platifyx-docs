package service

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/PlatifyX/platifyx-core/internal/domain"
	"github.com/PlatifyX/platifyx-core/pkg/azuredevops"
	"github.com/PlatifyX/platifyx-core/pkg/cache"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
)

type AzureDevOpsService struct {
	client      *azuredevops.Client
	cacheClient *cache.RedisClient
	log         *logger.Logger
	config      domain.AzureDevOpsConfig
}

func NewAzureDevOpsService(config domain.AzureDevOpsConfig, log *logger.Logger) *AzureDevOpsService {
	return &AzureDevOpsService{
		client: azuredevops.NewClient(config),
		log:    log,
		config: config,
	}
}

func NewAzureDevOpsServiceWithCache(config domain.AzureDevOpsConfig, cacheClient *cache.RedisClient, log *logger.Logger) *AzureDevOpsService {
	return &AzureDevOpsService{
		client:      azuredevops.NewClient(config),
		cacheClient: cacheClient,
		log:         log,
		config:      config,
	}
}

// NewAzureDevOpsServiceFromIntegration creates an AzureDevOpsService from an Integration
func NewAzureDevOpsServiceFromIntegration(integration *domain.Integration) (*AzureDevOpsService, error) {
	// Parse config JSON
	var config domain.AzureDevOpsConfig
	err := json.Unmarshal(integration.Config, &config)
	if err != nil {
		return nil, fmt.Errorf("failed to parse Azure DevOps config: %w", err)
	}

	// Create a minimal logger (we don't have access to the main logger here)
	log := logger.NewLogger("info")

	return NewAzureDevOpsService(config, log), nil
}

func (s *AzureDevOpsService) GetPipelines() ([]domain.Pipeline, error) {
	cacheKey := fmt.Sprintf("ci:pipelines:%s", s.config.Organization)

	// Try to get from cache first
	if s.cacheClient != nil {
		var cachedPipelines []domain.Pipeline
		err := s.cacheClient.GetJSON(cacheKey, &cachedPipelines)
		if err == nil {
			s.log.Info("Returning pipelines from cache")
			return cachedPipelines, nil
		}
		s.log.Debugw("Cache miss for pipelines", "error", err)
	}

	s.log.Info("Fetching Azure DevOps pipelines from all projects")

	pipelines, err := s.client.ListAllPipelines()
	if err != nil {
		s.log.Errorw("Failed to fetch pipelines", "error", err)
		return nil, err
	}

	// Store in cache (5 minutes TTL)
	if s.cacheClient != nil {
		err = s.cacheClient.Set(cacheKey, pipelines, 5*time.Minute)
		if err != nil {
			s.log.Warnw("Failed to cache pipelines", "error", err)
		} else {
			s.log.Info("Cached pipelines list")
		}
	}

	s.log.Infow("Fetched pipelines successfully from all projects", "count", len(pipelines))
	return pipelines, nil
}

func (s *AzureDevOpsService) GetPipelineRuns(pipelineID int) ([]domain.PipelineRun, error) {
	cacheKey := fmt.Sprintf("ci:pipeline_runs:%d", pipelineID)

	// Try to get from cache first
	if s.cacheClient != nil {
		var cachedRuns []domain.PipelineRun
		err := s.cacheClient.GetJSON(cacheKey, &cachedRuns)
		if err == nil {
			s.log.Debugw("Returning pipeline runs from cache", "pipelineId", pipelineID)
			return cachedRuns, nil
		}
	}

	s.log.Infow("Fetching pipeline runs", "pipelineId", pipelineID)

	runs, err := s.client.ListPipelineRuns(pipelineID)
	if err != nil {
		s.log.Errorw("Failed to fetch pipeline runs", "error", err, "pipelineId", pipelineID)
		return nil, err
	}

	// Store in cache (3 minutes TTL)
	if s.cacheClient != nil {
		err = s.cacheClient.Set(cacheKey, runs, 3*time.Minute)
		if err != nil {
			s.log.Warnw("Failed to cache pipeline runs", "error", err)
		}
	}

	s.log.Infow("Fetched pipeline runs successfully", "count", len(runs))
	return runs, nil
}

func (s *AzureDevOpsService) GetBuilds(limit int) ([]domain.Build, error) {
	cacheKey := fmt.Sprintf("ci:builds:%s:%d", s.config.Organization, limit)

	// Try to get from cache first
	if s.cacheClient != nil {
		var cachedBuilds []domain.Build
		err := s.cacheClient.GetJSON(cacheKey, &cachedBuilds)
		if err == nil {
			s.log.Debug("Returning builds from cache")
			return cachedBuilds, nil
		}
		s.log.Debugw("Cache miss for builds", "error", err)
	}

	s.log.Infow("Fetching builds from all projects", "limitPerProject", limit)

	builds, err := s.client.ListAllBuilds(limit)
	if err != nil {
		s.log.Errorw("Failed to fetch builds", "error", err)
		return nil, err
	}

	// Store in cache (2 minutes TTL - builds change frequently)
	if s.cacheClient != nil {
		err = s.cacheClient.Set(cacheKey, builds, 2*time.Minute)
		if err != nil {
			s.log.Warnw("Failed to cache builds", "error", err)
		} else {
			s.log.Debug("Cached builds list")
		}
	}

	s.log.Infow("Fetched builds successfully from all projects", "count", len(builds))
	return builds, nil
}

func (s *AzureDevOpsService) GetBuildByID(buildID int) (*domain.Build, error) {
	s.log.Infow("Fetching build by ID", "buildId", buildID)

	build, err := s.client.GetBuild(buildID)
	if err != nil {
		s.log.Errorw("Failed to fetch build", "error", err, "buildId", buildID)
		return nil, err
	}

	s.log.Info("Fetched build successfully")
	return build, nil
}

func (s *AzureDevOpsService) GetBuildLogs(buildID int) (string, error) {
	cacheKey := fmt.Sprintf("ci:build_logs:%d", buildID)

	// Try to get from cache first
	if s.cacheClient != nil {
		logs, err := s.cacheClient.Get(cacheKey)
		if err == nil {
			s.log.Debugw("Returning build logs from cache", "buildId", buildID)
			return logs, nil
		}
	}

	s.log.Infow("Fetching build logs", "buildId", buildID)

	logs, err := s.client.GetBuildLogs(buildID)
	if err != nil {
		s.log.Errorw("Failed to fetch build logs", "error", err, "buildId", buildID)
		return "", err
	}

	// Store in cache (1 hour TTL - logs are immutable once build completes)
	if s.cacheClient != nil {
		err = s.cacheClient.Set(cacheKey, logs, 1*time.Hour)
		if err != nil {
			s.log.Warnw("Failed to cache build logs", "error", err)
		}
	}

	s.log.Info("Fetched build logs successfully")
	return logs, nil
}

func (s *AzureDevOpsService) GetReleases(limit int) ([]domain.Release, error) {
	cacheKey := fmt.Sprintf("ci:releases:%s:%d", s.config.Organization, limit)

	// Try to get from cache first
	if s.cacheClient != nil {
		var cachedReleases []domain.Release
		err := s.cacheClient.GetJSON(cacheKey, &cachedReleases)
		if err == nil {
			s.log.Debug("Returning releases from cache")
			return cachedReleases, nil
		}
		s.log.Debugw("Cache miss for releases", "error", err)
	}

	s.log.Infow("Fetching releases from all projects", "limitPerProject", limit)

	releases, err := s.client.ListAllReleases(limit)
	if err != nil {
		s.log.Errorw("Failed to fetch releases", "error", err)
		return nil, err
	}

	// Store in cache (3 minutes TTL)
	if s.cacheClient != nil {
		err = s.cacheClient.Set(cacheKey, releases, 3*time.Minute)
		if err != nil {
			s.log.Warnw("Failed to cache releases", "error", err)
		} else {
			s.log.Debug("Cached releases list")
		}
	}

	s.log.Infow("Fetched releases successfully from all projects", "count", len(releases))
	return releases, nil
}

func (s *AzureDevOpsService) GetReleaseByID(releaseID int) (*domain.Release, error) {
	s.log.Infow("Fetching release by ID", "releaseId", releaseID)

	release, err := s.client.GetRelease(releaseID)
	if err != nil {
		s.log.Errorw("Failed to fetch release", "error", err, "releaseId", releaseID)
		return nil, err
	}

	s.log.Info("Fetched release successfully")
	return release, nil
}

func (s *AzureDevOpsService) GetPipelineStats() map[string]interface{} {
	pipelines, err := s.GetPipelines()
	if err != nil {
		return map[string]interface{}{
			"error": err.Error(),
		}
	}

	builds, err := s.GetBuilds(100)
	if err != nil {
		return map[string]interface{}{
			"totalPipelines": len(pipelines),
			"error":          err.Error(),
		}
	}

	successCount := 0
	failedCount := 0
	runningCount := 0

	for _, build := range builds {
		switch build.Result {
		case "succeeded":
			successCount++
		case "failed":
			failedCount++
		case "":
			if build.Status == "inProgress" {
				runningCount++
			}
		}
	}

	successRate := 0.0
	if len(builds) > 0 {
		successRate = float64(successCount) / float64(len(builds)) * 100
	}

	return map[string]interface{}{
		"totalPipelines": len(pipelines),
		"totalBuilds":    len(builds),
		"successCount":   successCount,
		"failedCount":    failedCount,
		"runningCount":   runningCount,
		"successRate":    successRate,
	}
}

func (s *AzureDevOpsService) QueueBuild(project string, definitionID int, sourceBranch string) (*domain.Build, error) {
	s.log.Infow("Queueing build", "project", project, "definitionId", definitionID, "branch", sourceBranch)

	build, err := s.client.QueueBuild(project, definitionID, sourceBranch)
	if err != nil {
		s.log.Errorw("Failed to queue build", "error", err, "project", project, "definitionId", definitionID)
		return nil, err
	}

	// Invalidate builds cache
	if s.cacheClient != nil {
		s.cacheClient.Delete(fmt.Sprintf("ci:builds:%s:100", s.config.Organization))
		s.cacheClient.Delete(fmt.Sprintf("ci:builds:%s:200", s.config.Organization))
		s.log.Debug("Invalidated builds cache after queueing build")
	}

	s.log.Infow("Build queued successfully", "buildId", build.ID, "buildNumber", build.BuildNumber)
	return build, nil
}

func (s *AzureDevOpsService) ApproveRelease(project string, approvalID int, comments string) error {
	s.log.Infow("Approving release", "project", project, "approvalId", approvalID)

	err := s.client.UpdateReleaseApproval(project, approvalID, "approved", comments)
	if err != nil {
		s.log.Errorw("Failed to approve release", "error", err, "project", project, "approvalId", approvalID)
		return err
	}

	// Invalidate releases cache
	if s.cacheClient != nil {
		s.cacheClient.Delete(fmt.Sprintf("ci:releases:%s:50", s.config.Organization))
		s.cacheClient.Delete(fmt.Sprintf("ci:releases:%s:100", s.config.Organization))
		s.log.Debug("Invalidated releases cache after approving release")
	}

	s.log.Info("Release approved successfully")
	return nil
}

func (s *AzureDevOpsService) RejectRelease(project string, approvalID int, comments string) error {
	s.log.Infow("Rejecting release", "project", project, "approvalId", approvalID)

	err := s.client.UpdateReleaseApproval(project, approvalID, "rejected", comments)
	if err != nil {
		s.log.Errorw("Failed to reject release", "error", err, "project", project, "approvalId", approvalID)
		return err
	}

	// Invalidate releases cache
	if s.cacheClient != nil {
		s.cacheClient.Delete(fmt.Sprintf("ci:releases:%s:50", s.config.Organization))
		s.cacheClient.Delete(fmt.Sprintf("ci:releases:%s:100", s.config.Organization))
		s.log.Debug("Invalidated releases cache after rejecting release")
	}

	s.log.Info("Release rejected successfully")
	return nil
}

// GetFileContent fetches a file from a repository
func (s *AzureDevOpsService) GetFileContent(repositoryName, filePath, branch string) (string, error) {
	s.log.Infow("Fetching file content", "repository", repositoryName, "path", filePath, "branch", branch)

	content, err := s.client.GetFileContent(repositoryName, filePath, branch)
	if err != nil {
		s.log.Errorw("Failed to fetch file content", "error", err, "repository", repositoryName, "path", filePath)
		return "", err
	}

	return content, nil
}

// GetRepositoryURL returns the web URL for a repository
func (s *AzureDevOpsService) GetRepositoryURL(repositoryName string) (string, error) {
	s.log.Infow("Getting repository URL", "repository", repositoryName)

	url, err := s.client.GetRepositoryURL(repositoryName)
	if err != nil {
		s.log.Errorw("Failed to get repository URL", "error", err, "repository", repositoryName)
		return "", err
	}

	return url, nil
}

// GetRepositories fetches all repositories from all projects
func (s *AzureDevOpsService) GetRepositories() ([]azuredevops.Repository, error) {
	cacheKey := fmt.Sprintf("azure:repositories:%s", s.config.Organization)

	// Try to get from cache first
	if s.cacheClient != nil {
		var cachedRepos []azuredevops.Repository
		err := s.cacheClient.GetJSON(cacheKey, &cachedRepos)
		if err == nil {
			s.log.Info("Returning repositories from cache")
			return cachedRepos, nil
		}
		s.log.Debugw("Cache miss for repositories", "error", err)
	}

	s.log.Info("Fetching Azure DevOps repositories from all projects")

	repos, err := s.client.ListAllRepositories()
	if err != nil {
		s.log.Errorw("Failed to fetch repositories", "error", err)
		return nil, err
	}

	// Store in cache (10 minutes TTL)
	if s.cacheClient != nil {
		err = s.cacheClient.Set(cacheKey, repos, 10*time.Minute)
		if err != nil {
			s.log.Warnw("Failed to cache repositories", "error", err)
		} else {
			s.log.Info("Cached repositories list")
		}
	}

	s.log.Infow("Fetched repositories successfully from all projects", "count", len(repos))
	return repos, nil
}

// GetRepositoriesStats returns statistics about repositories
func (s *AzureDevOpsService) GetRepositoriesStats() (map[string]interface{}, error) {
	repos, err := s.GetRepositories()
	if err != nil {
		return nil, err
	}

	totalSize := 0
	for _, repo := range repos {
		totalSize += repo.Size
	}

	return map[string]interface{}{
		"totalRepositories": len(repos),
		"totalSize":         totalSize,
	}, nil
}
