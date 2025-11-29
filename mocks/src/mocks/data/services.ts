export const mockServices = [
  {
    id: '1',
    name: 'api-gateway',
    description: 'Gateway principal da API',
    repository: 'https://github.com/empresa/api-gateway',
    version: '2.5.1',
    status: 'healthy',
    health: {
      status: 'healthy',
      uptime: 99.98,
      lastCheck: new Date().toISOString()
    },
    metrics: {
      cpu: 45,
      memory: 62,
      requests: 15420,
      errors: 12
    },
    team: 'Platform',
    owner: 'Maria Santos',
    lastDeploy: '2024-03-15T10:30:00Z',
    tags: ['api', 'gateway', 'critical']
  },
  {
    id: '2',
    name: 'auth-service',
    description: 'Serviço de autenticação e autorização',
    repository: 'https://github.com/empresa/auth-service',
    version: '1.8.3',
    status: 'healthy',
    health: {
      status: 'healthy',
      uptime: 99.95,
      lastCheck: new Date().toISOString()
    },
    metrics: {
      cpu: 32,
      memory: 48,
      requests: 8450,
      errors: 3
    },
    team: 'Security',
    owner: 'Pedro Costa',
    lastDeploy: '2024-03-14T15:20:00Z',
    tags: ['auth', 'security', 'critical']
  },
  {
    id: '3',
    name: 'payment-service',
    description: 'Processamento de pagamentos',
    repository: 'https://github.com/empresa/payment-service',
    version: '3.2.0',
    status: 'warning',
    health: {
      status: 'degraded',
      uptime: 99.85,
      lastCheck: new Date().toISOString()
    },
    metrics: {
      cpu: 78,
      memory: 85,
      requests: 22100,
      errors: 45
    },
    team: 'Payments',
    owner: 'Ana Oliveira',
    lastDeploy: '2024-03-16T09:15:00Z',
    tags: ['payment', 'fintech', 'critical']
  },
  {
    id: '4',
    name: 'notification-service',
    description: 'Envio de notificações por email e SMS',
    repository: 'https://github.com/empresa/notification-service',
    version: '1.5.2',
    status: 'healthy',
    health: {
      status: 'healthy',
      uptime: 99.92,
      lastCheck: new Date().toISOString()
    },
    metrics: {
      cpu: 28,
      memory: 35,
      requests: 12800,
      errors: 8
    },
    team: 'Communications',
    owner: 'Carlos Ferreira',
    lastDeploy: '2024-03-13T14:45:00Z',
    tags: ['notification', 'email', 'sms']
  },
  {
    id: '5',
    name: 'user-service',
    description: 'Gerenciamento de usuários',
    repository: 'https://github.com/empresa/user-service',
    version: '2.1.4',
    status: 'healthy',
    health: {
      status: 'healthy',
      uptime: 99.97,
      lastCheck: new Date().toISOString()
    },
    metrics: {
      cpu: 38,
      memory: 52,
      requests: 18600,
      errors: 5
    },
    team: 'Platform',
    owner: 'Juliana Alves',
    lastDeploy: '2024-03-15T16:30:00Z',
    tags: ['user', 'profile', 'core']
  }
]

export const mockServiceCatalog = [
  {
    id: 1,
    name: 'api-gateway',
    squad: 'Platform',
    application: 'Gateway',
    language: 'TypeScript',
    version: '18.17.0',
    repositoryType: 'GitHub',
    repositoryUrl: 'https://github.com/empresa/api-gateway',
    sonarqubeProject: 'api-gateway',
    namespace: 'production',
    microservices: true,
    monorepo: false,
    testUnit: true,
    infra: 'Kubernetes',
    hasStage: true,
    hasProd: true,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-03-16T14:30:00Z'
  },
  {
    id: 2,
    name: 'auth-service',
    squad: 'Security',
    application: 'Autenticação',
    language: 'Go',
    version: '1.21.0',
    repositoryType: 'GitHub',
    repositoryUrl: 'https://github.com/empresa/auth-service',
    sonarqubeProject: 'auth-service',
    namespace: 'production',
    microservices: true,
    monorepo: false,
    testUnit: true,
    infra: 'Kubernetes',
    hasStage: true,
    hasProd: true,
    createdAt: '2024-01-20T09:00:00Z',
    updatedAt: '2024-03-15T11:20:00Z'
  },
  {
    id: 3,
    name: 'payment-service',
    squad: 'Payments',
    application: 'Pagamentos',
    language: 'Python',
    version: '3.11.0',
    repositoryType: 'GitHub',
    repositoryUrl: 'https://github.com/empresa/payment-service',
    sonarqubeProject: 'payment-service',
    namespace: 'production',
    microservices: true,
    monorepo: false,
    testUnit: true,
    infra: 'Kubernetes',
    hasStage: true,
    hasProd: true,
    createdAt: '2024-02-01T14:00:00Z',
    updatedAt: '2024-03-16T09:15:00Z'
  },
]

