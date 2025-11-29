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
  RefreshCw,
  User,
  Tag
} from 'lucide-react'
import { getMockUnifiedBoard, getMockBoardBySource } from '../mocks/data/boards'

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
      const data = selectedSource 
        ? await getMockBoardBySource(selectedSource)
        : await getMockUnifiedBoard()
      setBoard(data)
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

  const getColumnColor = (columnName: string) => {
    const name = columnName.toLowerCase()
    if (name.includes('todo')) return 'border-blue-500/30 bg-blue-500/5'
    if (name.includes('progress')) return 'border-yellow-500/30 bg-yellow-500/5'
    if (name.includes('review')) return 'border-purple-500/30 bg-purple-500/5'
    if (name.includes('done')) return 'border-green-500/30 bg-green-500/5'
    return 'border-border'
  }

  const getColumnIcon = (columnName: string) => {
    const name = columnName.toLowerCase()
    if (name.includes('todo')) return <Clock className="w-5 h-5" />
    if (name.includes('progress')) return <GitBranch className="w-5 h-5" />
    if (name.includes('review')) return <AlertCircle className="w-5 h-5" />
    if (name.includes('done')) return <CheckCircle className="w-5 h-5" />
    return <LayoutGrid className="w-5 h-5" />
  }

  return (
    <div className="max-w-[1800px] mx-auto px-6 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center shadow-lg">
            <LayoutGrid size={32} className="text-primary" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-text mb-1">Boards Unificados</h1>
            <p className="text-lg text-text-secondary">Visualize tarefas do Jira, Azure DevOps e GitHub em um único lugar</p>
          </div>
        </div>
      </div>

      <div className="mb-8 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-3 bg-surface border-2 border-border rounded-xl px-4 py-3 shadow-sm">
          <Filter size={18} className="text-primary" />
          <select
            value={selectedSource || ''}
            onChange={(e) => {
              setSelectedSource(e.target.value || null)
              fetchBoard()
            }}
            className="bg-[#1d2d44] border-0 text-text outline-none focus:ring-0 cursor-pointer font-medium"
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
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 hover:bg-primary/90 hover:shadow-lg shadow-md"
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
          <div className="ml-auto px-4 py-2 bg-surface border border-border rounded-xl text-sm font-medium text-text-secondary">
            <span className="font-bold text-text">{board.totalItems}</span> itens • <span className="font-bold text-text">{board.sources.length}</span> fonte(s)
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={48} />
        </div>
      ) : !board || board.totalItems === 0 ? (
        <div className="bg-surface border-2 border-border rounded-2xl p-16 text-center">
          <LayoutGrid className="mx-auto mb-6 text-text-secondary/30" size={80} />
          <p className="text-text text-xl font-semibold mb-2">Nenhum item encontrado</p>
          <p className="text-text-secondary text-sm">
            Configure integrações com Jira, Azure DevOps ou GitHub para ver os boards
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto pb-6">
          <div className="flex gap-6 min-w-max">
            {filteredColumns.map((column) => (
              <div
                key={column.id}
                className={`w-80 bg-surface border-2 ${getColumnColor(column.name)} rounded-2xl p-5 flex-shrink-0 shadow-lg`}
              >
                <div className="flex items-center justify-between mb-5 pb-4 border-b border-border">
                  <h3 className="font-bold text-text text-lg flex items-center gap-2">
                    {getColumnIcon(column.name)}
                    {column.name}
                  </h3>
                  <span className="bg-background text-text-secondary text-sm font-bold px-3 py-1 rounded-lg border border-border">
                    {column.items.length}
                  </span>
                </div>

                <div className="space-y-3 max-h-[calc(100vh-350px)] overflow-y-auto pr-2">
                  {column.items.length === 0 ? (
                    <div className="text-center py-12 text-text-secondary/50 text-sm border-2 border-dashed border-border rounded-xl">
                      Nenhum item nesta coluna
                    </div>
                  ) : (
                    column.items.map((item) => (
                      <div
                        key={item.id}
                        className="bg-background border-2 border-border rounded-xl p-4 hover:border-primary hover:shadow-lg transition-all duration-200 cursor-pointer group"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-semibold text-text text-sm flex-1 leading-snug">
                            {item.title}
                          </h4>
                          {item.sourceUrl && (
                            <a
                              href={item.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-text-secondary hover:text-primary ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink size={14} />
                            </a>
                          )}
                        </div>

                        {item.description && (
                          <p className="text-text-secondary text-xs mb-3 line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>
                        )}

                        <div className="flex items-center gap-2 flex-wrap mb-3">
                          <span
                            className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${getSourceColor(item.source)} text-white`}
                          >
                            {getSourceLabel(item.source)}
                          </span>

                          {item.priority && (
                            <span
                              className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${getPriorityColor(item.priority)} text-white`}
                            >
                              {item.priority}
                            </span>
                          )}
                        </div>

                        {item.labels && item.labels.length > 0 && (
                          <div className="flex gap-1.5 flex-wrap mb-3">
                            {item.labels.slice(0, 3).map((label, idx) => (
                              <span
                                key={idx}
                                className="text-xs px-2 py-1 bg-surface border border-border text-text-secondary rounded-md flex items-center gap-1"
                              >
                                <Tag size={10} />
                                {label}
                              </span>
                            ))}
                          </div>
                        )}

                        {item.assignee && (
                          <div className="flex items-center gap-1.5 text-xs text-text-secondary pt-3 border-t border-border">
                            <User size={12} />
                            <span className="font-medium">{item.assignee}</span>
                          </div>
                        )}
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

