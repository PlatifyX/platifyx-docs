import { useState, useEffect } from 'react'
import { 
  LayoutGrid, 
  GitBranch, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Loader2,
  ExternalLink,
  Filter,
  RefreshCw
} from 'lucide-react'
import { buildApiUrl } from '../config/api'

interface BoardItem {
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

interface BoardColumn {
  id: string
  name: string
  items: BoardItem[]
}

interface UnifiedBoard {
  id: string
  name: string
  columns: BoardColumn[]
  totalItems: number
  sources: string[]
  lastUpdated: string
}

const sourceColors: Record<string, string> = {
  jira: 'bg-blue-500',
  azuredevops: 'bg-purple-500',
  github: 'bg-gray-500'
}

const sourceLabels: Record<string, string> = {
  jira: 'Jira',
  azuredevops: 'Azure DevOps',
  github: 'GitHub'
}

function BoardsPage() {
  const [board, setBoard] = useState<UnifiedBoard | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSource, setSelectedSource] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string | null>(null)

  useEffect(() => {
    fetchBoard()
  }, [])

  const fetchBoard = async () => {
    try {
      setLoading(true)
      const url = selectedSource 
        ? buildApiUrl(`boards/source/${selectedSource}`)
        : buildApiUrl('boards/unified')
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setBoard(data)
      }
    } catch (error) {
      console.error('Failed to fetch board:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSourceColor = (source: string) => {
    return sourceColors[source.toLowerCase()] || 'bg-gray-500'
  }

  const getSourceLabel = (source: string) => {
    return sourceLabels[source.toLowerCase()] || source
  }

  const getPriorityColor = (priority?: string) => {
    if (!priority) return 'bg-gray-500'
    const p = priority.toLowerCase()
    if (p.includes('high') || p.includes('critical')) return 'bg-red-500'
    if (p.includes('medium')) return 'bg-yellow-500'
    if (p.includes('low')) return 'bg-green-500'
    return 'bg-gray-500'
  }

  const filteredColumns = board?.columns.map(col => ({
    ...col,
    items: filterStatus 
      ? col.items.filter(item => item.status.toLowerCase() === filterStatus.toLowerCase())
      : col.items
  })) || []

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-text mb-2">Boards Unificados</h1>
        <p className="text-text-secondary">Visualize tarefas do Jira, Azure DevOps e GitHub em um único lugar</p>
      </div>

      <div className="mb-6 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-text-secondary" />
          <select
            value={selectedSource || ''}
            onChange={(e) => {
              setSelectedSource(e.target.value || null)
              fetchBoard()
            }}
            className="bg-surface border border-border rounded-lg px-4 py-2 text-text outline-none focus:border-primary"
          >
            <option value="">Todas as Fontes</option>
            <option value="jira">Jira</option>
            <option value="azuredevops">Azure DevOps</option>
            <option value="github">GitHub</option>
          </select>
        </div>

        <button
          onClick={fetchBoard}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-button text-text rounded-lg transition-colors disabled:opacity-50 hover:bg-primary-dark"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              Carregando...
            </>
          ) : (
            <>
              <RefreshCw size={18} />
              Atualizar
            </>
          )}
        </button>

        {board && (
          <div className="ml-auto text-sm text-text-secondary">
            {board.totalItems} itens • {board.sources.length} fonte(s)
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : !board || board.totalItems === 0 ? (
        <div className="bg-surface border border-border rounded-lg p-12 text-center">
                  <LayoutGrid className="mx-auto mb-4 text-text-secondary" size={48} />
          <p className="text-text-secondary text-lg">Nenhum item encontrado</p>
          <p className="text-text-secondary/70 text-sm mt-2">
            Configure integrações com Jira, Azure DevOps ou GitHub para ver os boards
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="flex gap-4 min-w-max pb-4">
            {filteredColumns.map((column) => (
              <div
                key={column.id}
                className="w-80 bg-surface border border-border rounded-lg p-4 flex-shrink-0"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-text flex items-center gap-2">
                    <LayoutGrid size={18} />
                    {column.name}
                  </h3>
                  <span className="bg-background text-text-secondary text-xs px-2 py-1 rounded">
                    {column.items.length}
                  </span>
                </div>

                <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
                  {column.items.length === 0 ? (
                    <div className="text-center py-8 text-text-secondary/70 text-sm">
                      Nenhum item
                    </div>
                  ) : (
                    column.items.map((item) => (
                      <div
                        key={item.id}
                        className="bg-background border border-border rounded-lg p-4 hover:border-primary transition-colors cursor-pointer"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-text text-sm flex-1">
                            {item.title}
                          </h4>
                          {item.sourceUrl && (
                            <a
                              href={item.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-text-secondary hover:text-primary ml-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink size={14} />
                            </a>
                          )}
                        </div>

                        {item.description && (
                          <p className="text-text-secondary text-xs mb-2 line-clamp-2">
                            {item.description}
                          </p>
                        )}

                        <div className="flex items-center gap-2 flex-wrap mt-3">
                          <span
                            className={`text-xs px-2 py-1 rounded ${getSourceColor(item.source)} text-white`}
                          >
                            {getSourceLabel(item.source)}
                          </span>

                          {item.priority && (
                            <span
                              className={`text-xs px-2 py-1 rounded ${getPriorityColor(item.priority)} text-white`}
                            >
                              {item.priority}
                            </span>
                          )}

                          {item.assignee && (
                            <span className="text-xs text-text-secondary">
                              👤 {item.assignee}
                            </span>
                          )}

                          {item.labels && item.labels.length > 0 && (
                            <div className="flex gap-1 flex-wrap">
                              {item.labels.slice(0, 2).map((label, idx) => (
                                <span
                                  key={idx}
                                  className="text-xs px-2 py-1 bg-background text-text-secondary rounded"
                                >
                                  {label}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-2 text-xs text-text-secondary/70">
                          {item.updatedAt && (
                            <span className="flex items-center gap-1">
                              <Clock size={12} />
                              {new Date(item.updatedAt).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default BoardsPage

