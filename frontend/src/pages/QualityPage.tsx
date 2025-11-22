import { useState, useEffect } from 'react'
import { Shield, AlertCircle, RefreshCw } from 'lucide-react'
import QualityStatsCard from '../components/Quality/QualityStatsCard'
import ProjectsTab from '../components/Quality/ProjectsTab'
import IssuesTab from '../components/Quality/IssuesTab'
import QualityFilters, { QualityFilterValues } from '../components/Quality/QualityFilters'
import IntegrationSelector from '../components/Common/IntegrationSelector'
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
      if (!response.ok) {
        // 404 = sem integração configurada
        if (response.status === 404) {
          setStats(null)
          setError(null)
        } else {
          // Outros erros (503, 500, etc.) = problema no serviço
          setError(`Erro ao buscar estatísticas (${response.status})`)
          setStats(null)
        }
        setLoading(false)
        return
      }
      const data = await response.json()
      setStats(data)
      setError(null)
    } catch (err: any) {
      // Erro de rede ou outros erros
      setError(`Erro de conexão: ${err.message || 'Não foi possível conectar ao backend'}`)
      setStats(null)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (newFilters: QualityFilterValues) => {
    setFilters(newFilters)
  }

  const handleIntegrationChange = (integration: string) => {
    handleFilterChange({
      ...filters,
      integration
    })
  }

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <Shield size={32} className="text-primary" />
          <div>
            <h1 className="text-[32px] font-bold text-text mb-1">Qualidade de Código</h1>
            <p className="text-base text-text-secondary">Análise estática, bugs e vulnerabilidades</p>
          </div>
        </div>
      </div>

      <IntegrationSelector
        integrationType="sonarqube"
        selectedIntegration={filters.integration}
        onIntegrationChange={handleIntegrationChange}
      />

      {!loading && stats && !error && (
        <QualityStatsCard stats={stats} />
      )}

      {!loading && error && (
        <div className="text-center py-20 px-5 flex flex-col items-center justify-center">
          <AlertCircle size={64} className="text-error mb-4" style={{ opacity: 0.7 }} />
          <h2 className="text-2xl font-semibold text-text mb-2">Erro ao carregar dados</h2>
          <p className="text-base text-text-secondary max-w-[500px] mb-4">{error}</p>
          <button
            className="flex items-center gap-2 py-2 px-4 bg-primary text-white border-none rounded-lg text-sm font-semibold cursor-pointer transition-all hover:bg-primary-dark"
            onClick={fetchStats}
          >
            <RefreshCw size={16} />
            Tentar novamente
          </button>
        </div>
      )}

      {!loading && !error && !stats && (
        <div className="text-center py-20 px-5 flex flex-col items-center justify-center">
          <Shield size={64} style={{ opacity: 0.3, marginBottom: '1rem' }} />
          <h2 className="text-2xl font-semibold text-text mb-2">Nenhuma integração</h2>
          <p className="text-base text-text-secondary max-w-[500px]">Configure uma integração do SonarQube para visualizar métricas de qualidade de código</p>
        </div>
      )}

      <QualityFilters onFilterChange={handleFilterChange} initialFilters={filters} />

      <div className="flex gap-2 border-b-2 border-border mb-6">
        <button
          className={`bg-transparent border-none py-3 px-6 text-[15px] font-semibold text-text-secondary cursor-pointer relative transition-all duration-200 hover:text-text ${
            activeTab === 'projects' ? 'text-primary after:content-[""] after:absolute after:-bottom-0.5 after:left-0 after:right-0 after:h-0.5 after:bg-primary' : ''
          }`}
          onClick={() => setActiveTab('projects')}
        >
          Projetos
        </button>
        <button
          className={`bg-transparent border-none py-3 px-6 text-[15px] font-semibold text-text-secondary cursor-pointer relative transition-all duration-200 hover:text-text ${
            activeTab === 'issues' ? 'text-primary after:content-[""] after:absolute after:-bottom-0.5 after:left-0 after:right-0 after:h-0.5 after:bg-primary' : ''
          }`}
          onClick={() => setActiveTab('issues')}
        >
          Issues
        </button>
      </div>

      <div className="min-h-[400px]">
        {activeTab === 'projects' && <ProjectsTab filters={filters} />}
        {activeTab === 'issues' && <IssuesTab filters={filters} />}
      </div>
    </div>
  )
}

export default QualityPage
