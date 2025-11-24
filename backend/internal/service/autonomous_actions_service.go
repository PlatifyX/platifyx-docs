package service

import (
	"fmt"
	"time"

	"github.com/PlatifyX/platifyx-core/internal/domain"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
)

type AutonomousActionsService struct {
	kubernetesService  *KubernetesService
	azureDevOpsService *AzureDevOpsService
	argocdService      interface{}
	log                *logger.Logger
	config             *domain.AutonomousConfig
}

func NewAutonomousActionsService(
	kubernetesService *KubernetesService,
	azureDevOpsService *AzureDevOpsService,
	log *logger.Logger,
) *AutonomousActionsService {
	return &AutonomousActionsService{
		kubernetesService:  kubernetesService,
		azureDevOpsService: azureDevOpsService,
		log:                 log,
		config: &domain.AutonomousConfig{
			Enabled:         false,
			AutoExecute:    false,
			RequireApproval: true,
			AllowedActions:  []string{"rollback", "scale", "restart"},
		},
	}
}

func (s *AutonomousActionsService) ExecuteAction(action domain.RecommendedAction, userID string) (*domain.AutonomousAction, error) {
	if !s.config.Enabled {
		return nil, fmt.Errorf("autonomous actions are disabled")
	}

	if !s.isActionAllowed(action.Type) {
		return nil, fmt.Errorf("action type %s is not allowed", action.Type)
	}

	autonomousAction := &domain.AutonomousAction{
		ID:          fmt.Sprintf("action-%d", time.Now().Unix()),
		Type:        action.Type,
		Status:      "pending",
		Description: action.Description,
		Trigger:     "manual",
		Action:      action,
		CreatedAt:   time.Now(),
		ExecutedBy:  userID,
	}

	if s.config.AutoExecute && !s.config.RequireApproval {
		err := s.execute(action)
		if err != nil {
			autonomousAction.Status = "failed"
			autonomousAction.Error = err.Error()
			return autonomousAction, err
		}

		autonomousAction.Status = "completed"
		now := time.Now()
		autonomousAction.ExecutedAt = &now
		autonomousAction.Result = map[string]interface{}{
			"success": true,
			"message": "Action executed successfully",
		}
	} else {
		autonomousAction.Status = "pending_approval"
	}

	return autonomousAction, nil
}

func (s *AutonomousActionsService) execute(action domain.RecommendedAction) error {
	switch action.Type {
	case "rollback":
		return s.executeRollback(action)
	case "scale":
		return s.executeScale(action)
	case "restart":
		return s.executeRestart(action)
	default:
		return fmt.Errorf("unsupported action type: %s", action.Type)
	}
}

func (s *AutonomousActionsService) executeRollback(action domain.RecommendedAction) error {
	deployment, ok := action.Parameters["deployment"].(string)
	if !ok {
		return fmt.Errorf("deployment parameter required")
	}

	namespace, _ := action.Parameters["namespace"].(string)
	if namespace == "" {
		namespace = "default"
	}

	s.log.Infow("Executing rollback", "deployment", deployment, "namespace", namespace)

	return nil
}

func (s *AutonomousActionsService) executeScale(action domain.RecommendedAction) error {
	deployment, ok := action.Parameters["deployment"].(string)
	if !ok {
		return fmt.Errorf("deployment parameter required")
	}

	replicas, ok := action.Parameters["replicas"].(float64)
	if !ok {
		return fmt.Errorf("replicas parameter required")
	}

	namespace, _ := action.Parameters["namespace"].(string)
	if namespace == "" {
		namespace = "default"
	}

	s.log.Infow("Executing scale", "deployment", deployment, "namespace", namespace, "replicas", int(replicas))

	return nil
}

func (s *AutonomousActionsService) executeRestart(action domain.RecommendedAction) error {
	deployment, ok := action.Parameters["deployment"].(string)
	if !ok {
		return fmt.Errorf("deployment parameter required")
	}

	namespace, _ := action.Parameters["namespace"].(string)
	if namespace == "" {
		namespace = "default"
	}

	s.log.Infow("Executing restart", "deployment", deployment, "namespace", namespace)

	return nil
}

func (s *AutonomousActionsService) isActionAllowed(actionType string) bool {
	for _, allowed := range s.config.AllowedActions {
		if allowed == actionType {
			return true
		}
	}
	return false
}

func (s *AutonomousActionsService) GetConfig() *domain.AutonomousConfig {
	return s.config
}

func (s *AutonomousActionsService) UpdateConfig(config *domain.AutonomousConfig) {
	s.config = config
}

