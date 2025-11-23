package domain

import "time"

type RecommendationType string

const (
	RecommendationTypeDeployment RecommendationType = "deployment"
	RecommendationTypeCost       RecommendationType = "cost"
	RecommendationTypeSecurity   RecommendationType = "security"
	RecommendationTypePerformance RecommendationType = "performance"
	RecommendationTypeReliability RecommendationType = "reliability"
)

type RecommendationSeverity string

const (
	SeverityLow      RecommendationSeverity = "low"
	SeverityMedium   RecommendationSeverity = "medium"
	SeverityHigh     RecommendationSeverity = "high"
	SeverityCritical RecommendationSeverity = "critical"
)

type Recommendation struct {
	ID          string                 `json:"id"`
	Type        RecommendationType     `json:"type"`
	Severity    RecommendationSeverity `json:"severity"`
	Title       string                 `json:"title"`
	Description string                 `json:"description"`
	Reason      string                 `json:"reason"`
	Action      string                 `json:"action"`
	Impact      string                 `json:"impact"`
	Confidence  float64                `json:"confidence"`
	Metadata    map[string]interface{} `json:"metadata,omitempty"`
	CreatedAt   time.Time              `json:"createdAt"`
	ExpiresAt   *time.Time             `json:"expiresAt,omitempty"`
}

type TroubleshootingRequest struct {
	Question    string                 `json:"question"`
	Context     map[string]interface{} `json:"context,omitempty"`
	ServiceName string                 `json:"serviceName,omitempty"`
	Deployment  string                 `json:"deployment,omitempty"`
	Namespace   string                 `json:"namespace,omitempty"`
}

type TroubleshootingResponse struct {
	Answer       string                 `json:"answer"`
	Confidence   float64                `json:"confidence"`
	RootCause    string                 `json:"rootCause"`
	Solution     string                 `json:"solution"`
	Evidence     []string               `json:"evidence"`
	RelatedLogs  []string               `json:"relatedLogs,omitempty"`
	RelatedMetrics map[string]interface{} `json:"relatedMetrics,omitempty"`
	Actions      []RecommendedAction    `json:"actions,omitempty"`
}

type RecommendedAction struct {
	Type        string                 `json:"type"`
	Description string                 `json:"description"`
	Command     string                 `json:"command,omitempty"`
	APIEndpoint string                 `json:"apiEndpoint,omitempty"`
	Parameters  map[string]interface{} `json:"parameters,omitempty"`
	AutoExecute bool                   `json:"autoExecute"`
}

type AutonomousAction struct {
	ID          string                 `json:"id"`
	Type        string                 `json:"type"`
	Status      string                 `json:"status"`
	Description string                 `json:"description"`
	Trigger     string                 `json:"trigger"`
	Action      RecommendedAction     `json:"action"`
	Result      map[string]interface{} `json:"result,omitempty"`
	Error       string                 `json:"error,omitempty"`
	CreatedAt   time.Time              `json:"createdAt"`
	ExecutedAt  *time.Time             `json:"executedAt,omitempty"`
	ExecutedBy  string                 `json:"executedBy"`
}

type AutonomousConfig struct {
	Enabled           bool     `json:"enabled"`
	AutoExecute       bool     `json:"autoExecute"`
	RequireApproval   bool     `json:"requireApproval"`
	AllowedActions    []string `json:"allowedActions"`
	NotificationChannels []string `json:"notificationChannels"`
}

