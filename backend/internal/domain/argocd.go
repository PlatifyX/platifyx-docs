package domain

import "time"

// ArgoCD integration configuration
type ArgoCDConfig struct {
	ServerURL string `json:"serverUrl"`
	AuthToken string `json:"authToken"`
	Insecure  bool   `json:"insecure,omitempty"` // Skip TLS verification
}

// ArgoCD Application
type ArgoCDApplication struct {
	Metadata ArgoCDMetadata        `json:"metadata"`
	Spec     ArgoCDApplicationSpec `json:"spec"`
	Status   ArgoCDApplicationStatus `json:"status"`
}

type ArgoCDMetadata struct {
	Name      string    `json:"name"`
	Namespace string    `json:"namespace"`
	CreatedAt time.Time `json:"creationTimestamp"`
}

type ArgoCDApplicationSpec struct {
	Source      ArgoCDSource      `json:"source"`
	Destination ArgoCDDestination `json:"destination"`
	Project     string            `json:"project"`
}

type ArgoCDSource struct {
	RepoURL        string `json:"repoURL"`
	Path           string `json:"path"`
	TargetRevision string `json:"targetRevision"`
	Chart          string `json:"chart,omitempty"`
}

type ArgoCDDestination struct {
	Server    string `json:"server"`
	Namespace string `json:"namespace"`
}

type ArgoCDApplicationStatus struct {
	Health        ArgoCDHealthStatus `json:"health"`
	Sync          ArgoCDSyncStatus   `json:"sync"`
	OperationState *ArgoCDOperationState `json:"operationState,omitempty"`
}

type ArgoCDHealthStatus struct {
	Status  string `json:"status"` // Healthy, Progressing, Degraded, Suspended, Missing, Unknown
	Message string `json:"message,omitempty"`
}

type ArgoCDSyncStatus struct {
	Status   string    `json:"status"` // Synced, OutOfSync, Unknown
	Revision string    `json:"revision"`
	ComparedTo ArgoCDComparedTo `json:"comparedTo"`
}

type ArgoCDComparedTo struct {
	Source      ArgoCDSource `json:"source"`
	Destination ArgoCDDestination `json:"destination"`
}

type ArgoCDOperationState struct {
	Operation  ArgoCDOperation `json:"operation"`
	Phase      string          `json:"phase"` // Running, Failed, Error, Succeeded
	Message    string          `json:"message,omitempty"`
	SyncResult *ArgoCDSyncResult `json:"syncResult,omitempty"`
	StartedAt  time.Time       `json:"startedAt"`
	FinishedAt *time.Time      `json:"finishedAt,omitempty"`
}

type ArgoCDOperation struct {
	Sync *ArgoCDSyncOperation `json:"sync,omitempty"`
}

type ArgoCDSyncOperation struct {
	Revision string   `json:"revision,omitempty"`
	Prune    bool     `json:"prune,omitempty"`
	DryRun   bool     `json:"dryRun,omitempty"`
	SyncOptions []string `json:"syncOptions,omitempty"`
}

type ArgoCDSyncResult struct {
	Resources []ArgoCDResourceResult `json:"resources"`
	Revision  string                 `json:"revision"`
}

type ArgoCDResourceResult struct {
	Group     string `json:"group"`
	Version   string `json:"version"`
	Kind      string `json:"kind"`
	Namespace string `json:"namespace"`
	Name      string `json:"name"`
	Status    string `json:"status"`
	Message   string `json:"message,omitempty"`
	HookPhase string `json:"hookPhase,omitempty"`
	SyncPhase string `json:"syncPhase,omitempty"`
}

// ArgoCD Project
type ArgoCDProject struct {
	Metadata ArgoCDMetadata      `json:"metadata"`
	Spec     ArgoCDProjectSpec   `json:"spec"`
	Status   ArgoCDProjectStatus `json:"status,omitempty"`
}

type ArgoCDProjectSpec struct {
	Description      string                 `json:"description,omitempty"`
	SourceRepos      []string               `json:"sourceRepos"`
	Destinations     []ArgoCDDestination    `json:"destinations"`
	ClusterResourceWhitelist []ArgoCDGroupKind `json:"clusterResourceWhitelist,omitempty"`
}

type ArgoCDProjectStatus struct {
	JWTTokensByRole map[string]ArgoCDJWTTokens `json:"jwtTokensByRole,omitempty"`
}

type ArgoCDJWTTokens struct {
	Items []ArgoCDJWTToken `json:"items"`
}

type ArgoCDJWTToken struct {
	IAT int64 `json:"iat"`
	EXP int64 `json:"exp,omitempty"`
	ID  string `json:"id,omitempty"`
}

type ArgoCDGroupKind struct {
	Group string `json:"group"`
	Kind  string `json:"kind"`
}

// ArgoCD Cluster
type ArgoCDCluster struct {
	Name       string            `json:"name"`
	Server     string            `json:"server"`
	Config     ArgoCDClusterConfig `json:"config"`
	Info       ArgoCDClusterInfo `json:"info,omitempty"`
}

type ArgoCDClusterConfig struct {
	TLSClientConfig ArgoCDTLSClientConfig `json:"tlsClientConfig"`
}

type ArgoCDTLSClientConfig struct {
	Insecure bool   `json:"insecure"`
	CAData   []byte `json:"caData,omitempty"`
	CertData []byte `json:"certData,omitempty"`
	KeyData  []byte `json:"keyData,omitempty"`
}

type ArgoCDClusterInfo struct {
	ServerVersion  string                    `json:"serverVersion,omitempty"`
	ConnectionState ArgoCDConnectionState     `json:"connectionState,omitempty"`
	ApplicationsCount int                     `json:"applicationsCount"`
}

type ArgoCDConnectionState struct {
	Status  string    `json:"status"` // Successful, Failed
	Message string    `json:"message,omitempty"`
	ModifiedAt *time.Time `json:"attemptedAt,omitempty"`
}

// API Response wrappers
type ArgoCDApplicationList struct {
	Items []ArgoCDApplication `json:"items"`
}

type ArgoCDProjectList struct {
	Items []ArgoCDProject `json:"items"`
}

type ArgoCDClusterList struct {
	Items []ArgoCDCluster `json:"items"`
}

// Stats for dashboard
type ArgoCDStats struct {
	TotalApplications int `json:"totalApplications"`
	HealthyApps       int `json:"healthyApps"`
	DegradedApps      int `json:"degradedApps"`
	ProgressingApps   int `json:"progressingApps"`
	SyncedApps        int `json:"syncedApps"`
	OutOfSyncApps     int `json:"outOfSyncApps"`
	TotalProjects     int `json:"totalProjects"`
	TotalClusters     int `json:"totalClusters"`
}
