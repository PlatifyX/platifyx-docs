package service

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/PlatifyX/platifyx-core/internal/domain"
	"github.com/PlatifyX/platifyx-core/internal/repository"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"gopkg.in/yaml.v3"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
)

type ServiceCatalogService struct {
	serviceRepo        *repository.ServiceRepository
	integrationRepo    *repository.IntegrationRepository
	kubeService        *KubernetesService
	azureDevOpsService *AzureDevOpsService
	githubService      *GitHubService
	log                *logger.Logger
}

func NewServiceCatalogService(
	serviceRepo *repository.ServiceRepository,
	integrationRepo *repository.IntegrationRepository,
	kubeService *KubernetesService,
	azureDevOpsService *AzureDevOpsService,
	githubService *GitHubService,
	log *logger.Logger,
) *ServiceCatalogService {
	return &ServiceCatalogService{
		serviceRepo:        serviceRepo,
		integrationRepo:    integrationRepo,
		kubeService:        kubeService,
		azureDevOpsService: azureDevOpsService,
		githubService:      githubService,
		log:                log,
	}
}

// SyncFromKubernetes scans Kubernetes for managed deployments and syncs to database
func (s *ServiceCatalogService) SyncFromKubernetes() error {
	s.log.Info("Starting service sync from Kubernetes")

	// Get Kubernetes client
	clientset := s.kubeService.GetClientset()
	if clientset == nil {
		return fmt.Errorf("kubernetes client not available")
	}

	// List all deployments with platifyx.io/managed=true label
	deployments, err := clientset.AppsV1().Deployments("").List(context.TODO(), metav1.ListOptions{
		LabelSelector: "platifyx.io/managed=true",
	})
	if err != nil {
		return fmt.Errorf("failed to list deployments: %w", err)
	}

	s.log.Infow("Found managed deployments", "count", len(deployments.Items))

	// Track unique services (squad-application)
	servicesMap := make(map[string]*domain.Service)

	for _, deployment := range deployments.Items {
		labels := deployment.Labels
		namespace := deployment.Namespace

		squad := labels["squad"]
		application := labels["application"]
		environment := labels["environment"]

		// If labels are not present, try to extract from deployment name
		// Pattern: {squad}-{application}-{environment}
		if squad == "" || application == "" {
			parts := strings.Split(deployment.Name, "-")
			if len(parts) >= 3 {
				// Last part is environment, everything else is squad-application
				environment = parts[len(parts)-1]

				// Check if environment is valid (stage or prod)
				if environment == "stage" || environment == "prod" {
					squad = parts[0]
					// Application is everything between squad and environment
					application = strings.Join(parts[1:len(parts)-1], "-")
				} else {
					s.log.Warnw("Unable to parse deployment name",
						"deployment", deployment.Name,
						"namespace", namespace,
					)
					continue
				}
			} else {
				s.log.Warnw("Deployment missing required labels and name doesn't match pattern",
					"deployment", deployment.Name,
					"namespace", namespace,
				)
				continue
			}
		}

		serviceName := fmt.Sprintf("%s-%s", squad, application)

		// Check if we already processed this service
		if _, exists := servicesMap[serviceName]; !exists {
			// Fetch pipeline metadata from Azure DevOps
			service, err := s.fetchServiceMetadata(squad, application, namespace)
			if err != nil {
				s.log.Errorw("Failed to fetch service metadata",
					"service", serviceName,
					"error", err,
				)
				continue
			}

			// Check which environments exist
			service.HasStage = false
			service.HasProd = false

			servicesMap[serviceName] = service
		}

		// Mark which environments exist
		if environment == "stage" {
			servicesMap[serviceName].HasStage = true
		} else if environment == "prod" {
			servicesMap[serviceName].HasProd = true
		}
	}

	// Upsert all services to database
	for _, service := range servicesMap {
		err := s.serviceRepo.Upsert(service)
		if err != nil {
			s.log.Errorw("Failed to upsert service",
				"service", service.Name,
				"error", err,
			)
			continue
		}
		s.log.Infow("Synced service", "name", service.Name)
	}

	s.log.Infow("Service sync completed", "synced", len(servicesMap))
	return nil
}

