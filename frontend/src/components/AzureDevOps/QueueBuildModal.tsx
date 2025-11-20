import { useState, useEffect } from 'react'
import { X, Rocket, GitBranch, FolderTree } from 'lucide-react'
import styles from './QueueBuildModal.module.css'
import { buildApiUrl } from '../../config/api'

interface Pipeline {
  id: number
  name: string
  project?: string
  integration?: string
}

interface QueueBuildModalProps {
  onClose: () => void
  onSuccess: () => void
}

function QueueBuildModal({ onClose, onSuccess }: QueueBuildModalProps) {
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [selectedIntegration, setSelectedIntegration] = useState('')
  const [selectedProject, setSelectedProject] = useState('')
  const [selectedPipeline, setSelectedPipeline] = useState<number | null>(null)
  const [sourceBranch, setSourceBranch] = useState('refs/heads/main')

  useEffect(() => {
    fetchPipelines()
  }, [])

  const fetchPipelines = async () => {
    try {
      const response = await fetch(buildApiUrl('ci/pipelines'))
      if (!response.ok) throw new Error('Failed to fetch pipelines')
      const data = await response.json()
      setPipelines(data.pipelines || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pipelines')
    } finally {
      setLoading(false)
    }
  }

  const uniqueIntegrations = Array.from(new Set(pipelines.map(p => p.integration || 'N/A')))
  const filteredProjects = selectedIntegration
    ? Array.from(new Set(pipelines.filter(p => p.integration === selectedIntegration).map(p => p.project || '')))
    : []
  const filteredPipelines = pipelines.filter(
    p => (!selectedIntegration || p.integration === selectedIntegration) &&
         (!selectedProject || p.project === selectedProject)
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedIntegration || !selectedProject || !selectedPipeline || !sourceBranch) {
      setError('Todos os campos são obrigatórios')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch(buildApiUrl('ci/builds'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          integrationName: selectedIntegration,
          project: selectedProject,
          definitionId: selectedPipeline,
          sourceBranch: sourceBranch,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to queue build')
      }

      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to queue build')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <Rocket size={24} />
            <div>
              <h2 className={styles.title}>Criar Novo Build</h2>
              <p className={styles.subtitle}>Selecione o pipeline e a branch para executar</p>
            </div>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.content}>
          {loading ? (
            <div className={styles.loading}>Carregando pipelines...</div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <FolderTree size={16} />
                  Integração (Organização)
                </label>
                <select
                  className={styles.select}
                  value={selectedIntegration}
                  onChange={(e) => {
                    setSelectedIntegration(e.target.value)
                    setSelectedProject('')
                    setSelectedPipeline(null)
                  }}
                  required
                >
                  <option value="">Selecione uma integração</option>
                  {uniqueIntegrations.map((integration) => (
                    <option key={integration} value={integration}>
                      {integration}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <FolderTree size={16} />
                  Projeto
                </label>
                <select
                  className={styles.select}
                  value={selectedProject}
                  onChange={(e) => {
                    setSelectedProject(e.target.value)
                    setSelectedPipeline(null)
                  }}
                  disabled={!selectedIntegration}
                  required
                >
                  <option value="">Selecione um projeto</option>
                  {filteredProjects.map((project) => (
                    <option key={project} value={project}>
                      {project}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <Rocket size={16} />
                  Pipeline
                </label>
                <select
                  className={styles.select}
                  value={selectedPipeline || ''}
                  onChange={(e) => setSelectedPipeline(Number(e.target.value))}
                  disabled={!selectedProject}
                  required
                >
                  <option value="">Selecione um pipeline</option>
                  {filteredPipelines.map((pipeline) => (
                    <option key={pipeline.id} value={pipeline.id}>
                      {pipeline.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <GitBranch size={16} />
                  Branch
                </label>
                <input
                  type="text"
                  className={styles.input}
                  value={sourceBranch}
                  onChange={(e) => setSourceBranch(e.target.value)}
                  placeholder="refs/heads/main"
                  required
                />
                <small className={styles.hint}>
                  Exemplo: refs/heads/main, refs/heads/develop, refs/heads/feature/my-feature
                </small>
              </div>

              {error && (
                <div className={styles.error}>
                  {error}
                </div>
              )}

              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={onClose}
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={submitting || !selectedPipeline}
                >
                  {submitting ? 'Criando...' : 'Criar Build'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default QueueBuildModal
