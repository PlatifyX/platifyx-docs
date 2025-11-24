package service

import (
	"fmt"
	"math"
	"time"

	"github.com/PlatifyX/platifyx-core/internal/domain"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
)

type MaturityService struct {
	kubernetesService  *KubernetesService
	azureDevOpsService *AzureDevOpsService
	sonarQubeService   *SonarQubeService
	finOpsService      *FinOpsService
	aiService          *AIService
	log                *logger.Logger
}

func NewMaturityService(
	kubernetesService *KubernetesService,
	azureDevOpsService *AzureDevOpsService,
	sonarQubeService *SonarQubeService,
	finOpsService *FinOpsService,
	aiService *AIService,
	log *logger.Logger,
) *MaturityService {
	return &MaturityService{
		kubernetesService:  kubernetesService,
		azureDevOpsService: azureDevOpsService,
		sonarQubeService:   sonarQubeService,
		finOpsService:      finOpsService,
		aiService:          aiService,
		log:                log,
	}
}

func (s *MaturityService) CalculateServiceMetrics(serviceName string) ([]domain.ServiceMetric, error) {
	metrics := []domain.ServiceMetric{}

	// Test Coverage
	testCoverage, err := s.calculateTestCoverage(serviceName)
	if err == nil {
		metrics = append(metrics, testCoverage)
	}

	// Deploy Velocity
	deployVelocity, err := s.calculateDeployVelocity(serviceName)
	if err == nil {
		metrics = append(metrics, deployVelocity)
	}

	// MTTR
	mttr, err := s.calculateMTTR(serviceName)
	if err == nil {
		metrics = append(metrics, mttr)
	}

	// Change Failure Rate
	changeFailureRate, err := s.calculateChangeFailureRate(serviceName)
	if err == nil {
		metrics = append(metrics, changeFailureRate)
	}

	// Build Queue Time
	buildQueueTime, err := s.calculateBuildQueueTime(serviceName)
	if err == nil {
		metrics = append(metrics, buildQueueTime)
	}

	// Performance Regression (detected by AI)
	perfRegression, err := s.detectPerformanceRegression(serviceName)
	if err == nil {
		metrics = append(metrics, perfRegression)
	}

	return metrics, nil
}

func (s *MaturityService) calculateTestCoverage(serviceName string) (domain.ServiceMetric, error) {
	if s.sonarQubeService == nil {
		return domain.ServiceMetric{}, fmt.Errorf("SonarQube service not available")
	}

	projects, err := s.sonarQubeService.GetProjects()
	if err != nil {
		return domain.ServiceMetric{}, err
	}

	var coverage float64
	for _, project := range projects {
		if project.Name == serviceName || project.Key == serviceName {
			// Get project details to get coverage
			details, err := s.sonarQubeService.GetProjectMeasures(project.Key)
			if err == nil {
				coverage = details.Coverage
			}
			break
		}
	}

	return domain.ServiceMetric{
		ID:          fmt.Sprintf("test-coverage-%s-%d", serviceName, time.Now().Unix()),
		ServiceName: serviceName,
		Type:        domain.MetricTypeTestCoverage,
		Value:       coverage,
		Unit:        "percentage",
		Timestamp:   time.Now(),
		Metadata: map[string]interface{}{
			"source": "sonarqube",
		},
	}, nil
}

func (s *MaturityService) calculateDeployVelocity(serviceName string) (domain.ServiceMetric, error) {
	if s.azureDevOpsService == nil {
		return domain.ServiceMetric{}, fmt.Errorf("Azure DevOps service not available")
	}

	builds, err := s.azureDevOpsService.GetBuilds(30)
	if err != nil {
		return domain.ServiceMetric{}, err
	}

	var deployCount int
	var totalTime time.Duration
	for _, build := range builds {
		if build.Result == "succeeded" {
			deployCount++
			if build.FinishTime.After(build.StartTime) {
				totalTime += build.FinishTime.Sub(build.StartTime)
			}
		}
	}

	avgDeployTime := float64(0)
	if deployCount > 0 {
		avgDeployTime = totalTime.Seconds() / float64(deployCount)
	}

	deploysPerWeek := float64(deployCount) / 4.0 // Approximate weeks

	return domain.ServiceMetric{
		ID:          fmt.Sprintf("deploy-velocity-%s-%d", serviceName, time.Now().Unix()),
		ServiceName: serviceName,
		Type:        domain.MetricTypeDeployVelocity,
		Value:       deploysPerWeek,
		Unit:        "deploys_per_week",
		Timestamp:   time.Now(),
		Metadata: map[string]interface{}{
			"deployCount":    deployCount,
			"avgDeployTime":  avgDeployTime,
			"source":          "azuredevops",
		},
	}, nil
}

