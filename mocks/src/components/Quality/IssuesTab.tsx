import { useState, useEffect } from 'react'
import { AlertCircle, Bug, Shield, Code } from 'lucide-react'
import { QualityFilterValues } from './QualityFilters'
import { apiFetch } from '../../config/api'

interface Issue {
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

interface IssuesTabProps {
  filters: QualityFilterValues
}

function IssuesTab({ filters }: IssuesTabProps) {
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterType, setFilterType] = useState('')
  const [filterSeverity, setFilterSeverity] = useState('')

  useEffect(() => {
    fetchIssues()
  }, [filters, filterType, filterSeverity])

  const fetchIssues = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: '100' })
      if (filters.integration) params.append('integration', filters.integration)
      if (filters.project) params.append('project', filters.project)
      if (filterType) params.append('type', filterType)
      if (filterSeverity) params.append('severity', filterSeverity)

      const response = await apiFetch(`quality/issues?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch issues')
      const data = await response.json()
      setIssues(data.issues || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load issues')
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColorClass = (severity: string) => {
    switch (severity.toUpperCase()) {
      case 'BLOCKER':
      case 'CRITICAL':
        return 'text-red-500'
      case 'MAJOR':
        return 'text-yellow-500'
      case 'MINOR':
      case 'INFO':
        return 'text-blue-500'
      default:
        return 'text-gray-400'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'BUG':
        return <Bug size={16} />
      case 'VULNERABILITY':
        return <Shield size={16} />
      case 'CODE_SMELL':
        return <Code size={16} />
      default:
        return <AlertCircle size={16} />
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR')
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-400">Carregando issues...</div>
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">Erro: {error}</div>
  }

  return (
    <div>
      <div className="flex gap-4 mb-6">
        <select
          className="input-base flex-1"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="">Todos os tipos</option>
          <option value="BUG">Bug</option>
          <option value="VULNERABILITY">Vulnerabilidade</option>
          <option value="CODE_SMELL">Code Smell</option>
        </select>

        <select
          className="input-base flex-1"
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
        >
          <option value="">Todas as severidades</option>
          <option value="BLOCKER">Blocker</option>
          <option value="CRITICAL">Critical</option>
          <option value="MAJOR">Major</option>
          <option value="MINOR">Minor</option>
          <option value="INFO">Info</option>
        </select>
      </div>

      {issues.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <AlertCircle size={48} className="mb-4" />
          <p>Nenhuma issue encontrada</p>
        </div>
      ) : (
        <div className="space-y-4">
          {issues.map((issue) => (
            <div key={issue.key} className="card-base">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-gray-300">
                  {getTypeIcon(issue.type)}
                  <span className="font-medium">{issue.type}</span>
                </div>
                <div className={`font-semibold ${getSeverityColorClass(issue.severity)}`}>
                  {issue.severity}
                </div>
              </div>

              <div className="text-white mb-3">{issue.message}</div>

              <div className="flex items-center justify-between text-sm text-gray-400 mb-3">
                <span className="font-mono">
                  {issue.component}
                  {issue.line && `:${issue.line}`}
                </span>
                <span className="px-2 py-1 bg-gray-700 rounded text-xs">{issue.status}</span>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-400">
                {issue.integration && (
                  <span className="text-blue-400">Integração: {issue.integration}</span>
                )}
                <span>
                  Criado em: {formatDate(issue.creationDate)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default IssuesTab
