package domain

// HashiCorp Vault integration configuration
type VaultConfig struct {
	Address   string `json:"address"`
	Token     string `json:"token"`
	Namespace string `json:"namespace,omitempty"`
}

// Vault Secret
type VaultSecret struct {
	RequestID     string                 `json:"request_id"`
	LeaseID       string                 `json:"lease_id"`
	LeaseDuration int                    `json:"lease_duration"`
	Renewable     bool                   `json:"renewable"`
	Data          map[string]interface{} `json:"data"`
	Warnings      []string               `json:"warnings,omitempty"`
}

// Vault KV Secret (v2)
type VaultKVSecret struct {
	Data     VaultKVData `json:"data"`
	Metadata VaultKVMetadata `json:"metadata"`
}

type VaultKVData struct {
	Data map[string]interface{} `json:"data"`
	Metadata VaultKVVersionMetadata `json:"metadata"`
}

type VaultKVMetadata struct {
	CreatedTime    string                 `json:"created_time"`
	CurrentVersion int                    `json:"current_version"`
	MaxVersions    int                    `json:"max_versions"`
	OldestVersion  int                    `json:"oldest_version"`
	UpdatedTime    string                 `json:"updated_time"`
	CustomMetadata map[string]interface{} `json:"custom_metadata,omitempty"`
}

type VaultKVVersionMetadata struct {
	CreatedTime  string `json:"created_time"`
	DeletionTime string `json:"deletion_time"`
	Destroyed    bool   `json:"destroyed"`
	Version      int    `json:"version"`
}

// Vault List Response
type VaultListResponse struct {
	Data VaultListData `json:"data"`
}

type VaultListData struct {
	Keys []string `json:"keys"`
}

// Vault Health
type VaultHealth struct {
	Initialized                bool   `json:"initialized"`
	Sealed                     bool   `json:"sealed"`
	Standby                    bool   `json:"standby"`
	PerformanceStandby         bool   `json:"performance_standby"`
	ReplicationPerformanceMode string `json:"replication_performance_mode"`
	ReplicationDRMode          string `json:"replication_dr_mode"`
	ServerTimeUTC              int64  `json:"server_time_utc"`
	Version                    string `json:"version"`
	ClusterName                string `json:"cluster_name"`
	ClusterID                  string `json:"cluster_id"`
}

// Vault Stats
type VaultStats struct {
	TotalSecrets  int    `json:"totalSecrets"`
	Initialized   bool   `json:"initialized"`
	Sealed        bool   `json:"sealed"`
	Version       string `json:"version"`
	ClusterName   string `json:"clusterName"`
}
