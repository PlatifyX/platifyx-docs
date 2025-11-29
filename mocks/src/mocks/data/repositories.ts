export interface Repository {
  id: number | string
  name: string
  full_name: string
  description: string
  html_url: string
  private: boolean
  fork: boolean
  created_at: string
  updated_at: string
  pushed_at: string
  size: number
  stargazers_count: number
  watchers_count: number
  language: string
  forks_count: number
  open_issues_count: number
  default_branch: string
  owner: {
    login: string
    avatar_url: string
  }
}

export interface RepoStats {
  totalRepositories: number
  totalStars: number
  totalForks: number
  totalOpenIssues: number
  publicRepos: number
  privateRepos: number
}

export const mockRepositories: Repository[] = [
  {
    id: 1,
    name: 'api-gateway',
    full_name: 'empresa/api-gateway',
    description: 'Gateway principal da API com roteamento e autenticação',
    html_url: 'https://github.com/empresa/api-gateway',
    private: true,
    fork: false,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-03-16T10:30:00Z',
    pushed_at: '2024-03-16T10:30:00Z',
    size: 2450,
    stargazers_count: 45,
    watchers_count: 12,
    language: 'TypeScript',
    forks_count: 12,
    open_issues_count: 8,
    default_branch: 'main',
    owner: {
      login: 'empresa',
      avatar_url: 'https://github.com/empresa.png'
    }
  },
  {
    id: 2,
    name: 'auth-service',
    full_name: 'empresa/auth-service',
    description: 'Serviço de autenticação usando JWT e OAuth2',
    html_url: 'https://github.com/empresa/auth-service',
    private: true,
    fork: false,
    created_at: '2024-01-20T09:00:00Z',
    updated_at: '2024-03-15T14:20:00Z',
    pushed_at: '2024-03-15T14:20:00Z',
    size: 1820,
    stargazers_count: 32,
    watchers_count: 8,
    language: 'Go',
    forks_count: 8,
    open_issues_count: 5,
    default_branch: 'main',
    owner: {
      login: 'empresa',
      avatar_url: 'https://github.com/empresa.png'
    }
  },
  {
    id: 3,
    name: 'payment-service',
    full_name: 'empresa/payment-service',
    description: 'Processamento de pagamentos integrado com Stripe e PayPal',
    html_url: 'https://github.com/empresa/payment-service',
    private: true,
    fork: false,
    created_at: '2024-02-01T14:00:00Z',
    updated_at: '2024-03-16T09:15:00Z',
    pushed_at: '2024-03-16T09:15:00Z',
    size: 3200,
    stargazers_count: 28,
    watchers_count: 6,
    language: 'Python',
    forks_count: 6,
    open_issues_count: 12,
    default_branch: 'main',
    owner: {
      login: 'empresa',
      avatar_url: 'https://github.com/empresa.png'
    }
  }
]

export const mockRepoStats: RepoStats = {
  totalRepositories: 3,
  totalStars: 105,
  totalForks: 26,
  totalOpenIssues: 25,
  publicRepos: 0,
  privateRepos: 3
}

export const getMockRepositories = async (): Promise<{ repositories: Repository[] }> => {
  await new Promise(resolve => setTimeout(resolve, 300))
  return { repositories: mockRepositories }
}

export const getMockRepoStats = async (): Promise<RepoStats> => {
  await new Promise(resolve => setTimeout(resolve, 250))
  return mockRepoStats
}

export const getMockRepositoryById = async (id: string) => {
  await new Promise(resolve => setTimeout(resolve, 200))
  return mockRepositories.find(r => r.id === id)
}

export const getMockRepoContent = async (owner: string, repo: string, path: string = '') => {
  await new Promise(resolve => setTimeout(resolve, 400))

  // Retorna conteúdo mockado de exemplo
  return `# ${repo}

## Descrição
Este é um repositório de demonstração.

## Instalação
\`\`\`bash
npm install
\`\`\`

## Uso
\`\`\`bash
npm start
\`\`\`

## Contribuindo
Pull requests são bem-vindos!
`
}
