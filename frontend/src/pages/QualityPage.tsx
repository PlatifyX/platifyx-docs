import { useState, useEffect } from 'react'
import { Shield } from 'lucide-react'
import QualityStatsCard from '../components/Quality/QualityStatsCard'
import ProjectsTab from '../components/Quality/ProjectsTab'
import IssuesTab from '../components/Quality/IssuesTab'
import QualityFilters, { QualityFilterValues } from '../components/Quality/QualityFilters'
import styles from './QualityPage.module.css'
import { buildApiUrl } from '../config/api'

type TabType = 'projects' | 'issues'

function QualityPage() {
  const [activeTab, setActiveTab] = useState<TabType>('projects')
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<QualityFilterValues>({
    integration: '',
    project: '',
  })

  // Read URL parameters on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const project = params.get('project')

    if (project) {
      setFilters(prev => ({
        ...prev,
        project: project
      }))
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [filters])

  const fetchStats = async () => {
    try {
      const params = new URLSearchParams()
      if (filters.integration) params.append('integration', filters.integration)
      if (filters.project) params.append('project', filters.project)

      const response = await fetch(buildApiUrl(`quality/stats?${params.toString()}`))
      if (!response.ok) throw new Error('Failed to fetch stats')
      const data = await response.json()
      setStats(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load statistics')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (newFilters: QualityFilterValues) => {
    setFilters(newFilters)
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <Shield size={32} className={styles.headerIcon} />
          <div>
            <h1 className={styles.title}>Qualidade de Código</h1>
            <p className={styles.subtitle}>Análise estática, bugs e vulnerabilidades</p>
          </div>
        </div>
      </div>

      {!loading && stats && !error && (
        <QualityStatsCard stats={stats} />
      )}

      {error && (
        <div className={styles.error}>
          <p>⚠️ {error}</p>
          <p className={styles.errorHint}>
            Verifique se as credenciais do SonarQube estão configuradas no backend
          </p>
        </div>
      )}

      <QualityFilters onFilterChange={handleFilterChange} initialFilters={filters} />

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'projects' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('projects')}
        >
          Projetos
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'issues' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('issues')}
        >
          Issues
        </button>
      </div>

      <div className={styles.tabContent}>
        {activeTab === 'projects' && <ProjectsTab filters={filters} />}
        {activeTab === 'issues' && <IssuesTab filters={filters} />}
      </div>
    </div>
  )
}

export default QualityPage
