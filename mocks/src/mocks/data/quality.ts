export interface QualityStats {
  totalProjects: number
  totalBugs: number
  totalVulnerabilities: number
  totalCodeSmells: number
  averageCoverage: number
  qualityGatePassed: number
  qualityGateFailed: number
}

export interface Project {
  key: string
  name: string
  qualifier: string
  visibility: string
  integration?: string
}

export interface ProjectDetails {
  key: string
  name: string
  integration?: string
  bugs: number
  vulnerabilities: number
  code_smells: number
  coverage: number
  duplications: number
  security_hotspots: number
  lines: number
  qualityGateStatus: string
}

export interface Issue {
  key: string
  rule: string
  severity: string
  component: string
  project: string
  line?: number
  message: string
  type: string
  status: string
  integration?: string
  creationDate: string
  updateDate: string
}

export const mockQualityStats: QualityStats = {
  totalProjects: 3,
  totalBugs: 29,
  totalVulnerabilities: 7,
  totalCodeSmells: 155,
  averageCoverage: 81.4,
  qualityGatePassed: 2,
  qualityGateFailed: 1
}

export const mockProjects: Project[] = [
  {
    key: 'api-gateway',
    name: 'api-gateway',
    qualifier: 'TRK',
    visibility: 'private',
    integration: 'SonarQube'
  },
  {
    key: 'auth-service',
    name: 'auth-service',
    qualifier: 'TRK',
    visibility: 'private',
    integration: 'SonarQube'
  },
  {
    key: 'payment-service',
    name: 'payment-service',
    qualifier: 'TRK',
    visibility: 'private',
    integration: 'SonarQube'
  }
]

export const mockProjectDetails: Record<string, ProjectDetails> = {
  'api-gateway': {
    key: 'api-gateway',
    name: 'api-gateway',
    integration: 'SonarQube',
    bugs: 2,
    vulnerabilities: 1,
    code_smells: 45,
    coverage: 87.5,
    duplications: 3.2,
    security_hotspots: 3,
    lines: 12500,
    qualityGateStatus: 'OK'
  },
  'auth-service': {
    key: 'auth-service',
    name: 'auth-service',
    integration: 'SonarQube',
    bugs: 0,
    vulnerabilities: 0,
    code_smells: 12,
    coverage: 92.3,
    duplications: 1.8,
    security_hotspots: 1,
    lines: 8500,
    qualityGateStatus: 'OK'
  },
  'payment-service': {
    key: 'payment-service',
    name: 'payment-service',
    integration: 'SonarQube',
    bugs: 5,
    vulnerabilities: 2,
    code_smells: 78,
    coverage: 65.2,
    duplications: 8.7,
    security_hotspots: 8,
    lines: 15200,
    qualityGateStatus: 'ERROR'
  }
}

export const mockIssues: Issue[] = [
  {
    key: 'AX123',
    rule: 'S1481',
    severity: 'MAJOR',
    component: 'api-gateway:src/routes/auth.ts',
    project: 'api-gateway',
    line: 45,
    message: 'Remove this unused "token" variable',
    type: 'CODE_SMELL',
    status: 'OPEN',
    integration: 'SonarQube',
    creationDate: '2024-03-10T10:00:00Z',
    updateDate: '2024-03-10T10:00:00Z'
  },
  {
    key: 'AX124',
    rule: 'S2068',
    severity: 'CRITICAL',
    component: 'payment-service:src/controllers/payment.controller.ts',
    project: 'payment-service',
    line: 145,
    message: 'Credentials should not be hard-coded',
    type: 'VULNERABILITY',
    status: 'OPEN',
    integration: 'SonarQube',
    creationDate: '2024-03-12T14:00:00Z',
    updateDate: '2024-03-12T14:00:00Z'
  },
  {
    key: 'AX125',
    rule: 'S2259',
    severity: 'BLOCKER',
    component: 'payment-service:src/utils/validator.ts',
    project: 'payment-service',
    line: 67,
    message: 'Null pointers should not be dereferenced',
    type: 'BUG',
    status: 'OPEN',
    integration: 'SonarQube',
    creationDate: '2024-03-11T09:00:00Z',
    updateDate: '2024-03-11T09:00:00Z'
  },
  {
    key: 'AX126',
    rule: 'S138',
    severity: 'MINOR',
    component: 'auth-service:src/middleware/auth.ts',
    project: 'auth-service',
    line: 23,
    message: 'Functions should not have too many lines of code',
    type: 'CODE_SMELL',
    status: 'RESOLVED',
    integration: 'SonarQube',
    creationDate: '2024-03-08T11:00:00Z',
    updateDate: '2024-03-14T16:00:00Z'
  },
  {
    key: 'AX127',
    rule: 'S3776',
    severity: 'MAJOR',
    component: 'api-gateway:src/utils/logger.ts',
    project: 'api-gateway',
    line: 89,
    message: 'Cognitive Complexity of functions should not be too high',
    type: 'CODE_SMELL',
    status: 'OPEN',
    integration: 'SonarQube',
    creationDate: '2024-03-09T15:00:00Z',
    updateDate: '2024-03-09T15:00:00Z'
  },
  {
    key: 'AX128',
    rule: 'S5131',
    severity: 'CRITICAL',
    component: 'payment-service:src/api/stripe.ts',
    project: 'payment-service',
    line: 34,
    message: 'Endpoints should not be vulnerable to reflected XSS attacks',
    type: 'VULNERABILITY',
    status: 'OPEN',
    integration: 'SonarQube',
    creationDate: '2024-03-13T10:00:00Z',
    updateDate: '2024-03-13T10:00:00Z'
  }
]

export const getMockQualityStats = async (): Promise<QualityStats> => {
  await new Promise(resolve => setTimeout(resolve, 300))
  return mockQualityStats
}

export const getMockQualityProjects = async (): Promise<{ projects: Project[] }> => {
  await new Promise(resolve => setTimeout(resolve, 250))
  return { projects: mockProjects }
}

export const getMockQualityProjectDetails = async (projectKey: string): Promise<ProjectDetails> => {
  await new Promise(resolve => setTimeout(resolve, 200))
  return mockProjectDetails[projectKey] || mockProjectDetails['api-gateway']
}

export const getMockQualityIssues = async (): Promise<{ issues: Issue[] }> => {
  await new Promise(resolve => setTimeout(resolve, 250))
  return { issues: mockIssues }
}
