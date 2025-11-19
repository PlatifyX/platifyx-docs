package loki

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/PlatifyX/platifyx-core/internal/domain"
)

type Client struct {
	baseURL    string
	username   string
	password   string
	httpClient *http.Client
}

func NewClient(config domain.LokiConfig) *Client {
	return &Client{
		baseURL:  strings.TrimSuffix(config.URL, "/"),
		username: config.Username,
		password: config.Password,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

func (c *Client) doRequest(method, endpoint string, params url.Values) ([]byte, error) {
	fullURL := c.baseURL + endpoint
	if params != nil {
		fullURL += "?" + params.Encode()
	}

	req, err := http.NewRequest(method, fullURL, nil)
	if err != nil {
		return nil, err
	}

	// Add basic auth if username and password are provided
	if c.username != "" && c.password != "" {
		auth := base64.StdEncoding.EncodeToString([]byte(c.username + ":" + c.password))
		req.Header.Set("Authorization", "Basic "+auth)
	}

	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	bodyBytes, _ := io.ReadAll(resp.Body)

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("Loki API returned status %d: %s", resp.StatusCode, string(bodyBytes))
	}

	return bodyBytes, nil
}

// GetLabels retrieves all label names from Loki
func (c *Client) GetLabels() ([]string, error) {
	data, err := c.doRequest("GET", "/loki/api/v1/labels", nil)
	if err != nil {
		return nil, err
	}

	var response struct {
		Status string   `json:"status"`
		Data   []string `json:"data"`
	}

	if err := json.Unmarshal(data, &response); err != nil {
		return nil, err
	}

	return response.Data, nil
}

// GetLabelValues retrieves all values for a specific label
func (c *Client) GetLabelValues(label string) ([]string, error) {
	data, err := c.doRequest("GET", fmt.Sprintf("/loki/api/v1/label/%s/values", label), nil)
	if err != nil {
		return nil, err
	}

	var response struct {
		Status string   `json:"status"`
		Data   []string `json:"data"`
	}

	if err := json.Unmarshal(data, &response); err != nil {
		return nil, err
	}

	return response.Data, nil
}

// QueryRange queries Loki for logs in a time range
func (c *Client) QueryRange(query string, start, end time.Time, limit int) (*domain.LokiQueryResult, error) {
	params := url.Values{}
	params.Add("query", query)
	params.Add("start", fmt.Sprintf("%d", start.UnixNano()))
	params.Add("end", fmt.Sprintf("%d", end.UnixNano()))
	if limit > 0 {
		params.Add("limit", fmt.Sprintf("%d", limit))
	}

	data, err := c.doRequest("GET", "/loki/api/v1/query_range", params)
	if err != nil {
		return nil, err
	}

	var result domain.LokiQueryResult
	if err := json.Unmarshal(data, &result); err != nil {
		return nil, err
	}

	return &result, nil
}

// Query queries Loki for logs at a specific time
func (c *Client) Query(query string, limit int) (*domain.LokiQueryResult, error) {
	params := url.Values{}
	params.Add("query", query)
	if limit > 0 {
		params.Add("limit", fmt.Sprintf("%d", limit))
	}

	data, err := c.doRequest("GET", "/loki/api/v1/query", params)
	if err != nil {
		return nil, err
	}

	var result domain.LokiQueryResult
	if err := json.Unmarshal(data, &result); err != nil {
		return nil, err
	}

	return &result, nil
}

// TestConnection tests if the Loki server is reachable
func (c *Client) TestConnection() error {
	// Try to fetch labels as a simple test
	_, err := c.doRequest("GET", "/loki/api/v1/labels", nil)
	return err
}