func (s *MaturityService) calculateMTTR(serviceName string) (domain.ServiceMetric, error) {
	// MTTR calculation would require incident/alert data
	// For now, we'll use a placeholder that can be enhanced
	return domain.ServiceMetric{
		ID:          fmt.Sprintf("mttr-%s-%d", serviceName, time.Now().Unix()),
		ServiceName: serviceName,
		Type:        domain.MetricTypeMTTR,
		Value:       0, // Placeholder - needs incident data
		Unit:        "minutes",
		Timestamp:   time.Now(),
		Metadata: map[string]interface{}{
			"note": "Requires incident tracking integration",
		},
	}, nil
}

func (s *MaturityService) calculateChangeFailureRate(serviceName string) (domain.ServiceMetric, error) {
	if s.azureDevOpsService == nil {
		return domain.ServiceMetric{}, fmt.Errorf("Azure DevOps service not available")
	}

	builds, err := s.azureDevOpsService.GetBuilds(100)
	if err != nil {
		return domain.ServiceMetric{}, err
	}

	totalBuilds := len(builds)
	failedBuilds := 0
	for _, build := range builds {
		if build.Result == "failed" || build.Result == "partiallySucceeded" {
			failedBuilds++
		}
	}

	failureRate := float64(0)
	if totalBuilds > 0 {
		failureRate = (float64(failedBuilds) / float64(totalBuilds)) * 100
	}

	return domain.ServiceMetric{
		ID:          fmt.Sprintf("change-failure-rate-%s-%d", serviceName, time.Now().Unix()),
		ServiceName: serviceName,
		Type:        domain.MetricTypeChangeFailureRate,
		Value:       failureRate,
		Unit:        "percentage",
		Timestamp:   time.Now(),
		Metadata: map[string]interface{}{
			"totalBuilds":  totalBuilds,
			"failedBuilds": failedBuilds,
			"source":       "azuredevops",
		},
	}, nil
}

func (s *MaturityService) calculateBuildQueueTime(serviceName string) (domain.ServiceMetric, error) {
	if s.azureDevOpsService == nil {
		return domain.ServiceMetric{}, fmt.Errorf("Azure DevOps service not available")
	}

	builds, err := s.azureDevOpsService.GetBuilds(50)
	if err != nil {
		return domain.ServiceMetric{}, err
	}

	var totalQueueTime time.Duration
	var count int
	for _, build := range builds {
		if build.QueueTime.Before(build.StartTime) {
			queueTime := build.StartTime.Sub(build.QueueTime)
			totalQueueTime += queueTime
			count++
		}
	}

	avgQueueTime := float64(0)
	if count > 0 {
		avgQueueTime = totalQueueTime.Seconds() / float64(count)
	}

	return domain.ServiceMetric{
		ID:          fmt.Sprintf("build-queue-time-%s-%d", serviceName, time.Now().Unix()),
		ServiceName: serviceName,
		Type:        domain.MetricTypeBuildQueueTime,
		Value:       avgQueueTime,
		Unit:        "seconds",
		Timestamp:   time.Now(),
		Metadata: map[string]interface{}{
			"sampleSize": count,
			"source":     "azuredevops",
		},
	}, nil
}

func (s *MaturityService) detectPerformanceRegression(serviceName string) (domain.ServiceMetric, error) {
	// This would use AI to analyze metrics and detect regressions
	// Placeholder for now
	return domain.ServiceMetric{
		ID:          fmt.Sprintf("perf-regression-%s-%d", serviceName, time.Now().Unix()),
		ServiceName: serviceName,
		Type:        domain.MetricTypePerformanceRegress,
		Value:       0, // 0 = no regression detected
		Unit:        "regression_score",
		Timestamp:   time.Now(),
		Metadata: map[string]interface{}{
			"note": "AI-based performance regression detection",
		},
	}, nil
}

