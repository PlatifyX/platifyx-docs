package domain

import "time"

type Service struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Type        string    `json:"type"`
	Status      string    `json:"status"`
	Version     string    `json:"version"`
	DeployedAt  time.Time `json:"deployedAt"`
	Owner       string    `json:"owner"`
	Repository  string    `json:"repository"`
	Health      Health    `json:"health"`
}

type Health struct {
	Status       string  `json:"status"`
	Uptime       float64 `json:"uptime"`
	SuccessRate  float64 `json:"successRate"`
	ResponseTime float64 `json:"responseTime"`
}
