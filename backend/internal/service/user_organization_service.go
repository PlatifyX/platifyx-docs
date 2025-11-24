package service

import (
	"github.com/PlatifyX/platifyx-core/internal/domain"
	"github.com/PlatifyX/platifyx-core/internal/repository"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
)

type UserOrganizationService struct {
	repo     *repository.UserOrganizationRepository
	userRepo *repository.UserRepository
	orgRepo  *repository.OrganizationRepository
	log      *logger.Logger
}

func NewUserOrganizationService(
	repo *repository.UserOrganizationRepository,
	userRepo *repository.UserRepository,
	orgRepo *repository.OrganizationRepository,
	log *logger.Logger,
) *UserOrganizationService {
	return &UserOrganizationService{
		repo:     repo,
		userRepo: userRepo,
		orgRepo:  orgRepo,
		log:      log,
	}
}

func (s *UserOrganizationService) GetUserOrganizations(userID string) ([]domain.UserOrganizationWithDetails, error) {
	s.log.Infow("Fetching user organizations", "userID", userID)

	userOrgs, err := s.repo.GetByUserID(userID)
	if err != nil {
		s.log.Errorw("Failed to fetch user organizations", "error", err, "userID", userID)
		return nil, err
	}

	result := make([]domain.UserOrganizationWithDetails, 0, len(userOrgs))
	for _, uo := range userOrgs {
		org, _ := s.orgRepo.GetByUUID(uo.OrganizationUUID)
		user, _ := s.userRepo.GetByID(uo.UserID)

		details := domain.UserOrganizationWithDetails{
			UserOrganization: uo,
		}
		if org != nil {
			details.Organization = org
		}
		if user != nil {
			details.User = user
		}
		result = append(result, details)
	}

	return result, nil
}

func (s *UserOrganizationService) GetOrganizationUsers(orgUUID string) ([]domain.UserOrganizationWithDetails, error) {
	s.log.Infow("Fetching organization users", "orgUUID", orgUUID)

	userOrgs, err := s.repo.GetByOrganizationUUID(orgUUID)
	if err != nil {
		s.log.Errorw("Failed to fetch organization users", "error", err, "orgUUID", orgUUID)
		return nil, err
	}

	result := make([]domain.UserOrganizationWithDetails, 0, len(userOrgs))
	for _, uo := range userOrgs {
		org, _ := s.orgRepo.GetByUUID(uo.OrganizationUUID)
		user, _ := s.userRepo.GetByID(uo.UserID)

		details := domain.UserOrganizationWithDetails{
			UserOrganization: uo,
		}
		if org != nil {
			details.Organization = org
		}
		if user != nil {
			details.User = user
		}
		result = append(result, details)
	}

	return result, nil
}

func (s *UserOrganizationService) AddUserToOrganization(orgUUID string, req domain.AddUserToOrganizationRequest) (*domain.UserOrganization, error) {
	s.log.Infow("Adding user to organization", "orgUUID", orgUUID, "userID", req.UserID)

	_, err := s.orgRepo.GetByUUID(orgUUID)
	if err != nil {
		return nil, err
	}

	_, err = s.userRepo.GetByID(req.UserID)
	if err != nil {
		return nil, err
	}

	existing, err := s.repo.GetByUserAndOrganization(req.UserID, orgUUID)
	if err != nil {
		return nil, err
	}
	if existing != nil {
		return existing, nil
	}

	role := req.Role
	if role == "" {
		role = "member"
	}

	uo := &domain.UserOrganization{
		UserID:         req.UserID,
		OrganizationUUID: orgUUID,
		Role:           role,
	}

	err = s.repo.Create(uo)
	if err != nil {
		s.log.Errorw("Failed to add user to organization", "error", err)
		return nil, err
	}

	s.log.Infow("User added to organization successfully", "orgUUID", orgUUID, "userID", req.UserID)
	return uo, nil
}

func (s *UserOrganizationService) UpdateUserRole(id, role string) error {
	s.log.Infow("Updating user organization role", "id", id, "role", role)

	err := s.repo.UpdateRole(id, role)
	if err != nil {
		s.log.Errorw("Failed to update user organization role", "error", err)
		return err
	}

	return nil
}

func (s *UserOrganizationService) RemoveUserFromOrganization(userID, orgUUID string) error {
	s.log.Infow("Removing user from organization", "userID", userID, "orgUUID", orgUUID)

	err := s.repo.DeleteByUserAndOrganization(userID, orgUUID)
	if err != nil {
		s.log.Errorw("Failed to remove user from organization", "error", err)
		return err
	}

	return nil
}

func (s *UserOrganizationService) HasAccess(userID, orgUUID string) (bool, error) {
	uo, err := s.repo.GetByUserAndOrganization(userID, orgUUID)
	if err != nil {
		return false, err
	}
	return uo != nil, nil
}


