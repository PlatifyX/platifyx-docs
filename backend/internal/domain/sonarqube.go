package domain

import "time"

type SonarQubeConfig struct {
	URL   string
	Token string
}

type SonarProject struct {
	Key            string    `json:"key"`
	Name           string    `json:"name"`
	Qualifier      string    `json:"qualifier"`
	Visibility     string    `json:"visibility"`
	LastAnalysisDate time.Time `json:"lastAnalysisDate,omitempty"`
	Integration    string    `json:"integration,omitempty"`
}

type SonarMeasure struct {
	Metric string `json:"metric"`
	Value  string `json:"value"`
}

type SonarProjectDetails struct {
	Key          string         `json:"key"`
	Name         string         `json:"name"`
	Integration  string         `json:"integration,omitempty"`
	Measures     []SonarMeasure `json:"measures"`

	// Parsed metrics for easier access
	Bugs            int     `json:"bugs"`
	Vulnerabilities int     `json:"vulnerabilities"`
	CodeSmells      int     `json:"code_smells"`
	Coverage        float64 `json:"coverage"`
	Duplications    float64 `json:"duplications"`
	SecurityHotspots int    `json:"security_hotspots"`
	Lines           int     `json:"lines"`
	QualityGateStatus string `json:"qualityGateStatus"`
}

type SonarIssue struct {
	Key          string    `json:"key"`
	Rule         string    `json:"rule"`
	Severity     string    `json:"severity"`
	Component    string    `json:"component"`
	Project      string    `json:"project"`
	Line         int       `json:"line,omitempty"`
	Message      string    `json:"message"`
	Author       string    `json:"author,omitempty"`
	CreationDate time.Time `json:"creationDate"`
	UpdateDate   time.Time `json:"updateDate"`
	Type         string    `json:"type"`
	Status       string    `json:"status"`
	Integration  string    `json:"integration,omitempty"`
}

type QualityGate struct {
	Key        string              `json:"key"`
	Name       string              `json:"name"`
	IsBuiltIn  bool                `json:"isBuiltIn"`
	IsDefault  bool                `json:"isDefault"`
	Conditions []QualityGateCondition `json:"conditions,omitempty"`
}

type QualityGateCondition struct {
	ID       string `json:"id"`
	Metric   string `json:"metric"`
	Op       string `json:"op"`
	Error    string `json:"error"`
}

type ProjectQualityGateStatus struct {
	ProjectKey    string    `json:"projectKey"`
	ProjectName   string    `json:"projectName"`
	Status        string    `json:"status"`
	AnalysisDate  time.Time `json:"analysisDate"`
	Conditions    []ConditionStatus `json:"conditions"`
	Integration   string    `json:"integration,omitempty"`
}

type ConditionStatus struct {
	Status         string `json:"status"`
	MetricKey      string `json:"metricKey"`
	Comparator     string `json:"comparator"`
	ErrorThreshold string `json:"errorThreshold"`
	ActualValue    string `json:"actualValue"`
}
