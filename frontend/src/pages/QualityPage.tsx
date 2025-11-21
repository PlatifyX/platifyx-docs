import { useState, useEffect } from 'react'
import { Shield } from 'lucide-react'
import QualityStatsCard from '../components/Quality/QualityStatsCard'
import ProjectsTab from '../components/Quality/ProjectsTab'
import IssuesTab from '../components/Quality/IssuesTab'
import QualityFilters, { QualityFilterValues } from '../components/Quality/QualityFilters'
import PageContainer from '../components/Layout/PageContainer'
import PageHeader from '../components/Layout/PageHeader'
import Section from '../components/Layout/Section'
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
      setStats(data.data)
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
    <PageContainer maxWidth="xl">
      <PageHeader
        icon={Shield}
        title="Qualidade de Código"
        subtitle="Análise estática, bugs e vulnerabilidades"
      />

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

      <Section spacing="lg">
        {activeTab === 'projects' && <ProjectsTab filters={filters} />}
        {activeTab === 'issues' && <IssuesTab filters={filters} />}
      </Section>
    </PageContainer>
  )
}

export default QualityPage
