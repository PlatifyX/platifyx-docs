import { useState, useEffect } from 'react'
import { GitBranch, FolderOpen, Package } from 'lucide-react'
import PipelineRunsModal from './PipelineRunsModal'
import styles from './AzureDevOpsTabs.module.css'

interface Pipeline {
  id: number
  name: string
  folder: string
  revision: number
  url: string
  project?: string
  lastBuildId?: number
}

function PipelinesTab() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null)

  useEffect(() => {
    fetchPipelines()
  }, [])

  const fetchPipelines = async () => {
    try {
      const response = await fetch('http://localhost:8060/api/v1/ci/pipelines')
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
    <>
      <div className={styles.grid}>
        {pipelines.map((pipeline) => (
          <div
            key={pipeline.id}
            className={`${styles.card} ${styles.clickable}`}
            onClick={() => setSelectedPipeline(pipeline)}
          >
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
                <span className={styles.label}>Projeto:</span>
                <span>{pipeline.project || 'N/A'}</span>
              </div>
              <div className={styles.cardInfo}>
                <Package size={16} />
                <span className={styles.label}>Build:</span>
                <span>{pipeline.lastBuildId ? `#${pipeline.lastBuildId}` : 'Nenhum'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedPipeline && (
        <PipelineRunsModal
          pipelineId={selectedPipeline.id}
          pipelineName={selectedPipeline.name}
          onClose={() => setSelectedPipeline(null)}
        />
      )}
    </>
  )
}

export default PipelinesTab
