import { useState, useEffect } from 'react'
import { DollarSign, Package, Filter, AlertTriangle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import IntegrationSelector from '../components/Common/IntegrationSelector'
import {
  getMockFinOpsStats,
  getMockServiceCosts,
  getMockMonthlyCosts,
  getMockForecast,
  getMockReservationUtilization,
  getMockSavingsPlansUtilization
} from '../mocks/data/finops'

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

interface ServiceCost {
  service: string
  cost: number
}

interface MonthlyCost {
  month: string
  cost: number
}

type TabType = 'overview' | 'trends' | 'services' | 'optimization'

function FinOpsPage() {
  const [stats, setStats] = useState<FinOpsStats | null>(null)
  const [serviceCosts, setServiceCosts] = useState<ServiceCost[]>([])
  const [monthlyCosts, setMonthlyCosts] = useState<MonthlyCost[]>([])
  const [forecast, setForecast] = useState<any[]>([])
  const [reservationUtilization, setReservationUtilization] = useState<any>(null)
  const [savingsPlansUtilization, setSavingsPlansUtilization] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [providerFilter, setProviderFilter] = useState('')
  const [selectedIntegration, setSelectedIntegration] = useState<string>('')
  const [monthsToShow, setMonthsToShow] = useState(12)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
    fetchMonthlyCosts()
    fetchForecast()
    if (activeTab === 'services') {
      fetchServiceCosts()
    }
    if (activeTab === 'optimization') {
      fetchOptimizationData()
    }
  }, [providerFilter, selectedIntegration, activeTab, monthsToShow])

  const fetchStats = async () => {
    try {
      setLoading(true)
      // Usando dados mockados
      const data = await getMockFinOpsStats()
      setStats(data)
    } catch (error) {
      console.error('Error fetching FinOps stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchServiceCosts = async () => {
    try {
      // Usando dados mockados
      const data = await getMockServiceCosts()
      setServiceCosts(data)
    } catch (error) {
      console.error('Error fetching service costs:', error)
    }
  }

  const fetchMonthlyCosts = async () => {
    try {
      // Usando dados mockados
      const data = await getMockMonthlyCosts()
      setMonthlyCosts(data)
    } catch (error) {
      console.error('Error fetching monthly costs:', error)
    }
  }

  const fetchForecast = async () => {
    try {
      // Usando dados mockados
      const data = await getMockForecast()
      setForecast(data)
    } catch (error) {
      console.error('Error fetching forecast:', error)
    }
  }

  const fetchOptimizationData = async () => {
    try {
      // Usando dados mockados
      const [reservationData, savingsPlansData] = await Promise.all([
        getMockReservationUtilization(),
        getMockSavingsPlansUtilization()
      ])

      setReservationUtilization(reservationData)
      setSavingsPlansUtilization(savingsPlansData)
    } catch (error) {
      console.error('Error fetching optimization data:', error)
    }
  }

  const formatMonth = (dateStr: string) => {
    if (!dateStr) return ''
    // Se já estiver no formato "Mês/Ano", retorna direto
    if (dateStr.includes('/')) return dateStr

    try {
      const parts = dateStr.split('-')
      if (parts.length >= 2) {
        const year = parseInt(parts[0])
        const month = parseInt(parts[1]) - 1
        const date = new Date(year, month, 1)
        return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
      }
      return dateStr
    } catch (e) {
      return dateStr
    }
  }

  const calculateTrends = () => {
    if (monthlyCosts.length < 2) return null

    const sorted = [...monthlyCosts]
    const lastMonthData = sorted[sorted.length - 1]
    const lastMonth = lastMonthData?.cost || 0
    const prevMonth = sorted[sorted.length - 2]?.cost || 0

    const momChange = prevMonth > 0 ? ((lastMonth - prevMonth) / prevMonth) * 100 : 0

    return {
      momChange,
      lastMonth,
      prevMonth
    }
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: stats?.currency || 'USD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <p className="mt-4 text-gray-400">Carregando dados de FinOps...</p>
        </div>
      </div>
    )
  }

  const trends = calculateTrends()

  return (
    <div className="p-4 md:p-6">
      <div className="mb-8">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">FinOps</h1>
            <p className="text-gray-400 text-sm mt-1">Gestão de custos e otimização de recursos cloud</p>
          </div>
        </div>
      </div>

      <IntegrationSelector
        integrationType="aws"
        selectedIntegration={selectedIntegration}
        onIntegrationChange={setSelectedIntegration}
      />

      <div className="mb-6 flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2 bg-[#1E1E1E] border border-gray-700 rounded-lg px-3 py-2">
          <Filter size={18} className="text-gray-400" />
          <select
            className="bg-transparent text-gray-300 outline-none cursor-pointer"
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value)}
          >
            <option value="">Todos os Provedores</option>
            <option value="aws">AWS</option>
            <option value="azure">Azure</option>
            <option value="gcp">GCP</option>
          </select>
        </div>
        {activeTab === 'services' && (
          <div className="flex items-center gap-2 bg-[#1E1E1E] border border-gray-700 rounded-lg px-3 py-2">
            <span className="text-gray-400 text-sm">Período:</span>
            <select
              className="bg-transparent text-gray-300 outline-none cursor-pointer"
              value={monthsToShow}
              onChange={(e) => setMonthsToShow(parseInt(e.target.value))}
            >
              <option value={1}>Mês atual</option>
              <option value={3}>3 meses</option>
              <option value={6}>6 meses</option>
              <option value={12}>12 meses</option>
            </select>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b border-gray-700">
        {[
          { id: 'overview', label: 'Visão Geral' },
          { id: 'trends', label: 'Tendências' },
          { id: 'services', label: 'Serviços' },
          { id: 'optimization', label: 'Otimização' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-green-400 border-b-2 border-green-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-6">
          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#1E1E1E] border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Custo Total (Mês)</span>
                <DollarSign className="text-green-400" size={20} />
              </div>
              <p className="text-3xl font-bold text-white">{formatCurrency(stats.monthlyCost)}</p>
              {trends && (
                <p className={`text-sm mt-2 ${trends.momChange < 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {trends.momChange < 0 ? '↓' : '↑'} {Math.abs(trends.momChange).toFixed(1)}% vs mês anterior
                </p>
              )}
            </div>

            <div className="bg-[#1E1E1E] border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Custo Diário</span>
                <DollarSign className="text-blue-400" size={20} />
              </div>
              <p className="text-3xl font-bold text-white">{formatCurrency(stats.dailyCost)}</p>
              <p className="text-sm text-gray-500 mt-2">Média do mês atual</p>
            </div>

            <div className="bg-[#1E1E1E] border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Recursos Ativos</span>
                <Package className="text-purple-400" size={20} />
              </div>
              <p className="text-3xl font-bold text-white">{stats.activeResources}</p>
              <p className="text-sm text-gray-500 mt-2">{stats.totalResources} recursos totais</p>
            </div>

            <div className="bg-[#1E1E1E] border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Recursos Inativos</span>
                <AlertTriangle className="text-yellow-400" size={20} />
              </div>
              <p className="text-3xl font-bold text-white">{stats.inactiveResources}</p>
              <p className="text-sm text-gray-500 mt-2">Oportunidade de economia</p>
            </div>
          </div>

          {/* Custo por Provedor */}
          <div className="bg-[#1E1E1E] border border-gray-700 rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4">Custo por Provedor Cloud</h3>
            <div className="space-y-4">
              {Object.entries(stats.costByProvider).map(([provider, cost]) => {
                const percentage = (cost / stats.totalCost) * 100
                return (
                  <div key={provider}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-300 font-medium">{provider}</span>
                      <span className="text-gray-400">{formatCurrency(cost)} ({percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Top 5 Serviços */}
          <div className="bg-[#1E1E1E] border border-gray-700 rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4">Top 5 Serviços por Custo</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={Object.entries(stats.costByService).map(([service, cost]) => ({ service, cost }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="service" stroke="#9CA3AF" />
                <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} stroke="#9CA3AF" />
                <Tooltip
                  formatter={(value: any) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: '#1E1E1E', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#D1D5DB' }}
                />
                <Bar dataKey="cost" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Trends Tab */}
      {activeTab === 'trends' && monthlyCosts.length > 0 && (
        <div className="space-y-6">
          <div className="bg-[#1E1E1E] border border-gray-700 rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4">Histórico de Custos Mensais</h3>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={monthlyCosts.slice(-12)}>
                <defs>
                  <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="month"
                  tickFormatter={formatMonth}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  stroke="#9CA3AF"
                />
                <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} stroke="#9CA3AF" />
                <Tooltip
                  formatter={(value: any) => formatCurrency(value)}
                  labelFormatter={formatMonth}
                  contentStyle={{ backgroundColor: '#1E1E1E', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#D1D5DB' }}
                />
                <Area
                  type="monotone"
                  dataKey="cost"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorCost)"
                  name="Custo"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {forecast && forecast.length > 0 && (
            <div className="bg-[#1E1E1E] border border-gray-700 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4">Previsão de Custos</h3>
              <div className="flex items-center gap-6 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6">
                <AlertTriangle size={48} className="text-yellow-400 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-400 mb-1">Previsão para Próximos Meses</p>
                  <p className="text-3xl font-bold text-yellow-400 mb-1">{formatCurrency(forecast[0]?.forecast || 0)}</p>
                  <p className="text-xs text-gray-500">Baseado no consumo histórico e tendências</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Services Tab */}
      {activeTab === 'services' && serviceCosts.length > 0 && (
        <div className="bg-[#1E1E1E] border border-gray-700 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4">Custos por Serviço</h3>
          <div className="space-y-3">
            {serviceCosts.map((service, index) => {
              const totalCost = serviceCosts.reduce((sum, s) => sum + s.cost, 0)
              const percentage = (service.cost / totalCost) * 100
              return (
                <div key={index} className="flex items-center justify-between p-4 bg-[#0d1321] rounded-lg hover:bg-gray-800 transition-colors">
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-200">{service.service}</span>
                      <span className="text-gray-400">{formatCurrency(service.cost)}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500 mt-1 inline-block">{percentage.toFixed(1)}% do total</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Optimization Tab */}
      {activeTab === 'optimization' && (
        <div className="space-y-6">
          {reservationUtilization && (
            <div className="bg-[#1E1E1E] border border-gray-700 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4">Reserved Instances</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-400 mb-2">Utilização</p>
                  <p className="text-4xl font-bold text-green-400">{reservationUtilization.utilization}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-2">Economia Total</p>
                  <p className="text-4xl font-bold text-green-400">{formatCurrency(reservationUtilization.savings)}</p>
                </div>
              </div>
              {reservationUtilization.recommendations && reservationUtilization.recommendations.length > 0 && (
                <div className="mt-6">
                  <p className="text-sm font-semibold text-gray-300 mb-3">Recomendações:</p>
                  <ul className="space-y-2">
                    {reservationUtilization.recommendations.map((rec: string, index: number) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-gray-400">
                        <span className="text-green-400 mt-0.5">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {savingsPlansUtilization && (
            <div className="bg-[#1E1E1E] border border-gray-700 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4">Savings Plans</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-400 mb-2">Utilização</p>
                  <p className="text-4xl font-bold text-blue-400">{savingsPlansUtilization.utilization}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-2">Cobertura</p>
                  <p className="text-4xl font-bold text-purple-400">{savingsPlansUtilization.coverage}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-2">Economia</p>
                  <p className="text-4xl font-bold text-green-400">{formatCurrency(savingsPlansUtilization.savings)}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default FinOpsPage
