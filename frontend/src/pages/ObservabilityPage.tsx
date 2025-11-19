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
  const [activeTab, setActiveTab] = useState<'overview' | 'prometheus' | 'grafana'>('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [overviewStats, setOverviewStats] = useState<OverviewStats>({})

  // Prometheus state
  const [prometheusTargets, setPrometheusTargets] = useState<PrometheusTarget[]>([])
  const [prometheusAlerts, setPrometheusAlerts] = useState<PrometheusAlert[]>([])

  // Grafana state
  const [grafanaDashboards, setGrafanaDashboards] = useState<GrafanaDashboard[]>([])
  const [grafanaAlerts, setGrafanaAlerts] = useState<GrafanaAlert[]>([])
  const [grafanaDatasources, setGrafanaDatasources] = useState<GrafanaDataSource[]>([])

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      if (activeTab === 'overview') {
        // Fetch both Prometheus and Grafana stats
        const [prometheusStatsRes, grafanaStatsRes] = await Promise.all([
          fetch(buildApiUrl('prometheus/stats')),
          fetch(buildApiUrl('grafana/stats'))
        ])

        const stats: OverviewStats = {}

        if (prometheusStatsRes.ok) {
          stats.prometheus = await prometheusStatsRes.json()
        }

        if (grafanaStatsRes.ok) {
          stats.grafana = await grafanaStatsRes.json()
        }

        setOverviewStats(stats)
      }

      if (activeTab === 'prometheus') {
        const [targetsRes, alertsRes] = await Promise.all([
          fetch(buildApiUrl('prometheus/targets')),
          fetch(buildApiUrl('prometheus/alerts'))
        ])

        if (targetsRes.ok) {
          const result = await targetsRes.json()
          setPrometheusTargets(result.data?.activeTargets || [])
        }

        if (alertsRes.ok) {
          const result = await alertsRes.json()
          setPrometheusAlerts(result.data?.alerts || [])
        }
      }

      if (activeTab === 'grafana') {
        const [dashboardsRes, alertsRes, datasourcesRes] = await Promise.all([
          fetch(buildApiUrl('grafana/dashboards')),
          fetch(buildApiUrl('grafana/alerts')),
          fetch(buildApiUrl('grafana/datasources'))
        ])

        if (dashboardsRes.ok) {
          const data = await dashboardsRes.json()
          setGrafanaDashboards(data.dashboards || [])
        }

        if (alertsRes.ok) {
          const data = await alertsRes.json()
          setGrafanaAlerts(data.alerts || [])
        }

        if (datasourcesRes.ok) {
          const data = await datasourcesRes.json()
          setGrafanaDatasources(data.datasources || [])
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
  }, [activeTab])

  const getAlertStateClass = (state: string) => {
    switch (state.toLowerCase()) {
      case 'firing':
      case 'alerting':
        return styles.alerting
      case 'ok':
      case 'inactive':
        return styles.ok
      case 'paused':
        return styles.paused
      case 'pending':
        return styles.pending
      default:
        return styles.nodata
    }
  }

  const getHealthClass = (health: string) => {
    switch (health.toLowerCase()) {
      case 'up':
        return styles.healthUp
      case 'down':
        return styles.healthDown
      default:
        return styles.healthUnknown
    }
  }

  const renderOverview = () => (
    <div className={styles.overview}>
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Prometheus</h2>
        <div className={styles.statsGrid}>
          <div className={`${styles.statCard} ${styles.clickable}`} onClick={() => setActiveTab('prometheus')}>
            <Target size={24} className={styles.statIcon} />
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Targets</span>
              <span className={styles.statValue}>{overviewStats.prometheus?.totalTargets || 0}</span>
            </div>
          </div>
          <div className={`${styles.statCard} ${styles.clickable}`} onClick={() => setActiveTab('prometheus')}>
            <Activity size={24} className={styles.statIcon} />
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Targets Ativos</span>
              <span className={styles.statValue}>{overviewStats.prometheus?.activeTargets || 0}</span>
            </div>
          </div>
          <div className={`${styles.statCard} ${styles.clickable}`} onClick={() => setActiveTab('prometheus')}>
            <AlertTriangle size={24} className={styles.statIcon} />
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Alertas</span>
              <span className={styles.statValue}>{overviewStats.prometheus?.totalAlerts || 0}</span>
            </div>
          </div>
          <div className={`${styles.statCard} ${styles.clickable}`} onClick={() => setActiveTab('prometheus')}>
            <AlertCircle size={24} className={styles.statIcon} />
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Alertas Ativos</span>
              <span className={styles.statValue}>{overviewStats.prometheus?.firingAlerts || 0}</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Grafana</h2>
        <div className={styles.statsGrid}>
          <div className={`${styles.statCard} ${styles.clickable}`} onClick={() => setActiveTab('grafana')}>
            <BarChart3 size={24} className={styles.statIcon} />
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Dashboards</span>
              <span className={styles.statValue}>{overviewStats.grafana?.totalDashboards || 0}</span>
            </div>
          </div>
          <div className={`${styles.statCard} ${styles.clickable}`} onClick={() => setActiveTab('grafana')}>
            <AlertTriangle size={24} className={styles.statIcon} />
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Alertas</span>
              <span className={styles.statValue}>{overviewStats.grafana?.totalAlerts || 0}</span>
            </div>
          </div>
          <div className={`${styles.statCard} ${styles.clickable}`} onClick={() => setActiveTab('grafana')}>
            <AlertCircle size={24} className={styles.statIcon} />
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Alertas Ativos</span>
              <span className={styles.statValue}>{overviewStats.grafana?.alertingAlerts || 0}</span>
            </div>
          </div>
          <div className={`${styles.statCard} ${styles.clickable}`} onClick={() => setActiveTab('grafana')}>
            <Database size={24} className={styles.statIcon} />
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Data Sources</span>
              <span className={styles.statValue}>{overviewStats.grafana?.totalDataSources || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderPrometheus = () => (
    <div className={styles.prometheus}>
      <div className={styles.subsection}>
        <h3 className={styles.subsectionTitle}>Alertas Ativas</h3>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nome da Alerta</th>
                <th>Resumo</th>
                <th>Descrição</th>
              </tr>
            </thead>
            <tbody>
              {prometheusAlerts.map((alert, idx) => (
                <tr key={idx}>
                  <td className={styles.alertName}>{alert.labels.alertname || '-'}</td>
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

  const renderGrafana = () => (
    <div className={styles.grafana}>
      <div className={styles.subsection}>
        <h3 className={styles.subsectionTitle}>Dashboards</h3>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Título</th>
                <th>Tipo</th>
                <th>Tags</th>
                <th>Pasta</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {grafanaDashboards.map((dashboard) => (
                <tr key={dashboard.id}>
                  <td>
                    <div className={styles.dashboardTitle}>
                      {dashboard.isStarred && <span className={styles.star}>⭐</span>}
                      {dashboard.title}
                    </div>
                  </td>
                  <td>
                    <span className={styles.badge}>{dashboard.type}</span>
                  </td>
                  <td>
                    <div className={styles.tags}>
                      {dashboard.tags && dashboard.tags.length > 0 ? (
                        dashboard.tags.map((tag, idx) => (
                          <span key={idx} className={styles.tag}>
                            {tag}
                          </span>
                        ))
                      ) : (
                        <span className={styles.noTags}>-</span>
                      )}
                    </div>
                  </td>
                  <td>{dashboard.folderTitle || 'General'}</td>
                  <td>
                    <a
                      href={dashboard.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.linkButton}
                      title="Abrir no Grafana"
                    >
                      <ExternalLink size={16} />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={styles.subsection}>
        <h3 className={styles.subsectionTitle}>Alertas</h3>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Estado</th>
                <th>Dashboard ID</th>
                <th>Data de Avaliação</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {grafanaAlerts.map((alert) => (
                <tr key={alert.id}>
                  <td>{alert.name}</td>
                  <td>
                    <span className={`${styles.alertState} ${getAlertStateClass(alert.state)}`}>
                      {alert.state}
                    </span>
                  </td>
                  <td>{alert.dashboardId}</td>
                  <td>{new Date(alert.evalDate).toLocaleString('pt-BR')}</td>
                  <td>
                    <a
                      href={alert.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.linkButton}
                      title="Ver alerta"
                    >
                      <ExternalLink size={16} />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={styles.subsection}>
        <h3 className={styles.subsectionTitle}>Data Sources</h3>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Tipo</th>
                <th>URL</th>
                <th>Acesso</th>
                <th>Padrão</th>
              </tr>
            </thead>
            <tbody>
              {grafanaDatasources.map((ds) => (
                <tr key={ds.id}>
                  <td className={styles.dsName}>{ds.name}</td>
                  <td>
                    <span className={styles.badge}>{ds.type}</span>
                  </td>
                  <td className={styles.dsUrl}>{ds.url || '-'}</td>
                  <td>
                    <span className={styles.badge}>{ds.access}</span>
                  </td>
                  <td>
                    {ds.isDefault ? (
                      <span className={styles.defaultBadge}>✓ Padrão</span>
                    ) : (
                      <span className={styles.notDefault}>-</span>
                    )}
                  </td>
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

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'overview' ? styles.active : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'prometheus' ? styles.active : ''}`}
          onClick={() => setActiveTab('prometheus')}
        >
          Prometheus
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'grafana' ? styles.active : ''}`}
          onClick={() => setActiveTab('grafana')}
        >
          Grafana
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

        {!loading && !error && (
          <>
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'prometheus' && renderPrometheus()}
            {activeTab === 'grafana' && renderGrafana()}
          </>
        )}
      </div>
    </div>
  )
}

export default ObservabilityPage
