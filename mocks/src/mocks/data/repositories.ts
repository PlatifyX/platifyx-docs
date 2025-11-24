export const mockRepositories = [
  {
    id: '1',
    name: 'api-gateway',
    fullName: 'empresa/api-gateway',
    description: 'Gateway principal da API com roteamento e autenticação',
    url: 'https://github.com/empresa/api-gateway',
    defaultBranch: 'main',
    language: 'TypeScript',
    stars: 45,
    forks: 12,
    openIssues: 8,
    lastCommit: '2024-03-16T10:30:00Z',
    isPrivate: true
  },
  {
    id: '2',
    name: 'auth-service',
    fullName: 'empresa/auth-service',
    description: 'Serviço de autenticação usando JWT e OAuth2',
    url: 'https://github.com/empresa/auth-service',
    defaultBranch: 'main',
    language: 'Go',
    stars: 32,
    forks: 8,
    openIssues: 5,
    lastCommit: '2024-03-15T14:20:00Z',
    isPrivate: true
  },
  {
    id: '3',
    name: 'payment-service',
    fullName: 'empresa/payment-service',
    description: 'Processamento de pagamentos integrado com Stripe e PayPal',
    url: 'https://github.com/empresa/payment-service',
    defaultBranch: 'main',
    language: 'Python',
    stars: 28,
    forks: 6,
    openIssues: 12,
    lastCommit: '2024-03-16T09:15:00Z',
    isPrivate: true
  },
  {
    id: '4',
    name: 'notification-service',
    fullName: 'empresa/notification-service',
    description: 'Sistema de notificações multi-canal (email, SMS, push)',
    url: 'https://github.com/empresa/notification-service',
    defaultBranch: 'main',
    language: 'Node.js',
    stars: 21,
    forks: 5,
    openIssues: 3,
    lastCommit: '2024-03-14T16:45:00Z',
    isPrivate: true
  },
  {
    id: '5',
    name: 'user-service',
    fullName: 'empresa/user-service',
    description: 'Gerenciamento de perfis e preferências de usuários',
    url: 'https://github.com/empresa/user-service',
    defaultBranch: 'main',
    language: 'Java',
    stars: 38,
    forks: 10,
    openIssues: 7,
    lastCommit: '2024-03-15T11:30:00Z',
    isPrivate: true
  },
  {
    id: '6',
    name: 'frontend-app',
    fullName: 'empresa/frontend-app',
    description: 'Aplicação frontend React com TypeScript',
    url: 'https://github.com/empresa/frontend-app',
    defaultBranch: 'main',
    language: 'TypeScript',
    stars: 56,
    forks: 15,
    openIssues: 18,
    lastCommit: '2024-03-16T15:00:00Z',
    isPrivate: true
  }
]

export const getMockRepositories = async () => {
  await new Promise(resolve => setTimeout(resolve, 300))
  return mockRepositories
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
