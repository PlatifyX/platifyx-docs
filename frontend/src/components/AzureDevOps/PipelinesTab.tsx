import { useState, useEffect } from 'react'
import { GitBranch, FolderOpen, Package } from 'lucide-react'
import PipelineRunsModal from './PipelineRunsModal'
import { FilterValues } from './CIFilters'
import { buildApiUrl } from '../../config/api'

interface Pipeline {
  id: number
  name: string
  folder: string
  revision: number
  url: string
  project?: string
  lastBuildId?: number
  integration?: string
}

interface PipelinesTabProps {
  filters: FilterValues
}

function PipelinesTab({ filters }: PipelinesTabProps) {
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null)

  useEffect(() => {
    fetchPipelines()
  }, [filters])

  const fetchPipelines = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.integration) params.append('integration', filters.integration)
      if (filters.project) params.append('project', filters.project)

      const response = await fetch(buildApiUrl(`ci/pipelines?${params.toString()}`))
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
    return <div className="text-center py-16 px-5 text-text-secondary text-base">Carregando pipelines...</div>
  }

  if (error) {
    return <div className="text-center py-10 px-5 text-error bg-error/10 border border-error rounded-xl">Erro: {error}</div>
  }

  if (pipelines.length === 0) {
    return (
      <div className="text-center py-20 px-5 text-text-secondary">
        <GitBranch size={48} className="mb-4 opacity-50" />
        <p>Nenhum pipeline encontrado</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-5">
        {pipelines.map((pipeline) => (
          <div
            key={pipeline.id}
            className="bg-surface border border-border rounded-xl p-5 transition-all duration-200 cursor-pointer hover:border-primary hover:-translate-y-1 hover:shadow-[0_8px_16px_rgba(99,102,241,0.2)]"
            onClick={() => setSelectedPipeline(pipeline)}
          >
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border">
              <GitBranch size={20} className="text-primary" />
              <div className="text-base font-semibold text-text">{pipeline.name}</div>
            </div>
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <FolderOpen size={16} />
                <span>{pipeline.folder || '/'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <span className="font-semibold text-text-secondary">Integração:</span>
                <span>{pipeline.integration || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <span className="font-semibold text-text-secondary">Projeto:</span>
                <span>{pipeline.project || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <Package size={16} />
                <span className="font-semibold text-text-secondary">Build:</span>
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
