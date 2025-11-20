import { useState, useEffect } from 'react'
import { X, Terminal, Download } from 'lucide-react'
import styles from './BuildLogsModal.module.css'
import { buildApiUrl } from '../../config/api'

interface BuildLogsModalProps {
  buildId: number
  buildNumber: string
  onClose: () => void
}

function BuildLogsModal({ buildId, buildNumber, onClose }: BuildLogsModalProps) {
  const [logs, setLogs] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchLogs()
  }, [buildId])

  const fetchLogs = async () => {
    try {
      const response = await fetch(buildApiUrl(`ci/builds/${buildId}/logs`))
      if (!response.ok) throw new Error('Failed to fetch build logs')
      const data = await response.json()
      setLogs(data.logs || 'Nenhum log disponível')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load logs')
    } finally {
      setLoading(false)
    }
  }

  const downloadLogs = () => {
    const blob = new Blob([logs], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `build-${buildNumber}-logs.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <Terminal size={24} />
            <div>
              <h2 className={styles.title}>Build Logs</h2>
              <p className={styles.subtitle}>Build #{buildNumber}</p>
            </div>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.downloadButton} onClick={downloadLogs} title="Download logs">
              <Download size={18} />
            </button>
            <button className={styles.closeButton} onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className={styles.content}>
          {loading && (
            <div className={styles.loading}>
              <Terminal size={48} />
              <p>Carregando logs...</p>
            </div>
          )}

          {error && (
            <div className={styles.error}>
              <p>Erro: {error}</p>
            </div>
          )}

          {!loading && !error && (
            <pre className={styles.logsContent}>{logs}</pre>
          )}
        </div>
      </div>
    </div>
  )
}

export default BuildLogsModal
