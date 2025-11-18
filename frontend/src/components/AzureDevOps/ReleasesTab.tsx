import { useState, useEffect } from 'react'
import { Rocket, CheckCircle, XCircle, Clock, UserCheck } from 'lucide-react'
import styles from './AzureDevOpsTabs.module.css'

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

function ReleasesTab() {
  const [releases, setReleases] = useState<Release[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchReleases()
  }, [])

  const fetchReleases = async () => {
    try {
      const response = await fetch('http://localhost:8060/api/v1/ci/releases?limit=50')
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
    if (deploymentStatus === 'succeeded') return <CheckCircle size={16} className={styles.iconSuccess} />
    if (deploymentStatus === 'failed') return <XCircle size={16} className={styles.iconError} />
    return <Clock size={16} className={styles.iconWarning} />
  }

  const getEnvironmentBadge = (deploymentStatus: string) => {
    if (deploymentStatus === 'succeeded') return styles.badgeSuccess
    if (deploymentStatus === 'failed') return styles.badgeError
    return styles.badgeWarning
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

  if (loading) {
    return <div className={styles.loading}>Carregando releases...</div>
  }

  if (error) {
    return <div className={styles.error}>Erro: {error}</div>
  }

  if (releases.length === 0) {
    return (
      <div className={styles.empty}>
        <Rocket size={48} />
        <p>Nenhuma release encontrada</p>
      </div>
    )
  }

  return (
    <div className={styles.list}>
      {releases.map((release) => (
        <div key={release.id} className={styles.listItem}>
          <div className={styles.listItemHeader}>
            <div className={styles.listItemTitle}>
              <Rocket size={18} className={styles.iconPrimary} />
              <span>{release.name}</span>
            </div>
            <span className={styles.badgeDefault}>{release.status}</span>
          </div>

          <div className={styles.listItemContent}>
            <div className={styles.listItemRow}>
              <span className={styles.label}>Definition:</span>
              <span>{release.releaseDefinition.name}</span>
            </div>
            <div className={styles.listItemRow}>
              <span className={styles.label}>Integração:</span>
              <span>{release.integration || 'N/A'}</span>
            </div>
            <div className={styles.listItemRow}>
              <span className={styles.label}>Created:</span>
              <span>{formatDate(release.createdOn)}</span>
            </div>
            <div className={styles.listItemRow}>
              <span className={styles.label}>Created By:</span>
              <span>{release.createdBy?.displayName || 'N/A'}</span>
            </div>

            {release.environments && release.environments.length > 0 && (
              <div className={styles.environments}>
                <span className={styles.label}>Environments:</span>
                <div className={styles.environmentsList}>
                  {release.environments.map((env) => {
                    const approvedBy = getApprovedBy(env)
                    return (
                      <div key={env.id} className={styles.environment}>
                        {getEnvironmentIcon(env.deploymentStatus)}
                        <span>{env.name}</span>
                        <span className={`${styles.badge} ${getEnvironmentBadge(env.deploymentStatus)}`}>
                          {env.deploymentStatus || env.status}
                        </span>
                        {approvedBy && (
                          <span className={styles.approver}>
                            <UserCheck size={14} />
                            <span>{approvedBy}</span>
                          </span>
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
