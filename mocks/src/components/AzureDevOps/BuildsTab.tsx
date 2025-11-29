import { useState, useEffect } from 'react'
import { Package, CheckCircle, XCircle, Clock, GitBranch, Plus } from 'lucide-react'
import BuildLogsModal from './BuildLogsModal'
import QueueBuildModal from './QueueBuildModal'
import { FilterValues } from './CIFilters'
import { getMockCIBuilds } from '../../mocks/data/ci'

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
      const data = await getMockCIBuilds()
      setBuilds(data.builds || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load builds')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (result: string, status: string) => {
    if (result === 'succeeded') return <CheckCircle size={18} className="text-success" />
    if (result === 'failed') return <XCircle size={18} className="text-error" />
    if (status === 'inProgress') return <Clock size={18} className="text-warning" />
    return <Clock size={18} />
  }

  const getStatusBadge = (result: string, status: string) => {
    if (result === 'succeeded') return <span className="py-1 px-3 rounded-xl text-xs font-semibold bg-success/10 text-success">Success</span>
    if (result === 'failed') return <span className="py-1 px-3 rounded-xl text-xs font-semibold bg-error/10 text-error">Failed</span>
    if (status === 'inProgress') return <span className="py-1 px-3 rounded-xl text-xs font-semibold bg-warning/10 text-warning">Running</span>
    return <span className="py-1 px-3 rounded-xl text-xs font-semibold bg-surface-light text-text-secondary">{status}</span>
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('pt-BR')
  }

  const getBranchName = (fullBranch: string) => {
    return fullBranch.replace('refs/heads/', '')
  }

  if (loading) {
    return <div className="text-center py-16 px-5 text-text-secondary text-base">Carregando builds...</div>
  }

  if (error) {
    return <div className="text-center py-10 px-5 text-error bg-error/10 border border-error rounded-xl">Erro: {error}</div>
  }

  if (builds.length === 0) {
    return (
      <div className="text-center py-20 px-5 text-text-secondary">
        <Package size={48} className="mb-4 opacity-50" />
        <p>Nenhum build encontrado</p>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        {builds.map((build) => (
          <div
            key={build.id}
            className="bg-surface border border-border rounded-xl p-5 transition-all duration-200 cursor-pointer hover:border-primary hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(99,102,241,0.15)]"
            onClick={() => setSelectedBuild(build)}
          >
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-3 text-base font-semibold text-text">
                {getStatusIcon(build.result, build.status)}
                <span>{build.definition.name}</span>
              </div>
              {getStatusBadge(build.result, build.status)}
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <span className="font-semibold text-text-secondary">Integração:</span>
                <span>{build.integration || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <span className="font-semibold text-text-secondary">Build:</span>
                <span>{build.buildNumber}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <GitBranch size={14} />
                <span>{getBranchName(build.sourceBranch)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <span className="font-semibold text-text-secondary">Finished:</span>
                <span>{formatDate(build.finishTime)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-primary text-white border-none cursor-pointer flex items-center justify-center shadow-[0_4px_12px_rgba(99,102,241,0.3)] transition-all duration-200 ease-in-out z-[100] hover:bg-primary-dark hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(99,102,241,0.4)] active:translate-y-0"
        onClick={() => setShowQueueModal(true)}
        title="Criar Novo Build"
      >
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
