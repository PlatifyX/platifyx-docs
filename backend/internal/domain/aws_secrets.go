package domain

import "time"

// AWS Secrets Manager integration configuration
type AWSSecretsConfig struct {
	AccessKeyID     string `json:"accessKeyId"`
	SecretAccessKey string `json:"secretAccessKey"`
	Region          string `json:"region"`
	SessionToken    string `json:"sessionToken,omitempty"`
}

// AWS Secret
type AWSSecret struct {
	ARN                      string                 `json:"arn"`
	Name                     string                 `json:"name"`
	Description              string                 `json:"description,omitempty"`
	SecretString             string                 `json:"secretString,omitempty"`
	SecretBinary             []byte                 `json:"secretBinary,omitempty"`
	VersionID                string                 `json:"versionId"`
	VersionStages            []string               `json:"versionStages"`
	CreatedDate              *time.Time             `json:"createdDate"`
	LastAccessedDate         *time.Time             `json:"lastAccessedDate,omitempty"`
	LastChangedDate          *time.Time             `json:"lastChangedDate,omitempty"`
	LastRotatedDate          *time.Time             `json:"lastRotatedDate,omitempty"`
	NextRotationDate         *time.Time             `json:"nextRotationDate,omitempty"`
	DeletedDate              *time.Time             `json:"deletedDate,omitempty"`
	Tags                     map[string]string      `json:"tags,omitempty"`
	RotationEnabled          bool                   `json:"rotationEnabled"`
	RotationLambdaARN        string                 `json:"rotationLambdaARN,omitempty"`
	RotationRules            *AWSRotationRules      `json:"rotationRules,omitempty"`
	KmsKeyID                 string                 `json:"kmsKeyId,omitempty"`
}

type AWSRotationRules struct {
	AutomaticallyAfterDays int64  `json:"automaticallyAfterDays"`
	Duration               string `json:"duration,omitempty"`
	ScheduleExpression     string `json:"scheduleExpression,omitempty"`
}

// AWS Secret List Entry
type AWSSecretListEntry struct {
	ARN                      string            `json:"arn"`
	Name                     string            `json:"name"`
	Description              string            `json:"description,omitempty"`
	KmsKeyID                 string            `json:"kmsKeyId,omitempty"`
	RotationEnabled          bool              `json:"rotationEnabled"`
	RotationLambdaARN        string            `json:"rotationLambdaARN,omitempty"`
	RotationRules            *AWSRotationRules `json:"rotationRules,omitempty"`
	LastAccessedDate         *time.Time        `json:"lastAccessedDate,omitempty"`
	LastChangedDate          *time.Time        `json:"lastChangedDate,omitempty"`
	LastRotatedDate          *time.Time        `json:"lastRotatedDate,omitempty"`
	NextRotationDate         *time.Time        `json:"nextRotationDate,omitempty"`
	DeletedDate              *time.Time        `json:"deletedDate,omitempty"`
	Tags                     map[string]string `json:"tags,omitempty"`
	SecretVersionsToStages   map[string][]string `json:"secretVersionsToStages,omitempty"`
	PrimaryRegion            string            `json:"primaryRegion,omitempty"`
	CreatedDate              *time.Time        `json:"createdDate"`
}

// AWS Secrets List Response
type AWSSecretsListResponse struct {
	SecretList []AWSSecretListEntry `json:"secretList"`
	NextToken  string               `json:"nextToken,omitempty"`
}

// AWS Secret Versions
type AWSSecretVersion struct {
	VersionID     string     `json:"versionId"`
	VersionStages []string   `json:"versionStages"`
	CreatedDate   *time.Time `json:"createdDate"`
	LastAccessedDate *time.Time `json:"lastAccessedDate,omitempty"`
}

// AWS Secrets Stats
type AWSSecretsStats struct {
	TotalSecrets     int `json:"totalSecrets"`
	RotationEnabled  int `json:"rotationEnabled"`
	ScheduledForDeletion int `json:"scheduledForDeletion"`
	Region           string `json:"region"`
}
