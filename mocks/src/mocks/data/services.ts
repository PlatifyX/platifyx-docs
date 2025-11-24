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

export const getMockServices = async () => {
  await new Promise(resolve => setTimeout(resolve, 300))
  return mockServices
}

export const getMockServiceById = async (id: string) => {
  await new Promise(resolve => setTimeout(resolve, 200))
  return mockServices.find(s => s.id === id)
}
