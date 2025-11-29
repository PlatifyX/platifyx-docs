export interface Pipeline {
  id: number
  name: string
  folder: string
  revision: number
  url: string
  project?: string
  lastBuildId?: number
  integration?: string
}

export interface Build {
  id: number
  buildNumber: string
  status: string
  result: string
  queueTime: string
  startTime: string
  finishTime: string
  sourceBranch: string
  sourceVersion: string
  requestedFor: string
  integration?: string
  definition: {
    id: number
    name: string
  }
}

export interface User {
  id: string
  displayName: string
  uniqueName: string
}

export interface ReleaseApproval {
  id: number
  approver: User
  approvedBy?: User
  status: string
  comments: string
  createdOn: string
  modifiedOn: string
  isAutomated: boolean
}

export interface ReleaseEnvironment {
  id: number
  name: string
  status: string
  deploymentStatus: string
  createdOn: string
  modifiedOn: string
  preDeployApprovals?: ReleaseApproval[]
  postDeployApprovals?: ReleaseApproval[]
}

export interface Release {
  id: number
  name: string
  status: string
  createdOn: string
  modifiedOn: string
  createdBy: User
  description: string
  integration?: string
  releaseDefinition: {
    id: number
    name: string
  }
  environments: ReleaseEnvironment[]
}

export interface CIStats {
  totalPipelines: number
  totalBuilds: number
  successCount: number
  failedCount: number
  runningCount: number
  successRate: number
  avgPipelineTime: number
  deployFrequency: number
  deployFailureRate: number
}

export const mockPipelines: Pipeline[] = [
  {
    id: 1,
    name: 'api-gateway-ci',
    folder: '/',
    revision: 1,
    url: 'https://dev.azure.com/org/project/_build?definitionId=1',
    project: 'PlatifyX',
    lastBuildId: 1234,
    integration: 'Azure DevOps'
  },
  {
    id: 2,
    name: 'auth-service-ci',
    folder: '/services',
    revision: 1,
    url: 'https://dev.azure.com/org/project/_build?definitionId=2',
    project: 'PlatifyX',
    lastBuildId: 856,
    integration: 'Azure DevOps'
  },
  {
    id: 3,
    name: 'payment-service-ci',
    folder: '/services',
    revision: 1,
    url: 'https://dev.azure.com/org/project/_build?definitionId=3',
    project: 'PlatifyX',
    lastBuildId: 2341,
    integration: 'Azure DevOps'
  },
  {
    id: 4,
    name: 'user-service-ci',
    folder: '/services',
    revision: 1,
    url: 'https://dev.azure.com/org/project/_build?definitionId=4',
    project: 'PlatifyX',
    lastBuildId: 1890,
    integration: 'Azure DevOps'
  }
]

