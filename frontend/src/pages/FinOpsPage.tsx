import { useState, useEffect } from 'react'
import { DollarSign, TrendingUp, TrendingDown, Server, Activity, Package, Filter } from 'lucide-react'
import { buildApiUrl } from '../config/api'

interface FinOpsStats {
  totalCost: number
  monthlyCost: number
  dailyCost: number
  costTrend: number
  totalResources: number
  activeResources: number
  inactiveResources: number
  costByProvider: { [key: string]: number }
  costByService: { [key: string]: number }
  currency: string
}

interface CloudResource {
  provider: string
  integration: string
  resourceId: string
  resourceName: string
  resourceType: string
  resourceGroup?: string
  region: string
  status: string
  cost?: number
  tags?: { [key: string]: string }
}

type TabType = 'overview' | 'resources' | 'costs'

function FinOpsPage() {
  const [stats, setStats] = useState<FinOpsStats | null>(null)
  const [resources, setResources] = useState<CloudResource[]>([])
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [providerFilter, setProviderFilter] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
    fetchResources()
  }, [providerFilter])

  const fetchStats = async () => {
    try {
      const queryParams = new URLSearchParams()
      if (providerFilter) queryParams.append('provider', providerFilter)

      console.log('Fetching stats from:', buildApiUrl(`finops/stats?${queryParams}`))
      const response = await fetch(buildApiUrl(`finops/stats?${queryParams}`))

      if (!response.ok) {
        console.error('Stats response not OK:', response.status, response.statusText)
        const errorText = await response.text()
        console.error('Error response:', errorText)
        return
      }

      const data = await response.json()
      console.log('Stats data:', data)
      setStats(data)
    } catch (error) {
      console.error('Error fetching FinOps stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchResources = async () => {
    try {
      const queryParams = new URLSearchParams()
      if (providerFilter) queryParams.append('provider', providerFilter)

      console.log('Fetching resources from:', buildApiUrl(`finops/resources?${queryParams}`))
      const response = await fetch(buildApiUrl(`finops/resources?${queryParams}`))

      if (!response.ok) {
        console.error('Resources response not OK:', response.status, response.statusText)
        return
      }

      const data = await response.json()
      console.log('Resources data:', data)
      setResources(data || [])
    } catch (error) {
      console.error('Error fetching resources:', error)
    }
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: stats?.currency || 'USD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const getStatusColor = (status: string): string => {
    const lowerStatus = status.toLowerCase()
    if (lowerStatus.includes('running') || lowerStatus.includes('active') || lowerStatus.includes('available')) {
      return 'bg-green-500/20 text-green-400'
    }
    return 'bg-gray-500/20 text-gray-400'
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-gray-400">Loading...</div>
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">FinOps</h1>
            <p className="text-gray-400 text-sm mt-1">Gestão de custos e otimização de recursos cloud</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-[#1E1E1E] border border-gray-700 rounded-lg px-3 py-2">
            <Filter size={18} className="text-gray-400" />
            <select
              className="bg-transparent text-gray-300 outline-none cursor-pointer"
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value)}
            >
              <option value="">Todos os Provedores</option>
              <option value="azure">Azure</option>
              <option value="gcp">GCP</option>
              <option value="aws">AWS</option>
            </select>
          </div>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-[#1E1E1E] border border-gray-700 rounded-lg p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <DollarSign size={24} className="text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-gray-400">Custo Mensal</div>
              <div className="text-2xl font-bold truncate">{formatCurrency(stats.monthlyCost)}</div>
            </div>
          </div>
          <div className="bg-[#1E1E1E] border border-gray-700 rounded-lg p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Activity size={24} className="text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-gray-400">Custo Diário</div>
              <div className="text-2xl font-bold truncate">{formatCurrency(stats.dailyCost)}</div>
            </div>
          </div>
          <div className="bg-[#1E1E1E] border border-gray-700 rounded-lg p-4 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${stats.costTrend >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
              {stats.costTrend >= 0 ? (
                <TrendingUp size={24} className="text-green-400" />
              ) : (
                <TrendingDown size={24} className="text-red-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-gray-400">Tendência</div>
              <div className={`text-2xl font-bold truncate ${stats.costTrend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {stats.costTrend >= 0 ? '+' : ''}{stats.costTrend.toFixed(1)}%
              </div>
            </div>
          </div>
          <div className="bg-[#1E1E1E] border border-gray-700 rounded-lg p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Package size={24} className="text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-gray-400">Total de Recursos</div>
              <div className="text-2xl font-bold truncate">{stats.totalResources}</div>
            </div>
          </div>
          <div className="bg-[#1E1E1E] border border-gray-700 rounded-lg p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Server size={24} className="text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-gray-400">Recursos Ativos</div>
              <div className="text-2xl font-bold truncate">{stats.activeResources}</div>
            </div>
          </div>
          <div className="bg-[#1E1E1E] border border-gray-700 rounded-lg p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Server size={24} className="text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-gray-400">Recursos Inativos</div>
              <div className="text-2xl font-bold truncate">{stats.inactiveResources}</div>
            </div>
          </div>
        </div>
      )}

      <div className="border-b border-gray-700 mb-6">
        <nav className="flex space-x-8">
          <button
            className={`py-4 px-2 border-b-2 transition-all ${
              activeTab === 'overview'
                ? 'border-[#1B998B] text-[#1B998B]'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
            }`}
            onClick={() => setActiveTab('overview')}
          >
            Visão Geral
          </button>
          <button
            className={`py-4 px-2 border-b-2 transition-all ${
              activeTab === 'resources'
                ? 'border-[#1B998B] text-[#1B998B]'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
            }`}
            onClick={() => setActiveTab('resources')}
          >
            Recursos ({resources.length})
          </button>
        </nav>
      </div>

      <div>
        {activeTab === 'overview' && stats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#1E1E1E] border border-gray-700 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4">Custo por Provedor</h3>
              <div className="space-y-3">
                {Object.entries(stats.costByProvider).map(([provider, cost]) => (
                  <div key={provider} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0">
                    <span className="text-gray-300 font-medium">{provider.toUpperCase()}</span>
                    <span className="text-lg font-bold text-green-400">{formatCurrency(cost)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-[#1E1E1E] border border-gray-700 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4">Top Serviços por Custo</h3>
              <div className="space-y-3">
                {Object.entries(stats.costByService)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 5)
                  .map(([service, cost]) => (
                    <div key={service} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0">
                      <span className="text-gray-300 font-medium truncate mr-4">{service}</span>
                      <span className="text-lg font-bold text-blue-400 flex-shrink-0">{formatCurrency(cost)}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'resources' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {resources.map((resource, index) => (
              <div key={index} className="bg-[#1E1E1E] border border-gray-700 rounded-lg p-4">
                <div className="flex items-start justify-between mb-4">
                  <h4 className="text-lg font-bold truncate mr-2">{resource.resourceName}</h4>
                  <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${getStatusColor(resource.status)}`}>
                    {resource.status}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Provedor:</span>
                    <span className="text-gray-200 font-medium">{resource.provider.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Tipo:</span>
                    <span className="text-gray-200 font-medium truncate ml-2">{resource.resourceType}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Região:</span>
                    <span className="text-gray-200 font-medium">{resource.region}</span>
                  </div>
                  {resource.cost && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Custo:</span>
                      <span className="text-green-400 font-bold">{formatCurrency(resource.cost)}</span>
                    </div>
                  )}
                  {resource.tags && Object.keys(resource.tags).length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-700">
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(resource.tags).map(([key, value]) => (
                          <span key={key} className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300">
                            {key}: {value}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default FinOpsPage
