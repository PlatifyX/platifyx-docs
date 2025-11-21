import { useState, useEffect } from 'react'
import { Activity, BarChart3, AlertTriangle, Database, RefreshCw, AlertCircle, ExternalLink, Target, Layers, FileText } from 'lucide-react'
import { buildApiUrl } from '../config/api'
import PageContainer from '../components/Layout/PageContainer'
import PageHeader from '../components/Layout/PageHeader'
import Section from '../components/Layout/Section'
import Card from '../components/UI/Card'
import StatCard from '../components/UI/StatCard'
import EmptyState from '../components/UI/EmptyState'
import DataTable, { Column } from '../components/Table/DataTable'
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

  // DataTable columns for Prometheus alerts
  const alertColumns: Column<PrometheusAlert>[] = [
    {
      key: 'alertname',
      header: 'Nome da Alerta',
      render: (alert) => alert.labels.alertname || '-',
      align: 'left'
    },
    {
      key: 'squad',
      header: 'Squad',
      render: (alert) => alert.labels.squad || '-',
      align: 'left'
    },
    {
      key: 'summary',
      header: 'Resumo',
      render: (alert) => alert.annotations.summary || '-',
      align: 'left'
    },
    {
      key: 'description',
      header: 'Descrição',
      render: (alert) => alert.annotations.description || '-',
      align: 'left'
    }
  ]

  // DataTable columns for Loki apps
  const lokiAppColumns: Column<LokiApp>[] = [
    {
      key: 'name',
      header: 'Aplicação',
      render: (app) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={16} />
          {app.name}
        </span>
      ),
      align: 'left'
    },
    {
      key: 'squad',
      header: 'Squad',
      render: (app) => app.squad || '-',
      align: 'left'
    },
    {
      key: 'application',
      header: 'Serviço',
      render: (app) => app.application || '-',
      align: 'left'
    },
    {
      key: 'environment',
      header: 'Ambiente',
      render: (app) => app.environment ? (
        <span className={`${styles.envBadge} ${styles[`env${app.environment}`]}`}>
          {app.environment}
        </span>
      ) : '-',
      align: 'left'
    }
  ]

  const renderOverview = () => (
    <>
      <Section title="Prometheus" icon="📊" spacing="lg">
        <div className={styles.statsGrid}>
          <StatCard
            icon={AlertCircle}
            label="Alertas Ativas"
            value={overviewStats.prometheus?.firingAlerts || 0}
            color="red"
          />
        </div>

        <Card title="Alertas Ativas" padding="lg" style={{ marginTop: '1.5rem' }}>
          {prometheusAlerts.length > 0 ? (
            <DataTable
              columns={alertColumns}
              data={prometheusAlerts}
              emptyMessage="Nenhum alerta ativo"
            />
          ) : (
            <EmptyState
              icon={AlertCircle}
              title="Nenhum alerta ativo"
              description="Todas as métricas estão dentro dos parâmetros normais"
            />
          )}
        </Card>
      </Section>

      <Section title="Grafana" icon="📈" spacing="lg">
        <Card padding="lg">
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
            <EmptyState
              icon={BarChart3}
              title="Nenhum dashboard configurado"
              description="Configure o Grafana para visualizar dashboards"
            />
          )}
        </Card>
      </Section>

      <Section title="Loki - Logs" icon="📝" spacing="lg">
        <Card title={`Aplicações com Logs (${lokiApps.length})`} padding="lg">
          {loadingLokiApps ? (
            <div className={styles.loading}>Carregando aplicações...</div>
          ) : lokiApps.length > 0 ? (
            <DataTable
              columns={lokiAppColumns}
              data={lokiApps}
              emptyMessage="Nenhuma aplicação com logs encontrada"
            />
          ) : (
            <EmptyState
              icon={FileText}
              title="Nenhuma aplicação com logs encontrada"
              description="Configure o Loki para coletar logs"
            />
          )}
        </Card>
      </Section>
    </>
  )

  return (
    <PageContainer maxWidth="xl">
      <PageHeader
        icon={Layers}
        title="Observabilidade"
        subtitle="Monitore métricas, dashboards e alertas do Prometheus e Grafana"
        actions={
          <button className={styles.refreshButton} onClick={fetchData} disabled={loading}>
            <RefreshCw size={20} />
            <span>Atualizar</span>
          </button>
        }
      />

      {error && (
        <div className={styles.error}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {loading && !error && <div className={styles.loading}>Carregando...</div>}

      {!loading && !error && renderOverview()}
    </PageContainer>
  )
}

export default ObservabilityPage