export const mockBuilds: Build[] = [
  {
    id: 1234,
    buildNumber: '1234',
    status: 'completed',
    result: 'succeeded',
    queueTime: '2024-03-16T10:00:00Z',
    startTime: '2024-03-16T10:01:00Z',
    finishTime: '2024-03-16T10:15:30Z',
    sourceBranch: 'refs/heads/main',
    sourceVersion: 'abc123def456',
    requestedFor: 'Maria Santos',
    integration: 'Azure DevOps',
    definition: {
      id: 1,
      name: 'api-gateway-ci'
    }
  },
  {
    id: 1233,
    buildNumber: '1233',
    status: 'completed',
    result: 'succeeded',
    queueTime: '2024-03-15T14:00:00Z',
    startTime: '2024-03-15T14:01:00Z',
    finishTime: '2024-03-15T14:12:45Z',
    sourceBranch: 'refs/heads/develop',
    sourceVersion: 'def456ghi789',
    requestedFor: 'Pedro Costa',
    integration: 'Azure DevOps',
    definition: {
      id: 1,
      name: 'api-gateway-ci'
    }
  },
  {
    id: 856,
    buildNumber: '856',
    status: 'completed',
    result: 'succeeded',
    queueTime: '2024-03-15T09:00:00Z',
    startTime: '2024-03-15T09:01:00Z',
    finishTime: '2024-03-15T09:08:20Z',
    sourceBranch: 'refs/heads/main',
    sourceVersion: 'ghi789jkl012',
    requestedFor: 'Ana Oliveira',
    integration: 'Azure DevOps',
    definition: {
      id: 2,
      name: 'auth-service-ci'
    }
  },
  {
    id: 2341,
    buildNumber: '2341',
    status: 'completed',
    result: 'failed',
    queueTime: '2024-03-16T08:00:00Z',
    startTime: '2024-03-16T08:01:00Z',
    finishTime: '2024-03-16T08:18:15Z',
    sourceBranch: 'refs/heads/main',
    sourceVersion: 'jkl012mno345',
    requestedFor: 'Carlos Ferreira',
    integration: 'Azure DevOps',
    definition: {
      id: 3,
      name: 'payment-service-ci'
    }
  },
  {
    id: 2340,
    buildNumber: '2340',
    status: 'inProgress',
    result: '',
    queueTime: '2024-03-16T11:00:00Z',
    startTime: '2024-03-16T11:01:00Z',
    finishTime: '',
    sourceBranch: 'refs/heads/develop',
    sourceVersion: 'mno345pqr678',
    requestedFor: 'Juliana Alves',
    integration: 'Azure DevOps',
    definition: {
      id: 3,
      name: 'payment-service-ci'
    }
  },
  {
    id: 1890,
    buildNumber: '1890',
    status: 'completed',
    result: 'succeeded',
    queueTime: '2024-03-15T16:00:00Z',
    startTime: '2024-03-15T16:01:00Z',
    finishTime: '2024-03-15T16:10:30Z',
    sourceBranch: 'refs/heads/main',
    sourceVersion: 'pqr678stu901',
    requestedFor: 'Maria Santos',
    integration: 'Azure DevOps',
    definition: {
      id: 4,
      name: 'user-service-ci'
    }
  }
]

