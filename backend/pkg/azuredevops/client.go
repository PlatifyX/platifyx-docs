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

	// Add project name and last build ID to each pipeline
	for i := range response.Value {
		response.Value[i].Project = project

		// Try to get last build ID (don't fail if not found)
		lastBuildID := c.getLastBuildID(project, response.Value[i].ID)
		if lastBuildID > 0 {
			response.Value[i].LastBuildID = lastBuildID
		}
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

// getLastBuildID fetches the most recent build ID for a pipeline/definition
func (c *Client) getLastBuildID(project string, definitionID int) int {
	url := fmt.Sprintf("%s/%s/%s/_apis/build/builds?definitions=%d&api-version=%s&$top=1",
		c.baseURL, c.organization, project, definitionID, apiVersion)

	body, err := c.doRequest("GET", url)
	if err != nil {
		return 0
	}

	var response struct {
		Value []struct {
			ID int `json:"id"`
		} `json:"value"`
	}

	if err := json.Unmarshal(body, &response); err != nil {
		return 0
	}

	if len(response.Value) > 0 {
		return response.Value[0].ID
	}

	return 0
}

func (c *Client) ListPipelineRuns(pipelineID int) ([]domain.PipelineRun, error) {
	// Need to find which project contains this pipeline
	// Try all projects until we find it
	projects, err := c.ListProjects()
	if err != nil {
		return nil, err
	}

	for _, project := range projects {
		// First try YAML pipeline runs endpoint
		runs, err := c.ListPipelineRunsForProject(project.Name, pipelineID)
		if err == nil && len(runs) > 0 {
			// Pipeline found in this project with runs
			fmt.Printf("Found pipeline %d in project %s with %d runs (YAML)\n", pipelineID, project.Name, len(runs))
			return runs, nil
		}

		// If no runs found, try classic build definitions endpoint
		// This converts builds to pipeline runs format
		runsFromBuilds, err := c.ListBuildsByDefinition(project.Name, pipelineID)
		if err == nil && len(runsFromBuilds) > 0 {
			fmt.Printf("Found pipeline %d in project %s with %d runs (Classic)\n", pipelineID, project.Name, len(runsFromBuilds))
			return runsFromBuilds, nil
		}

		// Try next project
		fmt.Printf("Pipeline %d not found in project %s\n", pipelineID, project.Name)
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

// ListBuildsByDefinition fetches builds for a specific pipeline/definition ID
// and converts them to PipelineRun format for compatibility
func (c *Client) ListBuildsByDefinition(project string, definitionID int) ([]domain.PipelineRun, error) {
	url := fmt.Sprintf("%s/%s/%s/_apis/build/builds?definitions=%d&api-version=%s&$top=50",
		c.baseURL, c.organization, project, definitionID, apiVersion)

	fmt.Printf("Fetching builds by definition from: %s\n", url)
	body, err := c.doRequest("GET", url)
	if err != nil {
		return nil, err
	}

	// Use same intermediate struct as ListBuildsForProject for project field
	var response struct {
		Value []struct {
			domain.Build
			ProjectObj struct {
				ID   string `json:"id"`
				Name string `json:"name"`
			} `json:"project"`
		} `json:"value"`
		Count int `json:"count"`
	}

	if err := json.Unmarshal(body, &response); err != nil {
		fmt.Printf("Failed to unmarshal builds response: %v\n", err)
		return nil, err
	}

	fmt.Printf("Builds by definition response: count=%d, len(value)=%d\n", response.Count, len(response.Value))

	// Convert builds to pipeline runs format
	runs := make([]domain.PipelineRun, len(response.Value))
	for i, item := range response.Value {
		build := item.Build
		runs[i] = domain.PipelineRun{
			ID:           build.ID,
			PipelineID:   definitionID,
			PipelineName: build.Definition.Name,
			State:        build.Status,
			Result:       build.Result,
			CreatedDate:  build.QueueTime,
			FinishedDate: build.FinishTime,
			URL:          build.URL,
			SourceBranch: build.SourceBranch,
			SourceVersion: build.SourceVersion,
		}
	}

	return runs, nil
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
