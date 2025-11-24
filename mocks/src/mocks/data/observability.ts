export const mockObservabilityMetrics = {
  uptime: 99.95,
  avgResponseTime: 245,
  requestsPerMinute: 1250,
  errorRate: 0.12,
  activeAlerts: 3
}

export const mockAlerts = [
  {
    id: 'alert-1',
    severity: 'critical',
    title: 'Alta latência no payment-service',
    description: 'Tempo de resposta médio acima de 2s nos últimos 5 minutos',
    service: 'payment-service',
    timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    status: 'firing',
    assignee: 'Ana Oliveira'
  },
  {
    id: 'alert-2',
    severity: 'warning',
    title: 'Uso elevado de memória - auth-service',
    description: 'Consumo de memória acima de 85%',
    service: 'auth-service',
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    status: 'firing',
    assignee: 'Pedro Costa'
  },
  {
    id: 'alert-3',
    severity: 'warning',
    title: 'Aumento na taxa de erros 5xx',
    description: 'Taxa de erros 5xx acima do limite em api-gateway',
    service: 'api-gateway',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    status: 'firing',
    assignee: 'Maria Santos'
  }
]

export const mockLogs = [
  {
    timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    level: 'error',
    service: 'payment-service',
    message: 'Payment gateway timeout after 30s',
    traceId: 'abc123xyz'
  },
  {
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    level: 'warning',
    service: 'auth-service',
    message: 'Rate limit approaching for IP 192.168.1.100',
    traceId: 'def456uvw'
  },
  {
    timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    level: 'info',
    service: 'notification-service',
    message: 'Email sent successfully to user@example.com',
    traceId: 'ghi789rst'
  },
  {
    timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    level: 'error',
    service: 'api-gateway',
    message: 'Upstream service unavailable: user-service',
    traceId: 'jkl012mno'
  }
]

export const mockMetricsTimeSeries = {
  responseTime: [
    { timestamp: Date.now() - 60000, value: 235 },
    { timestamp: Date.now() - 50000, value: 248 },
    { timestamp: Date.now() - 40000, value: 256 },
    { timestamp: Date.now() - 30000, value: 241 },
    { timestamp: Date.now() - 20000, value: 238 },
    { timestamp: Date.now() - 10000, value: 245 }
  ],
  requestRate: [
    { timestamp: Date.now() - 60000, value: 1180 },
    { timestamp: Date.now() - 50000, value: 1220 },
    { timestamp: Date.now() - 40000, value: 1280 },
    { timestamp: Date.now() - 30000, value: 1245 },
    { timestamp: Date.now() - 20000, value: 1260 },
    { timestamp: Date.now() - 10000, value: 1250 }
  ],
  errorRate: [
    { timestamp: Date.now() - 60000, value: 0.08 },
    { timestamp: Date.now() - 50000, value: 0.10 },
    { timestamp: Date.now() - 40000, value: 0.15 },
    { timestamp: Date.now() - 30000, value: 0.12 },
    { timestamp: Date.now() - 20000, value: 0.11 },
    { timestamp: Date.now() - 10000, value: 0.12 }
  ]
}

export const getMockObservabilityMetrics = async () => {
  await new Promise(resolve => setTimeout(resolve, 300))
  return mockObservabilityMetrics
}

export const getMockAlerts = async () => {
  await new Promise(resolve => setTimeout(resolve, 250))
  return mockAlerts
}

export const getMockLogs = async () => {
  await new Promise(resolve => setTimeout(resolve, 350))
  return mockLogs
}

export const getMockMetricsTimeSeries = async () => {
  await new Promise(resolve => setTimeout(resolve, 400))
  return mockMetricsTimeSeries
}
