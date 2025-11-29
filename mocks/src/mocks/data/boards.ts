export interface BoardItem {
  id: string
  title: string
  description?: string
  status: string
  priority?: string
  assignee?: string
  labels?: string[]
  source: string
  sourceUrl?: string
  createdAt: string
  updatedAt: string
  dueDate?: string
}

export interface BoardColumn {
  id: string
  name: string
  items: BoardItem[]
}

export interface UnifiedBoard {
  id: string
  name: string
  columns: BoardColumn[]
  totalItems: number
  sources: string[]
  lastUpdated: string
}

const mockBoardItems: BoardItem[] = [
  {
    id: 'jira-1',
    title: 'Implementar autenticação OAuth2',
    description: 'Adicionar suporte completo para OAuth2 no serviço de autenticação',
    status: 'Backlog',
    priority: 'High',
    assignee: 'Maria Santos',
    labels: ['backend', 'security'],
    source: 'jira',
    sourceUrl: 'https://jira.example.com/browse/PROJ-123',
    createdAt: '2024-03-10T09:00:00Z',
    updatedAt: '2024-03-16T10:00:00Z',
    dueDate: '2024-03-25T17:00:00Z'
  },
  {
    id: 'jira-2',
    title: 'Refatorar API Gateway',
    description: 'Melhorar performance e adicionar rate limiting',
    status: 'In Progress',
    priority: 'Medium',
    assignee: 'Pedro Costa',
    labels: ['refactoring', 'performance'],
    source: 'jira',
    sourceUrl: 'https://jira.example.com/browse/PROJ-124',
    createdAt: '2024-03-12T14:00:00Z',
    updatedAt: '2024-03-16T15:30:00Z'
  },
  {
    id: 'jira-3',
    title: 'Criar testes de integração',
    description: 'Adicionar testes E2E para fluxo de pagamentos',
    status: 'Testing',
    priority: 'High',
    assignee: 'Ana Oliveira',
    labels: ['testing', 'qa'],
    source: 'jira',
    sourceUrl: 'https://jira.example.com/browse/PROJ-125',
    createdAt: '2024-03-11T10:00:00Z',
    updatedAt: '2024-03-16T11:20:00Z',
    dueDate: '2024-03-20T17:00:00Z'
  },
  {
    id: 'jira-4',
    title: 'Atualizar documentação da API',
    description: 'Revisar e atualizar Swagger com novos endpoints',
    status: 'Done',
    priority: 'Low',
    assignee: 'Carlos Ferreira',
    labels: ['documentation'],
    source: 'jira',
    sourceUrl: 'https://jira.example.com/browse/PROJ-126',
    createdAt: '2024-03-08T08:00:00Z',
    updatedAt: '2024-03-15T16:00:00Z'
  },
  {
    id: 'jira-5',
    title: 'Adicionar cache Redis',
    description: 'Implementar cache distribuído para melhorar performance',
    status: 'Backlog',
    priority: 'Medium',
    assignee: 'Roberto Silva',
    labels: ['infrastructure', 'performance'],
    source: 'jira',
    sourceUrl: 'https://jira.example.com/browse/PROJ-127',
    createdAt: '2024-03-14T09:00:00Z',
    updatedAt: '2024-03-16T09:00:00Z'
  },
  {
    id: 'jira-6',
    title: 'Melhorar logs de erro',
    description: 'Adicionar contexto e stack traces nos logs',
    status: 'Review',
    priority: 'Low',
    assignee: 'Fernanda Lima',
    labels: ['observability', 'logging'],
    source: 'jira',
    sourceUrl: 'https://jira.example.com/browse/PROJ-128',
    createdAt: '2024-03-13T10:00:00Z',
    updatedAt: '2024-03-16T14:00:00Z'
  },
  {
    id: 'azuredevops-1',
    title: 'Configurar CI/CD pipeline',
    description: 'Criar pipeline para deploy automático em staging',
    status: 'To Do',
    priority: 'High',
    assignee: 'Juliana Alves',
    labels: ['devops', 'ci-cd'],
    source: 'azuredevops',
    sourceUrl: 'https://dev.azure.com/org/project/_workitems/edit/456',
    createdAt: '2024-03-13T09:00:00Z',
    updatedAt: '2024-03-16T09:00:00Z',
    dueDate: '2024-03-22T17:00:00Z'
  },
  {
    id: 'azuredevops-2',
    title: 'Corrigir bug no processamento de pagamentos',
    description: 'Erro ao processar pagamentos com cartão internacional',
    status: 'In Progress',
    priority: 'Critical',
    assignee: 'Ana Oliveira',
    labels: ['bug', 'payment'],
    source: 'azuredevops',
    sourceUrl: 'https://dev.azure.com/org/project/_workitems/edit/457',
    createdAt: '2024-03-14T11:00:00Z',
    updatedAt: '2024-03-16T14:00:00Z',
    dueDate: '2024-03-18T17:00:00Z'
  },
  {
    id: 'azuredevops-3',
    title: 'Otimizar queries do banco de dados',
    description: 'Melhorar performance das consultas de relatórios',
    status: 'Review',
    priority: 'Medium',
    assignee: 'Pedro Costa',
    labels: ['database', 'performance'],
    source: 'azuredevops',
    sourceUrl: 'https://dev.azure.com/org/project/_workitems/edit/458',
    createdAt: '2024-03-10T13:00:00Z',
    updatedAt: '2024-03-16T10:30:00Z'
  },
  {
    id: 'azuredevops-4',
    title: 'Implementar feature flag system',
    description: 'Adicionar sistema de feature flags para releases graduais',
    status: 'Done',
    priority: 'Medium',
    assignee: 'Maria Santos',
    labels: ['feature', 'infrastructure'],
    source: 'azuredevops',
    sourceUrl: 'https://dev.azure.com/org/project/_workitems/edit/459',
    createdAt: '2024-03-05T10:00:00Z',
    updatedAt: '2024-03-14T17:00:00Z'
  },
  {
    id: 'azuredevops-5',
    title: 'Adicionar monitoramento de métricas',
    description: 'Configurar Prometheus e Grafana para métricas customizadas',
    status: 'Backlog',
    priority: 'Medium',
    assignee: 'Lucas Mendes',
    labels: ['observability', 'monitoring'],
    source: 'azuredevops',
    sourceUrl: 'https://dev.azure.com/org/project/_workitems/edit/460',
    createdAt: '2024-03-15T08:00:00Z',
    updatedAt: '2024-03-16T08:00:00Z'
  },
  {
    id: 'azuredevops-6',
    title: 'Implementar retry logic',
    description: 'Adicionar retry automático para chamadas de API externas',
    status: 'Testing',
    priority: 'High',
    assignee: 'Juliana Alves',
    labels: ['backend', 'resilience'],
    source: 'azuredevops',
    sourceUrl: 'https://dev.azure.com/org/project/_workitems/edit/461',
    createdAt: '2024-03-12T11:00:00Z',
    updatedAt: '2024-03-16T12:00:00Z'
  },
  {
    id: 'github-1',
    title: 'Adicionar validação de formulários',
    description: 'Implementar validação client-side e server-side',
    status: 'To Do',
    priority: 'Medium',
    assignee: 'Carlos Ferreira',
    labels: ['frontend', 'validation'],
    source: 'github',
    sourceUrl: 'https://github.com/empresa/frontend-app/issues/78',
    createdAt: '2024-03-12T15:00:00Z',
    updatedAt: '2024-03-16T08:00:00Z'
  },
  {
    id: 'github-2',
    title: 'Melhorar tratamento de erros',
    description: 'Adicionar error boundaries e melhor feedback ao usuário',
    status: 'In Progress',
    priority: 'High',
    assignee: 'Juliana Alves',
    labels: ['frontend', 'error-handling'],
    source: 'github',
    sourceUrl: 'https://github.com/empresa/frontend-app/issues/79',
    createdAt: '2024-03-11T11:00:00Z',
    updatedAt: '2024-03-16T13:00:00Z',
    dueDate: '2024-03-21T17:00:00Z'
  },
  {
    id: 'github-3',
    title: 'Atualizar dependências',
    description: 'Atualizar pacotes npm para versões mais recentes',
    status: 'Done',
    priority: 'Low',
    assignee: 'Pedro Costa',
    labels: ['maintenance'],
    source: 'github',
    sourceUrl: 'https://github.com/empresa/frontend-app/issues/80',
    createdAt: '2024-03-09T09:00:00Z',
    updatedAt: '2024-03-15T12:00:00Z'
  },
  {
    id: 'github-4',
    title: 'Implementar dark mode',
    description: 'Adicionar suporte para tema escuro na aplicação',
    status: 'Backlog',
    priority: 'Low',
    assignee: 'Carlos Ferreira',
    labels: ['frontend', 'ui'],
    source: 'github',
    sourceUrl: 'https://github.com/empresa/frontend-app/issues/81',
    createdAt: '2024-03-15T10:00:00Z',
    updatedAt: '2024-03-16T10:00:00Z'
  },
  {
    id: 'github-5',
    title: 'Otimizar bundle size',
    description: 'Reduzir tamanho do bundle usando code splitting',
    status: 'Review',
    priority: 'Medium',
    assignee: 'Juliana Alves',
    labels: ['frontend', 'performance'],
    source: 'github',
    sourceUrl: 'https://github.com/empresa/frontend-app/issues/82',
    createdAt: '2024-03-13T14:00:00Z',
    updatedAt: '2024-03-16T15:00:00Z'
  },
  {
    id: 'github-6',
    title: 'Adicionar testes unitários',
    description: 'Aumentar cobertura de testes para componentes críticos',
    status: 'Testing',
    priority: 'High',
    assignee: 'Ana Oliveira',
    labels: ['testing', 'quality'],
    source: 'github',
    sourceUrl: 'https://github.com/empresa/frontend-app/issues/83',
    createdAt: '2024-03-11T13:00:00Z',
    updatedAt: '2024-03-16T11:00:00Z'
  }
]

