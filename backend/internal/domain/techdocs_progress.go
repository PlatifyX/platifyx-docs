package domain

import "time"

const (
	TechDocsProgressStatusQueued   = "queued"
	TechDocsProgressStatusRunning  = "running"
	TechDocsProgressStatusFailed   = "failed"
	TechDocsProgressStatusComplete = "completed"
)

type TechDocsProgress struct {
	ID            string     `json:"id"`
	Status        string     `json:"status"`
	Percent       int        `json:"percent"`
	Chunk         int        `json:"chunk"`
	TotalChunks   int        `json:"totalChunks"`
	Message       string     `json:"message"`
	Provider      AIProvider `json:"provider"`
	Model         string     `json:"model"`
	DocType       string     `json:"docType"`
	Source        string     `json:"source"`
	SavePath      string     `json:"savePath,omitempty"`
	RepoURL       string     `json:"repoUrl,omitempty"`
	ResultContent string     `json:"resultContent,omitempty"`
	ErrorMessage  string     `json:"errorMessage,omitempty"`
	StartedAt     time.Time  `json:"startedAt"`
	UpdatedAt     time.Time  `json:"updatedAt"`
}

