package github

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/PlatifyX/platifyx-core/internal/domain"
)

type Client struct {
	baseURL      string
	token        string
	organization string
	httpClient   *http.Client
}

func NewClient(config domain.GitHubConfig) *Client {
	return &Client{
		baseURL:      "https://api.github.com",
		token:        config.Token,
		organization: config.Organization,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

func (c *Client) doRequest(method, path string, body io.Reader) (*http.Response, error) {
	url := fmt.Sprintf("%s%s", c.baseURL, path)
	req, err := http.NewRequest(method, url, body)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", fmt.Sprintf("token %s", c.token))
	req.Header.Set("Accept", "application/vnd.github.v3+json")
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to execute request: %w", err)
	}

	if resp.StatusCode >= 400 {
		defer resp.Body.Close()
		bodyBytes, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("API request failed with status %d: %s", resp.StatusCode, string(bodyBytes))
	}

	return resp, nil
}

// TestConnection tests the connection to GitHub
func (c *Client) TestConnection() error {
	resp, err := c.doRequest("GET", "/user", nil)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	return nil
}

// GetAuthenticatedUser returns the authenticated user
func (c *Client) GetAuthenticatedUser() (*domain.GitHubUser, error) {
	resp, err := c.doRequest("GET", "/user", nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var rawUser struct {
		ID        int64  `json:"id"`
		Login     string `json:"login"`
		AvatarURL string `json:"avatar_url"`
		HTMLURL   string `json:"html_url"`
		Type      string `json:"type"`
		SiteAdmin bool   `json:"site_admin"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&rawUser); err != nil {
		return nil, fmt.Errorf("failed to decode user: %w", err)
	}

	return &domain.GitHubUser{
		ID:        rawUser.ID,
		Login:     rawUser.Login,
		AvatarURL: rawUser.AvatarURL,
		HTMLURL:   rawUser.HTMLURL,
		Type:      rawUser.Type,
		SiteAdmin: rawUser.SiteAdmin,
	}, nil
}

// ListRepositories lists repositories for the authenticated user or organization
func (c *Client) ListRepositories() ([]domain.GitHubRepository, error) {
	var path string
	if c.organization != "" {
		path = fmt.Sprintf("/orgs/%s/repos?per_page=100", c.organization)
	} else {
		path = "/user/repos?per_page=100"
	}

	resp, err := c.doRequest("GET", path, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var rawRepos []struct {
		ID              int64  `json:"id"`
		Name            string `json:"name"`
		FullName        string `json:"full_name"`
		Description     string `json:"description"`
		Private         bool   `json:"private"`
		Fork            bool   `json:"fork"`
		HTMLURL         string `json:"html_url"`
		CloneURL        string `json:"clone_url"`
		SSHURL          string `json:"ssh_url"`
		Language        string `json:"language"`
		StargazersCount int    `json:"stargazers_count"`
		WatchersCount   int    `json:"watchers_count"`
		ForksCount      int    `json:"forks_count"`
		OpenIssuesCount int    `json:"open_issues_count"`
		DefaultBranch   string `json:"default_branch"`
		Visibility      string `json:"visibility"`
		Owner           struct {
			ID        int64  `json:"id"`
			Login     string `json:"login"`
			AvatarURL string `json:"avatar_url"`
			HTMLURL   string `json:"html_url"`
			Type      string `json:"type"`
			SiteAdmin bool   `json:"site_admin"`
		} `json:"owner"`
		CreatedAt time.Time `json:"created_at"`
		UpdatedAt time.Time `json:"updated_at"`
		PushedAt  time.Time `json:"pushed_at"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&rawRepos); err != nil {
		return nil, fmt.Errorf("failed to decode repositories: %w", err)
	}

	repos := make([]domain.GitHubRepository, 0, len(rawRepos))
	for _, raw := range rawRepos {
		repos = append(repos, domain.GitHubRepository{
			ID:              raw.ID,
			Name:            raw.Name,
			FullName:        raw.FullName,
			Description:     raw.Description,
			Private:         raw.Private,
			Fork:            raw.Fork,
			HTMLURL:         raw.HTMLURL,
			CloneURL:        raw.CloneURL,
			SSHURL:          raw.SSHURL,
			Language:        raw.Language,
			StargazersCount: raw.StargazersCount,
			WatchersCount:   raw.WatchersCount,
			ForksCount:      raw.ForksCount,
			OpenIssuesCount: raw.OpenIssuesCount,
			DefaultBranch:   raw.DefaultBranch,
			Visibility:      raw.Visibility,
			Owner: domain.GitHubUser{
				ID:        raw.Owner.ID,
				Login:     raw.Owner.Login,
				AvatarURL: raw.Owner.AvatarURL,
				HTMLURL:   raw.Owner.HTMLURL,
				Type:      raw.Owner.Type,
				SiteAdmin: raw.Owner.SiteAdmin,
			},
			CreatedAt: raw.CreatedAt,
			UpdatedAt: raw.UpdatedAt,
			PushedAt:  raw.PushedAt,
		})
	}

	return repos, nil
}

// GetRepository gets a specific repository
func (c *Client) GetRepository(owner, repo string) (*domain.GitHubRepository, error) {
	path := fmt.Sprintf("/repos/%s/%s", owner, repo)

	resp, err := c.doRequest("GET", path, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var raw struct {
		ID              int64  `json:"id"`
		Name            string `json:"name"`
		FullName        string `json:"full_name"`
		Description     string `json:"description"`
		Private         bool   `json:"private"`
		Fork            bool   `json:"fork"`
		HTMLURL         string `json:"html_url"`
		CloneURL        string `json:"clone_url"`
		SSHURL          string `json:"ssh_url"`
		Language        string `json:"language"`
		StargazersCount int    `json:"stargazers_count"`
		WatchersCount   int    `json:"watchers_count"`
		ForksCount      int    `json:"forks_count"`
		OpenIssuesCount int    `json:"open_issues_count"`
		DefaultBranch   string `json:"default_branch"`
		Visibility      string `json:"visibility"`
		Owner           struct {
			ID        int64  `json:"id"`
			Login     string `json:"login"`
			AvatarURL string `json:"avatar_url"`
			HTMLURL   string `json:"html_url"`
			Type      string `json:"type"`
			SiteAdmin bool   `json:"site_admin"`
		} `json:"owner"`
		CreatedAt time.Time `json:"created_at"`
		UpdatedAt time.Time `json:"updated_at"`
		PushedAt  time.Time `json:"pushed_at"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&raw); err != nil {
		return nil, fmt.Errorf("failed to decode repository: %w", err)
	}

	return &domain.GitHubRepository{
		ID:              raw.ID,
		Name:            raw.Name,
		FullName:        raw.FullName,
		Description:     raw.Description,
		Private:         raw.Private,
		Fork:            raw.Fork,
		HTMLURL:         raw.HTMLURL,
		CloneURL:        raw.CloneURL,
		SSHURL:          raw.SSHURL,
		Language:        raw.Language,
		StargazersCount: raw.StargazersCount,
		WatchersCount:   raw.WatchersCount,
		ForksCount:      raw.ForksCount,
		OpenIssuesCount: raw.OpenIssuesCount,
		DefaultBranch:   raw.DefaultBranch,
		Visibility:      raw.Visibility,
		Owner: domain.GitHubUser{
			ID:        raw.Owner.ID,
			Login:     raw.Owner.Login,
			AvatarURL: raw.Owner.AvatarURL,
			HTMLURL:   raw.Owner.HTMLURL,
			Type:      raw.Owner.Type,
			SiteAdmin: raw.Owner.SiteAdmin,
		},
		CreatedAt: raw.CreatedAt,
		UpdatedAt: raw.UpdatedAt,
		PushedAt:  raw.PushedAt,
	}, nil
}

// ListCommits lists commits for a repository
func (c *Client) ListCommits(owner, repo string, branch string) ([]domain.GitHubCommit, error) {
	path := fmt.Sprintf("/repos/%s/%s/commits?per_page=50", owner, repo)
	if branch != "" {
		path += fmt.Sprintf("&sha=%s", branch)
	}

	resp, err := c.doRequest("GET", path, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var rawCommits []struct {
		SHA    string `json:"sha"`
		Commit struct {
			Message string `json:"message"`
			Author  struct {
				Name  string    `json:"name"`
				Email string    `json:"email"`
				Date  time.Time `json:"date"`
			} `json:"author"`
			Committer struct {
				Name  string    `json:"name"`
				Email string    `json:"email"`
				Date  time.Time `json:"date"`
			} `json:"committer"`
		} `json:"commit"`
		HTMLURL string `json:"html_url"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&rawCommits); err != nil {
		return nil, fmt.Errorf("failed to decode commits: %w", err)
	}

	commits := make([]domain.GitHubCommit, 0, len(rawCommits))
	for _, raw := range rawCommits {
		commits = append(commits, domain.GitHubCommit{
			SHA:     raw.SHA,
			Message: raw.Commit.Message,
			Author: domain.GitHubCommitUser{
				Name:  raw.Commit.Author.Name,
				Email: raw.Commit.Author.Email,
				Date:  raw.Commit.Author.Date,
			},
			Committer: domain.GitHubCommitUser{
				Name:  raw.Commit.Committer.Name,
				Email: raw.Commit.Committer.Email,
				Date:  raw.Commit.Committer.Date,
			},
			HTMLURL: raw.HTMLURL,
		})
	}

	return commits, nil
}

// ListPullRequests lists pull requests for a repository
func (c *Client) ListPullRequests(owner, repo, state string) ([]domain.GitHubPullRequest, error) {
	path := fmt.Sprintf("/repos/%s/%s/pulls?state=%s&per_page=50", owner, repo, state)

	resp, err := c.doRequest("GET", path, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var rawPRs []struct {
		ID        int64  `json:"id"`
		Number    int    `json:"number"`
		State     string `json:"state"`
		Title     string `json:"title"`
		Body      string `json:"body"`
		User      struct {
			ID        int64  `json:"id"`
			Login     string `json:"login"`
			AvatarURL string `json:"avatar_url"`
			HTMLURL   string `json:"html_url"`
			Type      string `json:"type"`
			SiteAdmin bool   `json:"site_admin"`
		} `json:"user"`
		HTMLURL      string     `json:"html_url"`
		CreatedAt    time.Time  `json:"created_at"`
		UpdatedAt    time.Time  `json:"updated_at"`
		ClosedAt     *time.Time `json:"closed_at"`
		MergedAt     *time.Time `json:"merged_at"`
		Draft        bool       `json:"draft"`
		Merged       bool       `json:"merged"`
		Mergeable    *bool      `json:"mergeable"`
		Comments     int        `json:"comments"`
		Commits      int        `json:"commits"`
		Additions    int        `json:"additions"`
		Deletions    int        `json:"deletions"`
		ChangedFiles int        `json:"changed_files"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&rawPRs); err != nil {
		return nil, fmt.Errorf("failed to decode pull requests: %w", err)
	}

	prs := make([]domain.GitHubPullRequest, 0, len(rawPRs))
	for _, raw := range rawPRs {
		prs = append(prs, domain.GitHubPullRequest{
			ID:       raw.ID,
			Number:   raw.Number,
			State:    raw.State,
			Title:    raw.Title,
			Body:     raw.Body,
			User: domain.GitHubUser{
				ID:        raw.User.ID,
				Login:     raw.User.Login,
				AvatarURL: raw.User.AvatarURL,
				HTMLURL:   raw.User.HTMLURL,
				Type:      raw.User.Type,
				SiteAdmin: raw.User.SiteAdmin,
			},
			HTMLURL:      raw.HTMLURL,
			CreatedAt:    raw.CreatedAt,
			UpdatedAt:    raw.UpdatedAt,
			ClosedAt:     raw.ClosedAt,
			MergedAt:     raw.MergedAt,
			Draft:        raw.Draft,
			Merged:       raw.Merged,
			Mergeable:    raw.Mergeable,
			Comments:     raw.Comments,
			Commits:      raw.Commits,
			Additions:    raw.Additions,
			Deletions:    raw.Deletions,
			ChangedFiles: raw.ChangedFiles,
		})
	}

	return prs, nil
}

// ListIssues lists issues for a repository
func (c *Client) ListIssues(owner, repo, state string) ([]domain.GitHubIssue, error) {
	path := fmt.Sprintf("/repos/%s/%s/issues?state=%s&per_page=50", owner, repo, state)

	resp, err := c.doRequest("GET", path, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var rawIssues []struct {
		ID     int64  `json:"id"`
		Number int    `json:"number"`
		State  string `json:"state"`
		Title  string `json:"title"`
		Body   string `json:"body"`
		User   struct {
			ID        int64  `json:"id"`
			Login     string `json:"login"`
			AvatarURL string `json:"avatar_url"`
			HTMLURL   string `json:"html_url"`
			Type      string `json:"type"`
			SiteAdmin bool   `json:"site_admin"`
		} `json:"user"`
		Labels []struct {
			ID          int64  `json:"id"`
			Name        string `json:"name"`
			Description string `json:"description"`
			Color       string `json:"color"`
		} `json:"labels"`
		HTMLURL   string     `json:"html_url"`
		Comments  int        `json:"comments"`
		CreatedAt time.Time  `json:"created_at"`
		UpdatedAt time.Time  `json:"updated_at"`
		ClosedAt  *time.Time `json:"closed_at"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&rawIssues); err != nil {
		return nil, fmt.Errorf("failed to decode issues: %w", err)
	}

	issues := make([]domain.GitHubIssue, 0, len(rawIssues))
	for _, raw := range rawIssues {
		labels := make([]domain.GitHubLabel, 0, len(raw.Labels))
		for _, l := range raw.Labels {
			labels = append(labels, domain.GitHubLabel{
				ID:          l.ID,
				Name:        l.Name,
				Description: l.Description,
				Color:       l.Color,
			})
		}

		issues = append(issues, domain.GitHubIssue{
			ID:     raw.ID,
			Number: raw.Number,
			State:  raw.State,
			Title:  raw.Title,
			Body:   raw.Body,
			User: domain.GitHubUser{
				ID:        raw.User.ID,
				Login:     raw.User.Login,
				AvatarURL: raw.User.AvatarURL,
				HTMLURL:   raw.User.HTMLURL,
				Type:      raw.User.Type,
				SiteAdmin: raw.User.SiteAdmin,
			},
			Labels:    labels,
			HTMLURL:   raw.HTMLURL,
			Comments:  raw.Comments,
			CreatedAt: raw.CreatedAt,
			UpdatedAt: raw.UpdatedAt,
			ClosedAt:  raw.ClosedAt,
		})
	}

	return issues, nil
}

// ListBranches lists branches for a repository
func (c *Client) ListBranches(owner, repo string) ([]domain.GitHubBranch, error) {
	path := fmt.Sprintf("/repos/%s/%s/branches?per_page=100", owner, repo)

	resp, err := c.doRequest("GET", path, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var rawBranches []struct {
		Name      string `json:"name"`
		Protected bool   `json:"protected"`
		Commit    struct {
			SHA string `json:"sha"`
		} `json:"commit"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&rawBranches); err != nil {
		return nil, fmt.Errorf("failed to decode branches: %w", err)
	}

	branches := make([]domain.GitHubBranch, 0, len(rawBranches))
	for _, raw := range rawBranches {
		branches = append(branches, domain.GitHubBranch{
			Name:      raw.Name,
			Protected: raw.Protected,
			Commit: domain.GitHubCommit{
				SHA: raw.Commit.SHA,
			},
		})
	}

	return branches, nil
}

// ListWorkflowRuns lists workflow runs for a repository
func (c *Client) ListWorkflowRuns(owner, repo string) ([]domain.GitHubWorkflowRun, error) {
	path := fmt.Sprintf("/repos/%s/%s/actions/runs?per_page=50", owner, repo)

	resp, err := c.doRequest("GET", path, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result struct {
		WorkflowRuns []struct {
			ID           int64      `json:"id"`
			Name         string     `json:"name"`
			HeadBranch   string     `json:"head_branch"`
			HeadSHA      string     `json:"head_sha"`
			RunNumber    int        `json:"run_number"`
			Event        string     `json:"event"`
			Status       string     `json:"status"`
			Conclusion   string     `json:"conclusion"`
			WorkflowID   int64      `json:"workflow_id"`
			HTMLURL      string     `json:"html_url"`
			CreatedAt    time.Time  `json:"created_at"`
			UpdatedAt    time.Time  `json:"updated_at"`
			RunStartedAt *time.Time `json:"run_started_at"`
		} `json:"workflow_runs"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode workflow runs: %w", err)
	}

	runs := make([]domain.GitHubWorkflowRun, 0, len(result.WorkflowRuns))
	for _, raw := range result.WorkflowRuns {
		runs = append(runs, domain.GitHubWorkflowRun{
			ID:           raw.ID,
			Name:         raw.Name,
			HeadBranch:   raw.HeadBranch,
			HeadSHA:      raw.HeadSHA,
			RunNumber:    raw.RunNumber,
			Event:        raw.Event,
			Status:       raw.Status,
			Conclusion:   raw.Conclusion,
			WorkflowID:   raw.WorkflowID,
			HTMLURL:      raw.HTMLURL,
			CreatedAt:    raw.CreatedAt,
			UpdatedAt:    raw.UpdatedAt,
			RunStartedAt: raw.RunStartedAt,
		})
	}

	return runs, nil
}

// GetOrganization gets organization details
func (c *Client) GetOrganization(org string) (*domain.GitHubOrganization, error) {
	path := fmt.Sprintf("/orgs/%s", org)

	resp, err := c.doRequest("GET", path, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var raw struct {
		ID          int64  `json:"id"`
		Login       string `json:"login"`
		Name        string `json:"name"`
		Description string `json:"description"`
		AvatarURL   string `json:"avatar_url"`
		HTMLURL     string `json:"html_url"`
		Type        string `json:"type"`
		PublicRepos int    `json:"public_repos"`
		Followers   int    `json:"followers"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&raw); err != nil {
		return nil, fmt.Errorf("failed to decode organization: %w", err)
	}

	return &domain.GitHubOrganization{
		ID:          raw.ID,
		Login:       raw.Login,
		Name:        raw.Name,
		Description: raw.Description,
		AvatarURL:   raw.AvatarURL,
		HTMLURL:     raw.HTMLURL,
		Type:        raw.Type,
		PublicRepos: raw.PublicRepos,
		Followers:   raw.Followers,
	}, nil
}
