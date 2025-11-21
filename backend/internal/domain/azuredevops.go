package domain

import "time"

type AzureDevOpsConfig struct {
	Organization string
	Project      string
	PAT          string
	URL          string
}

type Pipeline struct {
	ID          int    `json:"id"`
	Name        string `json:"name"`
	Folder      string `json:"folder"`
	Revision    int    `json:"revision"`
	URL         string `json:"url"`
	Project     string `json:"project,omitempty"`
	LastBuildID int    `json:"lastBuildId,omitempty"`
	Integration string `json:"integration,omitempty"`
}

type PipelineRun struct {
	ID            int       `json:"id"`
	PipelineID    int       `json:"pipelineId"`
	PipelineName  string    `json:"pipelineName"`
	State         string    `json:"state"`
	Result        string    `json:"result"`
	CreatedDate   time.Time `json:"createdDate"`
	FinishedDate  time.Time `json:"finishedDate"`
	URL           string    `json:"url"`
	SourceBranch  string    `json:"sourceBranch"`
	SourceVersion string    `json:"sourceVersion"`
	Integration   string    `json:"integration,omitempty"`
}

type Build struct {
	ID            int       `json:"id"`
	BuildNumber   string    `json:"buildNumber"`
	Status        string    `json:"status"`
	Result        string    `json:"result"`
	QueueTime     time.Time `json:"queueTime"`
	StartTime     time.Time `json:"startTime"`
	FinishTime    time.Time `json:"finishTime"`
	SourceBranch  string    `json:"sourceBranch"`
	SourceVersion string    `json:"sourceVersion"`
	RequestedFor  AzureDevOpsUser `json:"requestedFor"`
	URL           string    `json:"url"`
	Project       string    `json:"project,omitempty"`
	Integration   string    `json:"integration,omitempty"`
	Definition    struct {
		ID   int    `json:"id"`
		Name string `json:"name"`
	} `json:"definition"`
}

type AzureDevOpsUser struct {
	ID          string `json:"id"`
	DisplayName string `json:"displayName"`
	UniqueName  string `json:"uniqueName"`
}

type Release struct {
	ID              int       `json:"id"`
	Name            string    `json:"name"`
	Status          string    `json:"status"`
	CreatedOn       time.Time `json:"createdOn"`
	ModifiedOn      time.Time `json:"modifiedOn"`
	CreatedBy       AzureDevOpsUser `json:"createdBy"`
	Description     string    `json:"description"`
	URL             string    `json:"url"`
	Project         string    `json:"project,omitempty"`
	Integration     string    `json:"integration,omitempty"`
	ReleaseDefinition struct {
		ID   int    `json:"id"`
		Name string `json:"name"`
	} `json:"releaseDefinition"`
	Environments []ReleaseEnvironment `json:"environments"`
}

type ReleaseEnvironment struct {
	ID               int                   `json:"id"`
	Name             string                `json:"name"`
	Status           string                `json:"status"`
	DeploymentStatus string                `json:"deploymentStatus"`
	CreatedOn        time.Time             `json:"createdOn"`
	ModifiedOn       time.Time             `json:"modifiedOn"`
	PreDeployApprovals []ReleaseApproval   `json:"preDeployApprovals,omitempty"`
	PostDeployApprovals []ReleaseApproval  `json:"postDeployApprovals,omitempty"`
}

type ReleaseApproval struct {
	ID           int       `json:"id"`
	Approver     User      `json:"approver"`
	ApprovedBy   User      `json:"approvedBy,omitempty"`
	Status       string    `json:"status"`
	Comments     string    `json:"comments"`
	CreatedOn    time.Time `json:"createdOn"`
	ModifiedOn   time.Time `json:"modifiedOn"`
	IsAutomated  bool      `json:"isAutomated"`
}
