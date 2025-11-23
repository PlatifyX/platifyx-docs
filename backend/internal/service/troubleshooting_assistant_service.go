package service

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/PlatifyX/platifyx-core/internal/domain"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
)

type TroubleshootingAssistantService struct {
	aiService          *AIService
	kubernetesService  *KubernetesService
	azureDevOpsService *AzureDevOpsService
	lokiService        interface{}
	prometheusService  interface{}
	log                *logger.Logger
}

func NewTroubleshootingAssistantService(
	aiService *AIService,
	kubernetesService *KubernetesService,
	azureDevOpsService *AzureDevOpsService,
	log *logger.Logger,
) *TroubleshootingAssistantService {
	return &TroubleshootingAssistantService{
		aiService:          aiService,
		kubernetesService:  kubernetesService,
		azureDevOpsService: azureDevOpsService,
		log:                log,
	}
}

func (s *TroubleshootingAssistantService) Troubleshoot(req domain.TroubleshootingRequest) (*domain.TroubleshootingResponse, error) {
	if s.aiService == nil {
		return nil, fmt.Errorf("AI service not available")
	}

	contextData := s.gatherContext(req)

	messages := []domain.ChatMessage{
		{
			Role: "system",
			Content: `Você é um assistente especializado em troubleshooting de infraestrutura DevOps e Kubernetes.
Analise o contexto fornecido e responda com:
1. Causa raiz do problema
2. Solução recomendada
3. Evidências encontradas
4. Ações sugeridas

Seja técnico, preciso e direto.`,
		},
		{
			Role: "user",
			Content: s.buildPrompt(req, contextData),
		},
	}

	response, err := s.aiService.GenerateChat(domain.AIProviderClaude, messages, "")
	if err != nil {
		return nil, err
	}

	return s.parseTroubleshootingResponse(response.Content, contextData)
}

func (s *TroubleshootingAssistantService) gatherContext(req domain.TroubleshootingRequest) map[string]interface{} {
	context := make(map[string]interface{})

	if req.ServiceName != "" && s.kubernetesService != nil {
		deployments, err := s.kubernetesService.GetDeployments(req.Namespace)
		if err == nil {
			for _, dep := range deployments {
				if dep.Name == req.ServiceName {
					status := "healthy"
					if dep.ReadyReplicas < dep.Replicas {
						status = "degraded"
					}
					if dep.ReadyReplicas == 0 && dep.Replicas > 0 {
						status = "unavailable"
					}
					context["deployment"] = map[string]interface{}{
						"name":          dep.Name,
						"namespace":     dep.Namespace,
						"replicas":      dep.Replicas,
						"readyReplicas": dep.ReadyReplicas,
						"status":        status,
					}
					break
				}
			}
		}

		pods, err := s.kubernetesService.GetPods(req.Namespace)
		if err == nil {
			podList := []map[string]interface{}{}
			for _, pod := range pods {
				if strings.Contains(pod.Name, req.ServiceName) {
					podList = append(podList, map[string]interface{}{
						"name":   pod.Name,
						"status": pod.Status,
						"ready":  pod.Ready,
					})
				}
			}
			if len(podList) > 0 {
				context["pods"] = podList
			}
		}
	}

	if req.Deployment != "" && s.azureDevOpsService != nil {
		builds, err := s.azureDevOpsService.GetBuilds(10)
		if err == nil {
			recentBuilds := []map[string]interface{}{}
			for _, build := range builds {
				if build.Status == "failed" || build.Status == "partiallySucceeded" {
					recentBuilds = append(recentBuilds, map[string]interface{}{
						"id":     build.ID,
						"status": build.Status,
						"result": build.Result,
					})
				}
			}
			if len(recentBuilds) > 0 {
				context["recentFailedBuilds"] = recentBuilds
			}
		}
	}

	if req.Context != nil {
		for k, v := range req.Context {
			context[k] = v
		}
	}

	return context
}

func (s *TroubleshootingAssistantService) buildPrompt(req domain.TroubleshootingRequest, context map[string]interface{}) string {
	contextJSON, _ := json.MarshalIndent(context, "", "  ")

	return fmt.Sprintf(`Pergunta: %s

Contexto da infraestrutura:
%s

Analise e forneça:
1. Causa raiz identificada
2. Solução recomendada
3. Evidências encontradas
4. Ações sugeridas (com comandos se aplicável)`, req.Question, string(contextJSON))
}

func (s *TroubleshootingAssistantService) parseTroubleshootingResponse(aiResponse string, context map[string]interface{}) (*domain.TroubleshootingResponse, error) {
	response := &domain.TroubleshootingResponse{
		Answer:     aiResponse,
		Confidence: 0.8,
		Evidence:   []string{},
		Actions:    []domain.RecommendedAction{},
	}

	lines := strings.Split(aiResponse, "\n")
	var currentSection string

	for _, line := range lines {
		line = strings.TrimSpace(line)
		if strings.Contains(strings.ToLower(line), "causa raiz") || strings.Contains(strings.ToLower(line), "root cause") {
			currentSection = "rootCause"
			response.RootCause = strings.TrimPrefix(line, "Causa raiz:")
			response.RootCause = strings.TrimPrefix(response.RootCause, "Root Cause:")
			response.RootCause = strings.TrimSpace(response.RootCause)
		} else if strings.Contains(strings.ToLower(line), "solução") || strings.Contains(strings.ToLower(line), "solution") {
			currentSection = "solution"
			response.Solution = strings.TrimPrefix(line, "Solução:")
			response.Solution = strings.TrimPrefix(response.Solution, "Solution:")
			response.Solution = strings.TrimSpace(response.Solution)
		} else if currentSection == "rootCause" && response.RootCause != "" {
			response.RootCause += " " + line
		} else if currentSection == "solution" && response.Solution != "" {
			response.Solution += " " + line
		}
	}

	if response.RootCause == "" {
		response.RootCause = "Análise em andamento - verifique os logs e métricas"
	}

	if response.Solution == "" {
		response.Solution = aiResponse
	}

	return response, nil
}

