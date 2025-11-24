export const mockQualityMetrics = {
  overallScore: 82.5,
  trend: 2.3,
  coverage: 78.5,
  bugs: 45,
  vulnerabilities: 12,
  codeSmells: 234,
  technicalDebt: '15d 6h'
}

export const mockProjects = [
  {
    id: '1',
    name: 'api-gateway',
    qualityGate: 'passed',
    coverage: 85.2,
    bugs: 8,
    vulnerabilities: 2,
    codeSmells: 45,
    duplications: 3.2,
    lastAnalysis: '2024-03-16T10:30:00Z',
    rating: 'A'
  },
  {
    id: '2',
    name: 'auth-service',
    qualityGate: 'passed',
    coverage: 92.1,
    bugs: 3,
    vulnerabilities: 0,
    codeSmells: 18,
    duplications: 1.8,
    lastAnalysis: '2024-03-15T14:20:00Z',
    rating: 'A'
  },
  {
    id: '3',
    name: 'payment-service',
    qualityGate: 'failed',
    coverage: 65.4,
    bugs: 18,
    vulnerabilities: 5,
    codeSmells: 92,
    duplications: 8.7,
    lastAnalysis: '2024-03-16T09:15:00Z',
    rating: 'C'
  },
  {
    id: '4',
    name: 'notification-service',
    qualityGate: 'passed',
    coverage: 88.7,
    bugs: 5,
    vulnerabilities: 1,
    codeSmells: 28,
    duplications: 2.1,
    lastAnalysis: '2024-03-14T16:45:00Z',
    rating: 'A'
  },
  {
    id: '5',
    name: 'user-service',
    qualityGate: 'warning',
    coverage: 72.3,
    bugs: 11,
    vulnerabilities: 4,
    codeSmells: 51,
    duplications: 5.6,
    lastAnalysis: '2024-03-15T11:30:00Z',
    rating: 'B'
  }
]

export const mockVulnerabilities = [
  {
    id: 'vuln-1',
    severity: 'high',
    type: 'SQL Injection',
    project: 'payment-service',
    file: 'src/controllers/payment.controller.ts',
    line: 145,
    message: 'Possível SQL Injection detectado',
    status: 'open',
    assignee: 'Ana Oliveira'
  },
  {
    id: 'vuln-2',
    severity: 'critical',
    type: 'XSS',
    project: 'user-service',
    file: 'src/views/profile.tsx',
    line: 67,
    message: 'Cross-Site Scripting (XSS) vulnerável',
    status: 'open',
    assignee: 'Juliana Alves'
  },
  {
    id: 'vuln-3',
    severity: 'medium',
    type: 'Sensitive Data Exposure',
    project: 'payment-service',
    file: 'src/utils/logger.ts',
    line: 23,
    message: 'Dados sensíveis expostos em logs',
    status: 'resolved',
    assignee: 'Ana Oliveira'
  }
]

export const getMockQualityMetrics = async () => {
  await new Promise(resolve => setTimeout(resolve, 300))
  return mockQualityMetrics
}

export const getMockProjects = async () => {
  await new Promise(resolve => setTimeout(resolve, 350))
  return mockProjects
}

export const getMockVulnerabilities = async () => {
  await new Promise(resolve => setTimeout(resolve, 300))
  return mockVulnerabilities
}
