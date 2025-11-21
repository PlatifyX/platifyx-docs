import { useState, useEffect } from 'react'
import { DollarSign, TrendingUp, TrendingDown, Cloud, AlertTriangle, Calendar, Filter, Lightbulb, Eye } from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart
} from 'recharts'
import styles from './FinOpsPage.module.css'
import { buildApiUrl } from '../config/api'
import Loader from '../components/Loader/Loader'
import RecommendationDetailsModal from '../components/FinOps/RecommendationDetailsModal'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

interface MonthlyCost {
  month: string
  cost: number
}

interface ServiceCost {
  service: string
  cost: number
}

interface CostOptimizationRecommendation {
  provider: string
  integration: string
  resourceId: string
  resourceType: string
  recommendedAction: string
  currentConfiguration: string
  recommendedConfiguration: string
  estimatedMonthlySavings: number
  estimatedSavingsPercent: number
  currentMonthlyCost: number
  implementationEffort: string
  requiresRestart: boolean
  rollbackPossible: boolean
  accountName: string
  accountId: string
  region: string
  tags?: { [key: string]: string }
  currency: string
}

function FinOpsPageEnhanced() {
  const [loading, setLoading] = useState(true)
  const [monthlyCosts, setMonthlyCosts] = useState<MonthlyCost[]>([])
  const [serviceCosts, setServiceCosts] = useState<ServiceCost[]>([])
  const [forecast, setForecast] = useState<any[]>([])
  const [spUtilization, setSpUtilization] = useState<any>(null)
  const [recommendations, setRecommendations] = useState<CostOptimizationRecommendation[]>([])
  const [selectedRecommendation, setSelectedRecommendation] = useState<CostOptimizationRecommendation | null>(null)

  // Date filters
  const [monthsToShow, setMonthsToShow] = useState(1)

  const fetchAllData = async () => {
    setLoading(true)
    try {
      // Fetch all data in parallel
      const [monthlyRes, serviceRes, forecastRes, spRes, recommendationsRes] = await Promise.all([
        fetch(buildApiUrl('finops/aws/monthly')),
        fetch(buildApiUrl(`finops/aws/by-service?months=${monthsToShow}`)),
        fetch(buildApiUrl('finops/aws/forecast')),
        fetch(buildApiUrl('finops/aws/savings-plans-utilization')),
        fetch(buildApiUrl('finops/recommendations?provider=aws')),
      ])

      const monthlyData = await monthlyRes.json()
      const serviceData = await serviceRes.json()
      const forecastData = await forecastRes.json()
      const spData = await spRes.json()
      const recommendationsData = await recommendationsRes.json()

      console.log('Monthly Data:', monthlyData)
      console.log('Service Data:', serviceData)
      console.log('SP Data:', spData)
      console.log('Recommendations Data:', recommendationsData)

      setMonthlyCosts(monthlyData || [])
      setServiceCosts((serviceData || []).sort((a: ServiceCost, b: ServiceCost) => b.cost - a.cost).slice(0, 10))
      setForecast(forecastData || [])
      setSpUtilization(spData || null)
      setRecommendations(recommendationsData || [])
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
      <div className={styles.container}>
        <Loader size="large" message="Carregando dados FinOps..." />
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
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <Cloud size={32} className={styles.headerIcon} />
          <div>
            <h1 className={styles.title}>FinOps - AWS Cost Analytics</h1>
            <p className={styles.subtitle}>Análise completa de custos AWS</p>
          </div>
        </div>
      </div>

      {/* Date Filter */}
      <div className={styles.filterSection}>
        <div className={styles.filterLabel}>
          <Calendar size={20} />
          <span>Período de Análise</span>
        </div>
        <select
          className={styles.filterSelect}
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
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>📊 Visão Geral</h2>

        {/* KPI Cards */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <DollarSign size={24} />
            </div>
            <div className={styles.statContent}>
              <p className={styles.statLabel}>
                Custo Total ({monthsToShow === 1 ? 'Mês Atual' : `${monthsToShow} meses`})
              </p>
              <p className={styles.statValue}>{formatCurrency(totalCost)}</p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <DollarSign size={24} />
            </div>
            <div className={styles.statContent}>
              <p className={styles.statLabel}>Custo Mensal Médio</p>
              <p className={styles.statValue}>{formatCurrency(avgMonthlyCost)}</p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <DollarSign size={24} />
            </div>
            <div className={styles.statContent}>
              <p className={styles.statLabel}>Custo Diário Estimado</p>
              <p className={styles.statValue}>{formatCurrency(dailyCost)}</p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              {trend >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
            </div>
            <div className={styles.statContent}>
              <p className={styles.statLabel}>Tendência (Mês a Mês)</p>
              <p className={`${styles.statValue} ${trend >= 0 ? styles.trendUp : styles.trendDown}`}>
                {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        {/* 📈 Gráfico 1 — Custo Total (linha mês a mês) */}
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>📈 Custo Total Mensal (Tendência)</h3>
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
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>📊 Top 10 Serviços por Custo</h3>
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
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>📌 Previsão de Custos</h3>
            <div className={styles.forecastBox}>
              <AlertTriangle size={48} className={styles.forecastIcon} />
              <div>
                <p className={styles.forecastLabel}>Previsão para o Final do Mês</p>
                <p className={styles.forecastValue}>{formatCurrency(forecast[0]?.cost || 0)}</p>
                <p className={styles.forecastHint}>Baseado no consumo atual</p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 💳 SAVINGS PLANS */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>💳 Savings Plans</h2>

        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>💳 Savings Plans</h3>
          {spUtilization ? (
            <div>
              <div className={styles.utilizationBox}>
                <div className={styles.utilizationPercent}>
                  <span className={styles.percentValue}>
                    {spUtilization.utilizationPercent?.toFixed(1) || 0}%
                  </span>
                  <span className={styles.percentLabel}>Utilização</span>
                </div>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${spUtilization.utilizationPercent || 0}%` }}
                  />
                </div>
              </div>
              <div className={styles.statsRow}>
                <div className={styles.statItem}>
                  <span className={styles.statItemLabel}>Comprometido</span>
                  <span className={styles.statItemValue}>
                    {formatCurrency(spUtilization.totalCommitment || 0)}
                  </span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statItemLabel}>Utilizado</span>
                  <span className={styles.statItemValue}>
                    {formatCurrency(spUtilization.usedCommitment || 0)}
                  </span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statItemLabel}>Não Utilizado</span>
                  <span className={`${styles.statItemValue} ${styles.warning}`}>
                    {formatCurrency(spUtilization.unusedCommitment || 0)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className={styles.noData}>Nenhum Savings Plan encontrado</p>
          )}
        </div>
      </section>

      {/* 💡 RECOMENDAÇÕES DE OTIMIZAÇÃO */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>💡 Recursos com Economia Estimada</h2>

        <div className={styles.chartCard}>
          <div className={styles.recommendationsHeader}>
            <h3>Recomendações de Otimização de Custos</h3>
            <p style={{ color: 'var(--color-success)', fontWeight: 600, fontSize: '1.1rem', marginTop: '0.5rem' }}>
              Total de economia potencial: {formatCurrency(recommendations.reduce((sum, r) => sum + r.estimatedMonthlySavings, 0))}/mês
            </p>
          </div>

          {recommendations.length === 0 ? (
            <div className={styles.noData}>
              <Lightbulb size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
              <p>Nenhuma recomendação disponível no momento.</p>
              <p style={{ fontSize: '0.875rem', opacity: 0.7, marginTop: '0.5rem' }}>
                Configure suas credenciais AWS com permissões do Compute Optimizer para ver recomendações.
              </p>
            </div>
          ) : (
            <div className={styles.tableContainer}>
              <table className={styles.recommendationsTable}>
                <thead>
                  <tr>
                    <th>Economia mensal estimada</th>
                    <th>Tipo de recurso</th>
                    <th>ID do recurso</th>
                    <th>Ação mais recomendada</th>
                    <th style={{ width: '80px', textAlign: 'center' }}>Detalhes</th>
                  </tr>
                </thead>
                <tbody>
                  {recommendations.map((rec, index) => (
                    <tr key={index} className={styles.clickableRow}>
                      <td className={styles.savingsCell}>{formatCurrency(rec.estimatedMonthlySavings)}</td>
                      <td>{rec.resourceType}</td>
                      <td className={styles.resourceIdCell}>{rec.resourceId}</td>
                      <td className={styles.actionCell}>{rec.recommendedAction}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          className={styles.detailsButton}
                          onClick={() => setSelectedRecommendation(rec)}
                          title="Ver detalhes completos"
                        >
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Modal de Detalhes */}
      <RecommendationDetailsModal
        recommendation={selectedRecommendation}
        onClose={() => setSelectedRecommendation(null)}
      />

    </div>
  )
}

export default FinOpsPageEnhanced
