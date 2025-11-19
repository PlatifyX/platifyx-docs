import { useState, useEffect } from 'react'
import { Activity, BarChart3, AlertTriangle, Database, RefreshCw, AlertCircle, ExternalLink, Target, Layers, FileText } from 'lucide-react'
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

// Loki Interfaces
interface LokiApp {
  name: string
  squad?: string
  application?: string
  environment?: string
}

function ObservabilityPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [overviewStats, setOverviewStats] = useState<OverviewStats>({})
  const [prometheusAlerts, setPrometheusAlerts] = useState<PrometheusAlert[]>([])
  const [grafanaUrl, setGrafanaUrl] = useState<string>('')
  const [dashboardUid, setDashboardUid] = useState<string>('')
  const [dashboardTitle, setDashboardTitle] = useState<string>('Dashboard Principal')
  const [lokiApps, setLokiApps] = useState<LokiApp[]>([])
  const [loadingLokiApps, setLoadingLokiApps] = useState(false)

  const parseAppName = (appName: string): LokiApp => {
    const parts = appName.split('-')
    if (parts.length >= 3) {
      const environment = parts[parts.length - 1]
      if (environment === 'stage' || environment === 'prod') {
        const squad = parts[0]
        const application = parts.slice(1, -1).join('-')
        return { name: appName, squad, application, environment }
      }
    }
    return { name: appName }
  }

  const fetchLokiApps = async () => {
    setLoadingLokiApps(true)
    try {
      const response = await fetch(buildApiUrl('observability/logs/apps'))
      if (response.ok) {
        const data = await response.json()
        const apps = (data.apps || []).map(parseAppName)
        setLokiApps(apps)
      }
    } catch (err) {
      console.error('Failed to fetch Loki apps:', err)
    } finally {
      setLoadingLokiApps(false)
    }
  }

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Fetch Prometheus stats, Grafana stats, Prometheus alerts, Grafana config, and Grafana dashboards
      const [prometheusStatsRes, grafanaStatsRes, alertsRes, grafanaConfigRes] = await Promise.all([
        fetch(buildApiUrl('prometheus/stats')),
        fetch(buildApiUrl('grafana/stats')),
        fetch(buildApiUrl('prometheus/alerts')),
        fetch(buildApiUrl('grafana/config'))
      ])

      // Fetch Loki apps in parallel
      fetchLokiApps()

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

      // Fetch Grafana config and find main dashboard
      if (grafanaConfigRes.ok) {
        const configResult = await grafanaConfigRes.json()
        setGrafanaUrl(configResult.url)

        // Fetch dashboards to find the main one
        const dashboardsRes = await fetch(buildApiUrl('grafana/dashboards'))
        if (dashboardsRes.ok) {
          const dashboardsResult = await dashboardsRes.json()
          const dashboards = dashboardsResult.dashboards || []

          // Find first starred dashboard, or just use the first dashboard
          const mainDashboard = dashboards.find((d: GrafanaDashboard) => d.isStarred) || dashboards[0]
          if (mainDashboard) {
            setDashboardUid(mainDashboard.uid)
            setDashboardTitle(mainDashboard.title || 'Dashboard Principal')
          }
        }
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

        {/* Tabela de Alertas */}
        <div className={styles.subsection}>
          <h3 className={styles.subsectionTitle}>Alertas Ativas</h3>
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

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Grafana</h2>
        {grafanaUrl && dashboardUid ? (
          <div className={styles.dashboardLinkContainer}>
            <div className={styles.dashboardCard}>
              <div className={styles.dashboardIcon}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <line x1="9" y1="9" x2="15" y2="9" />
                  <line x1="9" y1="15" x2="15" y2="15" />
                </svg>
              </div>
              <div className={styles.dashboardInfo}>
                <h3 className={styles.dashboardName}>Domínio</h3>
                <p className={styles.dashboardDescription}>Clique para abrir o dashboard principal no Grafana</p>
              </div>
              <a
                href={`${grafanaUrl}/d/${dashboardUid}?orgId=1`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.dashboardButton}
              >
                Abrir Dashboard
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            </div>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p>Nenhum dashboard configurado</p>
          </div>
        )}
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Loki - Logs</h2>
        {loadingLokiApps ? (
          <div className={styles.loading}>Carregando aplicações...</div>
        ) : lokiApps.length > 0 ? (
          <div className={styles.subsection}>
            <h3 className={styles.subsectionTitle}>Aplicações com Logs ({lokiApps.length})</h3>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Aplicação</th>
                    <th>Squad</th>
                    <th>Serviço</th>
                    <th>Ambiente</th>
                  </tr>
                </thead>
                <tbody>
                  {lokiApps.map((app, idx) => (
                    <tr key={idx}>
                      <td className={styles.appName}>
                        <FileText size={16} style={{ marginRight: '8px' }} />
                        {app.name}
                      </td>
                      <td>{app.squad || '-'}</td>
                      <td>{app.application || '-'}</td>
                      <td>
                        {app.environment ? (
                          <span className={`${styles.envBadge} ${styles[`env${app.environment}`]}`}>
                            {app.environment}
                          </span>
                        ) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p>Nenhuma aplicação com logs encontrada</p>
          </div>
        )}
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
