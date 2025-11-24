export const mockFinOpsStats = {
  totalCost: 45678.90,
  monthlyChange: -8.5,
  budgetUsage: 72.3,
  topServices: [
    { name: 'EC2', cost: 12500.50, percentage: 27.4 },
    { name: 'RDS', cost: 8900.30, percentage: 19.5 },
    { name: 'S3', cost: 6700.80, percentage: 14.7 },
    { name: 'Lambda', cost: 4800.20, percentage: 10.5 },
    { name: 'CloudFront', cost: 3200.60, percentage: 7.0 }
  ],
  monthlyTrend: [
    { month: 'Set', cost: 48200 },
    { month: 'Out', cost: 49800 },
    { month: 'Nov', cost: 51200 },
    { month: 'Dez', cost: 50100 },
    { month: 'Jan', cost: 47800 },
    { month: 'Fev', cost: 46500 },
    { month: 'Mar', cost: 45678.90 }
  ]
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
  }
]

export const getMockFinOpsStats = async () => {
  await new Promise(resolve => setTimeout(resolve, 300))
  return mockFinOpsStats
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
