import { useState, useEffect } from 'react'
import { DollarSign, TrendingUp, TrendingDown, Cloud, Calendar, Lightbulb, Eye, RefreshCw } from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart
} from 'recharts'
import styles from './FinOpsPage.module.css'
import { buildApiUrl } from '../config/api'
import Loader from '../components/Loader/Loader'
import RecommendationDetailsModal from '../components/FinOps/RecommendationDetailsModal'
import PageContainer from '../components/Layout/PageContainer'
import PageHeader from '../components/Layout/PageHeader'
import Section from '../components/Layout/Section'
import Card from '../components/UI/Card'
import StatCard from '../components/UI/StatCard'
import EmptyState from '../components/UI/EmptyState'
import DataTable, { Column } from '../components/Table/DataTable'

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
      <PageContainer>
        <Loader size="large" message="Carregando dados FinOps..." />
      </PageContainer>
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

  // DataTable columns for recommendations
  const recommendationColumns: Column<CostOptimizationRecommendation>[] = [
    {
      key: 'savings',
      header: 'Economia mensal estimada',
      render: (rec) => (
        <span style={{ color: 'var(--color-success)', fontWeight: 600, fontSize: '1.05rem' }}>
          {formatCurrency(rec.estimatedMonthlySavings)}
        </span>
      ),
      align: 'left',
      width: '180px'
    },
    {
      key: 'resourceType',
      header: 'Tipo de recurso',
      render: (rec) => rec.resourceType,
      align: 'left'
    },
    {
      key: 'resourceId',
      header: 'ID do recurso',
      render: (rec) => (
        <span style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
          {rec.resourceId}
        </span>
      ),
      align: 'left'
    },
    {
      key: 'action',
      header: 'Ação mais recomendada',
      render: (rec) => rec.recommendedAction,
      align: 'left'
    },
    {
      key: 'details',
      header: 'Detalhes',
      render: (rec) => (
        <button
          className={styles.detailsButton}
          onClick={() => setSelectedRecommendation(rec)}
          title="Ver detalhes completos"
        >
          <Eye size={18} />
        </button>
      ),
      align: 'center',
      width: '80px'
    }
  ]

  return (
    <PageContainer maxWidth="xl">
      <PageHeader
        icon={Cloud}
        title="FinOps - AWS Cost Analytics"
        subtitle="Análise completa de custos AWS"
        actions={
          <button
            onClick={fetchAllData}
            className={styles.refreshButton}
            title="Atualizar dados"
          >
            <RefreshCw size={20} />
          </button>
        }
      />

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

      {/* 📊 VISÃO GERAL */}
      <Section title="Visão Geral" icon="📊" spacing="lg">
        {/* KPI Cards using StatCard component */}
        <div className={styles.statsGrid}>
          <StatCard
            icon={DollarSign}
            label={`Custo Total (${monthsToShow === 1 ? 'Mês Atual' : `${monthsToShow} meses`})`}
            value={formatCurrency(totalCost)}
            color="blue"
          />
          <StatCard
            icon={DollarSign}
            label="Custo Mensal Médio"
            value={formatCurrency(avgMonthlyCost)}
            color="purple"
          />
          <StatCard
            icon={DollarSign}
            label="Custo Diário Estimado"
            value={formatCurrency(dailyCost)}
            color="yellow"
          />
          <StatCard
            icon={trend >= 0 ? TrendingUp : TrendingDown}
            label="Tendência (Mês a Mês)"
            value={`${trend >= 0 ? '+' : ''}${trend.toFixed(1)}%`}
            color={trend >= 0 ? 'red' : 'green'}
          />
        </div>

        {/* 📈 Gráfico 1 — Custo Total (linha mês a mês) */}
        <Card title="📈 Custo Total Mensal (Tendência)" padding="lg" style={{ marginTop: '2rem' }}>
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
              <Area type="monotone" dataKey="cost" stroke="#8884d8" fillOpacity={1} fill="url(#colorCost)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* 📊 Gráfico 2 — Custo por Serviço (barra) */}
        <Card title="📊 Top 10 Serviços por Custo" padding="lg" style={{ marginTop: '1.5rem' }}>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={serviceCosts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="service" angle={-45} textAnchor="end" height={120} />
              <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} />
              <Tooltip formatter={(value: any) => formatCurrency(value)} />
              <Bar dataKey="cost" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* 📊 Gráfico 3 — Distribuição de Custo (pizza) */}
        <Card title="🍕 Distribuição de Custos por Serviço" padding="lg" style={{ marginTop: '1.5rem' }}>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={serviceCosts}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.service}: ${formatCurrency(entry.cost)}`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="cost"
              >
                {serviceCosts.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => formatCurrency(value)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </Section>

      {/* 🔮 PREVISÃO */}
      <Section title="Previsão de Custos (Próximos 3 Meses)" icon="🔮" spacing="lg">
        <Card padding="lg">
          {forecast.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={forecast}>
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
                <Legend />
                <Line type="monotone" dataKey="mean" stroke="#8884d8" name="Previsão Média" strokeWidth={2} />
                <Line type="monotone" dataKey="upperBound" stroke="#82ca9d" name="Limite Superior" strokeDasharray="5 5" />
                <Line type="monotone" dataKey="lowerBound" stroke="#ffc658" name="Limite Inferior" strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState
              icon={TrendingUp}
              title="Dados de previsão não disponíveis"
              description="Configure o AWS Cost Explorer para visualizar previsões"
            />
          )}
        </Card>
      </Section>

      {/* 💰 SAVINGS PLANS */}
      <Section title="Utilização de Savings Plans" icon="💰" spacing="lg">
        <Card padding="lg">
          {spUtilization && spUtilization.utilizationPercentage ? (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div>
                  <p style={{ color: 'var(--deep-sea-dusty-denim)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Taxa de Utilização</p>
                  <p style={{ color: 'var(--deep-sea-eggshell)', fontSize: '2rem', fontWeight: 700 }}>
                    {spUtilization.utilizationPercentage}%
                  </p>
                </div>
                <div>
                  <p style={{ color: 'var(--deep-sea-dusty-denim)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Economia Total</p>
                  <p style={{ color: 'var(--color-success)', fontSize: '2rem', fontWeight: 700 }}>
                    {formatCurrency(spUtilization.totalSavings)}
                  </p>
                </div>
                <div>
                  <p style={{ color: 'var(--deep-sea-dusty-denim)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Valor Não Utilizado</p>
                  <p style={{ color: 'var(--color-warning)', fontSize: '2rem', fontWeight: 700 }}>
                    {formatCurrency(spUtilization.unusedCommitment)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={DollarSign}
              title="Nenhum Savings Plan encontrado"
              description="Configure Savings Plans na AWS para otimizar seus custos"
            />
          )}
        </Card>
      </Section>

      {/* 💡 RECOMENDAÇÕES DE OTIMIZAÇÃO */}
      <Section title="Recursos com Economia Estimada" icon="💡" spacing="lg">
        <Card padding="lg">
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ color: 'var(--deep-sea-eggshell)', fontSize: '1.125rem', marginBottom: '0.5rem' }}>
              Recomendações de Otimização de Custos
            </h3>
            <p style={{ color: 'var(--color-success)', fontWeight: 600, fontSize: '1.1rem' }}>
              Total de economia potencial: {formatCurrency(recommendations.reduce((sum, r) => sum + r.estimatedMonthlySavings, 0))}/mês
            </p>
          </div>

          {recommendations.length === 0 ? (
            <EmptyState
              icon={Lightbulb}
              title="Nenhuma recomendação disponível no momento"
              description="Configure suas credenciais AWS com permissões do Compute Optimizer para ver recomendações"
            />
          ) : (
            <DataTable
              columns={recommendationColumns}
              data={recommendations}
              emptyMessage="Nenhuma recomendação encontrada"
            />
          )}
        </Card>
      </Section>

      {/* Modal de Detalhes */}
      <RecommendationDetailsModal
        recommendation={selectedRecommendation}
        onClose={() => setSelectedRecommendation(null)}
      />
    </PageContainer>
  )
}

export default FinOpsPageEnhanced
