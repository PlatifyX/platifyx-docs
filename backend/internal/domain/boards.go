package domain

import "time"

type BoardSource string

const (
	BoardSourceJira        BoardSource = "jira"
	BoardSourceAzureDevOps BoardSource = "azuredevops"
	BoardSourceGitHub      BoardSource = "github"
)

type BoardItem struct {
	ID          string                 `json:"id"`
	Title       string                 `json:"title"`
	Description string                 `json:"description,omitempty"`
	Status      string                 `json:"status"`
	Priority    string                 `json:"priority,omitempty"`
	Assignee    string                 `json:"assignee,omitempty"`
	Labels      []string               `json:"labels,omitempty"`
	Source      BoardSource            `json:"source"`
	SourceURL   string                 `json:"sourceUrl,omitempty"`
	CreatedAt   time.Time              `json:"createdAt"`
	UpdatedAt   time.Time              `json:"updatedAt"`
	DueDate     *time.Time             `json:"dueDate,omitempty"`
	Metadata    map[string]interface{} `json:"metadata,omitempty"`
}

type BoardColumn struct {
	ID    string      `json:"id"`
	Name  string      `json:"name"`
	Items []BoardItem `json:"items"`
}

type Board struct {
	ID          string       `json:"id"`
	Name        string       `json:"name"`
	Source      BoardSource  `json:"source"`
	Columns     []BoardColumn `json:"columns"`
	TotalItems  int          `json:"totalItems"`
	LastUpdated time.Time    `json:"lastUpdated"`
}

type UnifiedBoard struct {
	ID          string       `json:"id"`
	Name        string       `json:"name"`
	Columns     []BoardColumn `json:"columns"`
	TotalItems  int          `json:"totalItems"`
	Sources     []BoardSource `json:"sources"`
	LastUpdated time.Time    `json:"lastUpdated"`
}

