package domain

import "time"

// Prometheus integration configuration
type PrometheusConfig struct {
	URL      string `json:"url"`
	Username string `json:"username,omitempty"`
	Password string `json:"password,omitempty"`
}

// Prometheus Query Result
type PrometheusQueryResult struct {
	Status string                 `json:"status"`
	Data   PrometheusQueryData    `json:"data"`
	Error  string                 `json:"error,omitempty"`
}

type PrometheusQueryData struct {
	ResultType string                  `json:"resultType"`
	Result     []PrometheusMetricValue `json:"result"`
}

type PrometheusMetricValue struct {
	Metric map[string]string `json:"metric"`
	Value  []interface{}     `json:"value,omitempty"`
	Values [][]interface{}   `json:"values,omitempty"`
}

// Prometheus Target
type PrometheusTarget struct {
	DiscoveredLabels map[string]string `json:"discoveredLabels"`
	Labels           map[string]string `json:"labels"`
	ScrapePool       string            `json:"scrapePool"`
	ScrapeURL        string            `json:"scrapeUrl"`
	GlobalURL        string            `json:"globalUrl"`
	LastError        string            `json:"lastError"`
	LastScrape       time.Time         `json:"lastScrape"`
	LastScrapeDuration float64         `json:"lastScrapeDuration"`
	Health           string            `json:"health"` // up, down, unknown
}

type PrometheusTargetsResult struct {
	Status string                    `json:"status"`
	Data   PrometheusTargetsData     `json:"data"`
}

type PrometheusTargetsData struct {
	ActiveTargets  []PrometheusTarget `json:"activeTargets"`
	DroppedTargets []PrometheusTarget `json:"droppedTargets"`
}

// Prometheus Alert
type PrometheusAlert struct {
	Labels      map[string]string `json:"labels"`
	Annotations map[string]string `json:"annotations"`
	State       string            `json:"state"` // inactive, pending, firing
	ActiveAt    *time.Time        `json:"activeAt,omitempty"`
	Value       string            `json:"value"`
}

type PrometheusAlertsResult struct {
	Status string                `json:"status"`
	Data   PrometheusAlertsData  `json:"data"`
}

type PrometheusAlertsData struct {
	Alerts []PrometheusAlert `json:"alerts"`
}

// Prometheus Rule
type PrometheusRule struct {
	Name        string            `json:"name"`
	Query       string            `json:"query"`
	Duration    float64           `json:"duration"`
	Labels      map[string]string `json:"labels"`
	Annotations map[string]string `json:"annotations"`
	Alerts      []PrometheusAlert `json:"alerts,omitempty"`
	Health      string            `json:"health"`
	LastError   string            `json:"lastError,omitempty"`
	Type        string            `json:"type"` // alerting, recording
	State       string            `json:"state,omitempty"`
}

type PrometheusRuleGroup struct {
	Name     string           `json:"name"`
	File     string           `json:"file"`
	Rules    []PrometheusRule `json:"rules"`
	Interval float64          `json:"interval"`
}

type PrometheusRulesResult struct {
	Status string               `json:"status"`
	Data   PrometheusRulesData  `json:"data"`
}

type PrometheusRulesData struct {
	Groups []PrometheusRuleGroup `json:"groups"`
}

// Prometheus Label Values
type PrometheusLabelValuesResult struct {
	Status string   `json:"status"`
	Data   []string `json:"data"`
}

// Prometheus Series
type PrometheusSeriesResult struct {
	Status string              `json:"status"`
	Data   []map[string]string `json:"data"`
}

// Prometheus Metadata
type PrometheusMetadata struct {
	Type string `json:"type"`
	Help string `json:"help"`
	Unit string `json:"unit"`
}

type PrometheusMetadataResult struct {
	Status string                        `json:"status"`
	Data   map[string][]PrometheusMetadata `json:"data"`
}

// Prometheus Build Info
type PrometheusBuildInfo struct {
	Version   string `json:"version"`
	Revision  string `json:"revision"`
	Branch    string `json:"branch"`
	BuildUser string `json:"buildUser"`
	BuildDate string `json:"buildDate"`
	GoVersion string `json:"goVersion"`
}

type PrometheusBuildInfoResult struct {
	Status string                        `json:"status"`
	Data   map[string]string             `json:"data"`
}

// Prometheus Runtime Info
type PrometheusRuntimeInfo struct {
	StartTime           time.Time `json:"startTime"`
	CWD                 string    `json:"CWD"`
	ReloadConfigSuccess bool      `json:"reloadConfigSuccess"`
	LastConfigTime      time.Time `json:"lastConfigTime"`
	CorruptionCount     int       `json:"corruptionCount"`
	GoroutineCount      int       `json:"goroutineCount"`
	GOMAXPROCS          int       `json:"GOMAXPROCS"`
	GOGC                string    `json:"GOGC"`
	GOMEMLIMIT          string    `json:"GOMEMLIMIT"`
	StorageRetention    string    `json:"storageRetention"`
}

// Stats for dashboard
type PrometheusStats struct {
	TotalTargets     int `json:"totalTargets"`
	UpTargets        int `json:"upTargets"`
	DownTargets      int `json:"downTargets"`
	TotalAlerts      int `json:"totalAlerts"`
	FiringAlerts     int `json:"firingAlerts"`
	PendingAlerts    int `json:"pendingAlerts"`
	TotalRules       int `json:"totalRules"`
	TotalRuleGroups  int `json:"totalRuleGroups"`
	Version          string `json:"version"`
}
