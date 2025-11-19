package service

import (
	"github.com/PlatifyX/platifyx-core/internal/domain"
	"github.com/PlatifyX/platifyx-core/pkg/github"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
)

type GitHubService struct {
	client *github.Client
	log    *logger.Logger
}

func NewGitHubService(config domain.GitHubConfig, log *logger.Logger) *GitHubService {
	return &GitHubService{
		client: github.NewClient(config),
		log:    log,
	}
}

func (s *GitHubService) GetAuthenticatedUser() (*domain.GitHubUser, error) {
	s.log.Info("Fetching authenticated GitHub user")

	user, err := s.client.GetAuthenticatedUser()
	if err != nil {
		s.log.Errorw("Failed to fetch authenticated user", "error", err)
		return nil, err
	}

	s.log.Infow("Fetched authenticated user successfully", "login", user.Login)
	return user, nil
}

func (s *GitHubService) ListRepositories() ([]domain.GitHubRepository, error) {
	s.log.Info("Fetching GitHub repositories")

	repos, err := s.client.ListRepositories()
	if err != nil {
		s.log.Errorw("Failed to fetch repositories", "error", err)
		return nil, err
	}

	s.log.Infow("Fetched repositories successfully", "count", len(repos))
	return repos, nil
}

func (s *GitHubService) GetRepository(owner, repo string) (*domain.GitHubRepository, error) {
	s.log.Infow("Fetching GitHub repository", "owner", owner, "repo", repo)

	repository, err := s.client.GetRepository(owner, repo)
	if err != nil {
		s.log.Errorw("Failed to fetch repository", "error", err, "owner", owner, "repo", repo)
		return nil, err
	}

	s.log.Infow("Fetched repository successfully", "fullName", repository.FullName)
	return repository, nil
}

func (s *GitHubService) ListCommits(owner, repo, branch string) ([]domain.GitHubCommit, error) {
	s.log.Infow("Fetching GitHub commits", "owner", owner, "repo", repo, "branch", branch)

	commits, err := s.client.ListCommits(owner, repo, branch)
	if err != nil {
		s.log.Errorw("Failed to fetch commits", "error", err, "owner", owner, "repo", repo)
		return nil, err
	}

	s.log.Infow("Fetched commits successfully", "count", len(commits))
	return commits, nil
}

func (s *GitHubService) ListPullRequests(owner, repo, state string) ([]domain.GitHubPullRequest, error) {
	s.log.Infow("Fetching GitHub pull requests", "owner", owner, "repo", repo, "state", state)

	prs, err := s.client.ListPullRequests(owner, repo, state)
	if err != nil {
		s.log.Errorw("Failed to fetch pull requests", "error", err, "owner", owner, "repo", repo)
		return nil, err
	}

	s.log.Infow("Fetched pull requests successfully", "count", len(prs))
	return prs, nil
}

func (s *GitHubService) ListIssues(owner, repo, state string) ([]domain.GitHubIssue, error) {
	s.log.Infow("Fetching GitHub issues", "owner", owner, "repo", repo, "state", state)

	issues, err := s.client.ListIssues(owner, repo, state)
	if err != nil {
		s.log.Errorw("Failed to fetch issues", "error", err, "owner", owner, "repo", repo)
		return nil, err
	}

	s.log.Infow("Fetched issues successfully", "count", len(issues))
	return issues, nil
}

func (s *GitHubService) ListBranches(owner, repo string) ([]domain.GitHubBranch, error) {
	s.log.Infow("Fetching GitHub branches", "owner", owner, "repo", repo)

	branches, err := s.client.ListBranches(owner, repo)
	if err != nil {
		s.log.Errorw("Failed to fetch branches", "error", err, "owner", owner, "repo", repo)
		return nil, err
	}

	s.log.Infow("Fetched branches successfully", "count", len(branches))
	return branches, nil
}

func (s *GitHubService) ListWorkflowRuns(owner, repo string) ([]domain.GitHubWorkflowRun, error) {
	s.log.Infow("Fetching GitHub workflow runs", "owner", owner, "repo", repo)

	runs, err := s.client.ListWorkflowRuns(owner, repo)
	if err != nil {
		s.log.Errorw("Failed to fetch workflow runs", "error", err, "owner", owner, "repo", repo)
		return nil, err
	}

	s.log.Infow("Fetched workflow runs successfully", "count", len(runs))
	return runs, nil
}

func (s *GitHubService) GetOrganization(org string) (*domain.GitHubOrganization, error) {
	s.log.Infow("Fetching GitHub organization", "org", org)

	organization, err := s.client.GetOrganization(org)
	if err != nil {
		s.log.Errorw("Failed to fetch organization", "error", err, "org", org)
		return nil, err
	}

	s.log.Infow("Fetched organization successfully", "login", organization.Login)
	return organization, nil
}

func (s *GitHubService) GetStats() map[string]interface{} {
	repos, err := s.ListRepositories()
	if err != nil {
		return map[string]interface{}{
			"error": err.Error(),
		}
	}

	totalStars := 0
	totalForks := 0
	totalIssues := 0
	languageCount := make(map[string]int)

	for _, repo := range repos {
		totalStars += repo.StargazersCount
		totalForks += repo.ForksCount
		totalIssues += repo.OpenIssuesCount
		if repo.Language != "" {
			languageCount[repo.Language]++
		}
	}

	return map[string]interface{}{
		"totalRepositories": len(repos),
		"totalStars":        totalStars,
		"totalForks":        totalForks,
		"totalOpenIssues":   totalIssues,
		"languageCount":     languageCount,
	}
}

// GetFileContent fetches a file content from a repository
func (s *GitHubService) GetFileContent(owner, repo, path, ref string) (string, error) {
	s.log.Infow("Fetching file content from GitHub",
		"owner", owner,
		"repository", repo,
		"path", path,
		"ref", ref,
	)

	content, err := s.client.GetFileContent(owner, repo, path, ref)
	if err != nil {
		s.log.Errorw("Failed to fetch file content from GitHub",
			"error", err,
			"owner", owner,
			"repository", repo,
			"path", path,
		)
		return "", err
	}

	s.log.Infow("Fetched file content successfully from GitHub",
		"owner", owner,
		"repository", repo,
		"path", path,
	)
	return content, nil
}

// GetRepositoryURL returns the web URL for a repository
func (s *GitHubService) GetRepositoryURL(owner, repo string) string {
	return s.client.GetRepositoryURL(owner, repo)
}