// fetchServiceMetadata fetches metadata from GitHub or Azure DevOps ci/pipeline.yml
func (s *ServiceCatalogService) fetchServiceMetadata(squad, application, namespace string) (*domain.Service, error) {
	serviceName := fmt.Sprintf("%s-%s", squad, application)
	var fileContent string
	var err error
	var repoURL string
	var repositoryType string

	// Try GitHub first if available
	if s.githubService != nil {
		owner := s.githubService.GetConfiguredOrganization()
		if owner == "" {
			owner = "PlatifyX" // Fallback default
		}

		s.log.Infow("Trying to fetch from GitHub",
			"service", serviceName,
			"owner", owner,
		)

		// Try different branches
		branches := []string{"main", "master"}

		for _, branch := range branches {
			s.log.Infow("Attempting GitHub fetch",
				"owner", owner,
				"repo", serviceName,
				"branch", branch,
				"path", "ci/pipeline.yml",
			)

			fileContent, err = s.githubService.GetFileContent(owner, serviceName, "ci/pipeline.yml", branch)
			if err == nil {
				repoURL = s.githubService.GetRepositoryURL(owner, serviceName)
				repositoryType = "github"
				s.log.Infow("Successfully found repository on GitHub",
					"owner", owner,
					"repo", serviceName,
					"branch", branch,
				)
				break
			}
			s.log.Debugw("GitHub fetch failed, trying next branch",
				"owner", owner,
				"repo", serviceName,
				"branch", branch,
				"error", err.Error(),
			)
		}
	}

	// If GitHub failed or not available, try ALL Azure DevOps integrations
	if fileContent == "" && s.integrationRepo != nil {
		s.log.Infow("Trying to fetch from Azure DevOps integrations", "service", serviceName)

		// Get all Azure DevOps integrations
		azureIntegrations, err := s.integrationRepo.GetAllByType("azuredevops")
		if err != nil {
			s.log.Warnw("Failed to get Azure DevOps integrations", "error", err)
		} else {
			// Try each integration
			for _, integration := range azureIntegrations {
				s.log.Infow("Trying Azure DevOps integration",
					"service", serviceName,
					"integration", integration.Name,
				)

				// Create a temporary Azure DevOps service for this integration
				azureService, err := NewAzureDevOpsServiceFromIntegration(&integration)
				if err != nil {
					s.log.Warnw("Failed to create Azure DevOps service from integration",
						"integration", integration.Name,
						"error", err,
					)
					continue
				}

				// Try to fetch the file
				fileContent, err = azureService.GetFileContent(serviceName, "ci/pipeline.yml", "main")
				if err != nil {
					// Try refs/heads/main
					fileContent, err = azureService.GetFileContent(serviceName, "ci/pipeline.yml", "refs/heads/main")
				}

				if err == nil {
					repoURL, _ = azureService.GetRepositoryURL(serviceName)
					repositoryType = "azuredevops"
					s.log.Infow("Successfully found repository in Azure DevOps",
						"service", serviceName,
						"integration", integration.Name,
					)
					break
				} else {
					s.log.Debugw("Repository not found in this Azure DevOps integration",
						"service", serviceName,
						"integration", integration.Name,
						"error", err.Error(),
					)
				}
			}
		}
	}

	// If both failed, return error
	if fileContent == "" {
		return nil, fmt.Errorf("failed to fetch pipeline.yml from GitHub and Azure DevOps: %w", err)
	}

	// Parse YAML to extract variables
	var pipeline struct {
		Variables []interface{} `yaml:"variables"`
	}

	err = yaml.Unmarshal([]byte(fileContent), &pipeline)
	if err != nil {
		return nil, fmt.Errorf("failed to parse pipeline.yml: %w", err)
	}

	// Extract variables
	vars := make(map[string]string)
	for _, v := range pipeline.Variables {
		switch val := v.(type) {
		case map[string]interface{}:
			if name, ok := val["name"].(string); ok {
				if value, ok := val["value"].(string); ok {
					vars[name] = value
				}
			}
		}
	}

	// Build service object
	service := &domain.Service{
		Name:             serviceName,
		Squad:            squad,
		Application:      application,
		Language:         vars["language"],
		Version:          vars["version"],
		RepositoryType:   repositoryType,
		RepositoryURL:    repoURL,
		SonarQubeProject: serviceName,
		Namespace:        namespace,
		Microservices:    parseBool(vars["microservices"]),
		Monorepo:         parseBool(vars["monorepo"]),
		TestUnit:         parseBool(vars["testun"]),
		Infra:            vars["infra"],
	}

	return service, nil
}

