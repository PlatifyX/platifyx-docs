import { useState, useEffect } from 'react'
import { Activity, BarChart3, AlertTriangle, Database, RefreshCw, AlertCircle, ExternalLink } from 'lucide-react'
import { buildApiUrl } from '../config/api'
import styles from './GrafanaPage.module.css'

interface Dashboard {
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

interface Alert {
  id: number
  dashboardId: number
  name: string
  state: string
  newStateDate: string
  evalDate: string
  executionError: string
  url: string
}

interface DataSource {
  id: number
  uid: string
  name: string
  type: string
  url: string
  isDefault: boolean
  access: string
  jsonData?: any
}

interface Stats {
  totalDashboards: number
  totalAlerts: number
  alertingAlerts: number
  totalDataSources: number
  totalUsers: number
  totalFolders: number
}

function GrafanaPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'dashboards' | 'alerts' | 'datasources'>('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [stats, setStats] = useState<Stats | null>(null)
  const [dashboards, setDashboards] = useState<Dashboard[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [datasources, setDatasources] = useState<DataSource[]>([])

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      if (activeTab === 'overview') {
        const statsRes = await fetch(buildApiUrl('grafana/stats'))
        if (statsRes.ok) {
          const data = await statsRes.json()
          setStats(data)
        }
      }

      if (activeTab === 'dashboards' || activeTab === 'overview') {
        const dashboardsRes = await fetch(buildApiUrl('grafana/dashboards'))
        if (dashboardsRes.ok) {
          const data = await dashboardsRes.json()
          setDashboards(data.dashboards || [])
        }
      }

      if (activeTab === 'alerts' || activeTab === 'overview') {
        const alertsRes = await fetch(buildApiUrl('grafana/alerts'))
        if (alertsRes.ok) {
          const data = await alertsRes.json()
          setAlerts(data.alerts || [])
        }
      }

      if (activeTab === 'datasources' || activeTab === 'overview') {
        const datasourcesRes = await fetch(buildApiUrl('grafana/datasources'))
        if (datasourcesRes.ok) {
          const data = await datasourcesRes.json()
          setDatasources(data.datasources || [])
        }
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar dados do Grafana')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [activeTab])

  const getAlertStateClass = (state: string) => {
    switch (state.toLowerCase()) {
      case 'alerting':
        return styles.alerting
      case 'ok':
        return styles.ok
      case 'paused':
        return styles.paused
      case 'pending':
        return styles.pending
      default:
        return styles.nodata
    }
  }

  const renderOverview = () => (
    <div className={styles.overview}>
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <BarChart3 size={24} className={styles.statIcon} />
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Dashboards</span>
            <span className={styles.statValue}>{stats?.totalDashboards || 0}</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <AlertTriangle size={24} className={styles.statIcon} />
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Alertas</span>
            <span className={styles.statValue}>{stats?.totalAlerts || 0}</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <AlertCircle size={24} className={styles.statIcon} />
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Alertas Ativos</span>
            <span className={styles.statValue}>{stats?.alertingAlerts || 0}</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <Database size={24} className={styles.statIcon} />
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Data Sources</span>
            <span className={styles.statValue}>{stats?.totalDataSources || 0}</span>
          </div>
        </div>
      </div>
    </div>
  )

  const renderDashboards = () => (
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
          {dashboards.map((dashboard) => (
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
  )

  const renderAlerts = () => (
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
          {alerts.map((alert) => (
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
  )

  const renderDataSources = () => (
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
          {datasources.map((ds) => (
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
  )

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <Activity size={32} className={styles.headerIcon} />
          <div>
            <h1 className={styles.title}>Grafana</h1>
            <p className={styles.subtitle}>Visualize dashboards, alertas e data sources</p>
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
          className={`${styles.tab} ${activeTab === 'dashboards' ? styles.active : ''}`}
          onClick={() => setActiveTab('dashboards')}
        >
          Dashboards ({dashboards.length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'alerts' ? styles.active : ''}`}
          onClick={() => setActiveTab('alerts')}
        >
          Alertas ({alerts.length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'datasources' ? styles.active : ''}`}
          onClick={() => setActiveTab('datasources')}
        >
          Data Sources ({datasources.length})
        </button>
      </div>

      <div className={styles.content}>
        {error && (
          <div className={styles.error}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {loading && !error && (
          <div className={styles.loading}>Carregando...</div>
        )}

        {!loading && !error && (
          <>
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'dashboards' && renderDashboards()}
            {activeTab === 'alerts' && renderAlerts()}
            {activeTab === 'datasources' && renderDataSources()}
          </>
        )}
      </div>
    </div>
  )
}

export default GrafanaPage
