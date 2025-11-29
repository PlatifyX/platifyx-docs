export interface PrometheusAlert {
  labels: { [key: string]: string }
  annotations: { [key: string]: string }
  state: string
  activeAt: string
  value: string
}

export interface PrometheusStats {
  totalTargets: number
  activeTargets: number
  totalAlerts: number
  firingAlerts: number
}

export interface GrafanaStats {
  totalDashboards: number
  totalAlerts: number
  alertingAlerts: number
  totalDataSources: number
}

export interface GrafanaDashboard {
  id: number
  uid: string
  title: string
  url: string
  type: string
  tags: string[]
  isStarred: boolean
  uri: string
  folderTitle?: string
}

export interface LokiApp {
  name: string
  squad?: string
  application?: string
  environment?: string
}

export interface LokiLogEntry {
  timestamp: string
  line: string
  labels: { [key: string]: string }
}

export interface LokiStream {
  stream: { [key: string]: string }
  values: string[][]
}

export const mockPrometheusStats: PrometheusStats = {
  totalTargets: 12,
  activeTargets: 11,
  totalAlerts: 8,
  firingAlerts: 3
}

export const mockPrometheusAlerts: PrometheusAlert[] = [
  {
    labels: {
      alertname: 'HighLatency',
      squad: 'Payments',
      service: 'payment-service',
      severity: 'critical'
    },
    annotations: {
      summary: 'Alta latência no payment-service',
      description: 'Tempo de resposta médio acima de 2s nos últimos 5 minutos'
    },
    state: 'firing',
    activeAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    value: '2.5'
  },
  {
    labels: {
      alertname: 'HighMemoryUsage',
      squad: 'Security',
      service: 'auth-service',
      severity: 'warning'
    },
    annotations: {
      summary: 'Uso elevado de memória',
      description: 'Consumo de memória acima de 85% no auth-service'
    },
    state: 'firing',
    activeAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    value: '87.5'
  },
  {
    labels: {
      alertname: 'HighErrorRate',
      squad: 'Platform',
      service: 'api-gateway',
      severity: 'warning'
    },
    annotations: {
      summary: 'Aumento na taxa de erros 5xx',
      description: 'Taxa de erros 5xx acima do limite em api-gateway'
    },
    state: 'firing',
    activeAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    value: '0.15'
  }
]

export const mockGrafanaStats: GrafanaStats = {
  totalDashboards: 15,
  totalAlerts: 12,
  alertingAlerts: 2,
  totalDataSources: 5
}

export const mockGrafanaConfig = {
  url: 'https://grafana.example.com'
}

export const mockGrafanaDashboards: GrafanaDashboard[] = [
  {
    id: 1,
    uid: 'main-dashboard',
    title: 'Main Dashboard',
    url: 'https://grafana.example.com/d/main-dashboard',
    type: 'dash-db',
    tags: ['production', 'overview'],
    isStarred: true,
    uri: 'db/main-dashboard',
    folderTitle: 'General'
  },
  {
    id: 2,
    uid: 'api-metrics',
    title: 'API Metrics',
    url: 'https://grafana.example.com/d/api-metrics',
    type: 'dash-db',
    tags: ['api', 'metrics'],
    isStarred: false,
    uri: 'db/api-metrics',
    folderTitle: 'Services'
  },
  {
    id: 3,
    uid: 'infrastructure',
    title: 'Infrastructure Overview',
    url: 'https://grafana.example.com/d/infrastructure',
    type: 'dash-db',
    tags: ['infrastructure', 'kubernetes'],
    isStarred: false,
    uri: 'db/infrastructure',
    folderTitle: 'Infrastructure'
  }
]

export const mockLokiApps: string[] = [
  'platform-api-gateway-prod',
  'platform-api-gateway-stage',
  'security-auth-service-prod',
  'security-auth-service-stage',
  'payments-payment-service-prod',
  'payments-payment-service-stage',
  'platform-user-service-prod',
  'communications-notification-service-prod'
]

