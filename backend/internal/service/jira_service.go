package service

import (
	"github.com/PlatifyX/platifyx-core/internal/domain"
	"github.com/PlatifyX/platifyx-core/pkg/jira"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
)

type JiraService struct {
	client *jira.Client
	log    *logger.Logger
}

func NewJiraService(config domain.JiraConfig, log *logger.Logger) *JiraService {
	client := jira.NewClient(config)
	return &JiraService{
		client: client,
		log:    log,
	}
}

// GetCurrentUser gets the currently authenticated user
func (s *JiraService) GetCurrentUser() (*domain.JiraUser, error) {
	s.log.Info("Fetching current Jira user")

	user, err := s.client.GetCurrentUser()
	if err != nil {
		s.log.Errorw("Failed to fetch current user", "error", err)
		return nil, err
	}

	s.log.Infow("Fetched current user successfully", "user", user.DisplayName)
	return user, nil
}

// GetProjects retrieves all projects
func (s *JiraService) GetProjects() ([]domain.JiraProject, error) {
	s.log.Info("Fetching Jira projects")

	projects, err := s.client.GetProjects()
	if err != nil {
		s.log.Errorw("Failed to fetch projects", "error", err)
		return nil, err
	}

	s.log.Infow("Fetched projects successfully", "count", len(projects))
	return projects, nil
}

// SearchIssues searches for issues using JQL
func (s *JiraService) SearchIssues(jql string, maxResults int) ([]domain.JiraIssue, error) {
	s.log.Infow("Searching Jira issues", "jql", jql, "maxResults", maxResults)

	issues, err := s.client.SearchIssues(jql, maxResults)
	if err != nil {
		s.log.Errorw("Failed to search issues", "error", err, "jql", jql)
		return nil, err
	}

	s.log.Infow("Searched issues successfully", "count", len(issues))
	return issues, nil
}

// GetIssue retrieves a single issue by key
func (s *JiraService) GetIssue(issueKey string) (*domain.JiraIssue, error) {
	s.log.Infow("Fetching Jira issue", "key", issueKey)

	issue, err := s.client.GetIssue(issueKey)
	if err != nil {
		s.log.Errorw("Failed to fetch issue", "error", err, "key", issueKey)
		return nil, err
	}

	s.log.Infow("Fetched issue successfully", "key", issueKey)
	return issue, nil
}

// GetBoards retrieves all boards
func (s *JiraService) GetBoards() ([]domain.JiraBoard, error) {
	s.log.Info("Fetching Jira boards")

	boards, err := s.client.GetBoards()
	if err != nil {
		s.log.Errorw("Failed to fetch boards", "error", err)
		return nil, err
	}

	s.log.Infow("Fetched boards successfully", "count", len(boards))
	return boards, nil
}

// GetSprints retrieves sprints for a board
func (s *JiraService) GetSprints(boardID int) ([]domain.JiraSprint, error) {
	s.log.Infow("Fetching Jira sprints", "boardId", boardID)

	sprints, err := s.client.GetSprints(boardID)
	if err != nil {
		s.log.Errorw("Failed to fetch sprints", "error", err, "boardId", boardID)
		return nil, err
	}

	s.log.Infow("Fetched sprints successfully", "count", len(sprints))
	return sprints, nil
}

// GetStats retrieves aggregated statistics
func (s *JiraService) GetStats() (*domain.JiraStats, error) {
	s.log.Info("Fetching Jira stats")

	// Get projects count
	projects, err := s.GetProjects()
	if err != nil {
		return nil, err
	}

	// Search for all issues
	allIssues, err := s.SearchIssues("", 1000)
	if err != nil {
		return nil, err
	}

	// Count issues by status
	stats := &domain.JiraStats{
		TotalProjects: len(projects),
		TotalIssues:   len(allIssues),
	}

	for _, issue := range allIssues {
		statusCategory := issue.Fields.Status.StatusCategory.Name
		switch statusCategory {
		case "To Do":
			stats.OpenIssues++
		case "In Progress":
			stats.InProgress++
		case "Done":
			stats.Done++
		}
	}

	s.log.Infow("Fetched stats successfully",
		"totalProjects", stats.TotalProjects,
		"totalIssues", stats.TotalIssues,
	)

	return stats, nil
}
