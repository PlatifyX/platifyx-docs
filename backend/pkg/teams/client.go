package teams

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
	httpClient *http.Client
}

func NewClient(config domain.TeamsConfig) *Client {
	return &Client{
		webhookURL: config.WebhookURL,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

// SendMessage sends a message to Microsoft Teams via webhook
func (c *Client) SendMessage(message domain.TeamsMessage) error {
	if c.webhookURL == "" {
		return fmt.Errorf("webhook URL not configured")
	}

	// Set default MessageCard type if not specified
	if message.Type == "" {
		message.Type = "MessageCard"
	}
	if message.Context == "" {
		message.Context = "https://schema.org/extensions"
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
func (c *Client) SendSimpleMessage(title, text string) error {
	message := domain.TeamsMessage{
		Type:    "MessageCard",
		Context: "https://schema.org/extensions",
		Title:   title,
		Text:    text,
	}
	return c.SendMessage(message)
}

// SendAlert sends an alert message with color coding
func (c *Client) SendAlert(title, text, color string) error {
	message := domain.TeamsMessage{
		Type:       "MessageCard",
		Context:    "https://schema.org/extensions",
		Title:      title,
		Text:       text,
		ThemeColor: color,
	}
	return c.SendMessage(message)
}

// TestConnection tests the Teams webhook by sending a test message
func (c *Client) TestConnection() error {
	message := domain.TeamsMessage{
		Type:       "MessageCard",
		Context:    "https://schema.org/extensions",
		Title:      "Teste de Conexão",
		Text:       "✅ Conexão com Microsoft Teams estabelecida com sucesso!",
		ThemeColor: "0078D7", // Microsoft blue
	}
	return c.SendMessage(message)
}

// SendNotificationWithFacts sends a detailed notification with facts
func (c *Client) SendNotificationWithFacts(title, subtitle string, facts []domain.TeamsFact, color string) error {
	message := domain.TeamsMessage{
		Type:       "MessageCard",
		Context:    "https://schema.org/extensions",
		Title:      title,
		ThemeColor: color,
		Sections: []domain.TeamsSection{
			{
				ActivityTitle: title,
				ActivitySubtitle: subtitle,
				Facts: facts,
			},
		},
	}
	return c.SendMessage(message)
}
