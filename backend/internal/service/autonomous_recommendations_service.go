package service

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/PlatifyX/platifyx-core/internal/domain"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
)

type AutonomousRecommendationsService struct {
	aiService          *AIService
	kubernetesService  *KubernetesService
	finOpsService      *FinOpsService
	azureDevOpsService *AzureDevOpsService
	log                *logger.Logger
}

func NewAutonomousRecommendationsService(
	aiService *AIService,
	kubernetesService *KubernetesService,
	finOpsService *FinOpsService,
	azureDevOpsService *AzureDevOpsService,
	log *logger.Logger,
) *AutonomousRecommendationsService {
	return &AutonomousRecommendationsService{
		aiService:          aiService,
		kubernetesService:  kubernetesService,
		finOpsService:      finOpsService,
		azureDevOpsService: azureDevOpsService,
		log:                log,
	}
}

func (s *AutonomousRecommendationsService) GenerateRecommendations() ([]domain.Recommendation, error) {
	recommendations := []domain.Recommendation{}

	deploymentRecs, err := s.analyzeDeployments()
	if err != nil {
		s.log.Warnw("Failed to analyze deployments", "error", err)
	} else {
		recommendations = append(recommendations, deploymentRecs...)
	}

	costRecs, err := s.analyzeCosts()
	if err != nil {
		s.log.Warnw("Failed to analyze costs", "error", err)
	} else {
		recommendations = append(recommendations, costRecs...)
	}

	return recommendations, nil
}

func (s *AutonomousRecommendationsService) analyzeDeployments() ([]domain.Recommendation, error) {
	if s.kubernetesService == nil {
		return []domain.Recommendation{}, nil
	}

	deployments, err := s.kubernetesService.GetDeployments("")
	if err != nil {
		return nil, err
	}

	recommendations := []domain.Recommendation{}

	for _, deployment := range deployments {
		if deployment.Replicas > 0 && deployment.ReadyReplicas < deployment.Replicas {
			failureRate := float64(deployment.Replicas-deployment.ReadyReplicas) / float64(deployment.Replicas) * 100

			if failureRate >= 20 {
				rec := domain.Recommendation{
					ID:          fmt.Sprintf("deployment-%s-%d", deployment.Name, time.Now().Unix()),
					Type:        domain.RecommendationTypeDeployment,
					Severity:    domain.SeverityHigh,
					Title:       fmt.Sprintf("Deployment %s com %d%% de falha", deployment.Name, int(failureRate)),
					Description: fmt.Sprintf("O deployment %s está com apenas %d/%d réplicas prontas", deployment.Name, deployment.ReadyReplicas, deployment.Replicas),
					Reason:      fmt.Sprintf("Taxa de falha de %.1f%% detectada", failureRate),
					Action:      "Sugerir rollback e ajuste no readiness probe",
					Impact:      "Alta - Pode causar downtime do serviço",
					Confidence:  0.85,
					Metadata: map[string]interface{}{
						"namespace":      deployment.Namespace,
						"deployment":     deployment.Name,
						"replicas":       deployment.Replicas,
						"readyReplicas":  deployment.ReadyReplicas,
						"failureRate":    failureRate,
					},
					CreatedAt: time.Now(),
				}
				recommendations = append(recommendations, rec)
			}
		}
	}

	return recommendations, nil
}

func (s *AutonomousRecommendationsService) analyzeCosts() ([]domain.Recommendation, error) {
	if s.finOpsService == nil {
		return []domain.Recommendation{}, nil
	}

	stats, err := s.finOpsService.GetStats("", "")
	if err != nil {
		return nil, err
	}

	recommendations := []domain.Recommendation{}

	if stats.MonthlyCost > 0 {
		avgDailyCost := stats.MonthlyCost / 30
		currentDailyCost := stats.DailyCost

		if currentDailyCost > avgDailyCost*1.2 {
			increase := ((currentDailyCost - avgDailyCost) / avgDailyCost) * 100
			rec := domain.Recommendation{
				ID:          fmt.Sprintf("cost-spike-%d", time.Now().Unix()),
				Type:        domain.RecommendationTypeCost,
				Severity:    domain.SeverityMedium,
				Title:       fmt.Sprintf("Custo diário %.1f%% acima da média", increase),
				Description: fmt.Sprintf("Custo atual: $%.2f/dia vs média: $%.2f/dia", currentDailyCost, avgDailyCost),
				Reason:      "Spike de custo detectado comparado à média semanal",
				Action:      "Revisar recursos e considerar redimensionamento de pods",
				Impact:      "Médio - Pode impactar o orçamento mensal",
				Confidence:  0.75,
				Metadata: map[string]interface{}{
					"currentDailyCost": currentDailyCost,
					"avgDailyCost":     avgDailyCost,
					"increasePercent":  increase,
				},
				CreatedAt: time.Now(),
			}
			recommendations = append(recommendations, rec)
		}
	}

	return recommendations, nil
}

func (s *AutonomousRecommendationsService) GenerateAIRecommendation(context map[string]interface{}) (*domain.Recommendation, error) {
	if s.aiService == nil {
		return nil, fmt.Errorf("AI service not available")
	}

	contextJSON, _ := json.Marshal(context)
	prompt := fmt.Sprintf(`Analise o seguinte contexto de infraestrutura e gere uma recomendação técnica:

%s

Gere uma recomendação no formato JSON com os campos:
- type: tipo da recomendação (deployment, cost, security, performance, reliability)
- severity: severidade (low, medium, high, critical)
- title: título curto e direto
- description: descrição detalhada do problema
- reason: motivo da recomendação
- action: ação recomendada
- impact: impacto esperado
- confidence: confiança (0.0 a 1.0)

Responda APENAS com o JSON válido, sem markdown.`, string(contextJSON))

	response, err := s.aiService.GenerateCompletion(domain.AIProviderClaude, prompt, "")
	if err != nil {
		return nil, err
	}

	var recommendation domain.Recommendation
	if err := json.Unmarshal([]byte(response.Content), &recommendation); err != nil {
		return nil, fmt.Errorf("failed to parse AI response: %w", err)
	}

	recommendation.ID = fmt.Sprintf("ai-rec-%d", time.Now().Unix())
	recommendation.CreatedAt = time.Now()

	return &recommendation, nil
}

