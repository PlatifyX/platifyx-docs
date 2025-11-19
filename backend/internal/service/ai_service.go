package service

import (
	"fmt"
	"strings"

	"github.com/PlatifyX/platifyx-core/internal/domain"
	"github.com/PlatifyX/platifyx-core/pkg/claude"
	"github.com/PlatifyX/platifyx-core/pkg/gemini"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"github.com/PlatifyX/platifyx-core/pkg/openai"
)

type AIService struct {
	integrationService *IntegrationService
	log                *logger.Logger
}

func NewAIService(integrationService *IntegrationService, log *logger.Logger) *AIService {
	return &AIService{
		integrationService: integrationService,
		log:                log,
	}
}

// GetAvailableProviders returns list of available AI providers
func (s *AIService) GetAvailableProviders() ([]domain.AIProviderInfo, error) {
	providers := []domain.AIProviderInfo{}

	// Check OpenAI
	openaiConfig, err := s.integrationService.GetOpenAIConfig()
	if err == nil && openaiConfig != nil && openaiConfig.APIKey != "" {
		providers = append(providers, domain.AIProviderInfo{
			Provider:  domain.AIProviderOpenAI,
			Name:      "OpenAI",
			Available: true,
			Models:    []string{"gpt-4", "gpt-4-turbo-preview", "gpt-3.5-turbo"},
		})
	}

	// Check Claude
	claudeConfig, err := s.integrationService.GetClaudeConfig()
	if err == nil && claudeConfig != nil && claudeConfig.APIKey != "" {
		providers = append(providers, domain.AIProviderInfo{
			Provider:  domain.AIProviderClaude,
			Name:      "Claude (Anthropic)",
			Available: true,
			Models:    []string{"claude-3-opus-20240229", "claude-3-sonnet-20240229", "claude-3-haiku-20240307"},
		})
	}

	// Check Gemini
	geminiConfig, err := s.integrationService.GetGeminiConfig()
	if err == nil && geminiConfig != nil && geminiConfig.APIKey != "" {
		providers = append(providers, domain.AIProviderInfo{
			Provider:  domain.AIProviderGemini,
			Name:      "Google Gemini",
			Available: true,
			Models:    []string{"gemini-pro", "gemini-1.5-pro-latest"},
		})
	}

	return providers, nil
}

// GenerateCompletion generates text completion using specified provider
func (s *AIService) GenerateCompletion(provider domain.AIProvider, prompt string, model string) (*domain.AIResponse, error) {
	s.log.Infow("Generating completion", "provider", provider, "model", model)

	switch provider {
	case domain.AIProviderOpenAI:
		return s.generateOpenAICompletion(prompt, model)
	case domain.AIProviderClaude:
		return s.generateClaudeCompletion(prompt, model)
	case domain.AIProviderGemini:
		return s.generateGeminiCompletion(prompt, model)
	default:
		return nil, fmt.Errorf("unsupported AI provider: %s", provider)
	}
}

// GenerateChat generates chat response using specified provider
func (s *AIService) GenerateChat(provider domain.AIProvider, messages []domain.ChatMessage, model string) (*domain.AIResponse, error) {
	s.log.Infow("Generating chat response", "provider", provider, "model", model, "messages", len(messages))

	switch provider {
	case domain.AIProviderOpenAI:
		return s.generateOpenAIChat(messages, model)
	case domain.AIProviderClaude:
		return s.generateClaudeChat(messages, model)
	case domain.AIProviderGemini:
		return s.generateGeminiChat(messages, model)
	default:
		return nil, fmt.Errorf("unsupported AI provider: %s", provider)
	}
}

func (s *AIService) generateOpenAICompletion(prompt string, model string) (*domain.AIResponse, error) {
	config, err := s.integrationService.GetOpenAIConfig()
	if err != nil {
		return nil, fmt.Errorf("OpenAI not configured: %w", err)
	}

	client := openai.NewClient(config.APIKey, config.Organization)

	if model == "" {
		model = "gpt-4"
	}

	request := openai.ChatCompletionRequest{
		Model: model,
		Messages: []openai.ChatMessage{
			{Role: "user", Content: prompt},
		},
	}

	resp, err := client.CreateChatCompletion(request)
	if err != nil {
		return nil, fmt.Errorf("OpenAI API error: %w", err)
	}

	if len(resp.Choices) == 0 {
		return nil, fmt.Errorf("no response from OpenAI")
	}

	return &domain.AIResponse{
		Provider: domain.AIProviderOpenAI,
		Model:    resp.Model,
		Content:  resp.Choices[0].Message.Content,
	}, nil
}

func (s *AIService) generateOpenAIChat(messages []domain.ChatMessage, model string) (*domain.AIResponse, error) {
	config, err := s.integrationService.GetOpenAIConfig()
	if err != nil {
		return nil, fmt.Errorf("OpenAI not configured: %w", err)
	}

	client := openai.NewClient(config.APIKey, config.Organization)

	if model == "" {
		model = "gpt-4"
	}

	openaiMessages := make([]openai.ChatMessage, len(messages))
	for i, msg := range messages {
		openaiMessages[i] = openai.ChatMessage{
			Role:    msg.Role,
			Content: msg.Content,
		}
	}

	request := openai.ChatCompletionRequest{
		Model:    model,
		Messages: openaiMessages,
	}

	resp, err := client.CreateChatCompletion(request)
	if err != nil {
		return nil, fmt.Errorf("OpenAI API error: %w", err)
	}

	if len(resp.Choices) == 0 {
		return nil, fmt.Errorf("no response from OpenAI")
	}

	return &domain.AIResponse{
		Provider: domain.AIProviderOpenAI,
		Model:    resp.Model,
		Content:  resp.Choices[0].Message.Content,
	}, nil
}

