import { useState, useEffect } from 'react'
import { DollarSign, TrendingUp, TrendingDown, Cloud, AlertTriangle, Calendar } from 'lucide-react'
import {
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart
} from 'recharts'
import { buildApiUrl } from '../config/api'

interface MonthlyCost {
  month: string
  cost: number
}

interface ServiceCost {
  service: string
  cost: number
}

function FinOpsPageEnhanced() {
  const [loading, setLoading] = useState(true)
  const [monthlyCosts, setMonthlyCosts] = useState<MonthlyCost[]>([])
  const [serviceCosts, setServiceCosts] = useState<ServiceCost[]>([])
  const [forecast, setForecast] = useState<any[]>([])
  const [spUtilization, setSpUtilization] = useState<any>(null)

  // Date filters
  const [monthsToShow, setMonthsToShow] = useState(1)

  const fetchAllData = async () => {
    setLoading(true)
    try {
      // Fetch all data in parallel
      const [monthlyRes, serviceRes, forecastRes, spRes] = await Promise.all([
        fetch(buildApiUrl('finops/aws/monthly')),
        fetch(buildApiUrl(`finops/aws/by-service?months=${monthsToShow}`)),
        fetch(buildApiUrl('finops/aws/forecast')),
        fetch(buildApiUrl('finops/aws/savings-plans-utilization')),
      ])

      const monthlyData = await monthlyRes.json()
      const serviceData = await serviceRes.json()
      const forecastData = await forecastRes.json()
      const spData = await spRes.json()

      console.log('Monthly Data:', monthlyData)
      console.log('Service Data:', serviceData)
      console.log('SP Data:', spData)

      setMonthlyCosts(monthlyData || [])
      setServiceCosts((serviceData || []).sort((a: ServiceCost, b: ServiceCost) => b.cost - a.cost).slice(0, 10))
      setForecast(forecastData || [])
      setSpUtilization(spData || null)
    } catch (error) {
      console.error('Error fetching FinOps data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAllData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthsToShow])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD',
    }).format(value)
  }

  const formatMonth = (dateStr: string) => {
    if (!dateStr) return ''
    try {
      // dateStr comes as "2024-01" or "2024-01-01"
      const parts = dateStr.split('-')
      if (parts.length >= 2) {
        const year = parseInt(parts[0])
        const month = parseInt(parts[1]) - 1 // JavaScript months are 0-indexed
        const date = new Date(year, month, 1)
        return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
      }
      return dateStr
    } catch (e) {
      console.error('Error formatting date:', dateStr, e)
      return dateStr
    }
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <div className="flex items-center justify-center min-h-screen text-gray-400">Carregando dados FinOps...</div>
      </div>
    )
  }

  // Calculate metrics from monthly data
  const filteredMonthly = monthlyCosts.slice(-monthsToShow)
  const totalCost = filteredMonthly.reduce((sum, item) => sum + (item.cost || 0), 0)
  const avgMonthlyCost = filteredMonthly.length > 0 ? totalCost / filteredMonthly.length : 0
  const dailyCost = avgMonthlyCost / 30

  // Calculate trend (compare last month vs previous month)
  let trend = 0
  if (filteredMonthly.length >= 2) {
    const lastMonth = filteredMonthly[filteredMonthly.length - 1]?.cost || 0
    const prevMonth = filteredMonthly[filteredMonthly.length - 2]?.cost || 0
    if (prevMonth > 0) {
      trend = ((lastMonth - prevMonth) / prevMonth) * 100
    }
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <Cloud className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">FinOps - AWS Cost Analytics</h1>
            <p className="text-gray-400 text-sm mt-1">Análise completa de custos AWS</p>
          </div>
        </div>
      </div>

      {/* Date Filter */}
      <div className="mb-6 bg-[#1E1E1E] border border-gray-700 rounded-lg p-4 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2 text-gray-300">
          <Calendar size={20} />
          <span className="font-medium">Período de Análise</span>
        </div>
        <select
          className="bg-transparent text-gray-300 outline-none cursor-pointer border border-gray-600 rounded px-3 py-2"
          value={monthsToShow}
          onChange={(e) => setMonthsToShow(parseInt(e.target.value))}
        >
          <option value={1}>Mês Atual</option>
          <option value={3}>Últimos 3 meses</option>
          <option value={6}>Últimos 6 meses</option>
          <option value={12}>1 Ano</option>
        </select>
      </div>

      {/* 🔵 1. VISÃO GERAL (HIGH LEVEL) */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">📊 Visão Geral</h2>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#1E1E1E] border border-gray-700 rounded-lg p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <DollarSign size={24} className="text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-400">
                Custo Total ({monthsToShow === 1 ? 'Mês Atual' : `${monthsToShow} meses`})
              </p>
              <p className="text-2xl font-bold truncate">{formatCurrency(totalCost)}</p>
            </div>
          </div>

          <div className="bg-[#1E1E1E] border border-gray-700 rounded-lg p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <DollarSign size={24} className="text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-400">Custo Mensal Médio</p>
              <p className="text-2xl font-bold truncate">{formatCurrency(avgMonthlyCost)}</p>
            </div>
          </div>

          <div className="bg-[#1E1E1E] border border-gray-700 rounded-lg p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <DollarSign size={24} className="text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-400">Custo Diário Estimado</p>
              <p className="text-2xl font-bold truncate">{formatCurrency(dailyCost)}</p>
            </div>
          </div>

          <div className="bg-[#1E1E1E] border border-gray-700 rounded-lg p-4 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${trend >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
              {trend >= 0 ? <TrendingUp size={24} className="text-green-400" /> : <TrendingDown size={24} className="text-red-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-400">Tendência (Mês a Mês)</p>
              <p className={`text-2xl font-bold truncate ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        {/* 📈 Gráfico 1 — Custo Total (linha mês a mês) */}
        <div className="bg-[#1E1E1E] border border-gray-700 rounded-lg p-6 mb-6">
          <h3 className="text-xl font-bold mb-4">📈 Custo Total Mensal (Tendência)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={filteredMonthly}>
              <defs>
                <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                tickFormatter={formatMonth}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} />
              <Tooltip
                formatter={(value: any) => formatCurrency(value)}
                labelFormatter={formatMonth}
              />
              <Area
                type="monotone"
                dataKey="cost"
                stroke="#8884d8"
                fillOpacity={1}
                fill="url(#colorCost)"
                name="Custo"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 📊 Gráfico 2 — Custo por Serviço (barras) */}
        <div className="bg-[#1E1E1E] border border-gray-700 rounded-lg p-6 mb-6">
          <h3 className="text-xl font-bold mb-4">📊 Top 10 Serviços por Custo</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={serviceCosts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tickFormatter={(value) => `$${value.toLocaleString()}`} />
              <YAxis dataKey="service" type="category" width={200} />
              <Tooltip formatter={(value: any) => formatCurrency(value)} />
              <Bar dataKey="cost" fill="#00C49F" name="Custo" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 📌 Gráfico 4 — Forecast de Custos */}
        {forecast && forecast.length > 0 && (
          <div className="bg-[#1E1E1E] border border-gray-700 rounded-lg p-6 mb-6">
            <h3 className="text-xl font-bold mb-4">📌 Previsão de Custos</h3>
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
      </section>

      {/* 💳 SAVINGS PLANS */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">💳 Savings Plans</h2>

        <div className="bg-[#1E1E1E] border border-gray-700 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4">💳 Savings Plans</h3>
          {spUtilization ? (
            <div>
              <div className="mb-6 bg-[#2A2A2A] rounded-lg p-6">
                <div className="text-center mb-4">
                  <span className="text-5xl font-bold text-[#1B998B]">
                    {spUtilization.utilizationPercent?.toFixed(1) || 0}%
                  </span>
                  <span className="block text-sm text-gray-400 mt-2">Utilização</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-[#1B998B] to-green-400 h-3 rounded-full transition-all"
                    style={{ width: `${spUtilization.utilizationPercent || 0}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-[#2A2A2A] rounded-lg">
                  <span className="block text-sm text-gray-400 mb-2">Comprometido</span>
                  <span className="text-xl font-bold text-blue-400">
                    {formatCurrency(spUtilization.totalCommitment || 0)}
                  </span>
                </div>
                <div className="text-center p-4 bg-[#2A2A2A] rounded-lg">
                  <span className="block text-sm text-gray-400 mb-2">Utilizado</span>
                  <span className="text-xl font-bold text-green-400">
                    {formatCurrency(spUtilization.usedCommitment || 0)}
                  </span>
                </div>
                <div className="text-center p-4 bg-[#2A2A2A] rounded-lg">
                  <span className="block text-sm text-gray-400 mb-2">Não Utilizado</span>
                  <span className="text-xl font-bold text-yellow-400">
                    {formatCurrency(spUtilization.unusedCommitment || 0)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-400 py-8">Nenhum Savings Plan encontrado</p>
          )}
        </div>
      </section>

    </div>
  )
}

export default FinOpsPageEnhanced
