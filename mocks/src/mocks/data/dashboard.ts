export const mockDashboardMetrics = [
  {
    label: 'Uptime Total',
    value: '99.97%',
    change: '+0.05%',
    trend: 'up',
    color: '#10b981',
    icon: 'check'
  },
  {
    label: 'Requests/min',
    value: '12.5K',
    change: '+8.2%',
    trend: 'up',
    color: '#3b82f6',
    icon: 'zap'
  },
  {
    label: 'Latência Média',
    value: '245ms',
    change: '-12%',
    trend: 'up',
    color: '#8b5cf6',
    icon: 'clock'
  },
  {
    label: 'Taxa de Erros',
    value: '0.12%',
    change: '-0.03%',
    trend: 'up',
    color: '#ef4444',
    icon: 'alert'
  }
]

export const mockDashboardServices = [
  {
    name: 'api-gateway',
    version: 'v2.5.1',
    status: 'healthy',
    deployedAt: 'Há 5 dias',
    requests: '15.4K/min',
    uptime: '99.98%',
    lastDeploy: '2024-03-15T10:30:00Z'
  },
  {
    name: 'auth-service',
    version: 'v1.8.3',
    status: 'healthy',
    deployedAt: 'Há 3 dias',
    requests: '8.5K/min',
    uptime: '99.95%',
    lastDeploy: '2024-03-14T15:20:00Z'
  },
  {
    name: 'payment-service',
    version: 'v3.2.0',
    status: 'warning',
    deployedAt: 'Há 2 dias',
    requests: '22.1K/min',
    uptime: '99.85%',
    lastDeploy: '2024-03-16T09:15:00Z'
  },
  {
    name: 'notification-service',
    version: 'v1.5.2',
    status: 'healthy',
    deployedAt: 'Há 7 dias',
    requests: '12.8K/min',
    uptime: '99.92%',
    lastDeploy: '2024-03-13T14:45:00Z'
  },
  {
    name: 'user-service',
    version: 'v2.1.4',
    status: 'healthy',
    deployedAt: 'Há 4 dias',
    requests: '18.6K/min',
    uptime: '99.97%',
    lastDeploy: '2024-03-15T16:30:00Z'
  },
  {
    name: 'analytics-service',
    version: 'v1.3.8',
    status: 'healthy',
    deployedAt: 'Há 6 dias',
    requests: '5.2K/min',
    uptime: '99.94%',
    lastDeploy: '2024-03-14T08:15:00Z'
  },
  {
    name: 'search-service',
    version: 'v2.0.1',
    status: 'healthy',
    deployedAt: 'Há 1 dia',
    requests: '9.7K/min',
    uptime: '99.99%',
    lastDeploy: '2024-03-17T11:20:00Z'
  },
  {
    name: 'media-service',
    version: 'v1.7.5',
    status: 'healthy',
    deployedAt: 'Há 8 dias',
    requests: '6.3K/min',
    uptime: '99.91%',
    lastDeploy: '2024-03-12T13:40:00Z'
  }
]

export const mockRecentDeployments = [
  {
    service: 'search-service',
    version: 'v2.0.1',
    author: 'Maria Santos',
    time: 'Há 2 horas',
    status: 'success'
  },
  {
    service: 'payment-service',
    version: 'v3.2.0',
    author: 'Ana Oliveira',
    time: 'Há 5 horas',
    status: 'success'
  },
  {
    service: 'api-gateway',
    version: 'v2.5.1',
    author: 'Carlos Ferreira',
    time: 'Há 8 horas',
    status: 'success'
  },
  {
    service: 'notification-service',
    version: 'v1.5.2',
    author: 'Pedro Costa',
    time: 'Há 12 horas',
    status: 'warning'
  },
  {
    service: 'user-service',
    version: 'v2.1.4',
    author: 'Juliana Alves',
    time: 'Ontem às 18:30',
    status: 'success'
  },
  {
    service: 'auth-service',
    version: 'v1.8.3',
    author: 'Roberto Silva',
    time: 'Ontem às 15:20',
    status: 'success'
  },
  {
    service: 'analytics-service',
    version: 'v1.3.8',
    author: 'Fernanda Lima',
    time: 'Há 2 dias',
    status: 'success'
  },
  {
    service: 'media-service',
    version: 'v1.7.5',
    author: 'Lucas Mendes',
    time: 'Há 3 dias',
    status: 'success'
  }
]

export const mockQuickStats = [
  {
    label: 'Serviços',
    value: '12',
    color: '#10b981',
    icon: 'rocket'
  },
  {
    label: 'Clusters',
    value: '3',
    color: '#3b82f6',
    icon: 'container'
  },
  {
    label: 'Deployments',
    value: '24',
    color: '#8b5cf6',
    icon: 'package'
  },
  {
    label: 'Alertas',
    value: '3',
    color: '#f59e0b',
    icon: 'alert'
  }
]

export const getMockDashboardData = async () => {
  await new Promise(resolve => setTimeout(resolve, 400))
  return {
    metrics: mockDashboardMetrics,
    services: mockDashboardServices,
    recentDeployments: mockRecentDeployments,
    quickStats: mockQuickStats
  }
}
