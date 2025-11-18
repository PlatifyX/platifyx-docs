package service

import (
	"github.com/PlatifyX/platifyx-core/internal/domain"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"github.com/PlatifyX/platifyx-core/pkg/slack"
)

type SlackService struct {
	client *slack.Client
	log    *logger.Logger
}

func NewSlackService(config domain.SlackConfig, log *logger.Logger) *SlackService {
	client := slack.NewClient(config)
	return &SlackService{
		client: client,
		log:    log,
	}
}

// SendMessage sends a message to Slack
func (s *SlackService) SendMessage(message domain.SlackMessage) error {
	s.log.Info("Sending message to Slack")

	err := s.client.SendMessage(message)
	if err != nil {
		s.log.Errorw("Failed to send Slack message", "error", err)
		return err
	}

	s.log.Info("Slack message sent successfully")
	return nil
}

// SendSimpleMessage sends a simple text message
func (s *SlackService) SendSimpleMessage(text string) error {
	s.log.Infow("Sending simple message to Slack", "text", text)

	err := s.client.SendSimpleMessage(text)
	if err != nil {
		s.log.Errorw("Failed to send simple Slack message", "error", err)
		return err
	}

	s.log.Info("Simple Slack message sent successfully")
	return nil
}

// SendAlert sends an alert message
func (s *SlackService) SendAlert(title, text, color string) error {
	s.log.Infow("Sending alert to Slack", "title", title, "color", color)

	err := s.client.SendAlert(title, text, color)
	if err != nil {
		s.log.Errorw("Failed to send Slack alert", "error", err)
		return err
	}

	s.log.Info("Slack alert sent successfully")
	return nil
}

// ListChannels lists all channels (if bot token is configured)
func (s *SlackService) ListChannels() ([]domain.SlackChannel, error) {
	s.log.Info("Fetching Slack channels")

	channels, err := s.client.ListChannels()
	if err != nil {
		s.log.Errorw("Failed to fetch Slack channels", "error", err)
		return nil, err
	}

	s.log.Infow("Fetched Slack channels successfully", "count", len(channels))
	return channels, nil
}

// TestConnection tests the Slack connection
func (s *SlackService) TestConnection() error {
	s.log.Info("Testing Slack connection")

	err := s.client.TestConnection()
	if err != nil {
		s.log.Errorw("Slack connection test failed", "error", err)
		return err
	}

	s.log.Info("Slack connection test successful")
	return nil
}
