import { useState, useEffect } from 'react'
import { X, PlayCircle, CheckCircle, XCircle, Clock, Calendar } from 'lucide-react'
import { buildApiUrl } from '../../config/api'

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
      const response = await fetch(buildApiUrl(`ci/pipelines/${pipelineId}/runs`))
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
    if (state === 'inProgress') return <Clock size={20} className="text-warning" />
    if (result === 'succeeded') return <CheckCircle size={20} className="text-success" />
    if (result === 'failed') return <XCircle size={20} className="text-error" />
    return <PlayCircle size={20} className="text-text-secondary" />
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface border border-border rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <PlayCircle size={24} className="text-primary" />
            <div>
              <h2 className="text-lg font-semibold text-text">{pipelineName}</h2>
              <p className="text-sm text-text-secondary">Histórico de execuções</p>
            </div>
          </div>
          <button className="p-2 rounded-lg bg-surface-light text-text-secondary hover:bg-error/10 hover:text-error border-none cursor-pointer transition-colors" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-5">
          {loading && <div className="text-center py-16 px-5 text-text-secondary text-base">Carregando runs...</div>}

          {error && <div className="text-center py-10 px-5 text-error bg-error/10 border border-error rounded-xl">Erro: {error}</div>}

          {!loading && !error && runs.length === 0 && (
            <div className="text-center py-20 px-5 text-text-secondary">
              <PlayCircle size={48} className="mb-4 opacity-50" />
              <p>Nenhuma execução encontrada</p>
            </div>
          )}

          {!loading && !error && runs.length > 0 && (
            <div className="flex flex-col gap-3">
              {runs.map((run) => (
                <div key={run.id} className="bg-surface-light border border-border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-start gap-3">
                      {getStatusIcon(run.state, run.result)}
                      <div>
                        <div className="text-base font-semibold text-text">{run.name}</div>
                        <div className="flex items-center gap-1 text-xs text-text-secondary mt-1">
                          <Calendar size={14} />
                          <span>{formatDate(run.createdDate)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-text-secondary font-mono">#{run.id}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <span className="font-semibold text-text-secondary">Estado:</span>
                      <span className="text-text ml-1">{run.state}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-text-secondary">Resultado:</span>
                      <span className="text-text ml-1">{run.result || 'Em andamento'}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-text-secondary">Duração:</span>
                      <span className="text-text ml-1">
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
