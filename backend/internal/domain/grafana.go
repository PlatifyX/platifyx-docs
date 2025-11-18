package domain

import "time"

type GrafanaConfig struct {
	URL    string `json:"url"`
	APIKey string `json:"apiKey"`
}

type GrafanaDashboard struct {
	ID          int                    `json:"id"`
	UID         string                 `json:"uid"`
	Title       string                 `json:"title"`
	Tags        []string               `json:"tags"`
	URL         string                 `json:"url"`
	FolderID    int                    `json:"folderId"`
	FolderTitle string                 `json:"folderTitle"`
	IsStarred   bool                   `json:"isStarred"`
	Version     int                    `json:"version"`
	Meta        map[string]interface{} `json:"meta,omitempty"`
}

type GrafanaAlert struct {
	ID             int       `json:"id"`
	DashboardID    int       `json:"dashboardId"`
	DashboardUID   string    `json:"dashboardUid"`
	DashboardSlug  string    `json:"dashboardSlug"`
	PanelID        int       `json:"panelId"`
	Name           string    `json:"name"`
	State          string    `json:"state"`
	NewStateDate   time.Time `json:"newStateDate"`
	EvalDate       time.Time `json:"evalDate"`
	EvalData       string    `json:"evalData,omitempty"`
	ExecutionError string    `json:"executionError,omitempty"`
	URL            string    `json:"url"`
}

type GrafanaDataSource struct {
	ID            int                    `json:"id"`
	UID           string                 `json:"uid"`
	OrgID         int                    `json:"orgId"`
	Name          string                 `json:"name"`
	Type          string                 `json:"type"`
	TypeLogoURL   string                 `json:"typeLogoUrl,omitempty"`
	Access        string                 `json:"access"`
	URL           string                 `json:"url"`
	Database      string                 `json:"database,omitempty"`
	User          string                 `json:"user,omitempty"`
	BasicAuth     bool                   `json:"basicAuth"`
	IsDefault     bool                   `json:"isDefault"`
	ReadOnly      bool                   `json:"readOnly"`
	JsonData      map[string]interface{} `json:"jsonData,omitempty"`
	SecureJsonFields map[string]bool     `json:"secureJsonFields,omitempty"`
}

type GrafanaOrganization struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

type GrafanaUser struct {
	ID         int       `json:"id"`
	Email      string    `json:"email"`
	Name       string    `json:"name"`
	Login      string    `json:"login"`
	Theme      string    `json:"theme"`
	OrgID      int       `json:"orgId"`
	IsGrafanaAdmin bool  `json:"isGrafanaAdmin"`
	IsDisabled bool      `json:"isDisabled"`
	IsExternal bool      `json:"isExternal,omitempty"`
	AuthLabels []string  `json:"authLabels,omitempty"`
	UpdatedAt  time.Time `json:"updatedAt"`
	CreatedAt  time.Time `json:"createdAt"`
}

type GrafanaFolder struct {
	ID        int       `json:"id"`
	UID       string    `json:"uid"`
	Title     string    `json:"title"`
	URL       string    `json:"url"`
	HasACL    bool      `json:"hasAcl"`
	CanSave   bool      `json:"canSave"`
	CanEdit   bool      `json:"canEdit"`
	CanAdmin  bool      `json:"canAdmin"`
	CreatedBy string    `json:"createdBy"`
	Created   time.Time `json:"created"`
	UpdatedBy string    `json:"updatedBy"`
	Updated   time.Time `json:"updated"`
	Version   int       `json:"version"`
}

type GrafanaAnnotation struct {
	ID          int      `json:"id"`
	AlertID     int      `json:"alertId,omitempty"`
	DashboardID int      `json:"dashboardId,omitempty"`
	PanelID     int      `json:"panelId,omitempty"`
	UserID      int      `json:"userId,omitempty"`
	Text        string   `json:"text"`
	Time        int64    `json:"time"`
	TimeEnd     int64    `json:"timeEnd,omitempty"`
	Tags        []string `json:"tags,omitempty"`
}

type GrafanaHealth struct {
	Database string `json:"database"`
	Version  string `json:"version"`
	Commit   string `json:"commit"`
}