// GetAll returns all services
func (s *ServiceCatalogService) GetAll() ([]domain.Service, error) {
	return s.serviceRepo.GetAll()
}

// GetByName returns a service by name
func (s *ServiceCatalogService) GetByName(name string) (*domain.Service, error) {
	return s.serviceRepo.GetByName(name)
}

// GetServiceStatus returns runtime status for a service
func (s *ServiceCatalogService) GetServiceStatus(serviceName string) (*domain.ServiceStatus, error) {
	status := &domain.ServiceStatus{
		ServiceName: serviceName,
	}

	// Get Kubernetes client
	clientset := s.kubeService.GetClientset()
	if clientset == nil {
		return status, nil
	}

	// Check stage deployment
	stageDeploymentName := fmt.Sprintf("%s-stage", serviceName)
	stageStatus, _ := s.getDeploymentStatus(clientset, stageDeploymentName, "stage")
	status.StageStatus = stageStatus

	// Check prod deployment
	prodDeploymentName := fmt.Sprintf("%s-prod", serviceName)
	prodStatus, _ := s.getDeploymentStatus(clientset, prodDeploymentName, "prod")
	status.ProdStatus = prodStatus

	return status, nil
}

// getDeploymentStatus gets status of a specific deployment
func (s *ServiceCatalogService) getDeploymentStatus(clientset *kubernetes.Clientset, deploymentName, environment string) (*domain.DeploymentStatus, error) {
	deployment, err := clientset.AppsV1().Deployments("").List(context.TODO(), metav1.ListOptions{
		LabelSelector: fmt.Sprintf("app=%s", deploymentName),
	})
	if err != nil || len(deployment.Items) == 0 {
		return nil, err
	}

	dep := deployment.Items[0]
	namespace := dep.Namespace

	status := &domain.DeploymentStatus{
		Environment:       environment,
		Replicas:          *dep.Spec.Replicas,
		AvailableReplicas: dep.Status.AvailableReplicas,
	}

	// Determine status
	if dep.Status.AvailableReplicas == *dep.Spec.Replicas && dep.Status.AvailableReplicas > 0 {
		status.Status = "Running"
	} else if dep.Status.AvailableReplicas == 0 {
		status.Status = "Failed"
	} else {
		status.Status = "Pending"
	}

	// Get image
	if len(dep.Spec.Template.Spec.Containers) > 0 {
		status.Image = dep.Spec.Template.Spec.Containers[0].Image
	}

	// Get pods for this deployment
	pods, err := s.getPodsForDeployment(clientset, namespace, deploymentName)
	if err != nil {
		s.log.Warnw("Failed to get pods for deployment", "deployment", deploymentName, "error", err)
	} else {
		status.Pods = pods
	}

	return status, nil
}

// getPodsForDeployment gets pods related to a deployment
func (s *ServiceCatalogService) getPodsForDeployment(clientset *kubernetes.Clientset, namespace, deploymentName string) ([]domain.PodInfo, error) {
	pods, err := clientset.CoreV1().Pods(namespace).List(context.TODO(), metav1.ListOptions{
		LabelSelector: fmt.Sprintf("app=%s", deploymentName),
	})
	if err != nil {
		return nil, err
	}

	var podInfos []domain.PodInfo
	for _, pod := range pods.Items {
		// Calculate ready containers
		readyContainers := 0
		totalContainers := len(pod.Status.ContainerStatuses)
		for _, cs := range pod.Status.ContainerStatuses {
			if cs.Ready {
				readyContainers++
			}
		}

		// Calculate total restarts
		var totalRestarts int32
		for _, cs := range pod.Status.ContainerStatuses {
			totalRestarts += cs.RestartCount
		}

		// Calculate age
		age := time.Since(pod.CreationTimestamp.Time)
		ageStr := formatDuration(age)

		podInfo := domain.PodInfo{
			Name:      pod.Name,
			Status:    string(pod.Status.Phase),
			Ready:     fmt.Sprintf("%d/%d", readyContainers, totalContainers),
			Restarts:  totalRestarts,
			Age:       ageStr,
			Node:      pod.Spec.NodeName,
			Namespace: pod.Namespace,
		}
		podInfos = append(podInfos, podInfo)
	}

	return podInfos, nil
}