export const mockLokiLogs: Record<string, LokiLogEntry[]> = {
  'platform-api-gateway-prod': [
    {
      timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      line: 'INFO: Request processed successfully - GET /api/v1/users - 200 - 145ms',
      labels: { app: 'api-gateway', env: 'prod', level: 'info' }
    },
    {
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      line: 'ERROR: Upstream service unavailable: user-service - 503 - 5000ms',
      labels: { app: 'api-gateway', env: 'prod', level: 'error' }
    },
    {
      timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
      line: 'WARN: Rate limit approaching for IP 192.168.1.100',
      labels: { app: 'api-gateway', env: 'prod', level: 'warn' }
    }
  ],
  'security-auth-service-prod': [
    {
      timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
      line: 'INFO: User authenticated successfully - user@example.com',
      labels: { app: 'auth-service', env: 'prod', level: 'info' }
    },
    {
      timestamp: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
      line: 'WARN: Rate limit approaching for IP 192.168.1.100',
      labels: { app: 'auth-service', env: 'prod', level: 'warn' }
    },
    {
      timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      line: 'ERROR: Failed to validate token - Invalid signature',
      labels: { app: 'auth-service', env: 'prod', level: 'error' }
    }
  ],
  'payments-payment-service-prod': [
    {
      timestamp: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
      line: 'INFO: Payment processed successfully - Transaction ID: TXN-12345',
      labels: { app: 'payment-service', env: 'prod', level: 'info' }
    },
    {
      timestamp: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
      line: 'ERROR: Payment gateway timeout after 30s',
      labels: { app: 'payment-service', env: 'prod', level: 'error' }
    },
    {
      timestamp: new Date(Date.now() - 7 * 60 * 1000).toISOString(),
      line: 'WARN: High latency detected - 2.5s average response time',
      labels: { app: 'payment-service', env: 'prod', level: 'warn' }
    }
  ],
  'platform-user-service-prod': [
    {
      timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      line: 'INFO: User profile updated - user@example.com',
      labels: { app: 'user-service', env: 'prod', level: 'info' }
    },
    {
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      line: 'INFO: User created successfully - newuser@example.com',
      labels: { app: 'user-service', env: 'prod', level: 'info' }
    }
  ]
}

export const mockObservabilityMetrics = {
  uptime: 99.95,
  avgResponseTime: 245,
  requestsPerMinute: 1250,
  errorRate: 0.12,
  activeAlerts: 3
}

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

export const getMockPrometheusStats = async (): Promise<PrometheusStats> => {
  await new Promise(resolve => setTimeout(resolve, 300))
  return mockPrometheusStats
}

export const getMockPrometheusAlerts = async (): Promise<{ data: { alerts: PrometheusAlert[] } }> => {
  await new Promise(resolve => setTimeout(resolve, 250))
  return { data: { alerts: mockPrometheusAlerts } }
}

export const getMockGrafanaStats = async (): Promise<GrafanaStats> => {
  await new Promise(resolve => setTimeout(resolve, 300))
  return mockGrafanaStats
}

export const getMockGrafanaConfig = async () => {
  await new Promise(resolve => setTimeout(resolve, 200))
  return mockGrafanaConfig
}

export const getMockGrafanaDashboards = async (): Promise<{ dashboards: GrafanaDashboard[] }> => {
  await new Promise(resolve => setTimeout(resolve, 250))
  return { dashboards: mockGrafanaDashboards }
}

export const getMockLokiApps = async (): Promise<{ apps: string[] }> => {
  await new Promise(resolve => setTimeout(resolve, 300))
  return { apps: mockLokiApps }
}

export const getMockLokiLogs = async (appName: string): Promise<{ status: string; data: { resultType: string; result: LokiStream[] } }> => {
  await new Promise(resolve => setTimeout(resolve, 350))
  const logs = mockLokiLogs[appName] || []
  
  const streams: LokiStream[] = logs.map(log => {
    const timestampNs = (new Date(log.timestamp).getTime() * 1000000).toString()
    return {
      stream: log.labels,
      values: [[timestampNs, log.line]]
    }
  })
  
  return {
    status: 'success',
    data: {
      resultType: 'streams',
      result: streams
    }
  }
}

export const getMockObservabilityMetrics = async () => {
  await new Promise(resolve => setTimeout(resolve, 300))
  return mockObservabilityMetrics
}

export const getMockAlerts = async () => {
  await new Promise(resolve => setTimeout(resolve, 250))
  return []
}

export const getMockLogs = async () => {
  await new Promise(resolve => setTimeout(resolve, 350))
  return []
}

export const getMockMetricsTimeSeries = async () => {
  await new Promise(resolve => setTimeout(resolve, 400))
  return {}
}
