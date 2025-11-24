import { useState, useEffect } from 'react'
import { X, Rocket, GitBranch, FolderTree } from 'lucide-react'
import { apiFetch } from '../../config/api'

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
      const response = await apiFetch('ci/pipelines')
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
      const response = await apiFetch('ci/builds', {
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface border border-border rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <Rocket size={24} className="text-primary" />
            <div>
              <h2 className="text-lg font-semibold text-text">Criar Novo Build</h2>
              <p className="text-sm text-text-secondary">Selecione o pipeline e a branch para executar</p>
            </div>
          </div>
          <button className="p-2 rounded-lg bg-surface-light text-text-secondary hover:bg-error/10 hover:text-error border-none cursor-pointer transition-colors" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-5">
          {loading ? (
            <div className="text-center py-16 px-5 text-text-secondary text-base">Carregando pipelines...</div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-text">
                  <FolderTree size={16} />
                  Integração (Organização)
                </label>
                <select
                  className="w-full p-3 bg-surface-light border border-border rounded-lg text-text text-base cursor-pointer transition-colors hover:border-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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

              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-text">
                  <FolderTree size={16} />
                  Projeto
                </label>
                <select
                  className="w-full p-3 bg-surface-light border border-border rounded-lg text-text text-base cursor-pointer transition-colors hover:border-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
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

              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-text">
                  <Rocket size={16} />
                  Pipeline
                </label>
                <select
                  className="w-full p-3 bg-surface-light border border-border rounded-lg text-text text-base cursor-pointer transition-colors hover:border-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
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

              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-text">
                  <GitBranch size={16} />
                  Branch
                </label>
                <input
                  type="text"
                  className="w-full p-3 bg-surface-light border border-border rounded-lg text-text text-base transition-colors hover:border-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={sourceBranch}
                  onChange={(e) => setSourceBranch(e.target.value)}
                  placeholder="refs/heads/main"
                  required
                />
                <small className="text-xs text-text-secondary">
                  Exemplo: refs/heads/main, refs/heads/develop, refs/heads/feature/my-feature
                </small>
              </div>

              {error && (
                <div className="text-center py-3 px-4 text-error bg-error/10 border border-error rounded-lg">
                  {error}
                </div>
              )}

              <div className="flex gap-3 justify-end pt-4 border-t border-border">
                <button
                  type="button"
                  className="py-2.5 px-6 rounded-lg bg-surface-light text-text border-none cursor-pointer font-semibold transition-colors hover:bg-border disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={onClose}
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-6 rounded-lg bg-primary text-white border-none cursor-pointer font-semibold transition-colors hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
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
