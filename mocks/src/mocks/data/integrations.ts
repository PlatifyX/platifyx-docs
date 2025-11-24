export const mockIntegrations = [
  {
    id: 'github',
    name: 'GitHub',
    description: 'Integração com GitHub para repositórios e CI/CD',
    status: 'connected',
    type: 'source-control',
    icon: '🐙',
    configuredAt: '2024-01-15T10:00:00Z',
    lastSync: '2024-03-16T14:30:00Z',
    config: {
      organization: 'empresa',
      repositories: 24,
      webhooksEnabled: true
    }
  },
  {
    id: 'gitlab',
    name: 'GitLab',
    description: 'Integração com GitLab para repositórios alternativos',
    status: 'disconnected',
    type: 'source-control',
    icon: '🦊',
    configuredAt: null,
    lastSync: null,
    config: null
  },
  {
    id: 'azure-devops',
    name: 'Azure DevOps',
    description: 'Azure DevOps para pipelines e boards',
    status: 'connected',
    type: 'ci-cd',
    icon: '☁️',
    configuredAt: '2024-02-01T09:00:00Z',
    lastSync: '2024-03-16T15:00:00Z',
    config: {
      organization: 'empresa-devops',
      projects: 8,
      pipelinesEnabled: true
    }
  },
  {
    id: 'jira',
    name: 'Jira',
    description: 'Atlassian Jira para gerenciamento de issues',
    status: 'connected',
    type: 'project-management',
    icon: '📋',
    configuredAt: '2024-01-20T11:30:00Z',
    lastSync: '2024-03-16T14:45:00Z',
    config: {
      cloudId: 'abc123',
      projects: 15,
      syncEnabled: true
    }
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Notificações e alertas via Slack',
    status: 'connected',
    type: 'communication',
    icon: '💬',
    configuredAt: '2024-01-10T08:00:00Z',
    lastSync: '2024-03-16T16:00:00Z',
    config: {
      workspace: 'empresa-team',
      channels: 12,
      notificationsEnabled: true
    }
  },
  {
    id: 'datadog',
    name: 'Datadog',
    description: 'Monitoramento e observabilidade',
    status: 'connected',
    type: 'monitoring',
    icon: '📊',
    configuredAt: '2024-02-10T10:00:00Z',
    lastSync: '2024-03-16T15:30:00Z',
    config: {
      apiKey: '***********',
      metricsEnabled: true,
      logsEnabled: true
    }
  },
  {
    id: 'sonarqube',
    name: 'SonarQube',
    description: 'Análise de qualidade de código',
    status: 'connected',
    type: 'quality',
    icon: '🔍',
    configuredAt: '2024-02-15T13:00:00Z',
    lastSync: '2024-03-16T12:00:00Z',
    config: {
      serverUrl: 'https://sonar.empresa.com',
      projects: 18
    }
  }
]

export const mockAzureDevOpsProjects = [
  {
    id: 'proj-1',
    name: 'Platform Core',
    description: 'Serviços principais da plataforma',
    url: 'https://dev.azure.com/empresa/platform-core',
    pipelines: 8,
    repositories: 12
  },
  {
    id: 'proj-2',
    name: 'Mobile Apps',
    description: 'Aplicações mobile iOS e Android',
    url: 'https://dev.azure.com/empresa/mobile-apps',
    pipelines: 4,
    repositories: 5
  },
  {
    id: 'proj-3',
    name: 'Data Platform',
    description: 'Infraestrutura de dados e analytics',
    url: 'https://dev.azure.com/empresa/data-platform',
    pipelines: 6,
    repositories: 8
  }
]

export const getMockIntegrations = async () => {
  await new Promise(resolve => setTimeout(resolve, 300))
  return mockIntegrations
}

export const getMockAzureDevOpsProjects = async () => {
  await new Promise(resolve => setTimeout(resolve, 350))
  return mockAzureDevOpsProjects
}

export const testMockIntegration = async (integrationId: string) => {
  await new Promise(resolve => setTimeout(resolve, 800))
  return {
    success: true,
    message: 'Conexão testada com sucesso',
    details: {
      responseTime: '234ms',
      apiVersion: 'v3'
    }
  }
}
