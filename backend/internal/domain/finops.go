package domain

import "time"

// Cloud provider types
const (
	CloudProviderAzure CloudProvider = "azure"
	CloudProviderGCP   CloudProvider = "gcp"
	CloudProviderAWS   CloudProvider = "aws"
)

type CloudProvider string

// Configuration structures for each provider
type AzureCloudConfig struct {
	SubscriptionID string
	TenantID       string
	ClientID       string
	ClientSecret   string
}

type GCPCloudConfig struct {
	ProjectID          string
	ServiceAccountJSON string
}

type AWSCloudConfig struct {
	AccessKeyID     string
	SecretAccessKey string
	Region          string
}

// Cost and resource models
type CloudCost struct {
	Provider      string    `json:"provider"`
	Integration   string    `json:"integration"`
	ServiceName   string    `json:"serviceName"`
	ResourceGroup string    `json:"resourceGroup,omitempty"`
	Cost          float64   `json:"cost"`
	Currency      string    `json:"currency"`
	Period        string    `json:"period"` // daily, monthly, etc
	Date          time.Time `json:"date"`
}

type CloudResource struct {
	Provider      string                 `json:"provider"`
	Integration   string                 `json:"integration"`
	ResourceID    string                 `json:"resourceId"`
	ResourceName  string                 `json:"resourceName"`
	ResourceType  string                 `json:"resourceType"`
	ResourceGroup string                 `json:"resourceGroup,omitempty"`
	Region        string                 `json:"region"`
	Status        string                 `json:"status"`
	Tags          map[string]string      `json:"tags,omitempty"`
	Cost          float64                `json:"cost,omitempty"`
	Metadata      map[string]interface{} `json:"metadata,omitempty"`
	CreatedDate   time.Time              `json:"createdDate,omitempty"`
}

type CloudBudget struct {
	Provider    string    `json:"provider"`
	Integration string    `json:"integration"`
	Name        string    `json:"name"`
	Amount      float64   `json:"amount"`
	Currency    string    `json:"currency"`
	Period      string    `json:"period"`
	CurrentCost float64   `json:"currentCost"`
	Percentage  float64   `json:"percentage"`
	Status      string    `json:"status"` // ok, warning, critical
	StartDate   time.Time `json:"startDate"`
	EndDate     time.Time `json:"endDate"`
}

type FinOpsStats struct {
	TotalCost         float64            `json:"totalCost"`
	MonthlyCost       float64            `json:"monthlyCost"`
	DailyCost         float64            `json:"dailyCost"`
	CostTrend         float64            `json:"costTrend"` // percentage change
	TotalResources    int                `json:"totalResources"`
	ActiveResources   int                `json:"activeResources"`
	InactiveResources int                `json:"inactiveResources"`
	CostByProvider    map[string]float64 `json:"costByProvider"`
	CostByService     map[string]float64 `json:"costByService"`
	TopCostResources  []CloudResource    `json:"topCostResources"`
	Currency          string             `json:"currency"`
}