export const mockServiceMetrics: Record<string, any> = {
  'api-gateway': {
    sonarqube: {
      bugs: 2,
      vulnerabilities: 1,
      codeSmells: 45,
      securityHotspots: 3,
      coverage: 87.5
    },
    stageBuild: {
      status: 'succeeded',
      buildNumber: '1234',
      sourceBranch: 'develop',
      finishTime: '2024-03-16T10:30:00Z',
      integration: 'Azure DevOps'
    },
    mainBuild: {
      status: 'succeeded',
      buildNumber: '1230',
      sourceBranch: 'main',
      finishTime: '2024-03-15T10:30:00Z',
      integration: 'Azure DevOps'
    }
  },
  'auth-service': {
    sonarqube: {
      bugs: 0,
      vulnerabilities: 0,
      codeSmells: 12,
      securityHotspots: 1,
      coverage: 92.3
    },
    stageBuild: {
      status: 'succeeded',
      buildNumber: '856',
      sourceBranch: 'develop',
      finishTime: '2024-03-15T14:20:00Z',
      integration: 'Azure DevOps'
    },
    mainBuild: {
      status: 'succeeded',
      buildNumber: '852',
      sourceBranch: 'main',
      finishTime: '2024-03-14T15:20:00Z',
      integration: 'Azure DevOps'
    }
  },
  'payment-service': {
    sonarqube: {
      bugs: 5,
      vulnerabilities: 2,
      codeSmells: 78,
      securityHotspots: 8,
      coverage: 65.2
    },
    stageBuild: {
      status: 'succeeded',
      buildNumber: '2341',
      sourceBranch: 'develop',
      finishTime: '2024-03-16T09:15:00Z',
      integration: 'Azure DevOps'
    },
    mainBuild: {
      status: 'failed',
      buildNumber: '2338',
      sourceBranch: 'main',
      finishTime: '2024-03-15T09:15:00Z',
      integration: 'Azure DevOps'
    }
  },
  'notification-service': {
    sonarqube: {
      bugs: 1,
      vulnerabilities: 0,
      codeSmells: 23,
      securityHotspots: 2,
      coverage: 78.9
    },
    stageBuild: {
      status: 'succeeded',
      buildNumber: '567',
      sourceBranch: 'develop',
      finishTime: '2024-03-14T16:45:00Z',
      integration: 'Azure DevOps'
    },
    mainBuild: {
      status: 'succeeded',
      buildNumber: '564',
      sourceBranch: 'main',
      finishTime: '2024-03-13T14:45:00Z',
      integration: 'Azure DevOps'
    }
  },
}