// formatDuration formats a duration into a human-readable string (e.g., "2d", "5h", "30m")
func formatDuration(d time.Duration) string {
	days := int(d.Hours() / 24)
	if days > 0 {
		return fmt.Sprintf("%dd", days)
	}
	hours := int(d.Hours())
	if hours > 0 {
		return fmt.Sprintf("%dh", hours)
	}
	minutes := int(d.Minutes())
	if minutes > 0 {
		return fmt.Sprintf("%dm", minutes)
	}
	return fmt.Sprintf("%ds", int(d.Seconds()))
}

// GetServiceMetrics returns aggregated metrics from SonarQube and last build from Azure DevOps
func (s *ServiceCatalogService) GetServiceMetrics(serviceName string, sonarQubeService *SonarQubeService, azureDevOpsServices []*AzureDevOpsService) map[string]interface{} {
	metrics := make(map[string]interface{})
	metrics["serviceName"] = serviceName

	// Fetch SonarQube metrics
	if sonarQubeService != nil {
		sonarMetrics, err := sonarQubeService.GetProjectMeasures(serviceName)
		if err != nil {
			s.log.Warnw("Failed to fetch SonarQube metrics for service",
				"service", serviceName,
				"error", err,
			)
		} else if sonarMetrics != nil {
			s.log.Infow("Fetched SonarQube metrics",
				"service", serviceName,
				"bugs", sonarMetrics.Bugs,
				"vulnerabilities", sonarMetrics.Vulnerabilities,
				"codeSmells", sonarMetrics.CodeSmells,
				"securityHotspots", sonarMetrics.SecurityHotspots,
				"coverage", sonarMetrics.Coverage,
			)
			metrics["sonarqube"] = map[string]interface{}{
				"bugs":             sonarMetrics.Bugs,
				"vulnerabilities":  sonarMetrics.Vulnerabilities,
				"codeSmells":       sonarMetrics.CodeSmells,
				"securityHotspots": sonarMetrics.SecurityHotspots,
				"coverage":         sonarMetrics.Coverage,
			}
		} else {
			s.log.Warnw("SonarQube metrics returned nil", "service", serviceName)
		}
	}

	// Fetch last builds from ALL Azure DevOps integrations for stage and main branches
	if len(azureDevOpsServices) > 0 {
		var stageBuild, mainBuild map[string]interface{}
		totalMatchCount := 0

		s.log.Infow("Searching for builds across all Azure DevOps integrations",
			"serviceName", serviceName,
			"integrationCount", len(azureDevOpsServices),
		)

		// Iterate through all Azure DevOps services (integrations)
		for _, azureDevOpsService := range azureDevOpsServices {
			if azureDevOpsService == nil {
				continue
			}

			builds, err := azureDevOpsService.GetBuilds(100) // Get latest 100 builds
			if err != nil {
				s.log.Warnw("Failed to fetch builds from Azure DevOps integration",
					"error", err,
					"serviceName", serviceName,
				)
				continue
			}

			if len(builds) == 0 {
				continue
			}

			s.log.Infow("Fetched builds from integration",
				"serviceName", serviceName,
				"buildCount", len(builds),
			)

			// DEBUG: Log all definition names for cxm-export
			if serviceName == "cxm-export" && len(builds) > 0 {
				s.log.Infow("DEBUG: Showing first 20 build definitions for cxm-export from this integration")
				for i, build := range builds {
					if i < 20 {
						s.log.Infow("Build definition",
							"index", i,
							"definitionName", build.Definition.Name,
							"sourceBranch", build.SourceBranch,
							"integration", build.Integration,
						)
					}
				}
			}

			// Find the latest builds for stage and main branches
			matchCount := 0
			for _, build := range builds {
				definitionName := strings.ToLower(build.Definition.Name)
				serviceNameLower := strings.ToLower(serviceName)

				// Check if the build definition name matches the service name (case insensitive and partial match)
				if definitionName == serviceNameLower || strings.Contains(definitionName, serviceNameLower) {
					matchCount++
					totalMatchCount++
					sourceBranch := strings.ToLower(build.SourceBranch)

					s.log.Infow("Found matching build",
						"serviceName", serviceName,
						"definitionName", build.Definition.Name,
						"sourceBranch", build.SourceBranch,
						"sourceBranchLower", sourceBranch,
						"buildNumber", build.BuildNumber,
						"status", build.Result,
						"integration", build.Integration,
						"matchCount", totalMatchCount,
					)

					// Check if this is a stage build
					stageMatch := strings.Contains(sourceBranch, "stage") || strings.HasSuffix(sourceBranch, "refs/heads/stage")
					if stageBuild == nil && stageMatch {
						stageBuild = map[string]interface{}{
							"status":       build.Result,
							"buildNumber":  build.BuildNumber,
							"sourceBranch": build.SourceBranch,
							"finishTime":   build.FinishTime,
							"integration":  build.Integration,
						}
						s.log.Infow("✓ Added stage build", "serviceName", serviceName, "buildNumber", build.BuildNumber, "integration", build.Integration)
					} else if strings.Contains(sourceBranch, "stage") {
						s.log.Infow("✗ Stage build skipped (already have one)", "serviceName", serviceName, "buildNumber", build.BuildNumber)
					}

					// Check if this is a main/master build
					mainMatch := strings.Contains(sourceBranch, "main") ||
						strings.Contains(sourceBranch, "master") ||
						strings.HasSuffix(sourceBranch, "refs/heads/main") ||
						strings.HasSuffix(sourceBranch, "refs/heads/master")
					if mainBuild == nil && mainMatch {
						mainBuild = map[string]interface{}{
							"status":       build.Result,
							"buildNumber":  build.BuildNumber,
							"sourceBranch": build.SourceBranch,
							"finishTime":   build.FinishTime,
							"integration":  build.Integration,
						}
						s.log.Infow("✓ Added main build", "serviceName", serviceName, "buildNumber", build.BuildNumber, "integration", build.Integration)
					} else if strings.Contains(sourceBranch, "main") || strings.Contains(sourceBranch, "master") {
						s.log.Infow("✗ Main build skipped (already have one)", "serviceName", serviceName, "buildNumber", build.BuildNumber)
					} else {
						s.log.Debugw("Build doesn't match stage or main",
							"serviceName", serviceName,
							"buildNumber", build.BuildNumber,
							"sourceBranch", build.SourceBranch,
						)
					}

					// Break if we found both
					if stageBuild != nil && mainBuild != nil {
						break
					}
				}
			}

			s.log.Infow("Build search completed for integration",
				"serviceName", serviceName,
				"matchingBuildsFromIntegration", matchCount,
			)

			// If we found both builds, no need to check more integrations
			if stageBuild != nil && mainBuild != nil {
				break
			}
		}

		s.log.Infow("Build search completed across all integrations",
			"serviceName", serviceName,
			"totalMatchingBuilds", totalMatchCount,
			"foundStage", stageBuild != nil,
			"foundMain", mainBuild != nil,
		)

		// Add builds to metrics if found
		if stageBuild != nil {
			metrics["stageBuild"] = stageBuild
			s.log.Infow("Returning stage build metrics", "serviceName", serviceName)
		} else {
			s.log.Warnw("No stage build found", "serviceName", serviceName)
		}

		if mainBuild != nil {
			metrics["mainBuild"] = mainBuild
			s.log.Infow("Returning main build metrics", "serviceName", serviceName)
		} else {
			s.log.Warnw("No main build found", "serviceName", serviceName)
		}
	} else {
		s.log.Warnw("No Azure DevOps services available", "serviceName", serviceName)
	}

	return metrics
}

// GetMultipleServiceMetrics returns metrics for multiple services
func (s *ServiceCatalogService) GetMultipleServiceMetrics(serviceNames []string, sonarQubeService *SonarQubeService, azureDevOpsServices []*AzureDevOpsService) map[string]interface{} {
	result := make(map[string]interface{})

	for _, serviceName := range serviceNames {
		result[serviceName] = s.GetServiceMetrics(serviceName, sonarQubeService, azureDevOpsServices)
	}

	return result
}

// Helper function to parse yes/no to bool
func parseBool(s string) bool {
	return strings.ToLower(s) == "yes" || strings.ToLower(s) == "true"
}
