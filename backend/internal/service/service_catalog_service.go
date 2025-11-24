package service

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/PlatifyX/platifyx-core/internal/domain"
	"github.com/PlatifyX/platifyx-core/internal/repository"
	"github.com/PlatifyX/platifyx-core/pkg/cache"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"gopkg.in/yaml.v3"
	appsv1 "k8s.io/api/apps/v1"
	v1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
)

type ServiceCatalogService struct {
	serviceRepo        *repository.ServiceRepository
	integrationRepo    *repository.IntegrationRepository
	kubeService        *KubernetesService
	azureDevOpsService *AzureDevOpsService
	githubService      *GitHubService
	cacheClient        *cache.RedisClient
	log                *logger.Logger
}

func NewServiceCatalogService(
	serviceRepo *repository.ServiceRepository,
	integrationRepo *repository.IntegrationRepository,
	kubeService *KubernetesService,
	azureDevOpsService *AzureDevOpsService,
	githubService *GitHubService,
	cacheClient *cache.RedisClient,
	log *logger.Logger,
) *ServiceCatalogService {
	return &ServiceCatalogService{
		serviceRepo:        serviceRepo,
		integrationRepo:    integrationRepo,
		kubeService:        kubeService,
		azureDevOpsService: azureDevOpsService,
		githubService:      githubService,
		cacheClient:        cacheClient,
		log:                log,
	}
}

// SyncFromKubernetes scans Kubernetes for managed deployments and syncs to database
func (s *ServiceCatalogService) SyncFromKubernetes() error {
	if s.kubeService == nil {
		return fmt.Errorf("kubernetes service not available")
	}
	return s.SyncFromKubernetesWithService(s.kubeService)
}

// SyncFromKubernetesWithService scans Kubernetes for managed deployments and syncs to database using provided KubernetesService
func (s *ServiceCatalogService) SyncFromKubernetesWithService(kubeService *KubernetesService) error {
	return s.SyncFromKubernetesWithServiceAndOrg(kubeService, "")
}

