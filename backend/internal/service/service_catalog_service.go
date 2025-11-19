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
	log                *logger.Logger
}

func NewServiceCatalogService(
	serviceRepo *repository.ServiceRepository,
	kubeService *KubernetesService,
	azureDevOpsService *AzureDevOpsService,
	log *logger.Logger,
) *ServiceCatalogService {
	return &ServiceCatalogService{
		serviceRepo:        serviceRepo,
		kubeService:        kubeService,
		azureDevOpsService: azureDevOpsService,
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

// fetchServiceMetadata fetches metadata from Azure DevOps ci/pipeline.yml
func (s *ServiceCatalogService) fetchServiceMetadata(squad, application, namespace string) (*domain.Service, error) {
	serviceName := fmt.Sprintf("%s-%s", squad, application)

	// Fetch file content from Azure DevOps
	// Repository name follows pattern: squad-application
	fileContent, err := s.azureDevOpsService.GetFileContent(serviceName, "ci/pipeline.yml", "main")
	if err != nil {
		// Try refs/heads/main
		fileContent, err = s.azureDevOpsService.GetFileContent(serviceName, "ci/pipeline.yml", "refs/heads/main")
		if err != nil {
			return nil, fmt.Errorf("failed to fetch pipeline.yml: %w", err)
		}
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
		RepositoryType:   "azuredevops", // Default, can be enhanced
		SonarQubeProject: serviceName,
		Namespace:        namespace,
		Microservices:    parseBool(vars["microservices"]),
		Monorepo:         parseBool(vars["monorepo"]),
		TestUnit:         parseBool(vars["testun"]),
		Infra:            vars["infra"],
	}

	// Try to get repository URL
	repoURL, err := s.azureDevOpsService.GetRepositoryURL(serviceName)
	if err == nil {
		service.RepositoryURL = repoURL
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

// Helper function to parse yes/no to bool
func parseBool(s string) bool {
	return strings.ToLower(s) == "yes" || strings.ToLower(s) == "true"
}
