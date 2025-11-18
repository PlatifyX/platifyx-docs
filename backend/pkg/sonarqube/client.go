package sonarqube

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/PlatifyX/platifyx-core/internal/domain"
)

type Client struct {
	baseURL    string
	token      string
	httpClient *http.Client
}

func NewClient(config domain.SonarQubeConfig) *Client {
	return &Client{
		baseURL: strings.TrimSuffix(config.URL, "/"),
		token:   config.Token,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

func (c *Client) doRequest(method, endpoint string, params url.Values) ([]byte, error) {
	fullURL := c.baseURL + endpoint
	if params != nil {
		fullURL += "?" + params.Encode()
	}

	req, err := http.NewRequest(method, fullURL, nil)
	if err != nil {
		return nil, err
	}

	// SonarQube uses token authentication
	auth := base64.StdEncoding.EncodeToString([]byte(c.token + ":"))
	req.Header.Set("Authorization", "Basic "+auth)
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("SonarQube API returned status %d: %s", resp.StatusCode, string(bodyBytes))
	}

	return io.ReadAll(resp.Body)
}

// GetProjects retrieves all projects from SonarQube
func (c *Client) GetProjects() ([]domain.SonarProject, error) {
	params := url.Values{}
	params.Add("ps", "500") // Page size

	data, err := c.doRequest("GET", "/api/components/search", params)
	if err != nil {
		return nil, err
	}

	var response struct {
		Components []struct {
			Key              string `json:"key"`
			Name             string `json:"name"`
			Qualifier        string `json:"qualifier"`
			Visibility       string `json:"visibility"`
			LastAnalysisDate string `json:"lastAnalysisDate,omitempty"`
		} `json:"components"`
	}

	if err := json.Unmarshal(data, &response); err != nil {
		return nil, err
	}

	projects := make([]domain.SonarProject, 0)
	for _, comp := range response.Components {
		if comp.Qualifier != "TRK" { // Only projects
			continue
		}

		project := domain.SonarProject{
			Key:        comp.Key,
			Name:       comp.Name,
			Qualifier:  comp.Qualifier,
			Visibility: comp.Visibility,
		}

		if comp.LastAnalysisDate != "" {
			if t, err := time.Parse(time.RFC3339, comp.LastAnalysisDate); err == nil {
				project.LastAnalysisDate = t
			}
		}

		projects = append(projects, project)
	}

	return projects, nil
}

// GetProjectMeasures retrieves metrics for a specific project
func (c *Client) GetProjectMeasures(projectKey string) (*domain.SonarProjectDetails, error) {
	params := url.Values{}
	params.Add("component", projectKey)
	params.Add("metricKeys", "bugs,vulnerabilities,code_smells,coverage,duplicated_lines_density,security_hotspots,ncloc,alert_status")

	data, err := c.doRequest("GET", "/api/measures/component", params)
	if err != nil {
		return nil, err
	}

	var response struct {
		Component struct {
			Key      string `json:"key"`
			Name     string `json:"name"`
			Measures []struct {
				Metric string `json:"metric"`
				Value  string `json:"value"`
			} `json:"measures"`
		} `json:"component"`
	}

	if err := json.Unmarshal(data, &response); err != nil {
		return nil, err
	}

	project := &domain.SonarProjectDetails{
		Key:      response.Component.Key,
		Name:     response.Component.Name,
		Measures: make([]domain.SonarMeasure, 0),
	}

	// Parse measures
	for _, m := range response.Component.Measures {
		project.Measures = append(project.Measures, domain.SonarMeasure{
			Metric: m.Metric,
			Value:  m.Value,
		})

		// Parse specific metrics
		switch m.Metric {
		case "bugs":
			if v, err := strconv.Atoi(m.Value); err == nil {
				project.Bugs = v
			}
		case "vulnerabilities":
			if v, err := strconv.Atoi(m.Value); err == nil {
				project.Vulnerabilities = v
			}
		case "code_smells":
			if v, err := strconv.Atoi(m.Value); err == nil {
				project.CodeSmells = v
			}
		case "coverage":
			if v, err := strconv.ParseFloat(m.Value, 64); err == nil {
				project.Coverage = v
			}
		case "duplicated_lines_density":
			if v, err := strconv.ParseFloat(m.Value, 64); err == nil {
				project.Duplications = v
			}
		case "security_hotspots":
			if v, err := strconv.Atoi(m.Value); err == nil {
				project.SecurityHotspots = v
			}
		case "ncloc":
			if v, err := strconv.Atoi(m.Value); err == nil {
				project.Lines = v
			}
		case "alert_status":
			project.QualityGateStatus = m.Value
		}
	}

	return project, nil
}

// GetIssues retrieves issues from SonarQube with optional filters
func (c *Client) GetIssues(projectKey string, severities []string, types []string, limit int) ([]domain.SonarIssue, error) {
	params := url.Values{}
	if projectKey != "" {
		params.Add("componentKeys", projectKey)
	}
	if len(severities) > 0 {
		params.Add("severities", strings.Join(severities, ","))
	}
	if len(types) > 0 {
		params.Add("types", strings.Join(types, ","))
	}
	params.Add("ps", strconv.Itoa(limit))

	data, err := c.doRequest("GET", "/api/issues/search", params)
	if err != nil {
		return nil, err
	}

	var response struct {
		Issues []struct {
			Key          string `json:"key"`
			Rule         string `json:"rule"`
			Severity     string `json:"severity"`
			Component    string `json:"component"`
			Project      string `json:"project"`
			Line         int    `json:"line,omitempty"`
			Message      string `json:"message"`
			Author       string `json:"author,omitempty"`
			CreationDate string `json:"creationDate"`
			UpdateDate   string `json:"updateDate"`
			Type         string `json:"type"`
			Status       string `json:"status"`
		} `json:"issues"`
	}

	if err := json.Unmarshal(data, &response); err != nil {
		return nil, err
	}

	issues := make([]domain.SonarIssue, 0)
	for _, i := range response.Issues {
		issue := domain.SonarIssue{
			Key:       i.Key,
			Rule:      i.Rule,
			Severity:  i.Severity,
			Component: i.Component,
			Project:   i.Project,
			Line:      i.Line,
			Message:   i.Message,
			Author:    i.Author,
			Type:      i.Type,
			Status:    i.Status,
		}

		if t, err := time.Parse(time.RFC3339, i.CreationDate); err == nil {
			issue.CreationDate = t
		}
		if t, err := time.Parse(time.RFC3339, i.UpdateDate); err == nil {
			issue.UpdateDate = t
		}

		issues = append(issues, issue)
	}

	return issues, nil
}

// GetQualityGateStatus retrieves the quality gate status for a project
func (c *Client) GetQualityGateStatus(projectKey string) (*domain.ProjectQualityGateStatus, error) {
	params := url.Values{}
	params.Add("projectKey", projectKey)

	data, err := c.doRequest("GET", "/api/qualitygates/project_status", params)
	if err != nil {
		return nil, err
	}

	var response struct {
		ProjectStatus struct {
			Status     string `json:"status"`
			Conditions []struct {
				Status         string `json:"status"`
				MetricKey      string `json:"metricKey"`
				Comparator     string `json:"comparator"`
				ErrorThreshold string `json:"errorThreshold"`
				ActualValue    string `json:"actualValue"`
			} `json:"conditions"`
		} `json:"projectStatus"`
	}

	if err := json.Unmarshal(data, &response); err != nil {
		return nil, err
	}

	status := &domain.ProjectQualityGateStatus{
		ProjectKey: projectKey,
		Status:     response.ProjectStatus.Status,
		Conditions: make([]domain.ConditionStatus, 0),
	}

	for _, c := range response.ProjectStatus.Conditions {
		status.Conditions = append(status.Conditions, domain.ConditionStatus{
			Status:         c.Status,
			MetricKey:      c.MetricKey,
			Comparator:     c.Comparator,
			ErrorThreshold: c.ErrorThreshold,
			ActualValue:    c.ActualValue,
		})
	}

	return status, nil
}
