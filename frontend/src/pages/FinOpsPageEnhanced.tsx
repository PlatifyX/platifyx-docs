import { useState, useEffect } from 'react'
import { DollarSign, TrendingUp, TrendingDown, Cloud, AlertTriangle, Calendar, Filter } from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart
} from 'recharts'
import styles from './FinOpsPage.module.css'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

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

  // Date filters
  const [monthsToShow, setMonthsToShow] = useState(12)

  const fetchAllData = async () => {
    setLoading(true)
    try {
      // Fetch all data in parallel
      const [monthlyRes, serviceRes, forecastRes] = await Promise.all([
        fetch('http://localhost:8060/api/v1/finops/aws/monthly'),
        fetch(`http://localhost:8060/api/v1/finops/aws/by-service?months=${monthsToShow}`),
        fetch('http://localhost:8060/api/v1/finops/aws/forecast'),
      ])

      const monthlyData = await monthlyRes.json()
      const serviceData = await serviceRes.json()
      const forecastData = await forecastRes.json()

      console.log('Monthly Data:', monthlyData)
      console.log('Service Data:', serviceData)

      setMonthlyCosts(monthlyData || [])
      setServiceCosts((serviceData || []).sort((a: ServiceCost, b: ServiceCost) => b.cost - a.cost).slice(0, 10))
      setForecast(forecastData || [])
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
        <div className={styles.loading}>Carregando dados FinOps...</div>
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

    </div>
  )
}

export default FinOpsPageEnhanced
