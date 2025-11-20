import { useState, useEffect } from 'react'
import { Package, CheckCircle, XCircle, Clock, GitBranch, Plus } from 'lucide-react'
import BuildLogsModal from './BuildLogsModal'
import QueueBuildModal from './QueueBuildModal'
import { FilterValues } from './CIFilters'
import styles from './AzureDevOpsTabs.module.css'
import { buildApiUrl } from '../../config/api'

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
  integration?: string
  definition: {
    id: number
    name: string
  }
}

interface BuildsTabProps {
  filters: FilterValues
}

function BuildsTab({ filters }: BuildsTabProps) {
  const [builds, setBuilds] = useState<Build[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedBuild, setSelectedBuild] = useState<Build | null>(null)
  const [showQueueModal, setShowQueueModal] = useState(false)

  useEffect(() => {
    fetchBuilds()
  }, [filters])

  const fetchBuilds = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: '50' })
      if (filters.integration) params.append('integration', filters.integration)
      if (filters.project) params.append('project', filters.project)
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)

      const response = await fetch(buildApiUrl(`ci/builds?${params.toString()}`))
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
    <>
      <div className={styles.list}>
        {builds.map((build) => (
          <div
            key={build.id}
            className={`${styles.listItem} ${styles.clickable}`}
            onClick={() => setSelectedBuild(build)}
          >
            <div className={styles.listItemHeader}>
              <div className={styles.listItemTitle}>
                {getStatusIcon(build.result, build.status)}
                <span>{build.definition.name}</span>
              </div>
              {getStatusBadge(build.result, build.status)}
            </div>
            <div className={styles.listItemContent}>
              <div className={styles.listItemRow}>
                <span className={styles.label}>Integração:</span>
                <span>{build.integration || 'N/A'}</span>
              </div>
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

      <button className={styles.fabButton} onClick={() => setShowQueueModal(true)} title="Criar Novo Build">
        <Plus size={24} />
      </button>

      {selectedBuild && (
        <BuildLogsModal
          buildId={selectedBuild.id}
          buildNumber={selectedBuild.buildNumber}
          onClose={() => setSelectedBuild(null)}
        />
      )}

      {showQueueModal && (
        <QueueBuildModal
          onClose={() => setShowQueueModal(false)}
          onSuccess={() => {
            setShowQueueModal(false)
            fetchBuilds()
          }}
        />
      )}
    </>
  )
}

export default BuildsTab
