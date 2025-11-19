package slack

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
	webhookURL string
	botToken   string
	httpClient *http.Client
}

func NewClient(config domain.SlackConfig) *Client {
	return &Client{
		webhookURL: config.WebhookURL,
		botToken:   config.BotToken,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

// SendMessage sends a message to Slack via webhook
func (c *Client) SendMessage(message domain.SlackMessage) error {
	if c.webhookURL == "" {
		return fmt.Errorf("webhook URL not configured")
	}

	payload, err := json.Marshal(message)
	if err != nil {
		return fmt.Errorf("failed to marshal message: %w", err)
	}

	req, err := http.NewRequest("POST", c.webhookURL, bytes.NewBuffer(payload))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("API request failed with status %d: %s", resp.StatusCode, string(bodyBytes))
	}

	return nil
}

// SendSimpleMessage sends a simple text message
func (c *Client) SendSimpleMessage(text string) error {
	message := domain.SlackMessage{
		Text: text,
	}
	return c.SendMessage(message)
}

// SendAlert sends an alert message with color coding
func (c *Client) SendAlert(title, text, color string) error {
	message := domain.SlackMessage{
		Attachments: []domain.SlackAttachment{
			{
				Color: color,
				Title: title,
				Text:  text,
			},
		},
	}
	return c.SendMessage(message)
}

// TestConnection tests the Slack webhook by sending a test message
func (c *Client) TestConnection() error {
	message := domain.SlackMessage{
		Text: "✅ Conexão com Slack estabelecida com sucesso!",
	}
	return c.SendMessage(message)
}

// ListChannels lists all channels (requires bot token)
func (c *Client) ListChannels() ([]domain.SlackChannel, error) {
	if c.botToken == "" {
		return nil, fmt.Errorf("bot token not configured")
	}

	req, err := http.NewRequest("GET", "https://slack.com/api/conversations.list", nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.botToken))
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("API request failed with status %d: %s", resp.StatusCode, string(bodyBytes))
	}

	var result struct {
		OK       bool                   `json:"ok"`
		Channels []domain.SlackChannel  `json:"channels"`
		Error    string                 `json:"error,omitempty"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	if !result.OK {
		return nil, fmt.Errorf("Slack API error: %s", result.Error)
	}

	return result.Channels, nil
}
