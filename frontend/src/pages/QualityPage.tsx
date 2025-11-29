import { useState, useEffect } from 'react'
import { Shield, AlertCircle, RefreshCw } from 'lucide-react'
import QualityStatsCard from '../components/Quality/QualityStatsCard'
import ProjectsTab from '../components/Quality/ProjectsTab'
import IssuesTab from '../components/Quality/IssuesTab'
import QualityFilters, { QualityFilterValues } from '../components/Quality/QualityFilters'
import IntegrationSelector from '../components/Common/IntegrationSelector'
import EmptyIntegrationState from '../components/Common/EmptyIntegrationState'
import { apiFetch } from '../config/api'

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
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.integration) params.append('integration', filters.integration)
      if (filters.project) params.append('project', filters.project)

      const response = await apiFetch(`quality/stats?${params.toString()}`)
      if (!response.ok) {
        // 404 ou 503 = sem integração configurada
        if (response.status === 404 || response.status === 503) {
          setStats(null)
          setError(null)
        } else {
          // Outros erros (500, etc.) = problema no serviço
          setError(`Erro ao buscar estatísticas (${response.status})`)
          setStats(null)
        }
        setLoading(false)
        return
      }
      const data = await response.json()
      // Verificar se há dados válidos (pelo menos um projeto)
      if (data && data.totalProjects !== undefined) {
        setStats(data)
        setError(null)
      } else {
        // Dados inválidos ou vazios
        setStats(null)
        setError(null)
      }
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
    <div className="max-w-[1600px] mx-auto px-4">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-blue-500/10 p-3 rounded-lg border border-blue-500/20">
              <Shield size={32} className="text-primary" />
            </div>
            <div>
              <h1 className="text-[32px] font-bold text-text mb-1">Qualidade de Código</h1>
              <p className="text-base text-text-secondary">Análise estática, bugs e vulnerabilidades do SonarQube</p>
            </div>
          </div>
          {!loading && stats && (
            <button
              onClick={fetchStats}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all"
              title="Atualizar dados"
            >
              <RefreshCw size={16} />
              <span className="text-sm">Atualizar</span>
            </button>
          )}
        </div>
      </div>

      <IntegrationSelector
        integrationType="sonarqube"
        selectedIntegration={filters.integration}
        onIntegrationChange={handleIntegrationChange}
      />

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-400">Carregando métricas de qualidade...</p>
          </div>
        </div>
      )}

      {!loading && stats && !error && stats.totalProjects !== undefined && (
        <QualityStatsCard stats={stats} />
      )}

      {!loading && error && (
        <div className="text-center py-20 px-5 flex flex-col items-center justify-center">
          <div className="bg-red-500/10 p-4 rounded-full mb-4">
            <AlertCircle size={64} className="text-red-500" />
          </div>
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

      {!loading && !error && (!stats || stats.totalProjects === undefined) && (
        <EmptyIntegrationState
          title="Nenhum item encontrado"
          description="Configure uma integração do SonarQube para visualizar métricas de qualidade de código"
          integrations={['SonarQube']}
          icon={<Shield size={64} className="text-gray-500" />}
        />
      )}

      {!loading && stats && !error && (
        <>
          <QualityFilters onFilterChange={handleFilterChange} initialFilters={filters} />

          <div className="bg-gray-800/30 rounded-lg border border-gray-700 mb-6">
            <div className="flex gap-2 border-b border-gray-700">
              <button
                className={`bg-transparent border-none py-4 px-6 text-[15px] font-semibold cursor-pointer relative transition-all duration-200 ${
                  activeTab === 'projects'
                    ? 'text-blue-500 bg-gray-800/50 after:content-[""] after:absolute after:-bottom-px after:left-0 after:right-0 after:h-0.5 after:bg-blue-500'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/30'
                }`}
                onClick={() => setActiveTab('projects')}
              >
                📁 Projetos
              </button>
              <button
                className={`bg-transparent border-none py-4 px-6 text-[15px] font-semibold cursor-pointer relative transition-all duration-200 ${
                  activeTab === 'issues'
                    ? 'text-blue-500 bg-gray-800/50 after:content-[""] after:absolute after:-bottom-px after:left-0 after:right-0 after:h-0.5 after:bg-blue-500'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/30'
                }`}
                onClick={() => setActiveTab('issues')}
              >
                🐛 Issues
              </button>
            </div>

            <div className="p-6 min-h-[400px]">
              {activeTab === 'projects' && <ProjectsTab filters={filters} />}
              {activeTab === 'issues' && <IssuesTab filters={filters} />}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default QualityPage
