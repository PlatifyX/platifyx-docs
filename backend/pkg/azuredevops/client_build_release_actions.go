package azuredevops

import (
	"encoding/json"
	"fmt"

	"github.com/PlatifyX/platifyx-core/internal/domain"
)

// QueueBuild queues a new build for a given pipeline/definition
func (c *Client) QueueBuild(project string, definitionID int, sourceBranch string) (*domain.Build, error) {
	url := fmt.Sprintf("%s/%s/%s/_apis/build/builds?api-version=%s",
		c.baseURL, c.organization, project, apiVersion)

	requestBody := map[string]interface{}{
		"definition": map[string]interface{}{
			"id": definitionID,
		},
		"sourceBranch": sourceBranch,
	}

	body, err := c.doRequestWithBody("POST", url, requestBody)
	if err != nil {
		return nil, err
	}

	// Azure DevOps returns project as an object, not a string
	var response struct {
		domain.Build
		ProjectObj struct {
			ID   string `json:"id"`
			Name string `json:"name"`
		} `json:"project"`
	}

	if err := json.Unmarshal(body, &response); err != nil {
		return nil, err
	}

	build := response.Build
	build.Project = response.ProjectObj.Name

	return &build, nil
}

// UpdateReleaseApproval updates a release approval (approve or reject)
func (c *Client) UpdateReleaseApproval(project string, approvalID int, status, comments string) error {
	// Releases use vsrm subdomain
	releaseURL := c.baseURL
	if c.baseURL == "https://dev.azure.com" {
		releaseURL = "https://vsrm.dev.azure.com"
	}

	url := fmt.Sprintf("%s/%s/%s/_apis/release/approvals/%d?api-version=%s",
		releaseURL, c.organization, project, approvalID, apiVersion)

	requestBody := map[string]interface{}{
		"status":   status,
		"comments": comments,
	}

	_, err := c.doRequestWithBody("PATCH", url, requestBody)
	return err
}