func (s *AIService) generateClaudeCompletion(prompt string, model string) (*domain.AIResponse, error) {
	config, err := s.integrationService.GetClaudeConfig()
	if err != nil {
		return nil, fmt.Errorf("Claude not configured: %w", err)
	}

	client := claude.NewClient(config.APIKey)

	if model == "" {
		model = "claude-3-sonnet-20240229"
	}

	request := claude.MessageRequest{
		Model:     model,
		MaxTokens: 4096,
		Messages: []claude.Message{
			{Role: "user", Content: prompt},
		},
	}

	resp, err := client.CreateMessage(request)
	if err != nil {
		return nil, fmt.Errorf("Claude API error: %w", err)
	}

	if len(resp.Content) == 0 {
		return nil, fmt.Errorf("no response from Claude")
	}

	return &domain.AIResponse{
		Provider: domain.AIProviderClaude,
		Model:    resp.Model,
		Content:  resp.Content[0].Text,
		Usage: &domain.AIUsage{
			InputTokens:  resp.Usage.InputTokens,
			OutputTokens: resp.Usage.OutputTokens,
			TotalTokens:  resp.Usage.InputTokens + resp.Usage.OutputTokens,
		},
	}, nil
}

func (s *AIService) generateClaudeChat(messages []domain.ChatMessage, model string) (*domain.AIResponse, error) {
	config, err := s.integrationService.GetClaudeConfig()
	if err != nil {
		return nil, fmt.Errorf("Claude not configured: %w", err)
	}

	client := claude.NewClient(config.APIKey)

	if model == "" {
		model = "claude-3-sonnet-20240229"
	}

	claudeMessages := make([]claude.Message, len(messages))
	for i, msg := range messages {
		claudeMessages[i] = claude.Message{
			Role:    msg.Role,
			Content: msg.Content,
		}
	}

	request := claude.MessageRequest{
		Model:     model,
		MaxTokens: 4096,
		Messages:  claudeMessages,
	}

	resp, err := client.CreateMessage(request)
	if err != nil {
		return nil, fmt.Errorf("Claude API error: %w", err)
	}

	if len(resp.Content) == 0 {
		return nil, fmt.Errorf("no response from Claude")
	}

	return &domain.AIResponse{
		Provider: domain.AIProviderClaude,
		Model:    resp.Model,
		Content:  resp.Content[0].Text,
		Usage: &domain.AIUsage{
			InputTokens:  resp.Usage.InputTokens,
			OutputTokens: resp.Usage.OutputTokens,
			TotalTokens:  resp.Usage.InputTokens + resp.Usage.OutputTokens,
		},
	}, nil
}

func (s *AIService) generateGeminiCompletion(prompt string, model string) (*domain.AIResponse, error) {
	config, err := s.integrationService.GetGeminiConfig()
	if err != nil {
		return nil, fmt.Errorf("Gemini not configured: %w", err)
	}

	client := gemini.NewClient(config.APIKey)

	if model == "" {
		model = "gemini-pro"
	}

	request := gemini.GenerateContentRequest{
		Contents: []gemini.Content{
			{
				Parts: []gemini.Part{
					{Text: prompt},
				},
			},
		},
	}

	resp, err := client.GenerateContent(model, request)
	if err != nil {
		return nil, fmt.Errorf("Gemini API error: %w", err)
	}

	if len(resp.Candidates) == 0 || len(resp.Candidates[0].Content.Parts) == 0 {
		return nil, fmt.Errorf("no response from Gemini")
	}

	return &domain.AIResponse{
		Provider: domain.AIProviderGemini,
		Model:    model,
		Content:  resp.Candidates[0].Content.Parts[0].Text,
	}, nil
}

func (s *AIService) generateGeminiChat(messages []domain.ChatMessage, model string) (*domain.AIResponse, error) {
	config, err := s.integrationService.GetGeminiConfig()
	if err != nil {
		return nil, fmt.Errorf("Gemini not configured: %w", err)
	}

	client := gemini.NewClient(config.APIKey)

	if model == "" {
		model = "gemini-pro"
	}

	// Combine messages into a single prompt for Gemini
	var promptBuilder strings.Builder
	for _, msg := range messages {
		promptBuilder.WriteString(fmt.Sprintf("%s: %s\n", msg.Role, msg.Content))
	}

	request := gemini.GenerateContentRequest{
		Contents: []gemini.Content{
			{
				Parts: []gemini.Part{
					{Text: promptBuilder.String()},
				},
			},
		},
	}

	resp, err := client.GenerateContent(model, request)
	if err != nil {
		return nil, fmt.Errorf("Gemini API error: %w", err)
	}

	if len(resp.Candidates) == 0 || len(resp.Candidates[0].Content.Parts) == 0 {
		return nil, fmt.Errorf("no response from Gemini")
	}

	return &domain.AIResponse{
		Provider: domain.AIProviderGemini,
		Model:    model,
		Content:  resp.Candidates[0].Content.Parts[0].Text,
	}, nil
}
