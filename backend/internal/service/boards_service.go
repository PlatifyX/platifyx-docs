package service

import (
	"fmt"
	"strings"
	"time"

	"github.com/PlatifyX/platifyx-core/internal/domain"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
)

type BoardsService struct {
	jiraService       interface{} // Jira service placeholder
	azureDevOpsService *AzureDevOpsService
	githubService     *GitHubService
	integrationService *IntegrationService
	log               *logger.Logger
}

func NewBoardsService(
	azureDevOpsService *AzureDevOpsService,
	githubService *GitHubService,
	integrationService *IntegrationService,
	log *logger.Logger,
) *BoardsService {
	return &BoardsService{
		azureDevOpsService: azureDevOpsService,
		githubService:     githubService,
		integrationService: integrationService,
		log:               log,
	}
}

func (s *BoardsService) GetUnifiedBoard() (*domain.UnifiedBoard, error) {
	board := &domain.UnifiedBoard{
		ID:          "unified",
		Name:        "Unified Board",
		Columns:     []domain.BoardColumn{},
		TotalItems:  0,
		Sources:     []domain.BoardSource{},
		LastUpdated: time.Now(),
	}

	// Default columns for Kanban board
	columns := []domain.BoardColumn{
		{ID: "todo", Name: "To Do", Items: []domain.BoardItem{}},
		{ID: "inprogress", Name: "In Progress", Items: []domain.BoardItem{}},
		{ID: "review", Name: "Review", Items: []domain.BoardItem{}},
		{ID: "done", Name: "Done", Items: []domain.BoardItem{}},
	}

	allItems := []domain.BoardItem{}

	// Fetch items from Azure DevOps
	if s.azureDevOpsService != nil {
		azureItems, err := s.getAzureDevOpsItems()
		if err == nil {
			allItems = append(allItems, azureItems...)
			board.Sources = append(board.Sources, domain.BoardSourceAzureDevOps)
		}
	}

	// Fetch items from GitHub
	if s.githubService != nil {
		githubItems, err := s.getGitHubItems()
		if err == nil {
			allItems = append(allItems, githubItems...)
			board.Sources = append(board.Sources, domain.BoardSourceGitHub)
		}
	}

	// Fetch items from Jira (placeholder)
	jiraItems, err := s.getJiraItems()
	if err == nil {
		allItems = append(allItems, jiraItems...)
		board.Sources = append(board.Sources, domain.BoardSourceJira)
	}

	// Organize items by status into columns
	for _, item := range allItems {
		for i := range columns {
			if s.matchesColumn(item, columns[i].ID) {
				columns[i].Items = append(columns[i].Items, item)
				board.TotalItems++
				break
			}
		}
	}

	board.Columns = columns
	return board, nil
}

func (s *BoardsService) getAzureDevOpsItems() ([]domain.BoardItem, error) {
	if s.azureDevOpsService == nil {
		return nil, fmt.Errorf("Azure DevOps service not available")
	}

	// Get work items from Azure DevOps
	// This is a placeholder - would need actual Azure DevOps API integration
	items := []domain.BoardItem{}

	// Example: Get builds as work items
	builds, err := s.azureDevOpsService.GetBuilds(10)
	if err == nil {
		for _, build := range builds {
			status := s.mapAzureDevOpsStatus(build.Status, build.Result)
			item := domain.BoardItem{
				ID:        fmt.Sprintf("azuredevops-build-%d", build.ID),
				Title:     fmt.Sprintf("Build #%s", build.BuildNumber),
				Status:    status,
				Source:    domain.BoardSourceAzureDevOps,
				SourceURL: build.URL,
				CreatedAt: build.StartTime,
				UpdatedAt: build.FinishTime,
				Metadata: map[string]interface{}{
					"buildId":   build.ID,
					"buildType": "build",
				},
			}
			items = append(items, item)
		}
	}

	return items, nil
}

func (s *BoardsService) getGitHubItems() ([]domain.BoardItem, error) {
	if s.githubService == nil {
		return nil, fmt.Errorf("GitHub service not available")
	}

	items := []domain.BoardItem{}

	// Get pull requests as work items
	// This would need actual GitHub API integration
	// For now, returning empty list as placeholder

	return items, nil
}

func (s *BoardsService) getJiraItems() ([]domain.BoardItem, error) {
	// Jira integration placeholder
	items := []domain.BoardItem{}

	// Would integrate with Jira API here
	// For now, returning empty list

	return items, nil
}

func (s *BoardsService) mapAzureDevOpsStatus(status, result string) string {
	if result == "succeeded" {
		return "done"
	}
	if result == "failed" {
		return "review"
	}
	if status == "inProgress" {
		return "inprogress"
	}
	if status == "completed" {
		return "done"
	}
	return "todo"
}

func (s *BoardsService) matchesColumn(item domain.BoardItem, columnID string) bool {
	statusMap := map[string][]string{
		"todo":       {"todo", "to do", "ready", "queued", "backlog", "new", "open"},
		"inprogress": {"inprogress", "in progress", "in_progress", "active", "working", "running"},
		"review":     {"review", "testing", "qa", "failed"},
		"done":       {"done", "completed", "closed", "resolved", "succeeded", "finished"},
	}

	statusLower := strings.ToLower(item.Status)
	for _, validStatus := range statusMap[columnID] {
		if statusLower == validStatus {
			return true
		}
	}

	return false
}

func (s *BoardsService) GetBoardBySource(source domain.BoardSource) (*domain.Board, error) {
	board := &domain.Board{
		ID:          string(source),
		Name:        fmt.Sprintf("%s Board", source),
		Source:      source,
		Columns:     []domain.BoardColumn{},
		TotalItems:  0,
		LastUpdated: time.Now(),
	}

	var items []domain.BoardItem
	var err error

	switch source {
	case domain.BoardSourceAzureDevOps:
		items, err = s.getAzureDevOpsItems()
	case domain.BoardSourceGitHub:
		items, err = s.getGitHubItems()
	case domain.BoardSourceJira:
		items, err = s.getJiraItems()
	default:
		return nil, fmt.Errorf("unsupported board source: %s", source)
	}

	if err != nil {
		return nil, err
	}

	// Organize into columns
	columns := []domain.BoardColumn{
		{ID: "todo", Name: "To Do", Items: []domain.BoardItem{}},
		{ID: "inprogress", Name: "In Progress", Items: []domain.BoardItem{}},
		{ID: "review", Name: "Review", Items: []domain.BoardItem{}},
		{ID: "done", Name: "Done", Items: []domain.BoardItem{}},
	}

	for _, item := range items {
		for i := range columns {
			if s.matchesColumn(item, columns[i].ID) {
				columns[i].Items = append(columns[i].Items, item)
				board.TotalItems++
				break
			}
		}
	}

	board.Columns = columns
	return board, nil
}

