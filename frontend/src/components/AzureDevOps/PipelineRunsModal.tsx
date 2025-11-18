import { useState, useEffect } from 'react'
import { X, PlayCircle, CheckCircle, XCircle, Clock, Calendar } from 'lucide-react'
import styles from './PipelineRunsModal.module.css'

interface PipelineRun {
  id: number
  name: string
  state: string
  result: string
  createdDate: string
  finishedDate: string
  url: string
}

interface PipelineRunsModalProps {
  pipelineId: number
  pipelineName: string
  onClose: () => void
}

function PipelineRunsModal({ pipelineId, pipelineName, onClose }: PipelineRunsModalProps) {
  const [runs, setRuns] = useState<PipelineRun[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchRuns()
  }, [pipelineId])

  const fetchRuns = async () => {
    try {
      const response = await fetch(`http://localhost:8060/api/v1/ci/pipelines/${pipelineId}/runs`)
      if (!response.ok) throw new Error('Failed to fetch runs')
      const data = await response.json()
      setRuns(data.runs || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load runs')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (state: string, result: string) => {
    if (state === 'inProgress') return <Clock size={20} className={styles.statusRunning} />
    if (result === 'succeeded') return <CheckCircle size={20} className={styles.statusSuccess} />
    if (result === 'failed') return <XCircle size={20} className={styles.statusFailed} />
    return <PlayCircle size={20} className={styles.statusPending} />
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getDuration = (start: string, end: string) => {
    if (!start || !end) return '-'
    const startDate = new Date(start)
    const endDate = new Date(end)
    const diff = endDate.getTime() - startDate.getTime()
    const minutes = Math.floor(diff / 60000)
    const seconds = Math.floor((diff % 60000) / 1000)
    return `${minutes}m ${seconds}s`
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <PlayCircle size={24} />
            <div>
              <h2 className={styles.title}>{pipelineName}</h2>
              <p className={styles.subtitle}>Histórico de execuções</p>
            </div>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.content}>
          {loading && <div className={styles.loading}>Carregando runs...</div>}

          {error && <div className={styles.error}>Erro: {error}</div>}

          {!loading && !error && runs.length === 0 && (
            <div className={styles.empty}>
              <PlayCircle size={48} />
              <p>Nenhuma execução encontrada</p>
            </div>
          )}

          {!loading && !error && runs.length > 0 && (
            <div className={styles.runsList}>
              {runs.map((run) => (
                <div key={run.id} className={styles.runCard}>
                  <div className={styles.runHeader}>
                    {getStatusIcon(run.state, run.result)}
                    <div className={styles.runInfo}>
                      <div className={styles.runName}>{run.name}</div>
                      <div className={styles.runMeta}>
                        <Calendar size={14} />
                        <span>{formatDate(run.createdDate)}</span>
                      </div>
                    </div>
                    <div className={styles.runId}>#{run.id}</div>
                  </div>
                  <div className={styles.runDetails}>
                    <div className={styles.runDetail}>
                      <span className={styles.label}>Estado:</span>
                      <span className={styles.value}>{run.state}</span>
                    </div>
                    <div className={styles.runDetail}>
                      <span className={styles.label}>Resultado:</span>
                      <span className={styles.value}>{run.result || 'Em andamento'}</span>
                    </div>
                    <div className={styles.runDetail}>
                      <span className={styles.label}>Duração:</span>
                      <span className={styles.value}>
                        {getDuration(run.createdDate, run.finishedDate)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PipelineRunsModal