const buildUnifiedBoard = (items: BoardItem[]): UnifiedBoard => {
  const toDoItems = items.filter(item => 
    item.status === 'To Do' || item.status === 'Backlog'
  )
  const inProgressItems = items.filter(item => item.status === 'In Progress')
  const reviewItems = items.filter(item => 
    item.status === 'Review' || item.status === 'Testing'
  )
  const doneItems = items.filter(item => item.status === 'Done')

  const sources = Array.from(new Set(items.map(item => item.source)))

  return {
    id: 'unified-board-1',
    name: 'Board Unificado',
    columns: [
      {
        id: 'todo',
        name: 'To Do',
        items: toDoItems
      },
      {
        id: 'in-progress',
        name: 'In Progress',
        items: inProgressItems
      },
      {
        id: 'review',
        name: 'Review',
        items: reviewItems
      },
      {
        id: 'done',
        name: 'Done',
        items: doneItems
      }
    ],
    totalItems: items.length,
    sources: sources,
    lastUpdated: new Date().toISOString()
  }
}

export const getMockUnifiedBoard = async (): Promise<UnifiedBoard> => {
  await new Promise(resolve => setTimeout(resolve, 300))
  return buildUnifiedBoard(mockBoardItems)
}

export const getMockBoardBySource = async (source: string): Promise<UnifiedBoard> => {
  await new Promise(resolve => setTimeout(resolve, 200))
  const filteredItems = mockBoardItems.filter(item => item.source === source)
  const board = buildUnifiedBoard(filteredItems)
  board.id = `board-${source}`
  board.name = `Board - ${source === 'jira' ? 'Jira' : source === 'azuredevops' ? 'Azure DevOps' : 'GitHub'}`
  board.sources = [source]
  return board
}

