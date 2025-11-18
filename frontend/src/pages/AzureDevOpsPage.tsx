import { useState, useEffect } from 'react'
import { GitBranch } from 'lucide-react'
import StatsCard from '../components/AzureDevOps/StatsCard'
import PipelinesTab from '../components/AzureDevOps/PipelinesTab'
import BuildsTab from '../components/AzureDevOps/BuildsTab'
import ReleasesTab from '../components/AzureDevOps/ReleasesTab'
import styles from './AzureDevOpsPage.module.css'

type TabType = 'pipelines' | 'builds' | 'releases'

function AzureDevOpsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('pipelines')
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:8060/api/v1/ci/stats')
      if (!response.ok) throw new Error('Failed to fetch stats')
      const data = await response.json()
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <GitBranch size={32} className={styles.headerIcon} />
          <div>
            <h1 className={styles.title}>Azure DevOps</h1>
            <p className={styles.subtitle}>Pipelines, Builds e Releases</p>
          </div>
        </div>
      </div>

      {!loading && stats && !error && (
        <StatsCard stats={stats} />
      )}

      {error && (
        <div className={styles.error}>
          <p>⚠️ {error}</p>
          <p className={styles.errorHint}>
            Verifique se as credenciais do Azure DevOps estão configuradas no backend
          </p>
        </div>
      )}

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
        {activeTab === 'pipelines' && <PipelinesTab />}
        {activeTab === 'builds' && <BuildsTab />}
        {activeTab === 'releases' && <ReleasesTab />}
      </div>
    </div>
  )
}

export default AzureDevOpsPage
