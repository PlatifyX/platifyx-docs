package service

type MetricsService struct{}

func NewMetricsService() *MetricsService {
	return &MetricsService{}
}

func (m *MetricsService) GetDashboardMetrics() map[string]interface{} {
	return map[string]interface{}{
		"activeServices": 42,
		"deployFrequency": map[string]interface{}{
			"value":  "23/dia",
			"change": "+12%",
			"trend":  "up",
		},
		"mttr": map[string]interface{}{
			"value":  "18min",
			"change": "-8%",
			"trend":  "down",
		},
		"successRate": map[string]interface{}{
			"value":  "99.2%",
			"change": "+0.3%",
			"trend":  "up",
		},
	}
}

func (m *MetricsService) GetDORAMetrics() map[string]interface{} {
	return map[string]interface{}{
		"deploymentFrequency": map[string]interface{}{
			"value":       23.5,
			"unit":        "per day",
			"classification": "Elite",
		},
		"leadTimeForChanges": map[string]interface{}{
			"value":       45,
			"unit":        "minutes",
			"classification": "Elite",
		},
		"changeFailureRate": map[string]interface{}{
			"value":       2.3,
			"unit":        "percent",
			"classification": "High",
		},
		"timeToRestore": map[string]interface{}{
			"value":       18,
			"unit":        "minutes",
			"classification": "Elite",
		},
	}
}
