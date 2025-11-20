package domain

type AIProvider string

const (
	AIProviderOpenAI AIProvider = "openai"
	AIProviderClaude AIProvider = "claude"
	AIProviderGemini AIProvider = "gemini"
)

type AIGenerateDocRequest struct {
	Provider      AIProvider `json:"provider"`
	Source        string     `json:"source"` // "code", "github", "azuredevops"
	SourcePath    string     `json:"sourcePath,omitempty"`
	RepoURL       string     `json:"repoUrl,omitempty"`
	ProjectName   string     `json:"projectName,omitempty"`
	Code          string     `json:"code,omitempty"`
	Language      string     `json:"language,omitempty"`
	DocType       string     `json:"docType"` // "api", "architecture", "guide", "readme"
	Model         string     `json:"model,omitempty"`
	ReadFullRepo  bool       `json:"readFullRepo,omitempty"` // Read entire repository
	SavePath      string     `json:"savePath,omitempty"` // Custom save path (e.g., "ia/reponame.md")
}

type AIImproveDocRequest struct {
	Provider       AIProvider `json:"provider"`
	Content        string     `json:"content"`
	ImprovementType string    `json:"improvementType"` // "grammar", "clarity", "structure", "complete"
	Model          string     `json:"model,omitempty"`
}

type AIChatRequest struct {
	Provider    AIProvider `json:"provider"`
	Message     string     `json:"message"`
	Context     string     `json:"context,omitempty"`     // Document content for context
	Conversation []ChatMessage `json:"conversation,omitempty"` // Previous messages
	Model       string     `json:"model,omitempty"`
}

type ChatMessage struct {
	Role    string `json:"role"`    // "user", "assistant"
	Content string `json:"content"`
}

type AIResponse struct {
	Provider AIProvider `json:"provider"`
	Model    string     `json:"model"`
	Content  string     `json:"content"`
	Usage    *AIUsage   `json:"usage,omitempty"`
}

type AIUsage struct {
	InputTokens  int `json:"inputTokens"`
	OutputTokens int `json:"outputTokens"`
	TotalTokens  int `json:"totalTokens"`
}

type AIProviderInfo struct {
	Provider  AIProvider `json:"provider"`
	Name      string     `json:"name"`
	Available bool       `json:"available"`
	Models    []string   `json:"models"`
}
