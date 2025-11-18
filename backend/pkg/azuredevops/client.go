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
	httpClient   *http.Client
}

func NewClient(config domain.AzureDevOpsConfig) *Client {
	return &Client{
		organization: config.Organization,
		project:      config.Project,
		pat:          config.PAT,
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

func (c *Client) ListPipelines() ([]domain.Pipeline, error) {
	url := fmt.Sprintf("https://dev.azure.com/%s/%s/_apis/pipelines?api-version=%s",
		c.organization, c.project, apiVersion)

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

	return response.Value, nil
}

func (c *Client) ListPipelineRuns(pipelineID int) ([]domain.PipelineRun, error) {
	url := fmt.Sprintf("https://dev.azure.com/%s/%s/_apis/pipelines/%d/runs?api-version=%s",
		c.organization, c.project, pipelineID, apiVersion)

	body, err := c.doRequest("GET", url)
	if err != nil {
		return nil, err
	}

	var response struct {
		Value []domain.PipelineRun `json:"value"`
	}

	if err := json.Unmarshal(body, &response); err != nil {
		return nil, err
	}

	return response.Value, nil
}

func (c *Client) ListBuilds(top int) ([]domain.Build, error) {
	url := fmt.Sprintf("https://dev.azure.com/%s/%s/_apis/build/builds?api-version=%s&$top=%d",
		c.organization, c.project, apiVersion, top)

	body, err := c.doRequest("GET", url)
	if err != nil {
		return nil, err
	}

	var response struct {
		Value []domain.Build `json:"value"`
	}

	if err := json.Unmarshal(body, &response); err != nil {
		return nil, err
	}

	return response.Value, nil
}

func (c *Client) GetBuild(buildID int) (*domain.Build, error) {
	url := fmt.Sprintf("https://dev.azure.com/%s/%s/_apis/build/builds/%d?api-version=%s",
		c.organization, c.project, buildID, apiVersion)

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
	url := fmt.Sprintf("https://vsrm.dev.azure.com/%s/%s/_apis/release/releases?api-version=%s&$top=%d",
		c.organization, c.project, apiVersion, top)

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

func (c *Client) GetRelease(releaseID int) (*domain.Release, error) {
	url := fmt.Sprintf("https://vsrm.dev.azure.com/%s/%s/_apis/release/releases/%d?api-version=%s",
		c.organization, c.project, releaseID, apiVersion)

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