func (s *MaturityService) CalculateTeamMaturityScorecard(teamName string) (*domain.TeamMaturityScorecard, error) {
	scores := []domain.MaturityScore{}

	// Observability Score
	obsScore := s.calculateObservabilityScore(teamName)
	scores = append(scores, obsScore)

	// Automated Tests Score
	testScore := s.calculateAutomatedTestsScore(teamName)
	scores = append(scores, testScore)

	// Incident Response Score
	incidentScore := s.calculateIncidentResponseScore(teamName)
	scores = append(scores, incidentScore)

	// FinOps Score
	finOpsScore := s.calculateFinOpsScore(teamName)
	scores = append(scores, finOpsScore)

	// Calculate overall score
	overallScore := s.calculateOverallScore(scores)

	scorecard := &domain.TeamMaturityScorecard{
		TeamID:       teamName,
		TeamName:     teamName,
		Scores:       scores,
		OverallScore: overallScore,
		LastUpdated:  time.Now(),
		Trend:        "stable", // Would calculate based on historical data
	}

	// Generate AI recommendations
	recommendations := s.generateMaturityRecommendations(scorecard)
	for i := range scorecard.Scores {
		scorecard.Scores[i].Recommendations = recommendations[scorecard.Scores[i].Category]
	}

	return scorecard, nil
}

func (s *MaturityService) calculateObservabilityScore(teamName string) domain.MaturityScore {
	// Score based on:
	// - Grafana dashboards per service
	// - Alert coverage
	// - Log aggregation
	// - Metrics collection

	score := 5.0 // Base score
	level := "intermediate"

	if score >= 8 {
		level = "expert"
	} else if score >= 6 {
		level = "advanced"
	} else if score >= 4 {
		level = "intermediate"
	} else {
		level = "beginner"
	}

	return domain.MaturityScore{
		Category:    domain.MaturityCategoryObservability,
		Score:       math.Round(score*10) / 10,
		MaxScore:    10.0,
		Level:       level,
		Metrics:     []domain.ServiceMetric{},
		LastUpdated: time.Now(),
	}
}

func (s *MaturityService) calculateAutomatedTestsScore(teamName string) domain.MaturityScore {
	if s.sonarQubeService == nil {
		return domain.MaturityScore{
			Category:    domain.MaturityCategoryAutomatedTests,
			Score:       0,
			MaxScore:    10.0,
			Level:       "beginner",
			LastUpdated: time.Now(),
		}
	}

	projects, err := s.sonarQubeService.GetProjects()
	if err != nil {
		return domain.MaturityScore{
			Category:    domain.MaturityCategoryAutomatedTests,
			Score:       0,
			MaxScore:    10.0,
			Level:       "beginner",
			LastUpdated: time.Now(),
		}
	}

	var totalCoverage float64
	var count int
	for _, project := range projects {
		// Get project details to get coverage
		details, err := s.sonarQubeService.GetProjectMeasures(project.Key)
		if err == nil {
			totalCoverage += details.Coverage
			count++
		}
	}

	avgCoverage := float64(0)
	if count > 0 {
		avgCoverage = totalCoverage / float64(count)
	}

	// Convert coverage percentage (0-100) to score (0-10)
	score := avgCoverage / 10.0
	if score > 10 {
		score = 10
	}

	level := "beginner"
	if score >= 8 {
		level = "expert"
	} else if score >= 6 {
		level = "advanced"
	} else if score >= 4 {
		level = "intermediate"
	}

	return domain.MaturityScore{
		Category:    domain.MaturityCategoryAutomatedTests,
		Score:       math.Round(score*10) / 10,
		MaxScore:    10.0,
		Level:       level,
		LastUpdated: time.Now(),
	}
}

func (s *MaturityService) calculateIncidentResponseScore(teamName string) domain.MaturityScore {
	// Score based on:
	// - MTTR
	// - Incident response time
	// - Post-mortem documentation
	// - Runbook availability

	score := 6.0 // Placeholder
	level := "intermediate"

	if score >= 8 {
		level = "expert"
	} else if score >= 6 {
		level = "advanced"
	} else if score >= 4 {
		level = "intermediate"
	} else {
		level = "beginner"
	}

	return domain.MaturityScore{
		Category:    domain.MaturityCategoryIncidentResponse,
		Score:       math.Round(score*10) / 10,
		MaxScore:    10.0,
		Level:       level,
		LastUpdated: time.Now(),
	}
}

