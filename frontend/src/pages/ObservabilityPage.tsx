import { useState, useEffect } from 'react'
import { Activity, BarChart3, AlertTriangle, Database, RefreshCw, AlertCircle, ExternalLink, Target, Layers } from 'lucide-react'
import { buildApiUrl } from '../config/api'
import styles from './ObservabilityPage.module.css'

// Grafana Interfaces
interface GrafanaDashboard {
  id: number
  uid: string
  title: string
  url: string
  type: string
  tags: string[]
  isStarred: boolean
  uri: string
  folderTitle?: string
}

interface GrafanaAlert {
  id: number
  dashboardId: number
  name: string
  state: string
  newStateDate: string
  evalDate: string
  executionError: string
  url: string
}

interface GrafanaDataSource {
  id: number
  uid: string
  name: string
  type: string
  url: string
  isDefault: boolean
  access: string
  jsonData?: any
}

// Prometheus Interfaces
interface PrometheusTarget {
  scrapePool: string
  scrapeUrl: string
  globalUrl: string
  lastError: string
  lastScrape: string
  lastScrapeDuration: number
  health: string
  labels: { [key: string]: string }
}

interface PrometheusAlert {
  labels: { [key: string]: string }
  annotations: { [key: string]: string }
  state: string
  activeAt: string
  value: string
}

interface OverviewStats {
  prometheus?: {
    totalTargets: number
    activeTargets: number
    totalAlerts: number
    firingAlerts: number
  }
  grafana?: {
    totalDashboards: number
    totalAlerts: number
    alertingAlerts: number
    totalDataSources: number
  }
}

function ObservabilityPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [overviewStats, setOverviewStats] = useState<OverviewStats>({})
  const [prometheusAlerts, setPrometheusAlerts] = useState<PrometheusAlert[]>([])

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Fetch Prometheus and Grafana stats + Prometheus alerts
      const [prometheusStatsRes, grafanaStatsRes, alertsRes] = await Promise.all([
        fetch(buildApiUrl('prometheus/stats')),
        fetch(buildApiUrl('grafana/stats')),
        fetch(buildApiUrl('prometheus/alerts'))
      ])

      const stats: OverviewStats = {}

      if (prometheusStatsRes.ok) {
        stats.prometheus = await prometheusStatsRes.json()
      }

      if (grafanaStatsRes.ok) {
        stats.grafana = await grafanaStatsRes.json()
      }

      setOverviewStats(stats)

      if (alertsRes.ok) {
        const result = await alertsRes.json()
        setPrometheusAlerts(result.data?.alerts || [])
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar dados de observabilidade')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const renderOverview = () => (
    <div className={styles.overview}>
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Prometheus</h2>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <AlertCircle size={24} className={styles.statIcon} />
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Alertas Ativas</span>
              <span className={styles.statValue}>{overviewStats.prometheus?.firingAlerts || 0}</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Grafana</h2>
      </div>

      {/* Tabela de Alertas do Prometheus */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Alertas Ativas do Prometheus</h2>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nome da Alerta</th>
                <th>Squad</th>
                <th>Resumo</th>
                <th>Descrição</th>
              </tr>
            </thead>
            <tbody>
              {prometheusAlerts.map((alert, idx) => (
                <tr key={idx}>
                  <td className={styles.alertName}>{alert.labels.alertname || '-'}</td>
                  <td className={styles.squad}>{alert.labels.squad || '-'}</td>
                  <td className={styles.summary}>{alert.annotations.summary || '-'}</td>
                  <td className={styles.description}>{alert.annotations.description || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <Layers size={32} className={styles.headerIcon} />
          <div>
            <h1 className={styles.title}>Observabilidade</h1>
            <p className={styles.subtitle}>Monitore métricas, dashboards e alertas do Prometheus e Grafana</p>
          </div>
        </div>
        <button className={styles.refreshButton} onClick={fetchData} disabled={loading}>
          <RefreshCw size={20} />
          <span>Atualizar</span>
        </button>
      </div>

      <div className={styles.content}>
        {error && (
          <div className={styles.error}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {loading && !error && <div className={styles.loading}>Carregando...</div>}

        {!loading && !error && renderOverview()}
      </div>
    </div>
  )
}

export default ObservabilityPage
