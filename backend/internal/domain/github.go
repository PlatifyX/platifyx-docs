package domain

import "time"

type GitHubConfig struct {
	Token        string `json:"token"`
	Organization string `json:"organization,omitempty"`
}

type GitHubRepository struct {
	ID              int64     `json:"id"`
	Name            string    `json:"name"`
	FullName        string    `json:"fullName"`
	Description     string    `json:"description,omitempty"`
	Private         bool      `json:"private"`
	Fork            bool      `json:"fork"`
	HTMLURL         string    `json:"htmlUrl"`
	CloneURL        string    `json:"cloneUrl"`
	SSHURL          string    `json:"sshUrl"`
	Language        string    `json:"language,omitempty"`
	StargazersCount int       `json:"stargazersCount"`
	WatchersCount   int       `json:"watchersCount"`
	ForksCount      int       `json:"forksCount"`
	OpenIssuesCount int       `json:"openIssuesCount"`
	DefaultBranch   string    `json:"defaultBranch"`
	Visibility      string    `json:"visibility"`
	Owner           GitHubUser `json:"owner"`
	CreatedAt       time.Time `json:"createdAt"`
	UpdatedAt       time.Time `json:"updatedAt"`
	PushedAt        time.Time `json:"pushedAt,omitempty"`
}

type GitHubUser struct {
	ID        int64  `json:"id"`
	Login     string `json:"login"`
	AvatarURL string `json:"avatarUrl"`
	HTMLURL   string `json:"htmlUrl"`
	Type      string `json:"type"`
	SiteAdmin bool   `json:"siteAdmin"`
}

type GitHubCommit struct {
	SHA       string           `json:"sha"`
	Message   string           `json:"message"`
	Author    GitHubCommitUser `json:"author"`
	Committer GitHubCommitUser `json:"committer"`
	HTMLURL   string           `json:"htmlUrl"`
	Stats     GitHubCommitStats `json:"stats,omitempty"`
	Files     []GitHubCommitFile `json:"files,omitempty"`
}

type GitHubCommitUser struct {
	Name  string    `json:"name"`
	Email string    `json:"email"`
	Date  time.Time `json:"date"`
}

type GitHubCommitStats struct {
	Additions int `json:"additions"`
	Deletions int `json:"deletions"`
	Total     int `json:"total"`
}

type GitHubCommitFile struct {
	Filename  string `json:"filename"`
	Status    string `json:"status"`
	Additions int    `json:"additions"`
	Deletions int    `json:"deletions"`
	Changes   int    `json:"changes"`
	Patch     string `json:"patch,omitempty"`
}

type GitHubPullRequest struct {
	ID        int64      `json:"id"`
	Number    int        `json:"number"`
	State     string     `json:"state"`
	Title     string     `json:"title"`
	Body      string     `json:"body,omitempty"`
	User      GitHubUser `json:"user"`
	HTMLURL   string     `json:"htmlUrl"`
	CreatedAt time.Time  `json:"createdAt"`
	UpdatedAt time.Time  `json:"updatedAt"`
	ClosedAt  *time.Time `json:"closedAt,omitempty"`
	MergedAt  *time.Time `json:"mergedAt,omitempty"`
	Head      GitHubPRBranch `json:"head"`
	Base      GitHubPRBranch `json:"base"`
	Draft     bool       `json:"draft"`
	Merged    bool       `json:"merged"`
	Mergeable *bool      `json:"mergeable,omitempty"`
	Comments  int        `json:"comments"`
	Commits   int        `json:"commits"`
	Additions int        `json:"additions"`
	Deletions int        `json:"deletions"`
	ChangedFiles int     `json:"changedFiles"`
}

type GitHubPRBranch struct {
	Ref  string           `json:"ref"`
	SHA  string           `json:"sha"`
	Repo GitHubRepository `json:"repo"`
}

type GitHubIssue struct {
	ID        int64         `json:"id"`
	Number    int           `json:"number"`
	State     string        `json:"state"`
	Title     string        `json:"title"`
	Body      string        `json:"body,omitempty"`
	User      GitHubUser    `json:"user"`
	Labels    []GitHubLabel `json:"labels,omitempty"`
	Assignees []GitHubUser  `json:"assignees,omitempty"`
	HTMLURL   string        `json:"htmlUrl"`
	Comments  int           `json:"comments"`
	CreatedAt time.Time     `json:"createdAt"`
	UpdatedAt time.Time     `json:"updatedAt"`
	ClosedAt  *time.Time    `json:"closedAt,omitempty"`
}

type GitHubLabel struct {
	ID          int64  `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description,omitempty"`
	Color       string `json:"color"`
}

type GitHubBranch struct {
	Name      string       `json:"name"`
	Commit    GitHubCommit `json:"commit"`
	Protected bool         `json:"protected"`
}

type GitHubWorkflow struct {
	ID        int64     `json:"id"`
	Name      string    `json:"name"`
	Path      string    `json:"path"`
	State     string    `json:"state"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
	HTMLURL   string    `json:"htmlUrl"`
	BadgeURL  string    `json:"badgeUrl"`
}

type GitHubWorkflowRun struct {
	ID             int64      `json:"id"`
	Name           string     `json:"name"`
	HeadBranch     string     `json:"headBranch"`
	HeadSHA        string     `json:"headSha"`
	RunNumber      int        `json:"runNumber"`
	Event          string     `json:"event"`
	Status         string     `json:"status"`
	Conclusion     string     `json:"conclusion,omitempty"`
	WorkflowID     int64      `json:"workflowId"`
	HTMLURL        string     `json:"htmlUrl"`
	CreatedAt      time.Time  `json:"createdAt"`
	UpdatedAt      time.Time  `json:"updatedAt"`
	RunStartedAt   *time.Time `json:"runStartedAt,omitempty"`
}

type GitHubRelease struct {
	ID          int64     `json:"id"`
	TagName     string    `json:"tagName"`
	Name        string    `json:"name"`
	Body        string    `json:"body,omitempty"`
	Draft       bool      `json:"draft"`
	Prerelease  bool      `json:"prerelease"`
	CreatedAt   time.Time `json:"createdAt"`
	PublishedAt time.Time `json:"publishedAt"`
	Author      GitHubUser `json:"author"`
	HTMLURL     string    `json:"htmlUrl"`
	TarballURL  string    `json:"tarballUrl"`
	ZipballURL  string    `json:"zipballUrl"`
}

type GitHubOrganization struct {
	ID          int64  `json:"id"`
	Login       string `json:"login"`
	Name        string `json:"name,omitempty"`
	Description string `json:"description,omitempty"`
	AvatarURL   string `json:"avatarUrl"`
	HTMLURL     string `json:"htmlUrl"`
	Type        string `json:"type"`
	PublicRepos int    `json:"publicRepos"`
	Followers   int    `json:"followers,omitempty"`
}

type GitHubTeam struct {
	ID           int64  `json:"id"`
	Name         string `json:"name"`
	Slug         string `json:"slug"`
	Description  string `json:"description,omitempty"`
	Privacy      string `json:"privacy"`
	Permission   string `json:"permission"`
	MembersCount int    `json:"membersCount,omitempty"`
	ReposCount   int    `json:"reposCount,omitempty"`
	HTMLURL      string `json:"htmlUrl"`
}