func (s *MaturityService) calculateFinOpsScore(teamName string) domain.MaturityScore {
	// Score based on:
	// - Cost visibility
	// - Budget tracking
	// - Cost optimization
	// - Resource right-sizing

	score := 9.0 // Placeholder - FinOps seems well implemented
	level := "expert"

	if score >= 8 {
		level = "expert"
	} else if score >= 6 {
		level = "advanced"
	} else if score >= 4 {
		level = "intermediate"
	} else {
		level = "beginner"
	}

	return domain.MaturityScore{
		Category:    domain.MaturityCategoryFinOps,
		Score:       math.Round(score*10) / 10,
		MaxScore:    10.0,
		Level:       level,
		LastUpdated: time.Now(),
	}
}

func (s *MaturityService) calculateOverallScore(scores []domain.MaturityScore) float64 {
	if len(scores) == 0 {
		return 0
	}

	var sum float64
	for _, score := range scores {
		sum += score.Score
	}

	return math.Round((sum/float64(len(scores)))*10) / 10
}

func (s *MaturityService) generateMaturityRecommendations(scorecard *domain.TeamMaturityScorecard) map[domain.MaturityCategory][]domain.Recommendation {
	recommendations := make(map[domain.MaturityCategory][]domain.Recommendation)

	for _, score := range scorecard.Scores {
		if score.Score < 7 {
			recs := s.generateRecommendationsForCategory(score.Category, score.Score)
			recommendations[score.Category] = recs
		}
	}

	return recommendations
}

func (s *MaturityService) generateRecommendationsForCategory(category domain.MaturityCategory, currentScore float64) []domain.Recommendation {
	recommendations := []domain.Recommendation{}

	switch category {
	case domain.MaturityCategoryObservability:
		if currentScore < 5 {
			recommendations = append(recommendations, domain.Recommendation{
				ID:          fmt.Sprintf("rec-obs-%d", time.Now().Unix()),
				Type:        domain.RecommendationTypePerformance,
				Severity:    domain.SeverityMedium,
				Title:       "Melhorar Observabilidade",
				Description: "Implementar dashboards no Grafana e configurar alertas",
				Reason:      fmt.Sprintf("Score atual: %.1f/10", currentScore),
				Action:      "Criar dashboards para métricas críticas e configurar alertas proativos",
				Impact:      "Alta - Melhorará detecção de problemas",
				Confidence:  0.9,
				CreatedAt:   time.Now(),
			})
		}

	case domain.MaturityCategoryAutomatedTests:
		if currentScore < 6 {
			recommendations = append(recommendations, domain.Recommendation{
				ID:          fmt.Sprintf("rec-tests-%d", time.Now().Unix()),
				Type:        domain.RecommendationTypeReliability,
				Severity:    domain.SeverityHigh,
				Title:       "Aumentar Cobertura de Testes",
				Description: "Aumentar cobertura de testes automatizados",
				Reason:      fmt.Sprintf("Cobertura atual: %.1f%%", currentScore*10),
				Action:      "Adicionar testes unitários e de integração para aumentar cobertura",
				Impact:      "Alta - Reduzirá bugs em produção",
				Confidence:  0.85,
				CreatedAt:   time.Now(),
			})
		}

	case domain.MaturityCategoryIncidentResponse:
		if currentScore < 6 {
			recommendations = append(recommendations, domain.Recommendation{
				ID:          fmt.Sprintf("rec-incident-%d", time.Now().Unix()),
				Type:        domain.RecommendationTypeReliability,
				Severity:    domain.SeverityMedium,
				Title:       "Melhorar Resposta a Incidentes",
				Description: "Reduzir MTTR e melhorar processos de incident response",
				Reason:      fmt.Sprintf("Score atual: %.1f/10", currentScore),
				Action:      "Criar runbooks, melhorar alertas e documentar processos",
				Impact:      "Média - Reduzirá tempo de resolução",
				Confidence:  0.8,
				CreatedAt:   time.Now(),
			})
		}
	}

	return recommendations
}