export const mockReleases: Release[] = [
  {
    id: 1,
    name: 'Release-2024.03.16',
    status: 'active',
    createdOn: '2024-03-16T10:00:00Z',
    modifiedOn: '2024-03-16T10:30:00Z',
    createdBy: {
      id: 'user-1',
      displayName: 'Maria Santos',
      uniqueName: 'maria.santos@example.com'
    },
    description: 'Release para produção com novas features',
    integration: 'Azure DevOps',
    releaseDefinition: {
      id: 1,
      name: 'Production Release'
    },
    environments: [
      {
        id: 1,
        name: 'Staging',
        status: 'succeeded',
        deploymentStatus: 'succeeded',
        createdOn: '2024-03-16T10:05:00Z',
        modifiedOn: '2024-03-16T10:20:00Z',
        preDeployApprovals: [
          {
            id: 1,
            approver: {
              id: 'user-2',
              displayName: 'Pedro Costa',
              uniqueName: 'pedro.costa@example.com'
            },
            approvedBy: {
              id: 'user-2',
              displayName: 'Pedro Costa',
              uniqueName: 'pedro.costa@example.com'
            },
            status: 'approved',
            comments: 'Aprovado para staging',
            createdOn: '2024-03-16T10:05:00Z',
            modifiedOn: '2024-03-16T10:10:00Z',
            isAutomated: false
          }
        ],
        postDeployApprovals: []
      },
      {
        id: 2,
        name: 'Production',
        status: 'pending',
        deploymentStatus: 'pending',
        createdOn: '2024-03-16T10:25:00Z',
        modifiedOn: '2024-03-16T10:25:00Z',
        preDeployApprovals: [
          {
            id: 2,
            approver: {
              id: 'user-3',
              displayName: 'Ana Oliveira',
              uniqueName: 'ana.oliveira@example.com'
            },
            status: 'pending',
            comments: 'Aguardando aprovação',
            createdOn: '2024-03-16T10:25:00Z',
            modifiedOn: '2024-03-16T10:25:00Z',
            isAutomated: false
          }
        ],
        postDeployApprovals: []
      }
    ]
  },
  {
    id: 2,
    name: 'Release-2024.03.15',
    status: 'active',
    createdOn: '2024-03-15T14:00:00Z',
    modifiedOn: '2024-03-15T15:00:00Z',
    createdBy: {
      id: 'user-4',
      displayName: 'Carlos Ferreira',
      uniqueName: 'carlos.ferreira@example.com'
    },
    description: 'Hotfix para correção de bugs',
    integration: 'Azure DevOps',
    releaseDefinition: {
      id: 2,
      name: 'Hotfix Release'
    },
    environments: [
      {
        id: 3,
        name: 'Staging',
        status: 'succeeded',
        deploymentStatus: 'succeeded',
        createdOn: '2024-03-15T14:05:00Z',
        modifiedOn: '2024-03-15T14:30:00Z',
        preDeployApprovals: [
          {
            id: 3,
            approver: {
              id: 'user-2',
              displayName: 'Pedro Costa',
              uniqueName: 'pedro.costa@example.com'
            },
            approvedBy: {
              id: 'user-2',
              displayName: 'Pedro Costa',
              uniqueName: 'pedro.costa@example.com'
            },
            status: 'approved',
            comments: 'Aprovado',
            createdOn: '2024-03-15T14:05:00Z',
            modifiedOn: '2024-03-15T14:10:00Z',
            isAutomated: false
          }
        ],
        postDeployApprovals: []
      },
      {
        id: 4,
        name: 'Production',
        status: 'succeeded',
        deploymentStatus: 'succeeded',
        createdOn: '2024-03-15T14:35:00Z',
        modifiedOn: '2024-03-15T14:50:00Z',
        preDeployApprovals: [
          {
            id: 4,
            approver: {
              id: 'user-3',
              displayName: 'Ana Oliveira',
              uniqueName: 'ana.oliveira@example.com'
            },
            approvedBy: {
              id: 'user-3',
              displayName: 'Ana Oliveira',
              uniqueName: 'ana.oliveira@example.com'
            },
            status: 'approved',
            comments: 'Aprovado para produção',
            createdOn: '2024-03-15T14:35:00Z',
            modifiedOn: '2024-03-15T14:40:00Z',
            isAutomated: false
          }
        ],
        postDeployApprovals: []
      }
    ]
  },
  {
    id: 3,
    name: 'Release-2024.03.14',
    status: 'active',
    createdOn: '2024-03-14T09:00:00Z',
    modifiedOn: '2024-03-14T10:00:00Z',
    createdBy: {
      id: 'user-1',
      displayName: 'Maria Santos',
      uniqueName: 'maria.santos@example.com'
    },
    description: 'Release semanal com melhorias',
    integration: 'Azure DevOps',
    releaseDefinition: {
      id: 1,
      name: 'Production Release'
    },
    environments: [
      {
        id: 5,
        name: 'Staging',
        status: 'failed',
        deploymentStatus: 'failed',
        createdOn: '2024-03-14T09:05:00Z',
        modifiedOn: '2024-03-14T09:30:00Z',
        preDeployApprovals: [
          {
            id: 5,
            approver: {
              id: 'user-2',
              displayName: 'Pedro Costa',
              uniqueName: 'pedro.costa@example.com'
            },
            approvedBy: {
              id: 'user-2',
              displayName: 'Pedro Costa',
              uniqueName: 'pedro.costa@example.com'
            },
            status: 'approved',
            comments: 'Aprovado',
            createdOn: '2024-03-14T09:05:00Z',
            modifiedOn: '2024-03-14T09:10:00Z',
            isAutomated: false
          }
        ],
        postDeployApprovals: []
      }
    ]
  }
]

export const mockCIStats: CIStats = {
  totalPipelines: 4,
  totalBuilds: 6,
  successCount: 4,
  failedCount: 1,
  runningCount: 1,
  successRate: 80.0,
  avgPipelineTime: 720,
  deployFrequency: 12.5,
  deployFailureRate: 8.3
}

export const getMockCIStats = async (): Promise<CIStats> => {
  await new Promise(resolve => setTimeout(resolve, 300))
  return mockCIStats
}

export const getMockCIPipelines = async (): Promise<{ pipelines: Pipeline[] }> => {
  await new Promise(resolve => setTimeout(resolve, 250))
  return { pipelines: mockPipelines }
}

export const getMockCIBuilds = async (): Promise<{ builds: Build[] }> => {
  await new Promise(resolve => setTimeout(resolve, 250))
  return { builds: mockBuilds }
}

export const getMockCIReleases = async (): Promise<{ releases: Release[] }> => {
  await new Promise(resolve => setTimeout(resolve, 250))
  return { releases: mockReleases }
}

