package domain

import "time"

type LokiConfig struct {
	URL      string
	Username string
	Password string
}

// LokiLabel represents a label from Loki
type LokiLabel struct {
	Name   string   `json:"name"`
	Values []string `json:"values"`
}

// LokiLogEntry represents a single log line
type LokiLogEntry struct {
	Timestamp time.Time         `json:"timestamp"`
	Line      string            `json:"line"`
	Labels    map[string]string `json:"labels"`
}

// LokiStream represents a stream of logs with labels
type LokiStream struct {
	Stream map[string]string `json:"stream"`
	Values [][]string        `json:"values"` // [[timestamp, line], ...]
}

// LokiQueryResult represents the result of a Loki query
type LokiQueryResult struct {
	Status string `json:"status"`
	Data   struct {
		ResultType string       `json:"resultType"`
		Result     []LokiStream `json:"result"`
		Stats      interface{}  `json:"stats,omitempty"`
	} `json:"data"`
}
