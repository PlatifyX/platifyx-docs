export interface Recommendation {
  id: string
  type: string
  severity: string
  title: string
  description: string
  reason: string
  action: string
  impact: string
  confidence: number
}

export interface MaturityScore {
  category: string
  score: number
  maxScore: number
  level: string
  metrics: any[]
  recommendations: Recommendation[]
  lastUpdated: string
}

export interface TeamScorecard {
  teamId: string
  teamName: string
  scores: MaturityScore[]
  overallScore: number
  rank?: number
  lastUpdated: string
  trend: string
}

const mockScorecards: Record<string, TeamScorecard> = {
  'Platform': {
    teamId: 'platform',
    teamName: 'Platform Team',
    overallScore: 7.8,
    rank: 1,
    lastUpdated: new Date().toISOString(),
    trend: 'improving',
    scores: [
      {
        category: 'observability',
        score: 8.5,
        maxScore: 10,
        level: 'advanced',
        metrics: [],
        recommendations: [
          {
            id: 'rec-1',
            type: 'observability',
            severity: 'medium',
            title: 'Implementar distributed tracing',
            description: 'Adicionar tracing distribuído para melhor visibilidade de requisições entre serviços',
            reason: 'Falta de visibilidade em requisições cross-service',
            action: 'Integrar OpenTelemetry ou Jaeger',
            impact: 'Melhor debugging e performance analysis',
            confidence: 85
          }
        ],
        lastUpdated: new Date().toISOString()
      },
      {
        category: 'automated_tests',
        score: 8.0,
        maxScore: 10,
        level: 'advanced',
        metrics: [],
        recommendations: [],
        lastUpdated: new Date().toISOString()
      },
      {
        category: 'incident_response',
        score: 7.5,
        maxScore: 10,
        level: 'intermediate',
        metrics: [],
        recommendations: [
          {
            id: 'rec-2',
            type: 'incident_response',
            severity: 'high',
            title: 'Criar runbooks automatizados',
            description: 'Documentar e automatizar procedimentos de resposta a incidentes comuns',
            reason: 'Tempo de resposta a incidentes pode ser reduzido',
            action: 'Criar runbooks e integrar com sistema de alertas',
            impact: 'Redução de 40% no MTTR',
            confidence: 90
          }
        ],
        lastUpdated: new Date().toISOString()
      },
      {
        category: 'finops',
        score: 7.0,
        maxScore: 10,
        level: 'intermediate',
        metrics: [],
        recommendations: [],
        lastUpdated: new Date().toISOString()
      },
      {
        category: 'security',
        score: 8.2,
        maxScore: 10,
        level: 'advanced',
        metrics: [],
        recommendations: [],
        lastUpdated: new Date().toISOString()
      },
      {
        category: 'documentation',
        score: 6.5,
        maxScore: 10,
        level: 'intermediate',
        metrics: [],
        recommendations: [
          {
            id: 'rec-3',
            type: 'documentation',
            severity: 'low',
            title: 'Melhorar documentação de APIs',
            description: 'Adicionar exemplos e casos de uso na documentação das APIs',
            reason: 'Documentação atual é básica',
            action: 'Expandir documentação OpenAPI com exemplos',
            impact: 'Melhor onboarding e uso das APIs',
            confidence: 75
          }
        ],
        lastUpdated: new Date().toISOString()
      }
    ]
  },
  'Security': {
    teamId: 'security',
    teamName: 'Security Team',
    overallScore: 8.5,
    rank: 1,
    lastUpdated: new Date().toISOString(),
    trend: 'improving',
    scores: [
      {
        category: 'security',
        score: 9.5,
        maxScore: 10,
        level: 'expert',
        metrics: [],
        recommendations: [],
        lastUpdated: new Date().toISOString()
      },
      {
        category: 'observability',
        score: 8.0,
        maxScore: 10,
        level: 'advanced',
        metrics: [],
        recommendations: [],
        lastUpdated: new Date().toISOString()
      },
      {
        category: 'automated_tests',
        score: 8.8,
        maxScore: 10,
        level: 'advanced',
        metrics: [],
        recommendations: [],
        lastUpdated: new Date().toISOString()
      },
      {
        category: 'incident_response',
        score: 8.2,
        maxScore: 10,
        level: 'advanced',
        metrics: [],
        recommendations: [],
        lastUpdated: new Date().toISOString()
      },
      {
        category: 'finops',
        score: 7.5,
        maxScore: 10,
        level: 'intermediate',
        metrics: [],
        recommendations: [],
        lastUpdated: new Date().toISOString()
      },
      {
        category: 'documentation',
        score: 8.0,
        maxScore: 10,
        level: 'advanced',
        metrics: [],
        recommendations: [],
        lastUpdated: new Date().toISOString()
      }
    ]
  },
  'Payments': {
    teamId: 'payments',
    teamName: 'Payments Team',
    overallScore: 6.8,
    rank: 3,
    lastUpdated: new Date().toISOString(),
    trend: 'declining',
    scores: [
      {
        category: 'security',
        score: 7.0,
        maxScore: 10,
        level: 'intermediate',
        metrics: [],
        recommendations: [
          {
            id: 'rec-4',
            type: 'security',
            severity: 'critical',
            title: 'Corrigir vulnerabilidades críticas',
            description: 'Existem vulnerabilidades críticas que precisam ser corrigidas urgentemente',
            reason: 'Vulnerabilidades detectadas no código',
            action: 'Revisar e corrigir vulnerabilidades identificadas',
            impact: 'Redução de risco de segurança',
            confidence: 95
          }
        ],
        lastUpdated: new Date().toISOString()
      },
      {
        category: 'automated_tests',
        score: 6.5,
        maxScore: 10,
        level: 'intermediate',
        metrics: [],
        recommendations: [
          {
            id: 'rec-5',
            type: 'automated_tests',
            severity: 'high',
            title: 'Aumentar cobertura de testes',
            description: 'Cobertura atual está abaixo do ideal para um serviço crítico',
            reason: 'Cobertura de testes em 65%',
            action: 'Adicionar testes unitários e de integração',
            impact: 'Maior confiabilidade do serviço',
            confidence: 88
          }
        ],
        lastUpdated: new Date().toISOString()
      },
      {
        category: 'observability',
        score: 7.2,
        maxScore: 10,
        level: 'intermediate',
        metrics: [],
        recommendations: [],
        lastUpdated: new Date().toISOString()
      },
      {
        category: 'incident_response',
        score: 6.0,
        maxScore: 10,
        level: 'intermediate',
        metrics: [],
        recommendations: [],
        lastUpdated: new Date().toISOString()
      },
      {
        category: 'finops',
        score: 6.8,
        maxScore: 10,
        level: 'intermediate',
        metrics: [],
        recommendations: [],
        lastUpdated: new Date().toISOString()
      },
      {
        category: 'documentation',
        score: 6.5,
        maxScore: 10,
        level: 'intermediate',
        metrics: [],
        recommendations: [],
        lastUpdated: new Date().toISOString()
      }
    ]
  }
}

export const getMockMaturityScorecard = async (teamName: string): Promise<TeamScorecard> => {
  await new Promise(resolve => setTimeout(resolve, 300))
  const normalizedName = teamName.trim()
  
  if (mockScorecards[normalizedName]) {
    return mockScorecards[normalizedName]
  }
  
  if (normalizedName.toLowerCase().includes('platform')) {
    return mockScorecards['Platform']
  }
  
  if (normalizedName.toLowerCase().includes('security') || normalizedName.toLowerCase().includes('auth')) {
    return mockScorecards['Security']
  }
  
  if (normalizedName.toLowerCase().includes('payment')) {
    return mockScorecards['Payments']
  }
  
  return mockScorecards['Platform']
}


