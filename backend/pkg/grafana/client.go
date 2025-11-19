package grafana

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/PlatifyX/platifyx-core/internal/domain"
)

type Client struct {
	baseURL    string
	apiKey     string
	httpClient *http.Client
}

func NewClient(config domain.GrafanaConfig) *Client {
	return &Client{
		baseURL: strings.TrimSuffix(config.URL, "/"),
		apiKey:  config.APIKey,
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

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.apiKey))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

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

// TestConnection tests the connection to Grafana
func (c *Client) TestConnection() error {
	resp, err := c.doRequest("GET", "/api/health", nil)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	return nil
}

// GetHealth returns Grafana health information
func (c *Client) GetHealth() (*domain.GrafanaHealth, error) {
	resp, err := c.doRequest("GET", "/api/health", nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var health domain.GrafanaHealth
	if err := json.NewDecoder(resp.Body).Decode(&health); err != nil {
		return nil, fmt.Errorf("failed to decode health response: %w", err)
	}

	return &health, nil
}

// SearchDashboards searches for dashboards
func (c *Client) SearchDashboards(query string, tags []string) ([]domain.GrafanaDashboard, error) {
	path := "/api/search?type=dash-db"
	if query != "" {
		path += "&query=" + query
	}
	for _, tag := range tags {
		path += "&tag=" + tag
	}

	resp, err := c.doRequest("GET", path, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var dashboards []domain.GrafanaDashboard
	if err := json.NewDecoder(resp.Body).Decode(&dashboards); err != nil {
		return nil, fmt.Errorf("failed to decode dashboards: %w", err)
	}

	return dashboards, nil
}

// GetDashboardByUID retrieves a dashboard by UID
func (c *Client) GetDashboardByUID(uid string) (*domain.GrafanaDashboard, error) {
	resp, err := c.doRequest("GET", fmt.Sprintf("/api/dashboards/uid/%s", uid), nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result struct {
		Dashboard domain.GrafanaDashboard `json:"dashboard"`
		Meta      map[string]interface{}  `json:"meta"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode dashboard: %w", err)
	}

	result.Dashboard.Meta = result.Meta
	return &result.Dashboard, nil
}

// GetAlerts retrieves all alerts
func (c *Client) GetAlerts() ([]domain.GrafanaAlert, error) {
	resp, err := c.doRequest("GET", "/api/alerts", nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var alerts []domain.GrafanaAlert
	if err := json.NewDecoder(resp.Body).Decode(&alerts); err != nil {
		return nil, fmt.Errorf("failed to decode alerts: %w", err)
	}

	return alerts, nil
}

// GetAlertsByState retrieves alerts by state (alerting, ok, paused, pending, no_data)
func (c *Client) GetAlertsByState(state string) ([]domain.GrafanaAlert, error) {
	path := "/api/alerts"
	if state != "" {
		path += "?state=" + state
	}

	resp, err := c.doRequest("GET", path, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var alerts []domain.GrafanaAlert
	if err := json.NewDecoder(resp.Body).Decode(&alerts); err != nil {
		return nil, fmt.Errorf("failed to decode alerts: %w", err)
	}

	return alerts, nil
}

// GetDataSources retrieves all data sources
func (c *Client) GetDataSources() ([]domain.GrafanaDataSource, error) {
	resp, err := c.doRequest("GET", "/api/datasources", nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var datasources []domain.GrafanaDataSource
	if err := json.NewDecoder(resp.Body).Decode(&datasources); err != nil {
		return nil, fmt.Errorf("failed to decode datasources: %w", err)
	}

	return datasources, nil
}

// GetDataSourceByID retrieves a data source by ID
func (c *Client) GetDataSourceByID(id int) (*domain.GrafanaDataSource, error) {
	resp, err := c.doRequest("GET", fmt.Sprintf("/api/datasources/%d", id), nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var datasource domain.GrafanaDataSource
	if err := json.NewDecoder(resp.Body).Decode(&datasource); err != nil {
		return nil, fmt.Errorf("failed to decode datasource: %w", err)
	}

	return &datasource, nil
}

// GetOrganizations retrieves all organizations (requires admin)
func (c *Client) GetOrganizations() ([]domain.GrafanaOrganization, error) {
	resp, err := c.doRequest("GET", "/api/orgs", nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var orgs []domain.GrafanaOrganization
	if err := json.NewDecoder(resp.Body).Decode(&orgs); err != nil {
		return nil, fmt.Errorf("failed to decode organizations: %w", err)
	}

	return orgs, nil
}

// GetCurrentOrganization retrieves the current organization
func (c *Client) GetCurrentOrganization() (*domain.GrafanaOrganization, error) {
	resp, err := c.doRequest("GET", "/api/org", nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var org domain.GrafanaOrganization
	if err := json.NewDecoder(resp.Body).Decode(&org); err != nil {
		return nil, fmt.Errorf("failed to decode organization: %w", err)
	}

	return &org, nil
}

// GetUsers retrieves all users in the organization
func (c *Client) GetUsers() ([]domain.GrafanaUser, error) {
	resp, err := c.doRequest("GET", "/api/org/users", nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var users []domain.GrafanaUser
	if err := json.NewDecoder(resp.Body).Decode(&users); err != nil {
		return nil, fmt.Errorf("failed to decode users: %w", err)
	}

	return users, nil
}

// GetFolders retrieves all folders
func (c *Client) GetFolders() ([]domain.GrafanaFolder, error) {
	resp, err := c.doRequest("GET", "/api/folders", nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var folders []domain.GrafanaFolder
	if err := json.NewDecoder(resp.Body).Decode(&folders); err != nil {
		return nil, fmt.Errorf("failed to decode folders: %w", err)
	}

	return folders, nil
}

// GetFolderByUID retrieves a folder by UID
func (c *Client) GetFolderByUID(uid string) (*domain.GrafanaFolder, error) {
	resp, err := c.doRequest("GET", fmt.Sprintf("/api/folders/%s", uid), nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var folder domain.GrafanaFolder
	if err := json.NewDecoder(resp.Body).Decode(&folder); err != nil {
		return nil, fmt.Errorf("failed to decode folder: %w", err)
	}

	return &folder, nil
}

// GetAnnotations retrieves annotations with optional filters
func (c *Client) GetAnnotations(dashboardID int, from, to int64, tags []string) ([]domain.GrafanaAnnotation, error) {
	path := "/api/annotations?"

	if dashboardID > 0 {
		path += fmt.Sprintf("dashboardId=%d&", dashboardID)
	}
	if from > 0 {
		path += fmt.Sprintf("from=%d&", from)
	}
	if to > 0 {
		path += fmt.Sprintf("to=%d&", to)
	}
	for _, tag := range tags {
		path += fmt.Sprintf("tags=%s&", tag)
	}

	path = strings.TrimSuffix(path, "&")

	resp, err := c.doRequest("GET", path, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var annotations []domain.GrafanaAnnotation
	if err := json.NewDecoder(resp.Body).Decode(&annotations); err != nil {
		return nil, fmt.Errorf("failed to decode annotations: %w", err)
	}

	return annotations, nil
}
