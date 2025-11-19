package prometheus

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"time"

	"github.com/PlatifyX/platifyx-core/internal/domain"
)

type Client struct {
	url        string
	username   string
	password   string
	httpClient *http.Client
}

func NewClient(prometheusURL, username, password string) *Client {
	return &Client{
		url:      prometheusURL,
		username: username,
		password: password,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

func (c *Client) doRequest(method, path string, params url.Values) ([]byte, error) {
	reqURL := fmt.Sprintf("%s%s", c.url, path)

	if params != nil && len(params) > 0 {
		reqURL = fmt.Sprintf("%s?%s", reqURL, params.Encode())
	}

	req, err := http.NewRequest(method, reqURL, nil)
	if err != nil {
		return nil, fmt.Errorf("error creating request: %w", err)
	}

	// Add basic auth if credentials provided
	if c.username != "" && c.password != "" {
		req.SetBasicAuth(c.username, c.password)
	}

	req.Header.Set("Accept", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("error making request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("error reading response body: %w", err)
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("API request failed with status %d: %s", resp.StatusCode, string(body))
	}

	return body, nil
}

// TestConnection verifies the connection to Prometheus
func (c *Client) TestConnection() error {
	_, err := c.doRequest("GET", "/api/v1/status/buildinfo", nil)
	if err != nil {
		return fmt.Errorf("connection test failed: %w", err)
	}
	return nil
}

// Query executes a PromQL query at a single point in time
func (c *Client) Query(query string, timestamp *time.Time) (*domain.PrometheusQueryResult, error) {
	params := url.Values{}
	params.Set("query", query)
	if timestamp != nil {
		params.Set("time", fmt.Sprintf("%d", timestamp.Unix()))
	}

	body, err := c.doRequest("GET", "/api/v1/query", params)
	if err != nil {
		return nil, err
	}

	var result domain.PrometheusQueryResult
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("error unmarshaling query result: %w", err)
	}

	return &result, nil
}

// QueryRange executes a PromQL query over a range of time
func (c *Client) QueryRange(query string, start, end time.Time, step string) (*domain.PrometheusQueryResult, error) {
	params := url.Values{}
	params.Set("query", query)
	params.Set("start", fmt.Sprintf("%d", start.Unix()))
	params.Set("end", fmt.Sprintf("%d", end.Unix()))
	params.Set("step", step)

	body, err := c.doRequest("GET", "/api/v1/query_range", params)
	if err != nil {
		return nil, err
	}

	var result domain.PrometheusQueryResult
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("error unmarshaling query range result: %w", err)
	}

	return &result, nil
}

// GetTargets retrieves information about all active targets
func (c *Client) GetTargets() (*domain.PrometheusTargetsResult, error) {
	body, err := c.doRequest("GET", "/api/v1/targets", nil)
	if err != nil {
		return nil, err
	}

	var result domain.PrometheusTargetsResult
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("error unmarshaling targets: %w", err)
	}

	return &result, nil
}

// GetAlerts retrieves all active alerts
func (c *Client) GetAlerts() (*domain.PrometheusAlertsResult, error) {
	body, err := c.doRequest("GET", "/api/v1/alerts", nil)
	if err != nil {
		return nil, err
	}

	var result domain.PrometheusAlertsResult
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("error unmarshaling alerts: %w", err)
	}

	return &result, nil
}

// GetRules retrieves all alerting and recording rules
func (c *Client) GetRules() (*domain.PrometheusRulesResult, error) {
	body, err := c.doRequest("GET", "/api/v1/rules", nil)
	if err != nil {
		return nil, err
	}

	var result domain.PrometheusRulesResult
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("error unmarshaling rules: %w", err)
	}

	return &result, nil
}

// GetLabelValues retrieves all values for a specific label
func (c *Client) GetLabelValues(labelName string) (*domain.PrometheusLabelValuesResult, error) {
	path := fmt.Sprintf("/api/v1/label/%s/values", labelName)
	body, err := c.doRequest("GET", path, nil)
	if err != nil {
		return nil, err
	}

	var result domain.PrometheusLabelValuesResult
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("error unmarshaling label values: %w", err)
	}

	return &result, nil
}

// GetSeries finds series matching label selectors
func (c *Client) GetSeries(matches []string, start, end *time.Time) (*domain.PrometheusSeriesResult, error) {
	params := url.Values{}
	for _, match := range matches {
		params.Add("match[]", match)
	}
	if start != nil {
		params.Set("start", fmt.Sprintf("%d", start.Unix()))
	}
	if end != nil {
		params.Set("end", fmt.Sprintf("%d", end.Unix()))
	}

	body, err := c.doRequest("GET", "/api/v1/series", params)
	if err != nil {
		return nil, err
	}

	var result domain.PrometheusSeriesResult
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("error unmarshaling series: %w", err)
	}

	return &result, nil
}

// GetMetadata retrieves metadata about metrics
func (c *Client) GetMetadata(metric string) (*domain.PrometheusMetadataResult, error) {
	params := url.Values{}
	if metric != "" {
		params.Set("metric", metric)
	}

	body, err := c.doRequest("GET", "/api/v1/metadata", params)
	if err != nil {
		return nil, err
	}

	var result domain.PrometheusMetadataResult
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("error unmarshaling metadata: %w", err)
	}

	return &result, nil
}

// GetBuildInfo retrieves build information about the Prometheus server
func (c *Client) GetBuildInfo() (*domain.PrometheusBuildInfoResult, error) {
	body, err := c.doRequest("GET", "/api/v1/status/buildinfo", nil)
	if err != nil {
		return nil, err
	}

	var result domain.PrometheusBuildInfoResult
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("error unmarshaling build info: %w", err)
	}

	return &result, nil
}
