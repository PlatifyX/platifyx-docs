package service

import (
	"github.com/PlatifyX/platifyx-core/internal/domain"
	"github.com/PlatifyX/platifyx-core/pkg/azuredevops"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
)

type AzureDevOpsService struct {
	client *azuredevops.Client
	log    *logger.Logger
}

func NewAzureDevOpsService(config domain.AzureDevOpsConfig, log *logger.Logger) *AzureDevOpsService {
	return &AzureDevOpsService{
		client: azuredevops.NewClient(config),
		log:    log,
	}
}

func (s *AzureDevOpsService) GetPipelines() ([]domain.Pipeline, error) {
	s.log.Info("Fetching Azure DevOps pipelines from all projects")

	pipelines, err := s.client.ListAllPipelines()
	if err != nil {
		s.log.Errorw("Failed to fetch pipelines", "error", err)
		return nil, err
	}

	s.log.Infow("Fetched pipelines successfully from all projects", "count", len(pipelines))
	return pipelines, nil
}

func (s *AzureDevOpsService) GetPipelineRuns(pipelineID int) ([]domain.PipelineRun, error) {
	s.log.Infow("Fetching pipeline runs", "pipelineId", pipelineID)

	runs, err := s.client.ListPipelineRuns(pipelineID)
	if err != nil {
		s.log.Errorw("Failed to fetch pipeline runs", "error", err, "pipelineId", pipelineID)
		return nil, err
	}

	s.log.Infow("Fetched pipeline runs successfully", "count", len(runs))
	return runs, nil
}

func (s *AzureDevOpsService) GetBuilds(limit int) ([]domain.Build, error) {
	s.log.Infow("Fetching builds from all projects", "limitPerProject", limit)

	builds, err := s.client.ListAllBuilds(limit)
	if err != nil {
		s.log.Errorw("Failed to fetch builds", "error", err)
		return nil, err
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
	s.log.Infow("Fetching build logs", "buildId", buildID)

	logs, err := s.client.GetBuildLogs(buildID)
	if err != nil {
		s.log.Errorw("Failed to fetch build logs", "error", err, "buildId", buildID)
		return "", err
	}

	s.log.Info("Fetched build logs successfully")
	return logs, nil
}

func (s *AzureDevOpsService) GetReleases(limit int) ([]domain.Release, error) {
	s.log.Infow("Fetching releases from all projects", "limitPerProject", limit)

	releases, err := s.client.ListAllReleases(limit)
	if err != nil {
		s.log.Errorw("Failed to fetch releases", "error", err)
		return nil, err
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
