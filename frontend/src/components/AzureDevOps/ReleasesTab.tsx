import { useState, useEffect } from 'react'
import { Rocket, CheckCircle, XCircle, Clock, UserCheck, Check, X } from 'lucide-react'
import { FilterValues } from './CIFilters'
import { apiFetch } from '../../config/api'

interface User {
  id: string
  displayName: string
  uniqueName: string
}

interface ReleaseApproval {
  id: number
  approver: User
  approvedBy?: User
  status: string
  comments: string
  createdOn: string
  modifiedOn: string
  isAutomated: boolean
}

interface ReleaseEnvironment {
  id: number
  name: string
  status: string
  deploymentStatus: string
  createdOn: string
  modifiedOn: string
  preDeployApprovals?: ReleaseApproval[]
  postDeployApprovals?: ReleaseApproval[]
}

interface Release {
  id: number
  name: string
  status: string
  createdOn: string
  modifiedOn: string
  createdBy: User
  description: string
  integration?: string
  releaseDefinition: {
    id: number
    name: string
  }
  environments: ReleaseEnvironment[]
}

interface ReleasesTabProps {
  filters: FilterValues
}

function ReleasesTab({ filters }: ReleasesTabProps) {
  const [releases, setReleases] = useState<Release[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchReleases()
  }, [filters])

  const fetchReleases = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: '50' })
      if (filters.integration) params.append('integration', filters.integration)
      if (filters.project) params.append('project', filters.project)
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)

      const response = await apiFetch(`ci/releases?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch releases')
      const data = await response.json()
      setReleases(data.releases || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load releases')
    } finally {
      setLoading(false)
    }
  }

  const getEnvironmentIcon = (deploymentStatus: string) => {
    if (deploymentStatus === 'succeeded') return <CheckCircle size={16} className="text-success" />
    if (deploymentStatus === 'failed') return <XCircle size={16} className="text-error" />
    return <Clock size={16} className="text-warning" />
  }

  const getEnvironmentBadge = (deploymentStatus: string) => {
    if (deploymentStatus === 'succeeded') return 'py-1 px-3 rounded-xl text-xs font-semibold bg-success/10 text-success'
    if (deploymentStatus === 'failed') return 'py-1 px-3 rounded-xl text-xs font-semibold bg-error/10 text-error'
    return 'py-1 px-3 rounded-xl text-xs font-semibold bg-warning/10 text-warning'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('pt-BR')
  }

  const getApprovedBy = (env: ReleaseEnvironment): string | null => {
    // Check pre-deploy approvals first
    const preApproval = env.preDeployApprovals?.find(
      (a) => a.status === 'approved' && a.approvedBy
    )
    if (preApproval?.approvedBy) {
      return preApproval.approvedBy.displayName
    }

    // Check post-deploy approvals
    const postApproval = env.postDeployApprovals?.find(
      (a) => a.status === 'approved' && a.approvedBy
    )
    if (postApproval?.approvedBy) {
      return postApproval.approvedBy.displayName
    }

    return null
  }

  const getPendingApproval = (env: ReleaseEnvironment): ReleaseApproval | null => {
    // Check pre-deploy approvals first
    const preApproval = env.preDeployApprovals?.find(
      (a) => a.status === 'pending'
    )
    if (preApproval) {
      return preApproval
    }

    // Check post-deploy approvals
    const postApproval = env.postDeployApprovals?.find(
      (a) => a.status === 'pending'
    )
    if (postApproval) {
      return postApproval
    }

    return null
  }

  const handleApproveRelease = async (release: Release, approvalId: number, project: string) => {
    try {
      const response = await apiFetch('ci/releases/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          integrationName: release.integration,
          project: project,
          approvalId: approvalId,
          comments: 'Approved via PlatifyX',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to approve release')
      }

      // Refresh releases list
      fetchReleases()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve release')
    }
  }

  const handleRejectRelease = async (release: Release, approvalId: number, project: string) => {
    try {
      const response = await apiFetch('ci/releases/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          integrationName: release.integration,
          project: project,
          approvalId: approvalId,
          comments: 'Rejected via PlatifyX',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to reject release')
      }

      // Refresh releases list
      fetchReleases()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject release')
    }
  }

  if (loading) {
    return <div className="text-center py-16 px-5 text-text-secondary text-base">Carregando releases...</div>
  }

  if (error) {
    return <div className="text-center py-10 px-5 text-error bg-error/10 border border-error rounded-xl">Erro: {error}</div>
  }

  if (releases.length === 0) {
    return (
      <div className="text-center py-20 px-5 text-text-secondary">
        <Rocket size={48} className="mb-4 opacity-50" />
        <p>Nenhuma release encontrada</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {releases.map((release) => (
        <div key={release.id} className="bg-surface border border-border rounded-xl p-5 transition-all duration-200 hover:border-primary/50 hover:shadow-[0_4px_12px_rgba(99,102,241,0.15)]">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-3 text-base font-semibold text-text">
              <Rocket size={18} className="text-primary" />
              <span>{release.name}</span>
            </div>
            <span className="py-1 px-3 rounded-xl text-xs font-semibold bg-surface-light text-text-secondary">{release.status}</span>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <span className="font-semibold text-text-secondary">Definition:</span>
              <span>{release.releaseDefinition.name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <span className="font-semibold text-text-secondary">Integração:</span>
              <span>{release.integration || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <span className="font-semibold text-text-secondary">Created:</span>
              <span>{formatDate(release.createdOn)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <span className="font-semibold text-text-secondary">Created By:</span>
              <span>{release.createdBy?.displayName || 'N/A'}</span>
            </div>

            {release.environments && release.environments.length > 0 && (
              <div className="mt-3">
                <span className="font-semibold text-text-secondary text-sm mb-2 block">Environments:</span>
                <div className="flex flex-col gap-2">
                  {release.environments.map((env) => {
                    const approvedBy = getApprovedBy(env)
                    const pendingApproval = getPendingApproval(env)
                    return (
                      <div key={env.id} className="flex items-center gap-2 p-2 bg-surface-light rounded-lg border border-border">
                        {getEnvironmentIcon(env.deploymentStatus)}
                        <span className="text-sm text-text">{env.name}</span>
                        <span className={getEnvironmentBadge(env.deploymentStatus)}>
                          {env.deploymentStatus || env.status}
                        </span>
                        {approvedBy && (
                          <span className="flex items-center gap-1 text-xs text-success ml-auto">
                            <UserCheck size={14} />
                            <span>{approvedBy}</span>
                          </span>
                        )}
                        {pendingApproval && (
                          <div className="flex gap-1 ml-auto">
                            <button
                              className="p-1.5 rounded-lg bg-success/10 text-success hover:bg-success/20 border-none cursor-pointer transition-colors"
                              onClick={() => handleApproveRelease(release, pendingApproval.id, '')}
                              title="Aprovar"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              className="p-1.5 rounded-lg bg-error/10 text-error hover:bg-error/20 border-none cursor-pointer transition-colors"
                              onClick={() => handleRejectRelease(release, pendingApproval.id, '')}
                              title="Rejeitar"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export default ReleasesTab
