import { useState, useEffect } from 'react'
import { AlertCircle, Bug, Shield, Code } from 'lucide-react'
import { QualityFilterValues } from './QualityFilters'
import styles from './QualityTabs.module.css'

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

      const response = await fetch(`http://localhost:8060/api/v1/quality/issues?${params.toString()}`)
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

  const getSeverityColor = (severity: string) => {
    switch (severity.toUpperCase()) {
      case 'BLOCKER':
      case 'CRITICAL':
        return 'var(--color-error)'
      case 'MAJOR':
        return 'var(--color-warning)'
      case 'MINOR':
      case 'INFO':
        return 'var(--color-info)'
      default:
        return 'var(--color-text-secondary)'
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
    return <div className={styles.loading}>Carregando issues...</div>
  }

  if (error) {
    return <div className={styles.error}>Erro: {error}</div>
  }

  return (
    <div className={styles.container}>
      <div className={styles.filters}>
        <select
          className={styles.filterSelect}
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="">Todos os tipos</option>
          <option value="BUG">Bug</option>
          <option value="VULNERABILITY">Vulnerabilidade</option>
          <option value="CODE_SMELL">Code Smell</option>
        </select>

        <select
          className={styles.filterSelect}
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
        <div className={styles.empty}>
          <AlertCircle size={48} />
          <p>Nenhuma issue encontrada</p>
        </div>
      ) : (
        <div className={styles.issuesList}>
          {issues.map((issue) => (
            <div key={issue.key} className={styles.issueCard}>
              <div className={styles.issueHeader}>
                <div className={styles.issueType}>
                  {getTypeIcon(issue.type)}
                  <span>{issue.type}</span>
                </div>
                <div
                  className={styles.issueSeverity}
                  style={{ color: getSeverityColor(issue.severity) }}
                >
                  {issue.severity}
                </div>
              </div>

              <div className={styles.issueMessage}>{issue.message}</div>

              <div className={styles.issueMeta}>
                <span className={styles.issueComponent}>
                  {issue.component}
                  {issue.line && `:${issue.line}`}
                </span>
                <span className={styles.issueStatus}>{issue.status}</span>
              </div>

              <div className={styles.issueFooter}>
                {issue.integration && (
                  <span className={styles.integration}>Integração: {issue.integration}</span>
                )}
                <span className={styles.issueDate}>
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
