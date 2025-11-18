package service

import (
	"github.com/PlatifyX/platifyx-core/internal/domain"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"github.com/PlatifyX/platifyx-core/pkg/teams"
)

type TeamsService struct {
	client *teams.Client
	log    *logger.Logger
}

func NewTeamsService(config domain.TeamsConfig, log *logger.Logger) *TeamsService {
	client := teams.NewClient(config)
	return &TeamsService{
		client: client,
		log:    log,
	}
}

// SendMessage sends a message to Microsoft Teams
func (s *TeamsService) SendMessage(message domain.TeamsMessage) error {
	s.log.Info("Sending message to Teams")

	err := s.client.SendMessage(message)
	if err != nil {
		s.log.Errorw("Failed to send Teams message", "error", err)
		return err
	}

	s.log.Info("Teams message sent successfully")
	return nil
}

// SendSimpleMessage sends a simple text message
func (s *TeamsService) SendSimpleMessage(title, text string) error {
	s.log.Infow("Sending simple message to Teams", "title", title)

	err := s.client.SendSimpleMessage(title, text)
	if err != nil {
		s.log.Errorw("Failed to send simple Teams message", "error", err)
		return err
	}

	s.log.Info("Simple Teams message sent successfully")
	return nil
}

// SendAlert sends an alert message
func (s *TeamsService) SendAlert(title, text, color string) error {
	s.log.Infow("Sending alert to Teams", "title", title, "color", color)

	err := s.client.SendAlert(title, text, color)
	if err != nil {
		s.log.Errorw("Failed to send Teams alert", "error", err)
		return err
	}

	s.log.Info("Teams alert sent successfully")
	return nil
}

// SendNotificationWithFacts sends a detailed notification
func (s *TeamsService) SendNotificationWithFacts(title, subtitle string, facts []domain.TeamsFact, color string) error {
	s.log.Infow("Sending notification with facts to Teams", "title", title)

	err := s.client.SendNotificationWithFacts(title, subtitle, facts, color)
	if err != nil {
		s.log.Errorw("Failed to send Teams notification", "error", err)
		return err
	}

	s.log.Info("Teams notification sent successfully")
	return nil
}

// TestConnection tests the Teams connection
func (s *TeamsService) TestConnection() error {
	s.log.Info("Testing Teams connection")

	err := s.client.TestConnection()
	if err != nil {
		s.log.Errorw("Teams connection test failed", "error", err)
		return err
	}

	s.log.Info("Teams connection test successful")
	return nil
}
