package service

import (
	"github.com/PlatifyX/platifyx-core/internal/domain"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"github.com/PlatifyX/platifyx-core/pkg/openvpn"
)

type OpenVPNService struct {
	client *openvpn.Client
	log    *logger.Logger
}

func NewOpenVPNService(config domain.OpenVPNIntegrationConfig, log *logger.Logger) *OpenVPNService {
	client := openvpn.NewClient(config)
	return &OpenVPNService{
		client: client,
		log:    log,
	}
}

// ListUsers retrieves all users from OpenVPN
func (s *OpenVPNService) ListUsers() ([]domain.OpenVPNUser, error) {
	s.log.Info("Listing OpenVPN users")

	users, err := s.client.ListUsers()
	if err != nil {
		s.log.Errorw("Failed to list OpenVPN users", "error", err)
		return nil, err
	}

	s.log.Infow("Successfully listed OpenVPN users", "count", len(users))
	return users, nil
}

// GetUser retrieves a specific user by username
func (s *OpenVPNService) GetUser(username string) (*domain.OpenVPNUser, error) {
	s.log.Infow("Getting OpenVPN user", "username", username)

	user, err := s.client.GetUser(username)
	if err != nil {
		s.log.Errorw("Failed to get OpenVPN user", "error", err, "username", username)
		return nil, err
	}

	s.log.Infow("Successfully retrieved OpenVPN user", "username", username)
	return user, nil
}

// CreateUser creates a new user in OpenVPN
func (s *OpenVPNService) CreateUser(req domain.CreateOpenVPNUserRequest) (*domain.OpenVPNUser, error) {
	s.log.Infow("Creating OpenVPN user", "username", req.Username)

	user, err := s.client.CreateUser(req)
	if err != nil {
		s.log.Errorw("Failed to create OpenVPN user", "error", err, "username", req.Username)
		return nil, err
	}

	s.log.Infow("Successfully created OpenVPN user", "username", user.Username, "id", user.ID)
	return user, nil
}

// UpdateUser updates an existing user
func (s *OpenVPNService) UpdateUser(username string, req domain.UpdateOpenVPNUserRequest) (*domain.OpenVPNUser, error) {
	s.log.Infow("Updating OpenVPN user", "username", username)

	user, err := s.client.UpdateUser(username, req)
	if err != nil {
		s.log.Errorw("Failed to update OpenVPN user", "error", err, "username", username)
		return nil, err
	}

	s.log.Infow("Successfully updated OpenVPN user", "username", username)
	return user, nil
}

// DeleteUser deletes a user from OpenVPN
func (s *OpenVPNService) DeleteUser(username string) error {
	s.log.Infow("Deleting OpenVPN user", "username", username)

	err := s.client.DeleteUser(username)
	if err != nil {
		s.log.Errorw("Failed to delete OpenVPN user", "error", err, "username", username)
		return err
	}

	s.log.Infow("Successfully deleted OpenVPN user", "username", username)
	return nil
}

// TestConnection tests the connection to OpenVPN API
func (s *OpenVPNService) TestConnection() error {
	s.log.Info("Testing OpenVPN connection")

	err := s.client.TestConnection()
	if err != nil {
		s.log.Errorw("OpenVPN connection test failed", "error", err)
		return err
	}

	s.log.Info("OpenVPN connection test successful")
	return nil
}
