package service

import (
	"github.com/PlatifyX/platifyx-core/internal/domain"
	"github.com/PlatifyX/platifyx-core/internal/repository"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
)

type OrganizationUserService struct {
	repo *repository.OrganizationUserRepository
	log  *logger.Logger
}

func NewOrganizationUserService(repo *repository.OrganizationUserRepository, log *logger.Logger) *OrganizationUserService {
	return &OrganizationUserService{
		repo: repo,
		log:  log,
	}
}

func (s *OrganizationUserService) GetAllUsers(org *domain.Organization) ([]domain.OrganizationUser, error) {
	s.log.Infow("Fetching organization users", "orgUUID", org.UUID)

	users, err := s.repo.GetAllUsers(org)
	if err != nil {
		s.log.Errorw("Failed to fetch organization users", "error", err, "orgUUID", org.UUID)
		return nil, err
	}

	s.log.Infow("Fetched organization users successfully", "count", len(users), "orgUUID", org.UUID)
	return users, nil
}

func (s *OrganizationUserService) GetUserByID(org *domain.Organization, userID string) (*domain.OrganizationUser, error) {
	s.log.Infow("Fetching organization user", "orgUUID", org.UUID, "userID", userID)

	user, err := s.repo.GetUserByID(org, userID)
	if err != nil {
		s.log.Errorw("Failed to fetch organization user", "error", err, "orgUUID", org.UUID, "userID", userID)
		return nil, err
	}

	return user, nil
}

func (s *OrganizationUserService) CreateUser(org *domain.Organization, user *domain.OrganizationUser) error {
	s.log.Infow("Creating organization user", "orgUUID", org.UUID, "email", user.Email)

	err := s.repo.CreateUser(org, user)
	if err != nil {
		s.log.Errorw("Failed to create organization user", "error", err, "orgUUID", org.UUID)
		return err
	}

	s.log.Infow("Organization user created successfully", "orgUUID", org.UUID, "userID", user.ID)
	return nil
}

func (s *OrganizationUserService) UpdateUser(org *domain.Organization, user *domain.OrganizationUser) error {
	s.log.Infow("Updating organization user", "orgUUID", org.UUID, "userID", user.ID)

	err := s.repo.UpdateUser(org, user)
	if err != nil {
		s.log.Errorw("Failed to update organization user", "error", err, "orgUUID", org.UUID, "userID", user.ID)
		return err
	}

	return nil
}

func (s *OrganizationUserService) DeleteUser(org *domain.Organization, userID string) error {
	s.log.Infow("Deleting organization user", "orgUUID", org.UUID, "userID", userID)

	err := s.repo.DeleteUser(org, userID)
	if err != nil {
		s.log.Errorw("Failed to delete organization user", "error", err, "orgUUID", org.UUID, "userID", userID)
		return err
	}

	return nil
}

