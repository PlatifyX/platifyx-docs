import { useState, useEffect } from 'react'
import { DollarSign, TrendingUp, TrendingDown, Server, Activity, Package, Filter, AlertTriangle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { buildApiUrl } from '../config/api'
import IntegrationSelector from '../components/Common/IntegrationSelector'

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
      const queryParams = new URLSearchParams()
      if (providerFilter) queryParams.append('provider', providerFilter)
      if (selectedIntegration) queryParams.append('integration', selectedIntegration)

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


  const fetchServiceCosts = async () => {
    try {
      const queryParams = new URLSearchParams()
      queryParams.append('months', monthsToShow.toString())
      if (selectedIntegration) {
        queryParams.append('integration', selectedIntegration)
      }

      const response = await fetch(buildApiUrl(`finops/aws/by-service?${queryParams.toString()}`))
      
      if (!response.ok) {
        console.error('Service costs response not OK:', response.status, response.statusText)
        return
      }

      const data = await response.json()
      const sortedServices = (data || [])
        .map((item: any) => ({
          service: item.service || 'Unknown',
          cost: item.cost || 0
        }))
        .sort((a: ServiceCost, b: ServiceCost) => b.cost - a.cost)
        .slice(0, 10)

      setServiceCosts(sortedServices)
    } catch (error) {
      console.error('Error fetching service costs:', error)
    }
  }

  const fetchMonthlyCosts = async () => {
    try {
      const queryParams = new URLSearchParams()
      if (selectedIntegration) {
        queryParams.append('integration', selectedIntegration)
      }
      const response = await fetch(buildApiUrl(`finops/aws/monthly?${queryParams.toString()}`))
      if (response.ok) {
        const data = await response.json()
        setMonthlyCosts(data || [])
      }
    } catch (error) {
      console.error('Error fetching monthly costs:', error)
    }
  }

  const fetchForecast = async () => {
    try {
      const queryParams = new URLSearchParams()
      if (selectedIntegration) {
        queryParams.append('integration', selectedIntegration)
      }
      const response = await fetch(buildApiUrl(`finops/aws/forecast?${queryParams.toString()}`))
      if (response.ok) {
        const data = await response.json()
        setForecast(data || [])
      }
    } catch (error) {
      console.error('Error fetching forecast:', error)
    }
  }

  const fetchOptimizationData = async () => {
    try {
      const [reservationRes, savingsPlansRes] = await Promise.all([
        fetch(buildApiUrl('finops/aws/reservation-utilization')),
        fetch(buildApiUrl('finops/aws/savings-plans-utilization'))
      ])

      if (reservationRes.ok) {
        const data = await reservationRes.json()
        setReservationUtilization(data)
      }
      if (savingsPlansRes.ok) {
        const data = await savingsPlansRes.json()
        setSavingsPlansUtilization(data)
      }
    } catch (error) {
      console.error('Error fetching optimization data:', error)
    }
  }

  const formatMonth = (dateStr: string) => {
    if (!dateStr) return ''
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

    const sorted = [...monthlyCosts].sort((a, b) => a.month.localeCompare(b.month))
    const lastMonth = sorted[sorted.length - 1]?.cost || 0
    const prevMonth = sorted[sorted.length - 2]?.cost || 0
    const lastYear = sorted.length >= 13 ? sorted[sorted.length - 13]?.cost || 0 : null

    const momChange = prevMonth > 0 ? ((lastMonth - prevMonth) / prevMonth) * 100 : 0
    const yoyChange = lastYear && lastYear > 0 ? ((lastMonth - lastYear) / lastYear) * 100 : null

    return {
      momChange,
      yoyChange,
      lastMonth,
      prevMonth,
      lastYear
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
    return <div className="flex items-center justify-center min-h-screen text-gray-400">Loading...</div>
  }

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
            <option value="azure">Azure</option>
            <option value="gcp">GCP</option>
            <option value="aws">AWS</option>
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

      {monthlyCosts.length > 0 && (
        <div className="bg-[#1E1E1E] border border-gray-700 rounded-lg p-6 mb-6">
          <h3 className="text-xl font-bold mb-4">Histórico de Custos Mensais</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyCosts.slice(-12)}>
              <defs>
                <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1B998B" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#1B998B" stopOpacity={0}/>
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
                stroke="#1B998B"
                fillOpacity={1}
                fill="url(#colorCost)"
                name="Custo"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {forecast && forecast.length > 0 && (
        <div className="bg-[#1E1E1E] border border-gray-700 rounded-lg p-6 mb-6">
          <h3 className="text-xl font-bold mb-4">Previsão de Custos</h3>
          <div className="flex items-center gap-6 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6">
            <AlertTriangle size={48} className="text-yellow-400 flex-shrink-0" />
            <div>
              <p className="text-sm text-gray-400 mb-1">Previsão para o Final do Mês</p>
              <p className="text-3xl font-bold text-yellow-400 mb-1">{formatCurrency(forecast[0]?.cost || 0)}</p>
              <p className="text-xs text-gray-500">Baseado no consumo atual</p>
            </div>
          </div>
        </div>
      )}

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
              activeTab === 'trends'
                ? 'border-[#1B998B] text-[#1B998B]'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
            }`}
            onClick={() => setActiveTab('trends')}
          >
            Tendências
          </button>
          <button
            className={`py-4 px-2 border-b-2 transition-all ${
              activeTab === 'services'
                ? 'border-[#1B998B] text-[#1B998B]'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
            }`}
            onClick={() => setActiveTab('services')}
          >
            Serviços
          </button>
          <button
            className={`py-4 px-2 border-b-2 transition-all ${
              activeTab === 'optimization'
                ? 'border-[#1B998B] text-[#1B998B]'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
            }`}
            onClick={() => setActiveTab('optimization')}
          >
            Otimização
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

        {activeTab === 'trends' && (
          <div className="space-y-6">
            {monthlyCosts.length > 0 && (
              <div className="bg-[#1E1E1E] border border-gray-700 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4">Histórico de Custos (12 Meses)</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={monthlyCosts.slice(-12)}>
                    <defs>
                      <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1B998B" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#1B998B" stopOpacity={0}/>
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
                      stroke="#1B998B"
                      fillOpacity={1}
                      fill="url(#colorTrend)"
                      name="Custo"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {(() => {
              const trends = calculateTrends()
              if (!trends) return null

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-[#1E1E1E] border border-gray-700 rounded-lg p-6">
                    <h3 className="text-lg font-bold mb-4">Comparação Mês a Mês (MoM)</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Mês Anterior:</span>
                        <span className="text-gray-200 font-semibold">{formatCurrency(trends.prevMonth)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Mês Atual:</span>
                        <span className="text-gray-200 font-semibold">{formatCurrency(trends.lastMonth)}</span>
                      </div>
                      <div className="pt-4 border-t border-gray-700">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Variação:</span>
                          <span className={`text-xl font-bold ${trends.momChange >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                            {trends.momChange >= 0 ? '+' : ''}{trends.momChange.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {trends.yoyChange !== null && (
                    <div className="bg-[#1E1E1E] border border-gray-700 rounded-lg p-6">
                      <h3 className="text-lg font-bold mb-4">Comparação Ano a Ano (YoY)</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Mês Ano Passado:</span>
                          <span className="text-gray-200 font-semibold">{formatCurrency(trends.lastYear || 0)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Mês Atual:</span>
                          <span className="text-gray-200 font-semibold">{formatCurrency(trends.lastMonth)}</span>
                        </div>
                        <div className="pt-4 border-t border-gray-700">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400">Variação:</span>
                            <span className={`text-xl font-bold ${trends.yoyChange >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                              {trends.yoyChange >= 0 ? '+' : ''}{trends.yoyChange.toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })()}
          </div>
        )}

        {activeTab === 'services' && (
          <div className="space-y-6">
            <div className="bg-[#1E1E1E] border border-gray-700 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4">Top 10 Serviços por Custo</h3>
              {serviceCosts.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={serviceCosts} layout="vertical" margin={{ top: 5, right: 30, left: 150, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      type="number" 
                      tickFormatter={(value) => `$${value.toLocaleString()}`}
                      stroke="#9CA3AF"
                    />
                    <YAxis 
                      dataKey="service" 
                      type="category" 
                      width={140}
                      tick={{ fill: '#D1D5DB' }}
                    />
                    <Tooltip 
                      formatter={(value: any) => formatCurrency(value)}
                      contentStyle={{ backgroundColor: '#1E1E1E', border: '1px solid #374151', borderRadius: '8px' }}
                      labelStyle={{ color: '#D1D5DB' }}
                    />
                    <Bar dataKey="cost" fill="#1B998B" name="Custo" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <Package size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Nenhum dado de serviço disponível</p>
                </div>
              )}
            </div>

            {serviceCosts.length > 0 && (
              <div className="bg-[#1E1E1E] border border-gray-700 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4">Detalhes dos Serviços</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-3 px-4 text-gray-400 font-semibold">Serviço</th>
                        <th className="text-right py-3 px-4 text-gray-400 font-semibold">Custo Total</th>
                        <th className="text-right py-3 px-4 text-gray-400 font-semibold">% do Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {serviceCosts.map((service, index) => {
                        const totalCost = serviceCosts.reduce((sum, s) => sum + s.cost, 0)
                        const percentage = totalCost > 0 ? (service.cost / totalCost) * 100 : 0
                        return (
                          <tr key={index} className="border-b border-gray-700/50 hover:bg-gray-800/30 transition-colors">
                            <td className="py-3 px-4 text-gray-200 font-medium">{service.service}</td>
                            <td className="py-3 px-4 text-right text-green-400 font-bold">{formatCurrency(service.cost)}</td>
                            <td className="py-3 px-4 text-right text-gray-300">{percentage.toFixed(2)}%</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'optimization' && (
          <div className="space-y-6">
            <div className="bg-[#1E1E1E] border border-gray-700 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4">Reserved Instances - Utilização</h3>
              {reservationUtilization ? (
                <div className="space-y-6">
                  <div className="bg-[#2A2A2A] rounded-lg p-6">
                    <div className="text-center mb-4">
                      <span className="text-5xl font-bold text-[#1B998B]">
                        {reservationUtilization.utilizationPercent?.toFixed(1) || 0}%
                      </span>
                      <span className="block text-sm text-gray-400 mt-2">Taxa de Utilização</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-[#1B998B] to-green-400 h-3 rounded-full transition-all"
                        style={{ width: `${reservationUtilization.utilizationPercent || 0}%` }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-[#2A2A2A] rounded-lg">
                      <span className="block text-sm text-gray-400 mb-2">Total Comprometido</span>
                      <span className="text-xl font-bold text-blue-400">
                        {formatCurrency(reservationUtilization.totalCommitment || 0)}
                      </span>
                    </div>
                    <div className="text-center p-4 bg-[#2A2A2A] rounded-lg">
                      <span className="block text-sm text-gray-400 mb-2">Utilizado</span>
                      <span className="text-xl font-bold text-green-400">
                        {formatCurrency(reservationUtilization.usedCommitment || 0)}
                      </span>
                    </div>
                    <div className="text-center p-4 bg-[#2A2A2A] rounded-lg">
                      <span className="block text-sm text-gray-400 mb-2">Não Utilizado</span>
                      <span className="text-xl font-bold text-yellow-400">
                        {formatCurrency(reservationUtilization.unusedCommitment || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <Package size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Nenhuma Reserved Instance encontrada</p>
                </div>
              )}
            </div>

            <div className="bg-[#1E1E1E] border border-gray-700 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4">Savings Plans - Utilização</h3>
              {savingsPlansUtilization ? (
                <div className="space-y-6">
                  <div className="bg-[#2A2A2A] rounded-lg p-6">
                    <div className="text-center mb-4">
                      <span className="text-5xl font-bold text-[#1B998B]">
                        {savingsPlansUtilization.utilizationPercent?.toFixed(1) || 0}%
                      </span>
                      <span className="block text-sm text-gray-400 mt-2">Taxa de Utilização</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-[#1B998B] to-green-400 h-3 rounded-full transition-all"
                        style={{ width: `${savingsPlansUtilization.utilizationPercent || 0}%` }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-[#2A2A2A] rounded-lg">
                      <span className="block text-sm text-gray-400 mb-2">Total Comprometido</span>
                      <span className="text-xl font-bold text-blue-400">
                        {formatCurrency(savingsPlansUtilization.totalCommitment || 0)}
                      </span>
                    </div>
                    <div className="text-center p-4 bg-[#2A2A2A] rounded-lg">
                      <span className="block text-sm text-gray-400 mb-2">Utilizado</span>
                      <span className="text-xl font-bold text-green-400">
                        {formatCurrency(savingsPlansUtilization.usedCommitment || 0)}
                      </span>
                    </div>
                    <div className="text-center p-4 bg-[#2A2A2A] rounded-lg">
                      <span className="block text-sm text-gray-400 mb-2">Não Utilizado</span>
                      <span className="text-xl font-bold text-yellow-400">
                        {formatCurrency(savingsPlansUtilization.unusedCommitment || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <Package size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Nenhum Savings Plan encontrado</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default FinOpsPage
