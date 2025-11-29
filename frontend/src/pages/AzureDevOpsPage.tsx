import { useState, useEffect } from 'react'
import { GitBranch, Layers } from 'lucide-react'
import StatsCard from '../components/AzureDevOps/StatsCard'
import PipelinesTab from '../components/AzureDevOps/PipelinesTab'
import BuildsTab from '../components/AzureDevOps/BuildsTab'
import ReleasesTab from '../components/AzureDevOps/ReleasesTab'
import CIFilters, { FilterValues } from '../components/AzureDevOps/CIFilters'
import EmptyIntegrationState from '../components/Common/EmptyIntegrationState'
import { apiFetch } from '../config/api'

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

      const response = await apiFetch(`ci/stats?${params.toString()}`)
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
    <div className="max-w-[1400px] mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <GitBranch size={32} className="text-primary" />
          <div>
            <h1 className="text-[32px] font-bold text-text mb-1">CI</h1>
            <p className="text-base text-text-secondary">Pipelines, Builds e Releases</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 py-4 px-5 bg-surface border border-border rounded-lg mb-6">
        <div className="flex items-center gap-2 text-sm font-semibold text-text">
          <Layers size={18} />
          <span>Tipo de Integração:</span>
        </div>
        <select
          className="flex-1 max-w-[300px] py-2.5 px-3 border border-border rounded-md bg-background text-text text-sm font-medium cursor-pointer transition-all duration-200 focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)] hover:border-primary"
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
        <EmptyIntegrationState
          title="Nenhum item encontrado"
          description="Configure uma integração de CI/CD para visualizar pipelines e builds"
          integrations={['Azure DevOps', 'GitHub Actions', 'Jenkins']}
          icon={<GitBranch size={64} className="text-gray-500" />}
        />
      )}

      <CIFilters onFilterChange={handleFilterChange} initialFilters={filters} />

      <div className="flex gap-2 border-b-2 border-border mb-6">
        <button
          className={`bg-transparent border-none py-3 px-6 text-[15px] font-semibold text-text-secondary cursor-pointer relative transition-all duration-200 hover:text-text ${
            activeTab === 'pipelines' ? 'text-primary after:content-[""] after:absolute after:-bottom-0.5 after:left-0 after:right-0 after:h-0.5 after:bg-primary' : ''
          }`}
          onClick={() => setActiveTab('pipelines')}
        >
          Pipelines
        </button>
        <button
          className={`bg-transparent border-none py-3 px-6 text-[15px] font-semibold text-text-secondary cursor-pointer relative transition-all duration-200 hover:text-text ${
            activeTab === 'builds' ? 'text-primary after:content-[""] after:absolute after:-bottom-0.5 after:left-0 after:right-0 after:h-0.5 after:bg-primary' : ''
          }`}
          onClick={() => setActiveTab('builds')}
        >
          Builds
        </button>
        <button
          className={`bg-transparent border-none py-3 px-6 text-[15px] font-semibold text-text-secondary cursor-pointer relative transition-all duration-200 hover:text-text ${
            activeTab === 'releases' ? 'text-primary after:content-[""] after:absolute after:-bottom-0.5 after:left-0 after:right-0 after:h-0.5 after:bg-primary' : ''
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
