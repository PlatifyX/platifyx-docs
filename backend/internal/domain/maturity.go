package domain

import "time"

type MetricType string

const (
	MetricTypeTestCoverage      MetricType = "test_coverage"
	MetricTypeDeployVelocity    MetricType = "deploy_velocity"
	MetricTypeMTTR              MetricType = "mttr"
	MetricTypeChangeFailureRate MetricType = "change_failure_rate"
	MetricTypeBuildQueueTime    MetricType = "build_queue_time"
	MetricTypePerformanceRegress MetricType = "performance_regression"
)

type MaturityCategory string

const (
	MaturityCategoryObservability    MaturityCategory = "observability"
	MaturityCategoryAutomatedTests   MaturityCategory = "automated_tests"
	MaturityCategoryIncidentResponse MaturityCategory = "incident_response"
	MaturityCategoryFinOps           MaturityCategory = "finops"
	MaturityCategorySecurity         MaturityCategory = "security"
	MaturityCategoryDocumentation    MaturityCategory = "documentation"
)

type ServiceMetric struct {
	ID          string                 `json:"id"`
	ServiceName string                 `json:"serviceName"`
	PRNumber    string                 `json:"prNumber,omitempty"`
	Type        MetricType             `json:"type"`
	Value       float64                `json:"value"`
	Unit        string                 `json:"unit"`
	Timestamp   time.Time              `json:"timestamp"`
	Metadata    map[string]interface{} `json:"metadata,omitempty"`
}

type MaturityScore struct {
	Category     MaturityCategory      `json:"category"`
	Score        float64               `json:"score"`        // 0-10
	MaxScore     float64               `json:"maxScore"`    // Always 10
	Level        string                `json:"level"`       // "beginner", "intermediate", "advanced", "expert"
	Metrics      []ServiceMetric       `json:"metrics"`
	Recommendations []Recommendation   `json:"recommendations"`
	LastUpdated  time.Time             `json:"lastUpdated"`
}

type TeamMaturityScorecard struct {
	TeamID       string                 `json:"teamId"`
	TeamName     string                 `json:"teamName"`
	Scores       []MaturityScore        `json:"scores"`
	OverallScore float64                `json:"overallScore"` // Average of all categories
	Rank         int                    `json:"rank,omitempty"`
	LastUpdated  time.Time              `json:"lastUpdated"`
	Trend        string                 `json:"trend"` // "improving", "stable", "declining"
}

type ServiceMaturityScorecard struct {
	ServiceName  string                 `json:"serviceName"`
	Scores       []MaturityScore        `json:"scores"`
	OverallScore float64                `json:"overallScore"`
	LastUpdated  time.Time              `json:"lastUpdated"`
}

type MaturityRecommendation struct {
	Category    MaturityCategory `json:"category"`
	Priority    string           `json:"priority"` // "high", "medium", "low"
	Title       string           `json:"title"`
	Description string           `json:"description"`
	Action      string           `json:"action"`
	Impact      string           `json:"impact"`
	Effort      string           `json:"effort"` // "low", "medium", "high"
}

