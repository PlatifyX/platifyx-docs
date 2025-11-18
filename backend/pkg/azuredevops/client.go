package azuredevops

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/PlatifyX/platifyx-core/internal/domain"
)

const (
	apiVersion = "7.0"
)

type Client struct {
	organization string
	project      string
	pat          string
	baseURL      string
	httpClient   *http.Client
}

func NewClient(config domain.AzureDevOpsConfig) *Client {
	baseURL := config.URL
	if baseURL == "" {
		baseURL = "https://dev.azure.com"
	}
	return &Client{
		organization: config.Organization,
		project:      config.Project,
		pat:          config.PAT,
		baseURL:      baseURL,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

func (c *Client) doRequest(method, url string) ([]byte, error) {
	req, err := http.NewRequest(method, url, nil)
	if err != nil {
		return nil, err
	}

	auth := base64.StdEncoding.EncodeToString([]byte(":" + c.pat))
	req.Header.Set("Authorization", "Basic "+auth)
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("Azure DevOps API returned status %d", resp.StatusCode)
	}

	return io.ReadAll(resp.Body)
}

type Project struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

func (c *Client) ListProjects() ([]Project, error) {
	url := fmt.Sprintf("%s/%s/_apis/projects?api-version=%s",
		c.baseURL, c.organization, apiVersion)

	body, err := c.doRequest("GET", url)
	if err != nil {
		return nil, err
	}

	var response struct {
		Value []Project `json:"value"`
	}

	if err := json.Unmarshal(body, &response); err != nil {
		return nil, err
	}

	return response.Value, nil
}

func (c *Client) ListPipelines() ([]domain.Pipeline, error) {
	return c.ListPipelinesForProject(c.project)
}

func (c *Client) ListPipelinesForProject(project string) ([]domain.Pipeline, error) {
	url := fmt.Sprintf("%s/%s/%s/_apis/pipelines?api-version=%s",
		c.baseURL, c.organization, project, apiVersion)

	body, err := c.doRequest("GET", url)
	if err != nil {
		return nil, err
	}

	var response struct {
		Value []domain.Pipeline `json:"value"`
	}

	if err := json.Unmarshal(body, &response); err != nil {
		return nil, err
	}

	// Add project name to each pipeline
	for i := range response.Value {
		response.Value[i].Project = project
	}

	return response.Value, nil
}

func (c *Client) ListAllPipelines() ([]domain.Pipeline, error) {
	projects, err := c.ListProjects()
	if err != nil {
		return nil, err
	}

	var allPipelines []domain.Pipeline
	for _, project := range projects {
		pipelines, err := c.ListPipelinesForProject(project.Name)
		if err != nil {
			// Log error but continue with other projects
			continue
		}
		allPipelines = append(allPipelines, pipelines...)
	}

	return allPipelines, nil
}

func (c *Client) ListPipelineRuns(pipelineID int) ([]domain.PipelineRun, error) {
	// Need to find which project contains this pipeline
	// Try all projects until we find it
	projects, err := c.ListProjects()
	if err != nil {
		return nil, err
	}

	for _, project := range projects {
		runs, err := c.ListPipelineRunsForProject(project.Name, pipelineID)
		if err == nil {
			// Pipeline found in this project (200 response)
			// Return runs even if empty - empty array means pipeline exists but has no runs
			fmt.Printf("Found pipeline %d in project %s with %d runs\n", pipelineID, project.Name, len(runs))
			return runs, nil
		}
		// If error (likely 404), continue to next project
		fmt.Printf("Pipeline %d not found in project %s: %v\n", pipelineID, project.Name, err)
	}

	return nil, fmt.Errorf("pipeline %d not found in any project", pipelineID)
}

func (c *Client) ListPipelineRunsForProject(project string, pipelineID int) ([]domain.PipelineRun, error) {
	url := fmt.Sprintf("%s/%s/%s/_apis/pipelines/%d/runs?api-version=%s",
		c.baseURL, c.organization, project, pipelineID, apiVersion)

	fmt.Printf("Fetching pipeline runs from: %s\n", url)
	body, err := c.doRequest("GET", url)
	if err != nil {
		return nil, err
	}

	var response struct {
		Value []domain.PipelineRun `json:"value"`
		Count int                  `json:"count"`
	}

	if err := json.Unmarshal(body, &response); err != nil {
		fmt.Printf("Failed to unmarshal pipeline runs response: %v\n", err)
		fmt.Printf("Response body: %s\n", string(body))
		return nil, err
	}

	fmt.Printf("Pipeline runs response: count=%d, len(value)=%d\n", response.Count, len(response.Value))
	return response.Value, nil
}

func (c *Client) ListBuilds(top int) ([]domain.Build, error) {
	return c.ListBuildsForProject(c.project, top)
}

func (c *Client) ListBuildsForProject(project string, top int) ([]domain.Build, error) {
	url := fmt.Sprintf("%s/%s/%s/_apis/build/builds?api-version=%s&$top=%d",
		c.baseURL, c.organization, project, apiVersion, top)

	body, err := c.doRequest("GET", url)
	if err != nil {
		return nil, err
	}

	// Azure DevOps returns project as an object, not a string
	var response struct {
		Value []struct {
			domain.Build
			ProjectObj struct {
				ID   string `json:"id"`
				Name string `json:"name"`
			} `json:"project"`
		} `json:"value"`
	}

	if err := json.Unmarshal(body, &response); err != nil {
		return nil, err
	}

	// Extract builds and set project name
	builds := make([]domain.Build, len(response.Value))
	for i, item := range response.Value {
		builds[i] = item.Build
		builds[i].Project = item.ProjectObj.Name
	}

	return builds, nil
}

func (c *Client) ListAllBuilds(topPerProject int) ([]domain.Build, error) {
	projects, err := c.ListProjects()
	if err != nil {
		return nil, err
	}

	var allBuilds []domain.Build
	for _, project := range projects {
		builds, err := c.ListBuildsForProject(project.Name, topPerProject)
		if err != nil {
			// Log error but continue with other projects
			fmt.Printf("Error fetching builds for project %s: %v\n", project.Name, err)
			continue
		}
		allBuilds = append(allBuilds, builds...)
	}

	return allBuilds, nil
}

func (c *Client) GetBuild(buildID int) (*domain.Build, error) {
	url := fmt.Sprintf("%s/%s/%s/_apis/build/builds/%d?api-version=%s",
		c.baseURL, c.organization, c.project, buildID, apiVersion)

	body, err := c.doRequest("GET", url)
	if err != nil {
		return nil, err
	}

	var build domain.Build
	if err := json.Unmarshal(body, &build); err != nil {
		return nil, err
	}

	return &build, nil
}

func (c *Client) ListReleases(top int) ([]domain.Release, error) {
	return c.ListReleasesForProject(c.project, top)
}

func (c *Client) ListReleasesForProject(project string, top int) ([]domain.Release, error) {
	// Releases use vsrm subdomain
	releaseURL := c.baseURL
	if c.baseURL == "https://dev.azure.com" {
		releaseURL = "https://vsrm.dev.azure.com"
	}
	url := fmt.Sprintf("%s/%s/%s/_apis/release/releases?api-version=%s&$top=%d",
		releaseURL, c.organization, project, apiVersion, top)

	body, err := c.doRequest("GET", url)
	if err != nil {
		return nil, err
	}

	var response struct {
		Value []domain.Release `json:"value"`
	}

	if err := json.Unmarshal(body, &response); err != nil {
		return nil, err
	}

	return response.Value, nil
}

func (c *Client) ListAllReleases(topPerProject int) ([]domain.Release, error) {
	projects, err := c.ListProjects()
	if err != nil {
		return nil, err
	}

	var allReleases []domain.Release
	for _, project := range projects {
		releases, err := c.ListReleasesForProject(project.Name, topPerProject)
		if err != nil {
			// Log error but continue with other projects
			fmt.Printf("Error fetching releases for project %s: %v\n", project.Name, err)
			continue
		}
		// Tag each release with its project name
		for i := range releases {
			releases[i].Project = project.Name
		}
		allReleases = append(allReleases, releases...)
	}

	return allReleases, nil
}

func (c *Client) GetRelease(releaseID int) (*domain.Release, error) {
	// Releases use vsrm subdomain
	releaseURL := c.baseURL
	if c.baseURL == "https://dev.azure.com" {
		releaseURL = "https://vsrm.dev.azure.com"
	}
	url := fmt.Sprintf("%s/%s/%s/_apis/release/releases/%d?api-version=%s",
		releaseURL, c.organization, c.project, releaseID, apiVersion)

	body, err := c.doRequest("GET", url)
	if err != nil {
		return nil, err
	}

	var release domain.Release
	if err := json.Unmarshal(body, &release); err != nil {
		return nil, err
	}

	return &release, nil
}
