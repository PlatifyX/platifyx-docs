import {
  getMockAIProviders,
  mockGenerateDocumentation,
  mockImproveDocumentation,
  mockChat
} from '../mocks/data/aiProviders'
import { getMockRepositories, getMockRepoContent } from '../mocks/data/repositories'
import { getMockAzureDevOpsProjects } from '../mocks/data/integrations'

export interface AIProvider {
  provider: string
  name: string
  available: boolean
  models: string[]
}

export interface Repository {
  name: string
  fullName: string
  description: string
  url: string
  defaultBranch: string
}

export interface AzureDevOpsProject {
  id: string
  name: string
  description: string
}

export interface GenerateDocRequest {
  provider: string
  source: string
  sourcePath?: string
  repoURL?: string
  projectName?: string
  code?: string
  language?: string
  docType: string
  model?: string
  readFullRepo?: boolean
  savePath?: string
}

export type TechDocsProgressStatus = 'queued' | 'running' | 'completed' | 'failed'

export interface TechDocsProgress {
  id: string
  status: TechDocsProgressStatus
  percent: number
  chunk: number
  totalChunks: number
  message: string
  provider?: string
  model?: string
  docType?: string
  source?: string
  savePath?: string
  repoUrl?: string
  resultContent?: string
  errorMessage?: string
  startedAt: string
  updatedAt: string
}

export interface ImproveDocRequest {
  provider: string
  content: string
  improvementType: string
  model?: string
}

export interface ChatRequest {
  provider: string
  message: string
  context?: string
  conversation?: { role: string; content: string }[]
  model?: string
}

export interface GenerateDiagramRequest {
  provider: string
  diagramType: string
  source: string
  sourcePath?: string
  repoURL?: string
  projectName?: string
  code?: string
  description?: string
  language?: string
  model?: string
}

export interface AIResponse {
  provider: string
  model: string
  content: string
  usage?: {
    inputTokens: number
    outputTokens: number
    totalTokens: number
  }
}

export interface DiagramResponse {
  type: string
  format: string
  content: string
  provider: string
  model: string
}

export const aiService = {
  async getProviders(): Promise<AIProvider[]> {
    // Usando dados mockados
    return getMockAIProviders()
  },

  async getGitHubRepositories(): Promise<Repository[]> {
    try {
      // Usando dados mockados
      return getMockRepositories()
    } catch (err) {
      console.error('Error fetching GitHub repos:', err)
      return []
    }
  },

  async getGitHubRepoContent(owner: string, repo: string, path: string = ''): Promise<string> {
    try {
      // Usando dados mockados
      return getMockRepoContent(owner, repo, path)
    } catch (err) {
      console.error('Error fetching repo content:', err)
      throw err
    }
  },

  async getAzureDevOpsProjects(): Promise<AzureDevOpsProject[]> {
    try {
      // Usando dados mockados
      return getMockAzureDevOpsProjects()
    } catch (err) {
      console.error('Error fetching Azure DevOps projects:', err)
      return []
    }
  },

  async generateDocumentation(request: GenerateDocRequest): Promise<TechDocsProgress> {
    // Usando dados mockados
    return mockGenerateDocumentation(request)
  },

  async getDocumentationProgress(progressId: string): Promise<TechDocsProgress> {
    // Usando dados mockados - retorna progresso completo
    await new Promise(resolve => setTimeout(resolve, 200))
    return {
      id: progressId,
      status: 'completed',
      percent: 100,
      chunk: 10,
      totalChunks: 10,
      message: 'Documentação gerada com sucesso',
      startedAt: new Date(Date.now() - 5000).toISOString(),
      updatedAt: new Date().toISOString()
    }
  },

  async improveDocumentation(request: ImproveDocRequest): Promise<AIResponse> {
    // Usando dados mockados
    return mockImproveDocumentation(request)
  },

  async chat(request: ChatRequest): Promise<AIResponse> {
    // Usando dados mockados
    return mockChat(request)
  },

  async generateDiagram(request: GenerateDiagramRequest): Promise<DiagramResponse> {
    // Usando dados mockados
    await new Promise(resolve => setTimeout(resolve, 1500))
    return {
      type: request.diagramType,
      format: 'mermaid',
      content: `graph TD
    A[Cliente] -->|HTTP Request| B[API Gateway]
    B --> C{Autenticação}
    C -->|Válido| D[Serviços]
    C -->|Inválido| E[Error 401]
    D --> F[Database]
    D --> G[Cache]
    F --> H[Resposta]
    G --> H`,
      provider: request.provider,
      model: request.model || 'gpt-4'
    }
  },
}
