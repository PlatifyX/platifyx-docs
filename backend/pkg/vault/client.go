package vault

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/PlatifyX/platifyx-core/internal/domain"
)

type Client struct {
	address    string
	token      string
	namespace  string
	httpClient *http.Client
}

func NewClient(address, token, namespace string) *Client {
	return &Client{
		address:   address,
		token:     token,
		namespace: namespace,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

func (c *Client) doRequest(method, path string, body interface{}) ([]byte, error) {
	url := fmt.Sprintf("%s/v1/%s", c.address, path)

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

	req.Header.Set("X-Vault-Token", c.token)
	req.Header.Set("Content-Type", "application/json")
	if c.namespace != "" {
		req.Header.Set("X-Vault-Namespace", c.namespace)
	}

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

// TestConnection verifies the connection to Vault
func (c *Client) TestConnection() error {
	_, err := c.GetHealth()
	if err != nil {
		return fmt.Errorf("connection test failed: %w", err)
	}
	return nil
}

// GetHealth retrieves Vault health information
func (c *Client) GetHealth() (*domain.VaultHealth, error) {
	url := fmt.Sprintf("%s/v1/sys/health", c.address)
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("error creating request: %w", err)
	}

	// Health endpoint doesn't require authentication but returns different status codes
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("error making request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("error reading response body: %w", err)
	}

	var health domain.VaultHealth
	if err := json.Unmarshal(body, &health); err != nil {
		return nil, fmt.Errorf("error unmarshaling health: %w", err)
	}

	return &health, nil
}

// ReadSecret reads a secret from KV v1
func (c *Client) ReadSecret(path string) (*domain.VaultSecret, error) {
	respBody, err := c.doRequest("GET", path, nil)
	if err != nil {
		return nil, err
	}

	var secret domain.VaultSecret
	if err := json.Unmarshal(respBody, &secret); err != nil {
		return nil, fmt.Errorf("error unmarshaling secret: %w", err)
	}

	return &secret, nil
}

// ReadKVSecret reads a secret from KV v2
func (c *Client) ReadKVSecret(mountPath, secretPath string) (*domain.VaultKVSecret, error) {
	fullPath := fmt.Sprintf("%s/data/%s", mountPath, secretPath)
	respBody, err := c.doRequest("GET", fullPath, nil)
	if err != nil {
		return nil, err
	}

	var secret domain.VaultKVSecret
	if err := json.Unmarshal(respBody, &secret); err != nil {
		return nil, fmt.Errorf("error unmarshaling KV secret: %w", err)
	}

	return &secret, nil
}

// WriteKVSecret writes a secret to KV v2
func (c *Client) WriteKVSecret(mountPath, secretPath string, data map[string]interface{}) error {
	fullPath := fmt.Sprintf("%s/data/%s", mountPath, secretPath)
	payload := map[string]interface{}{
		"data": data,
	}

	_, err := c.doRequest("POST", fullPath, payload)
	return err
}

// DeleteKVSecret deletes a secret from KV v2
func (c *Client) DeleteKVSecret(mountPath, secretPath string) error {
	fullPath := fmt.Sprintf("%s/data/%s", mountPath, secretPath)
	_, err := c.doRequest("DELETE", fullPath, nil)
	return err
}

// ListSecrets lists secrets in a path
func (c *Client) ListSecrets(path string) ([]string, error) {
	respBody, err := c.doRequest("LIST", path, nil)
	if err != nil {
		return nil, err
	}

	var listResp domain.VaultListResponse
	if err := json.Unmarshal(respBody, &listResp); err != nil {
		return nil, fmt.Errorf("error unmarshaling list response: %w", err)
	}

	return listResp.Data.Keys, nil
}

// ListKVSecrets lists secrets in a KV v2 mount
func (c *Client) ListKVSecrets(mountPath, secretPath string) ([]string, error) {
	var fullPath string
	if secretPath == "" {
		fullPath = fmt.Sprintf("%s/metadata", mountPath)
	} else {
		fullPath = fmt.Sprintf("%s/metadata/%s", mountPath, secretPath)
	}
	return c.ListSecrets(fullPath)
}
