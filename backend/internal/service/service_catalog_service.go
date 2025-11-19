package service

import (
	"context"
	"fmt"
	"strings"

	"github.com/PlatifyX/platifyx-core/internal/domain"
	"github.com/PlatifyX/platifyx-core/internal/repository"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"gopkg.in/yaml.v3"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
)

type ServiceCatalogService struct {
	serviceRepo        *repository.ServiceRepository
	kubeService        *KubernetesService
	azureDevOpsService *AzureDevOpsService
	githubService      *GitHubService
	log                *logger.Logger
}

func NewServiceCatalogService(
	serviceRepo *repository.ServiceRepository,
	kubeService *KubernetesService,
	azureDevOpsService *AzureDevOpsService,
	githubService *GitHubService,
	log *logger.Logger,
) *ServiceCatalogService {
	return &ServiceCatalogService{
		serviceRepo:        serviceRepo,
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

	// If GitHub failed or not available, try Azure DevOps
	if fileContent == "" && s.azureDevOpsService != nil {
		s.log.Infow("Trying to fetch from Azure DevOps", "service", serviceName)

		fileContent, err = s.azureDevOpsService.GetFileContent(serviceName, "ci/pipeline.yml", "main")
		if err != nil {
			// Try refs/heads/main
			fileContent, err = s.azureDevOpsService.GetFileContent(serviceName, "ci/pipeline.yml", "refs/heads/main")
		}

		if err == nil {
			repoURL, _ = s.azureDevOpsService.GetRepositoryURL(serviceName)
			repositoryType = "azuredevops"
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

	return status, nil
}

// GetServiceMetrics returns aggregated metrics from SonarQube and last build from Azure DevOps
func (s *ServiceCatalogService) GetServiceMetrics(serviceName string, sonarQubeService *SonarQubeService, azureDevOpsService *AzureDevOpsService) map[string]interface{} {
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

	// Fetch last builds from Azure DevOps for stage and main branches
	if azureDevOpsService != nil {
		builds, err := azureDevOpsService.GetBuilds(100) // Get latest 100 builds
		if err == nil && len(builds) > 0 {
			var stageBuild, mainBuild map[string]interface{}

			// Find the latest builds for stage and main branches
			for _, build := range builds {
				// Check if the build definition name matches the service name
				if build.Definition.Name == serviceName {
					sourceBranch := strings.ToLower(build.SourceBranch)

					// Check if this is a stage build
					if stageBuild == nil && (strings.Contains(sourceBranch, "stage") ||
						strings.HasSuffix(sourceBranch, "refs/heads/stage")) {
						stageBuild = map[string]interface{}{
							"status":       build.Result,
							"buildNumber":  build.BuildNumber,
							"sourceBranch": build.SourceBranch,
							"finishTime":   build.FinishTime,
							"integration":  build.Integration,
						}
					}

					// Check if this is a main/master build
					if mainBuild == nil && (strings.Contains(sourceBranch, "main") ||
						strings.Contains(sourceBranch, "master") ||
						strings.HasSuffix(sourceBranch, "refs/heads/main") ||
						strings.HasSuffix(sourceBranch, "refs/heads/master")) {
						mainBuild = map[string]interface{}{
							"status":       build.Result,
							"buildNumber":  build.BuildNumber,
							"sourceBranch": build.SourceBranch,
							"finishTime":   build.FinishTime,
							"integration":  build.Integration,
						}
					}

					// Break if we found both
					if stageBuild != nil && mainBuild != nil {
						break
					}
				}
			}

			// Add builds to metrics if found
			if stageBuild != nil {
				metrics["stageBuild"] = stageBuild
			}
			if mainBuild != nil {
				metrics["mainBuild"] = mainBuild
			}
		}
	}

	return metrics
}

// GetMultipleServiceMetrics returns metrics for multiple services
func (s *ServiceCatalogService) GetMultipleServiceMetrics(serviceNames []string, sonarQubeService *SonarQubeService, azureDevOpsService *AzureDevOpsService) map[string]interface{} {
	result := make(map[string]interface{})

	for _, serviceName := range serviceNames {
		result[serviceName] = s.GetServiceMetrics(serviceName, sonarQubeService, azureDevOpsService)
	}

	return result
}

// Helper function to parse yes/no to bool
func parseBool(s string) bool {
	return strings.ToLower(s) == "yes" || strings.ToLower(s) == "true"
}
