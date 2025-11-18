package argocd

import (
	"bytes"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/PlatifyX/platifyx-core/internal/domain"
)

type Client struct {
	serverURL  string
	authToken  string
	httpClient *http.Client
}

func NewClient(serverURL, authToken string, insecure bool) *Client {
	transport := &http.Transport{
		TLSClientConfig: &tls.Config{
			InsecureSkipVerify: insecure,
		},
	}

	return &Client{
		serverURL: serverURL,
		authToken: authToken,
		httpClient: &http.Client{
			Timeout:   30 * time.Second,
			Transport: transport,
		},
	}
}

func (c *Client) doRequest(method, path string, body interface{}) ([]byte, error) {
	url := fmt.Sprintf("%s/api/v1/%s", c.serverURL, path)

	var reqBody io.Reader
	if body != nil {
		jsonData, err := json.Marshal(body)
		if err != nil {
			return nil, fmt.Errorf("error marshaling request body: %w", err)
		}
		reqBody = bytes.NewBuffer(jsonData)
	}

	req, err := http.NewRequest(method, url, reqBody)
	if err != nil {
		return nil, fmt.Errorf("error creating request: %w", err)
	}

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.authToken))
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("error making request: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("error reading response body: %w", err)
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("API request failed with status %d: %s", resp.StatusCode, string(respBody))
	}

	return respBody, nil
}

// TestConnection verifies the connection to ArgoCD
func (c *Client) TestConnection() error {
	_, err := c.doRequest("GET", "applications?fields=metadata.name", nil)
	if err != nil {
		return fmt.Errorf("connection test failed: %w", err)
	}
	return nil
}

// GetApplications lists all applications
func (c *Client) GetApplications() ([]domain.ArgoCDApplication, error) {
	respBody, err := c.doRequest("GET", "applications", nil)
	if err != nil {
		return nil, err
	}

	var appList domain.ArgoCDApplicationList
	if err := json.Unmarshal(respBody, &appList); err != nil {
		return nil, fmt.Errorf("error unmarshaling applications: %w", err)
	}

	return appList.Items, nil
}

// GetApplication gets a specific application
func (c *Client) GetApplication(name string) (*domain.ArgoCDApplication, error) {
	respBody, err := c.doRequest("GET", fmt.Sprintf("applications/%s", name), nil)
	if err != nil {
		return nil, err
	}

	var app domain.ArgoCDApplication
	if err := json.Unmarshal(respBody, &app); err != nil {
		return nil, fmt.Errorf("error unmarshaling application: %w", err)
	}

	return &app, nil
}

// SyncApplication triggers a sync operation for an application
func (c *Client) SyncApplication(name string, revision string, prune bool) error {
	syncReq := map[string]interface{}{
		"revision": revision,
		"prune":    prune,
	}

	_, err := c.doRequest("POST", fmt.Sprintf("applications/%s/sync", name), syncReq)
	if err != nil {
		return fmt.Errorf("error syncing application: %w", err)
	}

	return nil
}

// GetProjects lists all projects
func (c *Client) GetProjects() ([]domain.ArgoCDProject, error) {
	respBody, err := c.doRequest("GET", "projects", nil)
	if err != nil {
		return nil, err
	}

	var projectList domain.ArgoCDProjectList
	if err := json.Unmarshal(respBody, &projectList); err != nil {
		return nil, fmt.Errorf("error unmarshaling projects: %w", err)
	}

	return projectList.Items, nil
}

// GetProject gets a specific project
func (c *Client) GetProject(name string) (*domain.ArgoCDProject, error) {
	respBody, err := c.doRequest("GET", fmt.Sprintf("projects/%s", name), nil)
	if err != nil {
		return nil, err
	}

	var project domain.ArgoCDProject
	if err := json.Unmarshal(respBody, &project); err != nil {
		return nil, fmt.Errorf("error unmarshaling project: %w", err)
	}

	return &project, nil
}

// GetClusters lists all clusters
func (c *Client) GetClusters() ([]domain.ArgoCDCluster, error) {
	respBody, err := c.doRequest("GET", "clusters", nil)
	if err != nil {
		return nil, err
	}

	var clusterList domain.ArgoCDClusterList
	if err := json.Unmarshal(respBody, &clusterList); err != nil {
		return nil, fmt.Errorf("error unmarshaling clusters: %w", err)
	}

	return clusterList.Items, nil
}

// RefreshApplication refreshes an application
func (c *Client) RefreshApplication(name string) error {
	refreshReq := map[string]interface{}{
		"refresh": "normal",
	}

	_, err := c.doRequest("POST", fmt.Sprintf("applications/%s/refresh", name), refreshReq)
	if err != nil {
		return fmt.Errorf("error refreshing application: %w", err)
	}

	return nil
}

// DeleteApplication deletes an application
func (c *Client) DeleteApplication(name string, cascade bool) error {
	path := fmt.Sprintf("applications/%s?cascade=%t", name, cascade)
	_, err := c.doRequest("DELETE", path, nil)
	if err != nil {
		return fmt.Errorf("error deleting application: %w", err)
	}

	return nil
}

// RollbackApplication rolls back an application to a previous revision
func (c *Client) RollbackApplication(name string, revision string) error {
	rollbackReq := map[string]interface{}{
		"revision": revision,
	}

	_, err := c.doRequest("POST", fmt.Sprintf("applications/%s/rollback", name), rollbackReq)
	if err != nil {
		return fmt.Errorf("error rolling back application: %w", err)
	}

	return nil
}
