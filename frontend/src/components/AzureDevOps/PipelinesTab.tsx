import { useState, useEffect } from 'react'
import { GitBranch, FolderOpen } from 'lucide-react'
import styles from './AzureDevOpsTabs.module.css'

interface Pipeline {
  id: number
  name: string
  folder: string
  revision: number
  url: string
}

function PipelinesTab() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPipelines()
  }, [])

  const fetchPipelines = async () => {
    try {
      const response = await fetch('http://localhost:6000/api/v1/ci/pipelines')
      if (!response.ok) throw new Error('Failed to fetch pipelines')
      const data = await response.json()
      setPipelines(data.pipelines || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pipelines')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className={styles.loading}>Carregando pipelines...</div>
  }

  if (error) {
    return <div className={styles.error}>Erro: {error}</div>
  }

  if (pipelines.length === 0) {
    return (
      <div className={styles.empty}>
        <GitBranch size={48} />
        <p>Nenhum pipeline encontrado</p>
      </div>
    )
  }

  return (
    <div className={styles.grid}>
      {pipelines.map((pipeline) => (
        <div key={pipeline.id} className={styles.card}>
          <div className={styles.cardHeader}>
            <GitBranch size={20} className={styles.cardIcon} />
            <div className={styles.cardTitle}>{pipeline.name}</div>
          </div>
          <div className={styles.cardContent}>
            <div className={styles.cardInfo}>
              <FolderOpen size={16} />
              <span>{pipeline.folder || '/'}</span>
            </div>
            <div className={styles.cardInfo}>
              <span className={styles.label}>Revision:</span>
              <span>{pipeline.revision}</span>
            </div>
            <div className={styles.cardInfo}>
              <span className={styles.label}>ID:</span>
              <span>{pipeline.id}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default PipelinesTab
