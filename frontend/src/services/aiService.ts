import { apiFetch, buildApiUrl } from '../config/api'

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
    const response = await fetch(buildApiUrl('ai/providers'))
    if (!response.ok) throw new Error('Failed to fetch AI providers')
    const data = await response.json()
    return data.providers || []
  },

  async getGitHubRepositories(): Promise<Repository[]> {
    try {
      const response = await fetch(buildApiUrl('code/repositories'))
      if (!response.ok) throw new Error('Failed to fetch GitHub repositories')
      const data = await response.json()
      return data.repositories || []
    } catch (err) {
      console.error('Error fetching GitHub repos:', err)
      return []
    }
  },

  async getGitHubRepoContent(owner: string, repo: string, path: string = ''): Promise<string> {
    try {
      const url = buildApiUrl(`code/repositories/${owner}/${repo}/contents/${path}`)
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch repository content')
      const data = await response.json()

      // If it's a file, decode the content
      if (data.content) {
        return atob(data.content)
      }
      return ''
    } catch (err) {
      console.error('Error fetching repo content:', err)
      throw err
    }
  },

  async getAzureDevOpsProjects(): Promise<AzureDevOpsProject[]> {
    try {
      const response = await apiFetch('integrations/azuredevops/projects')
      if (!response.ok) throw new Error('Failed to fetch Azure DevOps projects')
      const data = await response.json()
      return data.projects || []
    } catch (err) {
      console.error('Error fetching Azure DevOps projects:', err)
      return []
    }
  },

  async generateDocumentation(request: GenerateDocRequest): Promise<TechDocsProgress> {
    const response = await fetch(buildApiUrl('techdocs/generate'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to generate documentation')
    }
    const data = await response.json()
    return data.progress
  },

  async getDocumentationProgress(progressId: string): Promise<TechDocsProgress> {
    const response = await fetch(buildApiUrl(`techdocs/progress/${progressId}`))
    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error || 'Failed to fetch documentation progress')
    }
    const data = await response.json()
    return data.progress
  },

  async improveDocumentation(request: ImproveDocRequest): Promise<AIResponse> {
    const response = await fetch(buildApiUrl('techdocs/improve'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to improve documentation')
    }
    return response.json()
  },

  async chat(request: ChatRequest): Promise<AIResponse> {
    const response = await fetch(buildApiUrl('techdocs/chat'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to process chat')
    }
    return response.json()
  },

  async generateDiagram(request: GenerateDiagramRequest): Promise<DiagramResponse> {
    const response = await fetch(buildApiUrl('techdocs/diagram'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to generate diagram')
    }
    return response.json()
  },
}
