export const mockFinOpsStats = {
  totalCost: 45678.90,
  monthlyCost: 45678.90,
  dailyCost: 1522.63,
  costTrend: -8.5,
  totalResources: 287,
  activeResources: 245,
  inactiveResources: 42,
  costByProvider: {
    'AWS': 35678.90,
    'Azure': 7800.00,
    'GCP': 2200.00
  },
  costByService: {
    'EC2': 12500.50,
    'RDS': 8900.30,
    'S3': 6700.80,
    'Lambda': 4800.20,
    'CloudFront': 3200.60
  },
  currency: 'USD'
}

export const mockServiceCosts = [
  { service: 'EC2', cost: 12500.50 },
  { service: 'RDS', cost: 8900.30 },
  { service: 'S3', cost: 6700.80 },
  { service: 'Lambda', cost: 4800.20 },
  { service: 'CloudFront', cost: 3200.60 },
  { service: 'ECS', cost: 2800.40 },
  { service: 'EKS', cost: 2400.50 },
  { service: 'Route53', cost: 1200.30 },
  { service: 'VPC', cost: 890.50 },
  { service: 'CloudWatch', cost: 656.80 }
]

export const mockMonthlyCosts = [
  { month: 'Abr/23', cost: 42500 },
  { month: 'Mai/23', cost: 43800 },
  { month: 'Jun/23', cost: 44200 },
  { month: 'Jul/23', cost: 46100 },
  { month: 'Ago/23', cost: 47500 },
  { month: 'Set/23', cost: 48200 },
  { month: 'Out/23', cost: 49800 },
  { month: 'Nov/23', cost: 51200 },
  { month: 'Dez/23', cost: 50100 },
  { month: 'Jan/24', cost: 47800 },
  { month: 'Fev/24', cost: 46500 },
  { month: 'Mar/24', cost: 45678.90 }
]

export const mockForecast = [
  { month: 'Abr/24', cost: 44500, forecast: 44800 },
  { month: 'Mai/24', cost: null, forecast: 43900 },
  { month: 'Jun/24', cost: null, forecast: 43200 }
]

export const mockReservationUtilization = {
  utilization: 87.5,
  savings: 12450.30,
  recommendations: [
    'Adicionar 5 Reserved Instances m5.large para economia de $2,400/ano',
    'Converter 8 instâncias On-Demand para Savings Plans'
  ]
}

export const mockSavingsPlansUtilization = {
  utilization: 92.3,
  coverage: 78.5,
  commitment: 15000,
  actualUsage: 13845,
  savings: 8920.50
}

export const mockCostByEnvironment = [
  { environment: 'Production', cost: 28500.40, percentage: 62.4 },
  { environment: 'Staging', cost: 10200.30, percentage: 22.3 },
  { environment: 'Development', cost: 5800.15, percentage: 12.7 },
  { environment: 'Testing', cost: 1178.05, percentage: 2.6 }
]

export const mockCostByTeam = [
  { team: 'Platform', cost: 15600.50, percentage: 34.2 },
  { team: 'Product', cost: 12400.30, percentage: 27.1 },
  { team: 'Data', cost: 9800.70, percentage: 21.5 },
  { team: 'Security', cost: 5200.40, percentage: 11.4 },
  { team: 'DevOps', cost: 2677.00, percentage: 5.8 }
]

export const mockOptimizationRecommendations = [
  {
    id: '1',
    title: 'Redimensionar instâncias EC2 subutilizadas',
    description: '12 instâncias EC2 com utilização média abaixo de 20%',
    potentialSavings: 3200.50,
    priority: 'high',
    category: 'rightsizing'
  },
  {
    id: '2',
    title: 'Migrar para Reserved Instances',
    description: 'Economize até 40% com compromisso de 1 ano',
    potentialSavings: 5800.30,
    priority: 'high',
    category: 'pricing'
  },
  {
    id: '3',
    title: 'Remover snapshots não utilizados',
    description: '45 snapshots EBS não acessados há mais de 90 dias',
    potentialSavings: 890.20,
    priority: 'medium',
    category: 'cleanup'
  },
  {
    id: '4',
    title: 'Otimizar transferência de dados',
    description: 'Reduzir custos de transferência entre regiões',
    potentialSavings: 1200.80,
    priority: 'medium',
    category: 'network'
  },
  {
    id: '5',
    title: 'Desligar recursos em horários inativos',
    description: 'Ambientes de dev/staging podem ser desligados fora do horário comercial',
    potentialSavings: 2100.00,
    priority: 'medium',
    category: 'scheduling'
  }
]

// Funções para simular chamadas de API
export const getMockFinOpsStats = async () => {
  await new Promise(resolve => setTimeout(resolve, 400))
  return mockFinOpsStats
}

export const getMockServiceCosts = async () => {
  await new Promise(resolve => setTimeout(resolve, 350))
  return mockServiceCosts
}

export const getMockMonthlyCosts = async () => {
  await new Promise(resolve => setTimeout(resolve, 350))
  return mockMonthlyCosts
}

export const getMockForecast = async () => {
  await new Promise(resolve => setTimeout(resolve, 400))
  return mockForecast
}

export const getMockReservationUtilization = async () => {
  await new Promise(resolve => setTimeout(resolve, 300))
  return mockReservationUtilization
}

export const getMockSavingsPlansUtilization = async () => {
  await new Promise(resolve => setTimeout(resolve, 300))
  return mockSavingsPlansUtilization
}

export const getMockCostByEnvironment = async () => {
  await new Promise(resolve => setTimeout(resolve, 250))
  return mockCostByEnvironment
}

export const getMockCostByTeam = async () => {
  await new Promise(resolve => setTimeout(resolve, 250))
  return mockCostByTeam
}

export const getMockOptimizationRecommendations = async () => {
  await new Promise(resolve => setTimeout(resolve, 300))
  return mockOptimizationRecommendations
}
