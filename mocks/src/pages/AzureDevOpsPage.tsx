import { useState, useEffect } from 'react'
import { GitBranch, Layers } from 'lucide-react'
import StatsCard from '../components/AzureDevOps/StatsCard'
import PipelinesTab from '../components/AzureDevOps/PipelinesTab'
import BuildsTab from '../components/AzureDevOps/BuildsTab'
import ReleasesTab from '../components/AzureDevOps/ReleasesTab'
import CIFilters, { FilterValues } from '../components/AzureDevOps/CIFilters'
import { getMockCIStats } from '../mocks/data/ci'

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
      const data = await getMockCIStats()
      setStats(data)
      setError(null)
    } catch (err) {
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
    <div className="max-w-[1600px] mx-auto px-6 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center shadow-lg">
            <GitBranch size={32} className="text-primary" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-text mb-1">CI/CD</h1>
            <p className="text-lg text-text-secondary">Pipelines, Builds e Releases</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 py-4 px-6 bg-surface border-2 border-border rounded-xl mb-8 shadow-md">
        <div className="flex items-center gap-3 text-sm font-semibold text-text">
          <Layers size={20} className="text-primary" />
          <span>Tipo de Integração:</span>
        </div>
        <select
          className="flex-1 max-w-[300px] py-2.5 px-4 border-2 border-border rounded-xl bg-background text-text text-sm font-medium cursor-pointer transition-all duration-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 hover:border-primary"
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
        <div className="text-center py-20 px-5 flex flex-col items-center justify-center">
          <GitBranch size={64} style={{ opacity: 0.3, marginBottom: '1rem' }} />
          <h2 className="text-2xl font-semibold text-text mb-2">Nenhuma integração</h2>
          <p className="text-base text-text-secondary max-w-[500px]">Configure uma integração de CI/CD (Azure DevOps, GitHub Actions, Jenkins) para visualizar pipelines e builds</p>
        </div>
      )}

      <CIFilters onFilterChange={handleFilterChange} initialFilters={filters} />

      <div className="flex gap-2 border-b-2 border-border mb-8 pb-2">
        <button
          className={`bg-transparent border-none py-4 px-8 text-base font-semibold cursor-pointer relative transition-all duration-200 ${
            activeTab === 'pipelines' 
              ? 'text-primary after:content-[""] after:absolute after:-bottom-0.5 after:left-0 after:right-0 after:h-0.5 after:bg-primary' 
              : 'text-text-secondary hover:text-text'
          }`}
          onClick={() => setActiveTab('pipelines')}
        >
          Pipelines
        </button>
        <button
          className={`bg-transparent border-none py-4 px-8 text-base font-semibold cursor-pointer relative transition-all duration-200 ${
            activeTab === 'builds' 
              ? 'text-primary after:content-[""] after:absolute after:-bottom-0.5 after:left-0 after:right-0 after:h-0.5 after:bg-primary' 
              : 'text-text-secondary hover:text-text'
          }`}
          onClick={() => setActiveTab('builds')}
        >
          Builds
        </button>
        <button
          className={`bg-transparent border-none py-4 px-8 text-base font-semibold cursor-pointer relative transition-all duration-200 ${
            activeTab === 'releases' 
              ? 'text-primary after:content-[""] after:absolute after:-bottom-0.5 after:left-0 after:right-0 after:h-0.5 after:bg-primary' 
              : 'text-text-secondary hover:text-text'
          }`}
          onClick={() => setActiveTab('releases')}
        >
          Releases
        </button>
      </div>

      <div className="min-h-[400px]">
        {activeTab === 'pipelines' && <PipelinesTab filters={filters} />}
        {activeTab === 'builds' && <BuildsTab filters={filters} />}
        {activeTab === 'releases' && <ReleasesTab filters={filters} />}
      </div>
    </div>
  )
}

export default AzureDevOpsPage
