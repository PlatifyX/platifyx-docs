export const mockRecommendations = [
  {
    id: 'rec-1',
    type: 'performance',
    severity: 'high' as const,
    title: 'Alto uso de CPU no payment-service',
    description: 'O serviço payment-service está com uso de CPU acima de 85% nas últimas 2 horas',
    reason: 'Análise de métricas detectou uso sustentado acima do limite',
    action: 'Aumentar replicas de 3 para 5 ou otimizar consultas ao banco',
    impact: 'Redução de latência em ~40% e melhor estabilidade',
    confidence: 92,
    metadata: {
      currentCpu: 87.5,
      threshold: 80,
      currentReplicas: 3,
      suggestedReplicas: 5,
      service: 'payment-service',
      namespace: 'production'
    },
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 22 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'rec-2',
    type: 'cost',
    severity: 'medium' as const,
    title: 'Recursos ociosos detectados',
    description: '3 pods em staging com uso inferior a 10% nas últimas 24h',
    reason: 'Pods com baixa utilização representam custo desnecessário',
    action: 'Reduzir replicas ou desligar recursos não utilizados',
    impact: 'Economia estimada de $450/mês',
    confidence: 88,
    metadata: {
      idlePods: ['staging-api-1', 'staging-worker-2', 'staging-cache-1'],
      avgUtilization: 8.5,
      monthlyCost: 450,
      namespace: 'staging'
    },
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'rec-3',
    type: 'security',
    severity: 'critical' as const,
    title: 'Vulnerabilidade crítica detectada',
    description: 'CVE-2024-1234 encontrada na imagem do auth-service',
    reason: 'Scanner de segurança identificou vulnerabilidade com score 9.8',
    action: 'Atualizar imagem para versão v2.8.4 ou superior',
    impact: 'Eliminação de risco de segurança crítico',
    confidence: 98,
    metadata: {
      cve: 'CVE-2024-1234',
      cvssScore: 9.8,
      currentVersion: 'v2.7.1',
      fixedVersion: 'v2.8.4',
      service: 'auth-service'
    },
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 23.5 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'rec-4',
    type: 'reliability',
    severity: 'high' as const,
    title: 'Taxa de erro elevada no user-service',
    description: 'Taxa de erro 5xx em 3.2% nas últimas 30 minutos',
    reason: 'Threshold de 1% ultrapassado significativamente',
    action: 'Investigar logs e reiniciar pods com problemas',
    impact: 'Melhoria na confiabilidade e experiência do usuário',
    confidence: 85,
    metadata: {
      errorRate: 3.2,
      threshold: 1.0,
      affectedPods: 2,
      totalRequests: 15680,
      failedRequests: 502,
      service: 'user-service'
    },
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString()
  },
  {
    id: 'rec-5',
    type: 'optimization',
    severity: 'low' as const,
    title: 'Cache hit rate abaixo do ideal',
    description: 'Redis cache com hit rate de 65% (ideal: 85%+)',
    reason: 'Baixo hit rate indica oportunidade de otimização',
    action: 'Revisar estratégia de cache e TTLs',
    impact: 'Redução de carga no banco e melhoria de performance',
    confidence: 75,
    metadata: {
      hitRate: 65,
      targetHitRate: 85,
      cacheService: 'redis-master',
      namespace: 'production'
    },
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
  }
]