// SyncFromKubernetesWithServiceAndOrg scans Kubernetes for managed deployments and syncs to database using provided KubernetesService and organizationUUID
func (s *ServiceCatalogService) SyncFromKubernetesWithServiceAndOrg(kubeService *KubernetesService, organizationUUID string) error {
	s.log.Info("Starting service sync from Kubernetes")

	// Get Kubernetes client
	clientset := kubeService.GetClientset()
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
			service, err := s.fetchServiceMetadata(organizationUUID, squad, application, namespace)
			if err != nil {
				s.log.Warnw("Failed to fetch service metadata, creating service with minimal info",
					"service", serviceName,
					"error", err,
				)
				// Create a basic service even if metadata fetch fails
				service = &domain.Service{
					Name:      serviceName,
					Squad:     squad,
					Application: application,
					Language:  "",
					RepositoryURL: "",
					RepositoryType: "",
				}
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

	// Clear cache after sync
	if s.cacheClient != nil {
		s.log.Info("Clearing service catalog cache after sync")
		s.cacheClient.Delete("service-catalog:all")
		s.cacheClient.Delete("service-catalog:metrics:*")
		s.cacheClient.Delete("service-catalog:status:*")
	}

	return nil
}

// fetchServiceMetadata fetches metadata from GitHub or Azure DevOps ci/pipeline.yml
func (s *ServiceCatalogService) fetchServiceMetadata(organizationUUID string, squad, application, namespace string) (*domain.Service, error) {
	serviceName := fmt.Sprintf("%s-%s", squad, application)
	var fileContent string
	var err error
	var repoURL string
	var repositoryType string

	// Try ALL GitHub integrations first
	if s.integrationRepo != nil {
		s.log.Infow("Trying to fetch from GitHub integrations", "service", serviceName)

		// Get all GitHub integrations
		githubIntegrations, err := s.integrationRepo.GetAllByType("github", organizationUUID)
		if err != nil {
			s.log.Warnw("Failed to get GitHub integrations", "error", err)
		} else {
			// Try each GitHub integration
			for _, integration := range githubIntegrations {
				s.log.Infow("Trying GitHub integration",
					"service", serviceName,
					"integration", integration.Name,
				)

				// Parse GitHub integration config
				var integrationConfig domain.GitHubIntegrationConfig
				if err := json.Unmarshal(integration.Config, &integrationConfig); err != nil {
					s.log.Warnw("Failed to parse GitHub integration config",
						"integration", integration.Name,
						"error", err,
					)
					continue
				}

				// Convert to GitHubConfig
				githubConfig := domain.GitHubConfig{
					Token:        integrationConfig.Token,
					Organization: integrationConfig.Organization,
				}

				// Create a temporary GitHub service for this integration
				githubService := NewGitHubService(githubConfig, s.log)

				// Try different owners (from config or default)
				owners := []string{githubConfig.Organization}
				if githubConfig.Organization == "" {
					owners = []string{"PlatifyX"} // Fallback default
				}

				// Try different branches
				branches := []string{"main", "master"}

				found := false
				for _, owner := range owners {
					for _, branch := range branches {
						s.log.Infow("Attempting GitHub fetch",
							"owner", owner,
							"repo", serviceName,
							"branch", branch,
							"path", "ci/pipeline.yml",
							"integration", integration.Name,
						)

						fileContent, err = githubService.GetFileContent(owner, serviceName, "ci/pipeline.yml", branch)
						if err == nil {
							repoURL = githubService.GetRepositoryURL(owner, serviceName)
							repositoryType = "github"
							s.log.Infow("Successfully found repository on GitHub",
								"owner", owner,
								"repo", serviceName,
								"branch", branch,
								"integration", integration.Name,
							)
							found = true
							break
						}
						s.log.Debugw("GitHub fetch failed, trying next branch",
							"owner", owner,
							"repo", serviceName,
							"branch", branch,
							"integration", integration.Name,
							"error", err.Error(),
						)
					}
					if found {
						break
					}
				}
				if found {
					break
				} else {
					s.log.Debugw("Repository not found in this GitHub integration",
						"service", serviceName,
						"integration", integration.Name,
					)
				}
			}
		}
	}

	// If GitHub failed or not available, try ALL Azure DevOps integrations
	if fileContent == "" && s.integrationRepo != nil {
		s.log.Infow("Trying to fetch from Azure DevOps integrations", "service", serviceName)

		// Get all Azure DevOps integrations
		azureIntegrations, err := s.integrationRepo.GetAllByType("azuredevops", organizationUUID)
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

// GetAll returns all services (with cache)
func (s *ServiceCatalogService) GetAll() ([]domain.Service, error) {
	cacheKey := "service-catalog:all"

	// Try to get from cache first
	if s.cacheClient != nil {
		var cachedServices []domain.Service
		err := s.cacheClient.GetJSON(cacheKey, &cachedServices)
		if err == nil {
			s.log.Info("Returning services from cache")
			return cachedServices, nil
		}
		s.log.Debugw("Cache miss for services", "error", err)
	}

	// Cache miss or cache not available, fetch from database
	services, err := s.serviceRepo.GetAll()
	if err != nil {
		return nil, err
	}

	// Store in cache (5 minutes TTL)
	if s.cacheClient != nil {
		err = s.cacheClient.Set(cacheKey, services, 5*time.Minute)
		if err != nil {
			s.log.Warnw("Failed to cache services", "error", err)
		} else {
			s.log.Info("Cached services list")
		}
	}

	return services, nil
}

// GetByName returns a service by name
func (s *ServiceCatalogService) GetByName(name string) (*domain.Service, error) {
	return s.serviceRepo.GetByName(name)
}

// GetServiceStatus returns runtime status for a service (with cache)
// Deprecated: Use GetServiceStatusWithKubeService instead
func (s *ServiceCatalogService) GetServiceStatus(serviceName string) (*domain.ServiceStatus, error) {
	status := &domain.ServiceStatus{
		ServiceName: serviceName,
	}

	// Get Kubernetes client
	if s.kubeService != nil {
		clientset := s.kubeService.GetClientset()
		if clientset != nil {
			// Check stage deployment
			stageDeploymentName := fmt.Sprintf("%s-stage", serviceName)
			stageStatus, _ := s.getDeploymentStatus(clientset, stageDeploymentName, "stage")
			status.StageStatus = stageStatus

			// Check prod deployment
			prodDeploymentName := fmt.Sprintf("%s-prod", serviceName)
			prodStatus, _ := s.getDeploymentStatus(clientset, prodDeploymentName, "prod")
			status.ProdStatus = prodStatus
		}
	}

	return status, nil
}

// GetServiceStatusWithKubeService returns runtime status for a service using provided KubernetesService
func (s *ServiceCatalogService) GetServiceStatusWithKubeService(serviceName string, kubeService *KubernetesService) (*domain.ServiceStatus, error) {
	cacheKey := fmt.Sprintf("service-catalog:status:%s", serviceName)

	// Try to get from cache first
	if s.cacheClient != nil {
		var cachedStatus domain.ServiceStatus
		err := s.cacheClient.GetJSON(cacheKey, &cachedStatus)
		if err == nil {
			s.log.Debugw("Returning service status from cache", "service", serviceName)
			return &cachedStatus, nil
		}
	}

	status := &domain.ServiceStatus{
		ServiceName: serviceName,
	}

	// Get Kubernetes client
	clientset := kubeService.GetClientset()
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

	// Store in cache (30 seconds TTL - status changes frequently)
	if s.cacheClient != nil {
		err := s.cacheClient.Set(cacheKey, status, 30*time.Second)
		if err != nil {
			s.log.Warnw("Failed to cache service status", "service", serviceName, "error", err)
		}
	}

	return status, nil
}

// getDeploymentStatus gets status of a specific deployment
func (s *ServiceCatalogService) getDeploymentStatus(clientset *kubernetes.Clientset, deploymentName, environment string) (*domain.DeploymentStatus, error) {
	// First try to find by name directly (searching all namespaces)
	deployments, err := clientset.AppsV1().Deployments("").List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	var dep *appsv1.Deployment
	for i := range deployments.Items {
		if deployments.Items[i].Name == deploymentName {
			dep = &deployments.Items[i]
			break
		}
	}

	// If not found by name, try by label selector (for backward compatibility)
	if dep == nil {
		labelDeployments, err := clientset.AppsV1().Deployments("").List(context.TODO(), metav1.ListOptions{
			LabelSelector: fmt.Sprintf("app=%s", deploymentName),
		})
		if err == nil && len(labelDeployments.Items) > 0 {
			dep = &labelDeployments.Items[0]
		}
	}

	if dep == nil {
		return nil, fmt.Errorf("deployment %s not found", deploymentName)
	}

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
	// Try to get pods by matching the deployment name in labels or pod name prefix
	pods, err := clientset.CoreV1().Pods(namespace).List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	// Filter pods that belong to this deployment
	var matchingPods []v1.Pod
	for _, pod := range pods.Items {
		// Check if pod name starts with deployment name (common pattern)
		if strings.HasPrefix(pod.Name, deploymentName) {
			matchingPods = append(matchingPods, pod)
			continue
		}
		// Check labels
		if pod.Labels["app"] == deploymentName {
			matchingPods = append(matchingPods, pod)
			continue
		}
		// Check if pod has owner reference to this deployment
		for _, owner := range pod.OwnerReferences {
			if owner.Kind == "ReplicaSet" {
				// Get the ReplicaSet to check if it belongs to this deployment
				rs, err := clientset.AppsV1().ReplicaSets(namespace).Get(context.TODO(), owner.Name, metav1.GetOptions{})
				if err == nil {
					for _, rsOwner := range rs.OwnerReferences {
						if rsOwner.Kind == "Deployment" && rsOwner.Name == deploymentName {
							matchingPods = append(matchingPods, pod)
							break
						}
					}
				}
			}
		}
	}

	var podInfos []domain.PodInfo
	for _, pod := range matchingPods {
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

// GetServiceMetrics returns aggregated metrics from SonarQube and last build from Azure DevOps (with cache)
func (s *ServiceCatalogService) GetServiceMetrics(serviceName string, sonarQubeServices []*SonarQubeService, azureDevOpsServices []*AzureDevOpsService) map[string]interface{} {
	cacheKey := fmt.Sprintf("service-catalog:metrics:%s", serviceName)

	// Try to get from cache first
	if s.cacheClient != nil {
		var cachedMetrics map[string]interface{}
		err := s.cacheClient.GetJSON(cacheKey, &cachedMetrics)
		if err == nil {
			s.log.Debugw("Returning service metrics from cache", "service", serviceName)
			return cachedMetrics
		}
	}

	metrics := make(map[string]interface{})
	metrics["serviceName"] = serviceName

	// Get service info to find the correct SonarQube project name
	service, err := s.serviceRepo.GetByName(serviceName)
	var sonarQubeProjectKey string
	if err == nil && service != nil {
		// Use sonarqubeProject if available, otherwise use application, otherwise use serviceName
		if service.SonarQubeProject != "" {
			sonarQubeProjectKey = service.SonarQubeProject
		} else if service.Application != "" {
			sonarQubeProjectKey = service.Application
		} else {
			sonarQubeProjectKey = serviceName
		}
	} else {
		sonarQubeProjectKey = serviceName
	}

	// Fetch SonarQube metrics from all integrations
	if len(sonarQubeServices) > 0 {
		for _, sonarQubeService := range sonarQubeServices {
			if sonarQubeService == nil {
				continue
			}

			// Try sonarqubeProject first, then application, then serviceName
			projectKeys := []string{sonarQubeProjectKey}
			if service != nil && service.Application != "" && service.Application != sonarQubeProjectKey {
				projectKeys = append(projectKeys, service.Application)
			}
			if serviceName != sonarQubeProjectKey {
				projectKeys = append(projectKeys, serviceName)
			}

			for _, projectKey := range projectKeys {
				sonarMetrics, err := sonarQubeService.GetProjectMeasures(projectKey)
				if err == nil && sonarMetrics != nil {
					s.log.Infow("Fetched SonarQube metrics",
						"service", serviceName,
						"projectKey", projectKey,
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
					break // Found metrics, no need to try other project keys
				} else {
					s.log.Debugw("Failed to fetch SonarQube metrics for project",
						"service", serviceName,
						"projectKey", projectKey,
						"error", err,
					)
				}
			}

			// If we found metrics, no need to check other integrations
			if metrics["sonarqube"] != nil {
				break
			}
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

	// Store in cache (3 minutes TTL)
	if s.cacheClient != nil {
		err := s.cacheClient.Set(cacheKey, metrics, 3*time.Minute)
		if err != nil {
			s.log.Warnw("Failed to cache service metrics", "service", serviceName, "error", err)
		}
	}

	return metrics
}

// GetMultipleServiceMetrics returns metrics for multiple services
func (s *ServiceCatalogService) GetMultipleServiceMetrics(serviceNames []string, sonarQubeServices []*SonarQubeService, azureDevOpsServices []*AzureDevOpsService) map[string]interface{} {
	result := make(map[string]interface{})

	for _, serviceName := range serviceNames {
		result[serviceName] = s.GetServiceMetrics(serviceName, sonarQubeServices, azureDevOpsServices)
	}

	return result
}

// Helper function to parse yes/no to bool
func parseBool(s string) bool {
	return strings.ToLower(s) == "yes" || strings.ToLower(s) == "true"
}