export const mockServiceStatus: Record<string, any> = {
  'api-gateway': {
    serviceName: 'api-gateway',
    stageStatus: {
      environment: 'staging',
      status: 'Running',
      replicas: 2,
      availableReplicas: 2,
      image: 'api-gateway:2.5.1',
      lastDeployed: '2024-03-15T10:30:00Z',
      pods: [
        {
          name: 'api-gateway-staging-7d8f9c4b-abc12',
          status: 'Running',
          ready: '1/1',
          restarts: 0,
          age: '2d',
          node: 'node-1',
          namespace: 'staging'
        },
        {
          name: 'api-gateway-staging-7d8f9c4b-def34',
          status: 'Running',
          ready: '1/1',
          restarts: 0,
          age: '2d',
          node: 'node-2',
          namespace: 'staging'
        }
      ]
    },
    prodStatus: {
      environment: 'production',
      status: 'Running',
      replicas: 3,
      availableReplicas: 3,
      image: 'api-gateway:2.5.1',
      lastDeployed: '2024-03-15T10:30:00Z',
      pods: [
        {
          name: 'api-gateway-prod-8e9f0d5c-jkl78',
          status: 'Running',
          ready: '1/1',
          restarts: 0,
          age: '3d',
          node: 'node-4',
          namespace: 'production'
        },
        {
          name: 'api-gateway-prod-8e9f0d5c-mno90',
          status: 'Running',
          ready: '1/1',
          restarts: 0,
          age: '3d',
          node: 'node-5',
          namespace: 'production'
        },
        {
          name: 'api-gateway-prod-8e9f0d5c-pqr12',
          status: 'Running',
          ready: '1/1',
          restarts: 0,
          age: '3d',
          node: 'node-6',
          namespace: 'production'
        }
      ]
    }
  },
  'auth-service': {
    serviceName: 'auth-service',
    stageStatus: {
      environment: 'staging',
      status: 'Running',
      replicas: 2,
      availableReplicas: 2,
      image: 'auth-service:1.8.3',
      lastDeployed: '2024-03-14T15:20:00Z',
      pods: [
        {
          name: 'auth-service-staging-9a0b1c2d-yza78',
          status: 'Running',
          ready: '1/1',
          restarts: 0,
          age: '2d',
          node: 'node-1',
          namespace: 'staging'
        },
        {
          name: 'auth-service-staging-9a0b1c2d-bcd90',
          status: 'Running',
          ready: '1/1',
          restarts: 0,
          age: '2d',
          node: 'node-2',
          namespace: 'staging'
        }
      ]
    },
    prodStatus: {
      environment: 'production',
      status: 'Running',
      replicas: 3,
      availableReplicas: 3,
      image: 'auth-service:1.8.3',
      lastDeployed: '2024-03-14T15:20:00Z',
      pods: [
        {
          name: 'auth-service-prod-0b1c2d3e-efg12',
          status: 'Running',
          ready: '1/1',
          restarts: 0,
          age: '3d',
          node: 'node-4',
          namespace: 'production'
        },
        {
          name: 'auth-service-prod-0b1c2d3e-hij34',
          status: 'Running',
          ready: '1/1',
          restarts: 0,
          age: '3d',
          node: 'node-5',
          namespace: 'production'
        },
        {
          name: 'auth-service-prod-0b1c2d3e-klm56',
          status: 'Running',
          ready: '1/1',
          restarts: 0,
          age: '2d',
          node: 'node-6',
          namespace: 'production'
        }
      ]
    }
  },
  'payment-service': {
    serviceName: 'payment-service',
    stageStatus: {
      environment: 'staging',
      status: 'Running',
      replicas: 2,
      availableReplicas: 2,
      image: 'payment-service:3.2.0',
      lastDeployed: '2024-03-16T09:15:00Z',
      pods: [
        {
          name: 'payment-service-staging-1c2d3e4f-qrs90',
          status: 'Running',
          ready: '1/1',
          restarts: 1,
          age: '1d',
          node: 'node-1',
          namespace: 'staging'
        },
        {
          name: 'payment-service-staging-1c2d3e4f-tuv12',
          status: 'Running',
          ready: '1/1',
          restarts: 0,
          age: '1d',
          node: 'node-2',
          namespace: 'staging'
        }
      ]
    },
    prodStatus: {
      environment: 'production',
      status: 'Running',
      replicas: 3,
      availableReplicas: 3,
      image: 'payment-service:3.2.0',
      lastDeployed: '2024-03-16T09:15:00Z',
      pods: [
        {
          name: 'payment-service-prod-2d3e4f5g-wxy34',
          status: 'Running',
          ready: '1/1',
          restarts: 0,
          age: '1d',
          node: 'node-4',
          namespace: 'production'
        },
        {
          name: 'payment-service-prod-2d3e4f5g-zab56',
          status: 'Running',
          ready: '1/1',
          restarts: 1,
          age: '1d',
          node: 'node-5',
          namespace: 'production'
        },
        {
          name: 'payment-service-prod-2d3e4f5g-cde78',
          status: 'Running',
          ready: '1/1',
          restarts: 0,
          age: '1d',
          node: 'node-6',
          namespace: 'production'
        }
      ]
    }
  },
}

export const getMockServices = async () => {
  await new Promise(resolve => setTimeout(resolve, 300))
  return mockServices
}

export const getMockServiceById = async (id: string) => {
  await new Promise(resolve => setTimeout(resolve, 200))
  return mockServices.find(s => s.id === id)
}

export const getMockServiceCatalog = async () => {
  await new Promise(resolve => setTimeout(resolve, 300))
  return {
    services: mockServiceCatalog,
    total: mockServiceCatalog.length
  }
}

export const getMockServiceCatalogMetrics = async (serviceNames: string[]) => {
  await new Promise(resolve => setTimeout(resolve, 400))
  const metrics: Record<string, any> = {}
  serviceNames.forEach(name => {
    if (mockServiceMetrics[name]) {
      metrics[name] = mockServiceMetrics[name]
    }
  })
  return { metrics }
}

export const getMockServiceCatalogStatus = async (serviceName: string) => {
  await new Promise(resolve => setTimeout(resolve, 200))
  return mockServiceStatus[serviceName] || null
}
