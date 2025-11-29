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

interface Project {
  key: string
  name: string
  integration?: string
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
  const [filterProject, setFilterProject] = useState(filters.project || '')
  const [projects, setProjects] = useState<Project[]>([])

  useEffect(() => {
    fetchProjects()
  }, [filters.integration])

  useEffect(() => {
    fetchIssues()
  }, [filters, filterType, filterSeverity, filterProject])

  const fetchProjects = async () => {
    try {
      const params = new URLSearchParams()
      if (filters.integration) params.append('integration', filters.integration)

      const response = await apiFetch(`quality/projects?${params.toString()}`)
      if (!response.ok) return
      const data = await response.json()
      setProjects(data.projects || [])
    } catch (err) {
      console.error('Failed to fetch projects:', err)
    }
  }

  const fetchIssues = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: '100' })
      if (filters.integration) params.append('integration', filters.integration)
      if (filterProject) params.append('project', filterProject)
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Projeto</label>
          <select
            className="input-base w-full"
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
          >
            <option value="">Todos os projetos</option>
            {projects.map((project) => (
              <option key={project.key} value={project.key}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Tipo</label>
          <select
            className="input-base w-full"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">Todos os tipos</option>
            <option value="BUG">Bug</option>
            <option value="VULNERABILITY">Vulnerabilidade</option>
            <option value="CODE_SMELL">Code Smell</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Severidade</label>
          <select
            className="input-base w-full"
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
      </div>

      {issues.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <AlertCircle size={48} className="mb-4" />
          <p>Nenhuma issue encontrada</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-sm text-gray-400 mb-4">
            Mostrando {issues.length} issue{issues.length !== 1 ? 's' : ''}
          </div>
          {issues.map((issue) => (
            <div key={issue.key} className="card-base hover:border-gray-600 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={getSeverityColorClass(issue.severity)}>
                    {getTypeIcon(issue.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-300">{issue.type}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                        issue.severity === 'BLOCKER' || issue.severity === 'CRITICAL'
                          ? 'bg-red-500/20 text-red-400'
                          : issue.severity === 'MAJOR'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {issue.severity}
                      </span>
                    </div>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  issue.status === 'OPEN'
                    ? 'bg-red-500/20 text-red-400'
                    : issue.status === 'CONFIRMED'
                    ? 'bg-orange-500/20 text-orange-400'
                    : issue.status === 'RESOLVED'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-gray-700 text-gray-300'
                }`}>
                  {issue.status}
                </span>
              </div>

              <div className="text-white mb-4 leading-relaxed">{issue.message}</div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Code size={14} />
                    <span className="font-mono text-xs bg-gray-800 px-2 py-1 rounded">
                      {issue.component}
                      {issue.line && <span className="text-blue-400">:{issue.line}</span>}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-700">
                  <div className="flex items-center gap-4">
                    {issue.project && (
                      <span className="flex items-center gap-1">
                        <span className="text-gray-500">Projeto:</span>
                        <span className="text-blue-400">{issue.project}</span>
                      </span>
                    )}
                    {issue.integration && (
                      <span className="flex items-center gap-1">
                        <span className="text-gray-500">Integração:</span>
                        <span className="text-blue-400">{issue.integration}</span>
                      </span>
                    )}
                  </div>
                  <span className="text-gray-500">
                    Criado em: {formatDate(issue.creationDate)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default IssuesTab
