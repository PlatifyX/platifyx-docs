import { useState, useEffect } from 'react'
import { DollarSign, TrendingUp, TrendingDown, Server, Cloud, AlertTriangle } from 'lucide-react'
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

interface TagCost {
  tag: string
  cost: number
}

function FinOpsPageEnhanced() {
  const [loading, setLoading] = useState(true)
  const [monthlyCosts, setMonthlyCosts] = useState<MonthlyCost[]>([])
  const [serviceCosts, setServiceCosts] = useState<ServiceCost[]>([])
  const [teamCosts, setTeamCosts] = useState<TagCost[]>([])
  const [appCosts, setAppCosts] = useState<TagCost[]>([])
  const [forecast, setForecast] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    setLoading(true)
    try {
      // Fetch all data in parallel
      const [monthlyRes, serviceRes, teamRes, appRes, forecastRes, statsRes] = await Promise.all([
        fetch('http://localhost:8060/api/v1/finops/aws/monthly'),
        fetch('http://localhost:8060/api/v1/finops/aws/by-service'),
        fetch('http://localhost:8060/api/v1/finops/aws/by-tag?tag=Team'),
        fetch('http://localhost:8060/api/v1/finops/aws/by-tag?tag=Application'),
        fetch('http://localhost:8060/api/v1/finops/aws/forecast'),
        fetch('http://localhost:8060/api/v1/finops/stats?provider=aws'),
      ])

      const monthlyData = await monthlyRes.json()
      const serviceData = await serviceRes.json()
      const teamData = await teamRes.json()
      const appData = await appRes.json()
      const forecastData = await forecastRes.json()
      const statsData = await statsRes.json()

      setMonthlyCosts(monthlyData || [])
      setServiceCosts((serviceData || []).sort((a: ServiceCost, b: ServiceCost) => b.cost - a.cost).slice(0, 10))
      setTeamCosts((teamData || []).sort((a: TagCost, b: TagCost) => b.cost - a.cost))
      setAppCosts((appData || []).sort((a: TagCost, b: TagCost) => b.cost - a.cost))
      setForecast(forecastData || [])
      setStats(statsData || {})
    } catch (error) {
      console.error('Error fetching FinOps data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD',
    }).format(value)
  }

  const formatMonth = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr + '-01')
    return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Carregando dados FinOps...</div>
      </div>
    )
  }

  const totalCost = stats?.totalCost || 0
  const monthlyCost = stats?.monthlyCost || 0
  const dailyCost = stats?.dailyCost || 0
  const trend = stats?.costTrend || 0

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <Cloud size={32} className={styles.headerIcon} />
          <div>
            <h1 className={styles.title}>FinOps - AWS Cost Analytics</h1>
            <p className={styles.subtitle}>Análise completa de custos AWS - Últimos 12 meses</p>
          </div>
        </div>
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
              <p className={styles.statLabel}>Custo Total (Anual)</p>
              <p className={styles.statValue}>{formatCurrency(totalCost)}</p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <DollarSign size={24} />
            </div>
            <div className={styles.statContent}>
              <p className={styles.statLabel}>Custo Mensal Médio</p>
              <p className={styles.statValue}>{formatCurrency(monthlyCost)}</p>
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
              <p className={styles.statLabel}>Tendência</p>
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
            <AreaChart data={monthlyCosts}>
              <defs>
                <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tickFormatter={formatMonth} />
              <YAxis tickFormatter={(value) => `$${value}`} />
              <Tooltip formatter={(value: any) => formatCurrency(value)} labelFormatter={formatMonth} />
              <Area type="monotone" dataKey="cost" stroke="#8884d8" fillOpacity={1} fill="url(#colorCost)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 📊 Gráfico 2 — Custo por Serviço (barras) */}
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>📊 Top 10 Serviços por Custo</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={serviceCosts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tickFormatter={(value) => `$${value}`} />
              <YAxis dataKey="service" type="category" width={150} />
              <Tooltip formatter={(value: any) => formatCurrency(value)} />
              <Bar dataKey="cost" fill="#00C49F" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 📌 Gráfico 4 — Forecast de Custos */}
        {forecast && forecast.length > 0 && (
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>📌 Previsão de Custos (Próximos 3 Meses)</h3>
            <div className={styles.forecastBox}>
              <AlertTriangle size={48} className={styles.forecastIcon} />
              <div>
                <p className={styles.forecastLabel}>Custo Previsto</p>
                <p className={styles.forecastValue}>{formatCurrency(forecast[0]?.cost || 0)}</p>
                <p className={styles.forecastHint}>Baseado no consumo atual</p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 🟢 2. DEEP DIVE DE CUSTOS */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>🔍 Deep Dive de Custos</h2>

        <div className={styles.twoColumns}>
          {/* Por Time */}
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>👥 Custo por Time</h3>
            {teamCosts.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={teamCosts}
                    dataKey="cost"
                    nameKey="tag"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(entry) => `${entry.tag}: ${formatCurrency(entry.cost)}`}
                  >
                    {teamCosts.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className={styles.noData}>Nenhum dado de tag "Team" encontrado</p>
            )}
          </div>

          {/* Por Aplicação */}
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>📱 Custo por Aplicação</h3>
            {appCosts.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={appCosts.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="tag" />
                  <YAxis tickFormatter={(value) => `$${value}`} />
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                  <Bar dataKey="cost" fill="#FFBB28" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className={styles.noData}>Nenhum dado de tag "Application" encontrado</p>
            )}
          </div>
        </div>

        {/* 📈 Gráfico 6 — Custo por Recurso (Top Resources) */}
        {stats?.topCostResources && stats.topCostResources.length > 0 && (
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>💰 Top 5 Recursos Mais Caros</h3>
            <div className={styles.resourceTable}>
              <table>
                <thead>
                  <tr>
                    <th>Recurso</th>
                    <th>Tipo</th>
                    <th>Região</th>
                    <th>Status</th>
                    <th>Custo Estimado</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topCostResources.map((resource: any, index: number) => (
                    <tr key={index}>
                      <td>{resource.resourceName}</td>
                      <td>{resource.resourceType}</td>
                      <td>{resource.region}</td>
                      <td>
                        <span className={`${styles.badge} ${styles[`status${resource.status}`]}`}>
                          {resource.status}
                        </span>
                      </td>
                      <td className={styles.costCell}>{formatCurrency(resource.cost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* 🟥 4. NETWORK E ARMAZENAMENTO */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>🌐 Rede e Armazenamento</h2>
        <div className={styles.infoBox}>
          <p>⚠️ Dados de Data Transfer e armazenamento detalhado em desenvolvimento.</p>
          <p>Utilize a AWS Cost Explorer Console para análise detalhada de:</p>
          <ul>
            <li>Data Transfer Inter-Region, NAT Gateway, Internet</li>
            <li>Crescimento de S3, RDS e EBS por GB</li>
          </ul>
        </div>
      </section>

      {/* 🟪 5. OTIMIZAÇÃO / WASTE */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>⚡ Otimização e Desperdício</h2>
        <div className={styles.infoBox}>
          <p>🔧 Recursos de otimização em desenvolvimento:</p>
          <ul>
            <li>Estimativa de recursos ociosos por serviço</li>
            <li>Utilização de Savings Plans e Reserved Instances</li>
            <li>Detecção de anomalias de custo (integração com AWS Cost Anomaly Detection)</li>
          </ul>
          <p>📌 Utilize o AWS Cost Explorer para análises detalhadas de otimização.</p>
        </div>
      </section>
    </div>
  )
}

export default FinOpsPageEnhanced
