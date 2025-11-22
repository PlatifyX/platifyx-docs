import { useState, useEffect } from 'react'
import { GitBranch, Layers } from 'lucide-react'
import StatsCard from '../components/AzureDevOps/StatsCard'
import PipelinesTab from '../components/AzureDevOps/PipelinesTab'
import BuildsTab from '../components/AzureDevOps/BuildsTab'
import ReleasesTab from '../components/AzureDevOps/ReleasesTab'
import CIFilters, { FilterValues } from '../components/AzureDevOps/CIFilters'
import styles from './AzureDevOpsPage.module.css'
import { buildApiUrl } from '../config/api'

type TabType = 'pipelines' | 'builds' | 'releases'
type IntegrationType = 'all' | 'azuredevops' | 'github' | 'jenkins'

function AzureDevOpsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('pipelines')
  const [integrationType, setIntegrationType] = useState<IntegrationType>('azuredevops')
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<FilterValues>({
    integration: '',
    startDate: '',
    endDate: '',
    project: '',
  })

  // Read URL parameters on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const repo = params.get('repo')

    if (repo) {
      setFilters(prev => ({
        ...prev,
        project: repo
      }))
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [filters])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.integration) params.append('integration', filters.integration)
      if (filters.project) params.append('project', filters.project)
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)

      const response = await fetch(buildApiUrl(`ci/stats?${params.toString()}`))
      if (!response.ok) {
        // Se não houver integração, não mostra como erro
        setStats(null)
        setError(null)
        setLoading(false)
        return
      }
      const data = await response.json()
      setStats(data)
      setError(null)
    } catch (err) {
      // Em caso de erro de rede ou outros, também trata como sem integração
      setStats(null)
      setError(null)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (newFilters: FilterValues) => {
    setFilters(newFilters)
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <GitBranch size={32} className={styles.headerIcon} />
          <div>
            <h1 className={styles.title}>CI</h1>
            <p className={styles.subtitle}>Pipelines, Builds e Releases</p>
          </div>
        </div>
      </div>

      <div className={styles.integrationSelector}>
        <div className={styles.selectorLabel}>
          <Layers size={18} />
          <span>Tipo de Integração:</span>
        </div>
        <select
          className={styles.selectorDropdown}
          value={integrationType}
          onChange={(e) => setIntegrationType(e.target.value as IntegrationType)}
        >
          <option value="azuredevops">Azure DevOps</option>
          <option value="github" disabled>GitHub Actions (Em breve)</option>
          <option value="jenkins" disabled>Jenkins (Em breve)</option>
          <option value="all">Todas as Integrações</option>
        </select>
      </div>

      {!loading && stats && !error && (
        <StatsCard stats={stats} />
      )}

      {!loading && !stats && !error && (
        <div className={styles.emptyState}>
          <GitBranch size={64} style={{ opacity: 0.3, marginBottom: '1rem' }} />
          <h2>Nenhuma integração</h2>
          <p>Configure uma integração de CI/CD (Azure DevOps, GitHub Actions, Jenkins) para visualizar pipelines e builds</p>
        </div>
      )}

      <CIFilters onFilterChange={handleFilterChange} initialFilters={filters} />

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'pipelines' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('pipelines')}
        >
          Pipelines
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'builds' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('builds')}
        >
          Builds
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'releases' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('releases')}
        >
          Releases
        </button>
      </div>

      <div className={styles.tabContent}>
        {activeTab === 'pipelines' && <PipelinesTab filters={filters} />}
        {activeTab === 'builds' && <BuildsTab filters={filters} />}
        {activeTab === 'releases' && <ReleasesTab filters={filters} />}
      </div>
    </div>
  )
}

export default AzureDevOpsPage
