import { useState, useEffect } from 'react'
import { RefreshCw, AlertCircle, Layers, FileText } from 'lucide-react'
import { getMockPrometheusStats, getMockPrometheusAlerts, getMockGrafanaStats, getMockGrafanaConfig, getMockGrafanaDashboards, getMockLokiApps, getMockLokiLogs } from '../mocks/data/observability'

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

interface LokiLogEntry {
  timestamp: string
  line: string
  labels: { [key: string]: string }
}

interface LokiStream {
  stream: { [key: string]: string }
  values: string[][] // [[timestamp, line], ...]
}

interface LokiQueryResult {
  status: string
  data: {
    resultType: string
    result: LokiStream[]
  }
}

function ObservabilityPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [overviewStats, setOverviewStats] = useState<OverviewStats>({})
  const [prometheusAlerts, setPrometheusAlerts] = useState<PrometheusAlert[]>([])
  const [grafanaUrl, setGrafanaUrl] = useState<string>('')
  const [dashboardUid, setDashboardUid] = useState<string>('')
  const [lokiApps, setLokiApps] = useState<LokiApp[]>([])
  const [loadingLokiApps, setLoadingLokiApps] = useState(false)
  const [selectedApp, setSelectedApp] = useState<string | null>(null)
  const [logs, setLogs] = useState<LokiLogEntry[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)

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
      const data = await getMockLokiApps()
      const apps = (data.apps || []).map(parseAppName)
      setLokiApps(apps)
    } catch (err) {
      console.error('Failed to fetch Loki apps:', err)
    } finally {
      setLoadingLokiApps(false)
    }
  }

  const fetchLogsForApp = async (appName: string) => {
    setSelectedApp(appName)
    setLoadingLogs(true)
    setLogs([])

    try {
      const data: LokiQueryResult = await getMockLokiLogs(appName)

      const parsedLogs: LokiLogEntry[] = []
      if (data.data && data.data.result) {
        data.data.result.forEach(stream => {
          stream.values.forEach(([timestamp, line]) => {
            parsedLogs.push({
              timestamp: new Date(parseInt(timestamp) / 1000000).toISOString(),
              line,
              labels: stream.stream
            })
          })
        })
      }

      parsedLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      setLogs(parsedLogs)
    } catch (err) {
      console.error('Failed to fetch logs for app:', err)
    } finally {
      setLoadingLogs(false)
    }
  }

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      const [prometheusStats, grafanaStats, alertsResult, grafanaConfig, dashboardsResult] = await Promise.all([
        getMockPrometheusStats(),
        getMockGrafanaStats(),
        getMockPrometheusAlerts(),
        getMockGrafanaConfig(),
        getMockGrafanaDashboards()
      ])

      fetchLokiApps()

      const stats: OverviewStats = {
        prometheus: prometheusStats,
        grafana: grafanaStats
      }

      setOverviewStats(stats)
      setPrometheusAlerts(alertsResult.data?.alerts || [])

      setGrafanaUrl(grafanaConfig.url)

      const dashboards = dashboardsResult.dashboards || []
      const mainDashboard = dashboards.find((d: GrafanaDashboard) => d.isStarred) || dashboards[0]
      if (mainDashboard) {
        setDashboardUid(mainDashboard.uid)
      }
    } catch (err: any) {
      setError(`Erro ao carregar dados: ${err.message || 'Erro desconhecido'}`)
      setOverviewStats({})
      setPrometheusAlerts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const renderOverview = () => (
    <div className="animate-fade-in">
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-text mb-6 pb-3 border-b-2 border-border">Prometheus</h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-5">
          <div className="bg-surface border border-border rounded-xl p-6 flex items-center gap-4 transition-all duration-200 hover:border-primary hover:shadow-card hover:-translate-y-0.5">
            <AlertCircle size={24} className="text-primary" />
            <div className="flex-1 flex flex-col">
              <span className="text-sm text-text-secondary mb-1">Alertas Ativas</span>
              <span className="text-[28px] font-bold text-text">{overviewStats.prometheus?.firingAlerts || 0}</span>
            </div>
          </div>
        </div>

        {/* Tabela de Alertas */}
        <div className="mb-10">
          <h3 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">Alertas Ativas</h3>
          <div className="overflow-x-auto bg-surface border border-border rounded-xl">
            <table className="w-full border-collapse">
              <thead className="bg-background">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-[13px] text-text-secondary uppercase tracking-wide border-b-2 border-border">Nome da Alerta</th>
                  <th className="text-left py-3 px-4 font-semibold text-[13px] text-text-secondary uppercase tracking-wide border-b-2 border-border">Squad</th>
                  <th className="text-left py-3 px-4 font-semibold text-[13px] text-text-secondary uppercase tracking-wide border-b-2 border-border">Resumo</th>
                  <th className="text-left py-3 px-4 font-semibold text-[13px] text-text-secondary uppercase tracking-wide border-b-2 border-border">Descrição</th>
                </tr>
              </thead>
              <tbody>
                {prometheusAlerts.map((alert, idx) => (
                  <tr key={idx} className="hover:bg-background">
                    <td className="py-3.5 px-4 border-b border-border text-sm text-text last:border-b-0 font-medium">{alert.labels.alertname || '-'}</td>
                    <td className="py-3.5 px-4 border-b border-border text-sm text-text last:border-b-0 text-[13px] text-primary font-semibold">{alert.labels.squad || '-'}</td>
                    <td className="py-3.5 px-4 border-b border-border text-sm text-text last:border-b-0 text-[13px] font-medium">{alert.annotations.summary || '-'}</td>
                    <td className="py-3.5 px-4 border-b border-border text-sm text-text last:border-b-0 text-[13px] text-text-secondary">{alert.annotations.description || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="mb-12">
        <h2 className="text-2xl font-bold text-text mb-6 pb-3 border-b-2 border-border">Grafana</h2>
        {grafanaUrl && dashboardUid ? (
          <div className="w-full">
            <div className="flex items-center gap-6 p-6 bg-gradient-to-br from-primary/5 to-purple-500/5 border border-border rounded-xl transition-all duration-200 hover:border-primary hover:shadow-primary-sm">
              <div className="flex-shrink-0 w-16 h-16 flex items-center justify-center bg-gradient-to-br from-primary to-purple-600 rounded-xl text-white">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <line x1="9" y1="9" x2="15" y2="9" />
                  <line x1="9" y1="15" x2="15" y2="15" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-text m-0 mb-2">Domínio</h3>
                <p className="text-sm text-text-secondary m-0">Clique para abrir o dashboard principal no Grafana</p>
              </div>
              <a
                href={`${grafanaUrl}/d/${dashboardUid}?orgId=1`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white border-0 rounded-lg text-sm font-medium cursor-pointer transition-all duration-200 no-underline hover:bg-primary-dark hover:-translate-y-px hover:shadow-primary"
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
          <div className="text-center py-20 px-5 flex flex-col items-center justify-center">
            <p>Nenhum dashboard configurado</p>
          </div>
        )}
      </div>

      <div className="mb-12">
        <h2 className="text-2xl font-bold text-text mb-6 pb-3 border-b-2 border-border">Logs</h2>
        {loadingLokiApps ? (
          <div className="text-center py-[60px] px-5 text-lg text-text-secondary">Carregando aplicações...</div>
        ) : lokiApps.length > 0 ? (
          <div className="mb-10">
            <h3 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">Aplicações com Logs ({lokiApps.length})</h3>
            <div className="overflow-x-auto bg-surface border border-border rounded-xl">
              <table className="w-full border-collapse">
                <thead className="bg-background">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-[13px] text-text-secondary uppercase tracking-wide border-b-2 border-border">Aplicação</th>
                    <th className="text-left py-3 px-4 font-semibold text-[13px] text-text-secondary uppercase tracking-wide border-b-2 border-border">Squad</th>
                    <th className="text-left py-3 px-4 font-semibold text-[13px] text-text-secondary uppercase tracking-wide border-b-2 border-border">Serviço</th>
                    <th className="text-left py-3 px-4 font-semibold text-[13px] text-text-secondary uppercase tracking-wide border-b-2 border-border">Ambiente</th>
                  </tr>
                </thead>
                <tbody>
                  {lokiApps.map((app, idx) => (
                    <tr
                      key={idx}
                      className={`hover:bg-background cursor-pointer transition-colors ${selectedApp === app.name ? 'bg-primary/10' : ''}`}
                      onClick={() => fetchLogsForApp(app.name)}
                    >
                      <td className="py-3.5 px-4 border-b border-border text-sm text-text last:border-b-0 flex items-center font-medium">
                        <FileText size={16} style={{ marginRight: '8px' }} />
                        {app.name}
                      </td>
                      <td className="py-3.5 px-4 border-b border-border text-sm text-text last:border-b-0">{app.squad || '-'}</td>
                      <td className="py-3.5 px-4 border-b border-border text-sm text-text last:border-b-0">{app.application || '-'}</td>
                      <td className="py-3.5 px-4 border-b border-border text-sm text-text last:border-b-0">
                        {app.environment ? (
                          <span className={`inline-block px-3 py-1 rounded-md text-xs font-semibold capitalize ${
                            app.environment === 'stage' ? 'bg-warning/10 text-warning' :
                            app.environment === 'prod' ? 'bg-success/10 text-success' : ''
                          }`}>
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
          <div className="text-center py-20 px-5 flex flex-col items-center justify-center">
            <p>Nenhuma aplicação com logs encontrada</p>
          </div>
        )}

        {selectedApp && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text flex items-center gap-2">
                <FileText size={20} />
                Logs de {selectedApp}
              </h3>
              <button
                onClick={() => setSelectedApp(null)}
                className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text border border-border rounded-lg hover:bg-background transition-colors"
              >
                Fechar
              </button>
            </div>

            {loadingLogs ? (
              <div className="text-center py-12 text-text-secondary">
                Carregando logs...
              </div>
            ) : logs.length > 0 ? (
              <div className="bg-surface border border-border rounded-xl overflow-hidden">
                <div className="max-h-[600px] overflow-y-auto p-4 font-mono text-xs">
                  {logs.map((log, idx) => (
                    <div key={idx} className="mb-2 hover:bg-background/50 p-2 rounded transition-colors">
                      <div className="flex gap-4">
                        <span className="text-text-secondary whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </span>
                        <span className="text-text break-all flex-1">{log.line}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-text-secondary bg-surface border border-border rounded-xl">
                Nenhum log encontrado para esta aplicação nas últimas 1 hora
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Layers size={32} className="text-primary" />
          <div>
            <h1 className="text-[32px] font-bold text-text mb-1">Observabilidade</h1>
            <p className="text-base text-text-secondary">Monitore métricas, dashboards e alertas do Prometheus e Grafana</p>
          </div>
        </div>
        <button
          className={`flex items-center gap-2 px-6 py-3 bg-primary text-white border-0 rounded-lg text-[15px] font-semibold cursor-pointer transition-all duration-200 hover:bg-primary-dark hover:-translate-y-0.5 hover:shadow-primary disabled:opacity-60 disabled:cursor-not-allowed ${loading ? '[&>svg]:animate-spin' : ''}`}
          onClick={fetchData}
          disabled={loading}
        >
          <RefreshCw size={20} />
          <span>Atualizar</span>
        </button>
      </div>

      <div className="min-h-[400px]">
        {loading && <div className="text-center py-[60px] px-5 text-lg text-text-secondary">Carregando...</div>}

        {!loading && error && (
          <div className="text-center py-20 px-5 flex flex-col items-center justify-center">
            <AlertCircle size={64} className="text-error mb-4" style={{ opacity: 0.7 }} />
            <h2 className="text-2xl font-semibold text-text mb-2">Erro ao carregar dados</h2>
            <p className="text-base text-text-secondary max-w-[500px] mb-4">{error}</p>
            <button
              className="flex items-center gap-2 py-2 px-4 bg-primary text-white border-none rounded-lg text-sm font-semibold cursor-pointer transition-all hover:bg-primary-dark"
              onClick={fetchData}
            >
              <RefreshCw size={16} />
              Tentar novamente
            </button>
          </div>
        )}

        {!loading && !error && !overviewStats.prometheus && !overviewStats.grafana && lokiApps.length === 0 && (
          <div className="text-center py-20 px-5 flex flex-col items-center justify-center">
            <Layers size={64} style={{ opacity: 0.3, marginBottom: '1rem' }} />
            <h2 className="text-2xl font-semibold text-text mb-2">Nenhuma integração</h2>
            <p className="text-base text-text-secondary max-w-[500px]">Configure integrações de Prometheus, Grafana ou Loki para monitorar métricas, dashboards e logs</p>
          </div>
        )}

        {!loading && (overviewStats.prometheus || overviewStats.grafana || lokiApps.length > 0) && renderOverview()}
      </div>
    </div>
  )
}

export default ObservabilityPage