export const mockAutonomousActions = [
  {
    id: 'action-1',
    type: 'auto-scale',
    status: 'completed',
    description: 'Auto-scaling aplicado ao payment-service',
    trigger: 'CPU usage > 85% for 5 minutes',
    action: {
      type: 'scale',
      description: 'Aumentar réplicas de 3 para 5',
      command: 'kubectl scale deployment payment-service --replicas=5 -n production',
      autoExecute: true
    },
    result: {
      previousReplicas: 3,
      newReplicas: 5,
      cpuAfter: 52.3,
      executionTime: '2.3s'
    },
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    executedAt: new Date(Date.now() - 3 * 60 * 60 * 1000 + 5000).toISOString(),
    executedBy: 'autonomous-agent'
  },
  {
    id: 'action-2',
    type: 'restart',
    status: 'completed',
    description: 'Restart automático de pod com memory leak',
    trigger: 'Memory usage > 95% for 10 minutes',
    action: {
      type: 'restart',
      description: 'Reiniciar pod user-service-7d8f9b4c5-x8k2m',
      command: 'kubectl delete pod user-service-7d8f9b4c5-x8k2m -n production',
      autoExecute: true
    },
    result: {
      podName: 'user-service-7d8f9b4c5-x8k2m',
      newPodName: 'user-service-7d8f9b4c5-p9m3n',
      memoryBefore: 96.8,
      memoryAfter: 24.5,
      restartTime: '8.7s'
    },
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    executedAt: new Date(Date.now() - 8 * 60 * 60 * 1000 + 15000).toISOString(),
    executedBy: 'autonomous-agent'
  },
  {
    id: 'action-3',
    type: 'optimization',
    status: 'pending',
    description: 'Otimização de recursos em staging',
    trigger: 'Low resource utilization detected',
    action: {
      type: 'scale-down',
      description: 'Reduzir réplicas em staging de 5 para 2',
      command: 'kubectl scale deployment staging-api --replicas=2 -n staging',
      autoExecute: false
    },
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    executedBy: 'pending-approval'
  },
  {
    id: 'action-4',
    type: 'alert-mitigation',
    status: 'failed',
    description: 'Tentativa de mitigação de erro 5xx',
    trigger: 'Error rate > 5% for 5 minutes',
    action: {
      type: 'rollback',
      description: 'Rollback para versão anterior',
      command: 'kubectl rollout undo deployment/payment-service -n production',
      autoExecute: true
    },
    error: 'Rollback failed: no previous revision available',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    executedAt: new Date(Date.now() - 24 * 60 * 60 * 1000 + 3000).toISOString(),
    executedBy: 'autonomous-agent'
  }
]

export const mockAutonomousConfig = {
  enabled: true,
  autoExecute: true,
  requireApproval: false,
  allowedActions: [
    'auto-scale',
    'restart',
    'rollback',
    'alert-mitigation',
    'resource-optimization'
  ],
  notificationChannels: ['slack', 'email']
}

export const mockTroubleshootingResponse = {
  answer: 'O problema está relacionado a um memory leak no serviço user-service. Detectamos aumento progressivo de uso de memória nas últimas 6 horas.',
  confidence: 89,
  rootCause: 'Memory leak causado por conexões de banco não fechadas adequadamente na função getUserProfile()',
  solution: 'Recomendamos: 1) Restart imediato do pod afetado, 2) Deploy da versão v2.1.5 que corrige o leak, 3) Monitorar uso de memória nas próximas 24h',
  evidence: [
    'Uso de memória crescendo 2.3% por hora',
    'Logs mostram "connection pool exhausted" em 45 ocorrências',
    'Heap dump indica 3200+ objetos Connection não coletados',
    'Última versão (v2.1.4) introduziu mudança na connection pool'
  ],
  relatedLogs: [
    '[ERROR] Connection pool exhausted after 30s timeout',
    '[WARN] Memory usage at 94.8%, triggering GC',
    '[ERROR] Failed to acquire connection from pool'
  ],
  relatedMetrics: {
    memoryUsage: 94.8,
    connectionPoolSize: 100,
    activeConnections: 100,
    queuedRequests: 234,
    errorRate: 2.8
  },
  actions: [
    {
      type: 'restart',
      description: 'Restart imediato do pod afetado',
      command: 'kubectl delete pod user-service-7d8f9b4c5-x8k2m -n production',
      autoExecute: false
    },
    {
      type: 'deploy',
      description: 'Deploy da versão v2.1.5 (fix)',
      command: 'kubectl set image deployment/user-service user-service=user-service:v2.1.5 -n production',
      autoExecute: false
    }
  ]
}

// Funções para simular chamadas de API
export const getMockRecommendations = async () => {
  await new Promise(resolve => setTimeout(resolve, 800))
  return mockRecommendations
}

export const getMockAutonomousActions = async () => {
  await new Promise(resolve => setTimeout(resolve, 600))
  return mockAutonomousActions
}

export const getMockAutonomousConfig = async () => {
  await new Promise(resolve => setTimeout(resolve, 300))
  return mockAutonomousConfig
}

export const mockTroubleshoot = async (question: string, serviceName?: string, namespace?: string) => {
  await new Promise(resolve => setTimeout(resolve, 2000))

  // Retorna resposta baseada na pergunta
  return mockTroubleshootingResponse
}

export const mockExecuteAction = async (actionId: string) => {
  await new Promise(resolve => setTimeout(resolve, 1500))

  return {
    success: true,
    actionId,
    result: {
      status: 'completed',
      message: 'Ação executada com sucesso',
      executedAt: new Date().toISOString()
    }
  }
}

export const mockUpdateConfig = async (config: any) => {
  await new Promise(resolve => setTimeout(resolve, 500))

  return {
    success: true,
    config: { ...mockAutonomousConfig, ...config }
  }
}
