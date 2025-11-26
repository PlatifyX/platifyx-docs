package openvpn

import (
	"bytes"
	"encoding/base64"
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
	username   string
	password   string
	httpClient *http.Client
}

func NewClient(config domain.OpenVPNIntegrationConfig) *Client {
	return &Client{
		baseURL:  strings.TrimSuffix(config.URL, "/"),
		username: config.Username,
		password: config.Password,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

func (c *Client) doRequest(method, endpoint string, body interface{}) ([]byte, error) {
	fullURL := c.baseURL + endpoint

	var reqBody io.Reader
	if body != nil {
		jsonData, err := json.Marshal(body)
		if err != nil {
			return nil, err
		}
		reqBody = bytes.NewBuffer(jsonData)
	}

	req, err := http.NewRequest(method, fullURL, reqBody)
	if err != nil {
		return nil, err
	}

	// Basic Auth
	auth := base64.StdEncoding.EncodeToString([]byte(c.username + ":" + c.password))
	req.Header.Set("Authorization", "Basic "+auth)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	bodyBytes, _ := io.ReadAll(resp.Body)

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("OpenVPN API returned status %d: %s", resp.StatusCode, string(bodyBytes))
	}

	return bodyBytes, nil
}

// ListUsers retrieves all users from OpenVPN
func (c *Client) ListUsers() ([]domain.OpenVPNUser, error) {
	data, err := c.doRequest("GET", "/api/users", nil)
	if err != nil {
		return nil, err
	}

	var response struct {
		Users []struct {
			ID        string    `json:"id"`
			Username  string    `json:"username"`
			Email     string    `json:"email"`
			Enabled   bool      `json:"enabled"`
			CreatedAt time.Time `json:"created_at"`
			UpdatedAt time.Time `json:"updated_at"`
		} `json:"users"`
	}

	if err := json.Unmarshal(data, &response); err != nil {
		return nil, err
	}

	users := make([]domain.OpenVPNUser, 0)
	for _, u := range response.Users {
		users = append(users, domain.OpenVPNUser{
			ID:        u.ID,
			Username:  u.Username,
			Email:     u.Email,
			Enabled:   u.Enabled,
			CreatedAt: u.CreatedAt,
			UpdatedAt: u.UpdatedAt,
		})
	}

	return users, nil
}

// GetUser retrieves a specific user by username
func (c *Client) GetUser(username string) (*domain.OpenVPNUser, error) {
	endpoint := fmt.Sprintf("/api/users/%s", username)
	data, err := c.doRequest("GET", endpoint, nil)
	if err != nil {
		return nil, err
	}

	var response struct {
		ID        string    `json:"id"`
		Username  string    `json:"username"`
		Email     string    `json:"email"`
		Enabled   bool      `json:"enabled"`
		CreatedAt time.Time `json:"created_at"`
		UpdatedAt time.Time `json:"updated_at"`
	}

	if err := json.Unmarshal(data, &response); err != nil {
		return nil, err
	}

	return &domain.OpenVPNUser{
		ID:        response.ID,
		Username:  response.Username,
		Email:     response.Email,
		Enabled:   response.Enabled,
		CreatedAt: response.CreatedAt,
		UpdatedAt: response.UpdatedAt,
	}, nil
}

// CreateUser creates a new user in OpenVPN
func (c *Client) CreateUser(req domain.CreateOpenVPNUserRequest) (*domain.OpenVPNUser, error) {
	data, err := c.doRequest("POST", "/api/users", req)
	if err != nil {
		return nil, err
	}

	var response struct {
		ID        string    `json:"id"`
		Username  string    `json:"username"`
		Email     string    `json:"email"`
		Enabled   bool      `json:"enabled"`
		CreatedAt time.Time `json:"created_at"`
		UpdatedAt time.Time `json:"updated_at"`
	}

	if err := json.Unmarshal(data, &response); err != nil {
		return nil, err
	}

	return &domain.OpenVPNUser{
		ID:        response.ID,
		Username:  response.Username,
		Email:     response.Email,
		Enabled:   response.Enabled,
		CreatedAt: response.CreatedAt,
		UpdatedAt: response.UpdatedAt,
	}, nil
}

// UpdateUser updates an existing user
func (c *Client) UpdateUser(username string, req domain.UpdateOpenVPNUserRequest) (*domain.OpenVPNUser, error) {
	endpoint := fmt.Sprintf("/api/users/%s", username)
	data, err := c.doRequest("PUT", endpoint, req)
	if err != nil {
		return nil, err
	}

	var response struct {
		ID        string    `json:"id"`
		Username  string    `json:"username"`
		Email     string    `json:"email"`
		Enabled   bool      `json:"enabled"`
		CreatedAt time.Time `json:"created_at"`
		UpdatedAt time.Time `json:"updated_at"`
	}

	if err := json.Unmarshal(data, &response); err != nil {
		return nil, err
	}

	return &domain.OpenVPNUser{
		ID:        response.ID,
		Username:  response.Username,
		Email:     response.Email,
		Enabled:   response.Enabled,
		CreatedAt: response.CreatedAt,
		UpdatedAt: response.UpdatedAt,
	}, nil
}

// DeleteUser deletes a user from OpenVPN
func (c *Client) DeleteUser(username string) error {
	endpoint := fmt.Sprintf("/api/users/%s", username)
	_, err := c.doRequest("DELETE", endpoint, nil)
	return err
}

// TestConnection tests the connection to OpenVPN API
func (c *Client) TestConnection() error {
	_, err := c.doRequest("GET", "/api/health", nil)
	if err != nil {
		return fmt.Errorf("failed to connect to OpenVPN API: %w", err)
	}
	return nil
}
