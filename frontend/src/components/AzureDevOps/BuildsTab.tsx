import { useState, useEffect } from 'react'
import { Package, CheckCircle, XCircle, Clock, GitBranch } from 'lucide-react'
import styles from './AzureDevOpsTabs.module.css'

interface Build {
  id: number
  buildNumber: string
  status: string
  result: string
  queueTime: string
  startTime: string
  finishTime: string
  sourceBranch: string
  sourceVersion: string
  requestedFor: string
  definition: {
    id: number
    name: string
  }
}

function BuildsTab() {
  const [builds, setBuilds] = useState<Build[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchBuilds()
  }, [])

  const fetchBuilds = async () => {
    try {
      const response = await fetch('http://localhost:8060/api/v1/ci/builds?limit=50')
      if (!response.ok) throw new Error('Failed to fetch builds')
      const data = await response.json()
      setBuilds(data.builds || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load builds')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (result: string, status: string) => {
    if (result === 'succeeded') return <CheckCircle size={18} className={styles.iconSuccess} />
    if (result === 'failed') return <XCircle size={18} className={styles.iconError} />
    if (status === 'inProgress') return <Clock size={18} className={styles.iconWarning} />
    return <Clock size={18} />
  }

  const getStatusBadge = (result: string, status: string) => {
    if (result === 'succeeded') return <span className={styles.badgeSuccess}>Success</span>
    if (result === 'failed') return <span className={styles.badgeError}>Failed</span>
    if (status === 'inProgress') return <span className={styles.badgeWarning}>Running</span>
    return <span className={styles.badgeDefault}>{status}</span>
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('pt-BR')
  }

  const getBranchName = (fullBranch: string) => {
    return fullBranch.replace('refs/heads/', '')
  }

  if (loading) {
    return <div className={styles.loading}>Carregando builds...</div>
  }

  if (error) {
    return <div className={styles.error}>Erro: {error}</div>
  }

  if (builds.length === 0) {
    return (
      <div className={styles.empty}>
        <Package size={48} />
        <p>Nenhum build encontrado</p>
      </div>
    )
  }

  return (
    <div className={styles.list}>
      {builds.map((build) => (
        <div key={build.id} className={styles.listItem}>
          <div className={styles.listItemHeader}>
            <div className={styles.listItemTitle}>
              {getStatusIcon(build.result, build.status)}
              <span>{build.definition.name}</span>
            </div>
            {getStatusBadge(build.result, build.status)}
          </div>
          <div className={styles.listItemContent}>
            <div className={styles.listItemRow}>
              <span className={styles.label}>Build:</span>
              <span>{build.buildNumber}</span>
            </div>
            <div className={styles.listItemRow}>
              <GitBranch size={14} />
              <span>{getBranchName(build.sourceBranch)}</span>
            </div>
            <div className={styles.listItemRow}>
              <span className={styles.label}>Finished:</span>
              <span>{formatDate(build.finishTime)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default BuildsTab
