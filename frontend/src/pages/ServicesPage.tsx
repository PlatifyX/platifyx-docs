import { useState, useEffect } from 'react'
import { Box, RefreshCw, ExternalLink, Activity, Code, Users, GitBranch, GitMerge, Shield, Bug, TrendingUp, AlertTriangle } from 'lucide-react'
import { buildApiUrl } from '../config/api'

interface Service {
  id: number
  name: string
  squad: string
  application: string
  language: string
  version: string
  repositoryType: string
  repositoryUrl: string
  sonarqubeProject: string
  namespace: string
  microservices: boolean
  monorepo: boolean
  testUnit: boolean
  infra: string
  hasStage: boolean
  hasProd: boolean
  createdAt: string
  updatedAt: string
}

interface ServiceMetrics {
  sonarqube?: {
    bugs: number
    vulnerabilities: number
    codeSmells: number
    securityHotspots: number
    coverage: number
  }
  stageBuild?: {
    status: string
    buildNumber: string
    sourceBranch: string
    finishTime: string
    integration: string
  }
  mainBuild?: {
    status: string
    buildNumber: string
    sourceBranch: string
    finishTime: string
    integration: string
  }
}

interface PodInfo {
  name: string
  status: string
  ready: string
  restarts: number
  age: string
  node?: string
  namespace: string
}

interface DeploymentStatus {
  environment: string
  status: string
  replicas: number
  availableReplicas: number
  image: string
  lastDeployed?: string
  pods?: PodInfo[]
}

interface ServiceStatus {
  serviceName: string
  stageStatus?: DeploymentStatus
  prodStatus?: DeploymentStatus
}

function ServicesPage() {
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [serviceMetrics, setServiceMetrics] = useState<Record<string, ServiceMetrics>>({})
  const [serviceStatus, setServiceStatus] = useState<Record<string, ServiceStatus>>({})
  const [loadingMetrics, setLoadingMetrics] = useState(false)
  const [filter, setFilter] = useState('')
  const [squadFilter, setSquadFilter] = useState('all')

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toString()
  }

  const fetchServices = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(buildApiUrl('service-catalog'))
      if (!response.ok) {
        throw new Error('Failed to fetch services')
      }

      const data = await response.json()
      const fetchedServices = data.services || []
      setServices(fetchedServices)

      // Fetch metrics for all services
      if (fetchedServices.length > 0) {
        await fetchServicesMetrics(fetchedServices.map((s: Service) => s.name))
        await fetchServicesStatus(fetchedServices.map((s: Service) => s.name))
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar serviços')
    } finally {
      setLoading(false)
    }
  }

  const fetchServicesMetrics = async (serviceNames: string[]) => {
    setLoadingMetrics(true)

    try {
      const response = await fetch(buildApiUrl('service-catalog/metrics'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ serviceNames }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch metrics')
      }

      const data = await response.json()
      console.log('Metrics response:', data)
      console.log('Service metrics:', data.metrics)
      setServiceMetrics(data.metrics || {})
    } catch (err: any) {
      console.error('Failed to fetch service metrics:', err)
      // Don't show error to user, just log it
    } finally {
      setLoadingMetrics(false)
    }
  }

  const fetchServicesStatus = async (serviceNames: string[]) => {
    try {
      // Fetch status for each service
      const statusPromises = serviceNames.map(async (serviceName) => {
        try {
          const response = await fetch(buildApiUrl(`service-catalog/${serviceName}/status`))
          if (response.ok) {
            const status: ServiceStatus = await response.json()
            return { serviceName, status }
          }
        } catch (err) {
          console.error(`Failed to fetch status for ${serviceName}:`, err)
        }
        return null
      })

      const results = await Promise.all(statusPromises)
      const statusMap: Record<string, ServiceStatus> = {}

      results.forEach((result) => {
        if (result) {
          statusMap[result.serviceName] = result.status
        }
      })

      setServiceStatus(statusMap)
    } catch (err: any) {
      console.error('Failed to fetch services status:', err)
    }
  }

  const syncServices = async () => {
    setSyncing(true)
    setError(null)

    try {
      const response = await fetch(buildApiUrl('service-catalog/sync'), {
        method: 'POST',
      })
      if (!response.ok) {
        throw new Error('Failed to sync services')
      }

      // Reload services after sync
      await fetchServices()
    } catch (err: any) {
      setError(err.message || 'Erro ao sincronizar serviços')
    } finally {
      setSyncing(false)
    }
  }

  useEffect(() => {
    fetchServices()
  }, [])

  const squads = Array.from(new Set(services.map(s => s.squad))).sort()

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(filter.toLowerCase()) ||
      service.squad.toLowerCase().includes(filter.toLowerCase()) ||
      service.application.toLowerCase().includes(filter.toLowerCase())
    const matchesSquad = squadFilter === 'all' || service.squad === squadFilter

    return matchesSearch && matchesSquad
  })

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Box size={32} className="text-primary" />
          <div>
            <h1 className="text-[32px] font-bold text-text mb-1">Catálogo de Serviços</h1>
            <p className="text-base text-text-secondary">
              {services.length} serviços descobertos automaticamente do Kubernetes
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            className="flex items-center gap-2 px-6 py-3 bg-[#10b981] text-white border-0 rounded-lg text-[15px] font-semibold cursor-pointer transition-all duration-200 hover:bg-[#059669] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(16,185,129,0.3)] disabled:opacity-60 disabled:cursor-not-allowed"
            onClick={syncServices}
            disabled={syncing}
          >
            <RefreshCw size={20} className={syncing ? 'animate-spin' : ''} />
            <span>{syncing ? 'Sincronizando...' : 'Sincronizar'}</span>
          </button>
          <button className="flex items-center gap-2 px-6 py-3 bg-primary text-white border-0 rounded-lg text-[15px] font-semibold cursor-pointer transition-all duration-200 hover:bg-primary-dark hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(99,102,241,0.3)] disabled:opacity-60 disabled:cursor-not-allowed" onClick={fetchServices} disabled={loading}>
            <RefreshCw size={20} />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      <div className="flex gap-4 mb-8">
        <input
          type="text"
          placeholder="Buscar por nome, squad ou aplicação..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="flex-1 px-4 py-3 border border-border rounded-lg text-[15px] bg-surface text-text transition-all duration-200 focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)]"
        />
        <select
          value={squadFilter}
          onChange={(e) => setSquadFilter(e.target.value)}
          className="px-4 py-3 border border-border rounded-lg text-[15px] bg-surface text-text cursor-pointer min-w-[200px]"
        >
          <option value="all">Todas as Squads</option>
          {squads.map(squad => (
            <option key={squad} value={squad}>{squad}</option>
          ))}
        </select>
      </div>

      <div className="min-h-[400px]">
        {error && (
          <div className="flex items-center justify-center gap-3 bg-[rgba(239,68,68,0.1)] border border-error rounded-xl p-5 mb-6 text-error text-center">
            <Activity size={20} />
            <span>{error}</span>
          </div>
        )}

        {loading && !error && <div className="text-center py-[60px] px-5 text-lg text-text-secondary">Carregando serviços...</div>}

        {!loading && !error && filteredServices.length === 0 && (
          <div className="text-center py-20 px-5">
            <Box size={64} className="text-text-secondary opacity-30 mb-4" />
            <h2 className="text-2xl font-semibold text-text mb-2">Nenhum serviço encontrado</h2>
            <p className="text-base text-text-secondary">
              {filter || squadFilter !== 'all'
                ? 'Tente ajustar os filtros de busca'
                : 'Clique em "Sincronizar" para descobrir serviços do Kubernetes'}
            </p>
          </div>
        )}

        {!loading && !error && filteredServices.length > 0 && (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(350px,1fr))] gap-6 animate-fadeIn">
            {filteredServices.map(service => (
              <div key={service.id} className="bg-surface border border-border rounded-xl p-6 transition-all duration-200 hover:border-primary hover:shadow-[0_6px_16px_rgba(99,102,241,0.1)] hover:-translate-y-1">
                <div className="flex justify-between items-start mb-4 pb-4 border-b border-border">
                  <div className="flex items-center gap-2 text-primary">
                    <Box size={20} />
                    <h3 className="text-lg font-semibold m-0 text-text">{service.name}</h3>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[rgba(99,102,241,0.1)] text-primary rounded-md text-[13px] font-semibold">
                    <Users size={16} />
                    <span>{service.squad}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3 mb-4">
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <Code size={16} />
                    <span>{service.language} {service.version}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <GitBranch size={16} />
                    <span>{service.repositoryType}</span>
                  </div>
                </div>

                <div className="flex gap-3 mb-4 pt-4 border-t border-border">
                  {service.hasStage && (
                    <div className="flex-1 flex flex-col gap-1.5">
                      <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Stage</span>
                      <span className="inline-block px-3 py-1.5 rounded-md text-xs font-semibold text-center bg-[rgba(34,197,94,0.1)] text-success">
                        Disponível
                      </span>
                    </div>
                  )}
                  {service.hasProd && (
                    <div className="flex-1 flex flex-col gap-1.5">
                      <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Prod</span>
                      <span className="inline-block px-3 py-1.5 rounded-md text-xs font-semibold text-center bg-[rgba(34,197,94,0.1)] text-success">
                        Disponível
                      </span>
                    </div>
                  )}
                </div>

                {/* Loading Metrics */}
                {loadingMetrics && !serviceMetrics[service.name] && (
                  <div className="flex items-center justify-center gap-3 p-6 mb-4 bg-[rgba(99,102,241,0.05)] border border-dashed border-primary rounded-lg text-primary text-sm font-medium">
                    <RefreshCw size={20} className="animate-spin" />
                    <span>Carregando métricas e pipelines...</span>
                  </div>
                )}

                {/* SonarQube Metrics */}
                {serviceMetrics[service.name]?.sonarqube && (
                  <div className="mb-4 p-4 bg-background rounded-lg">
                    <h4 className="text-sm font-semibold text-text mb-3 mt-0">SonarQube</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <Bug size={14} style={{ color: 'var(--color-error)' }} />
                        <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Bugs</span>
                        <span className="text-xl font-bold text-text">{formatNumber(serviceMetrics[service.name]?.sonarqube?.bugs || 0)}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Shield size={14} style={{ color: 'var(--color-error)' }} />
                        <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Vulnerabilidades</span>
                        <span className="text-xl font-bold text-text">{formatNumber(serviceMetrics[service.name]?.sonarqube?.vulnerabilities || 0)}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Code size={14} style={{ color: 'var(--color-warning)' }} />
                        <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Code Smells</span>
                        <span className="text-xl font-bold text-text">{formatNumber(serviceMetrics[service.name]?.sonarqube?.codeSmells || 0)}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <AlertTriangle size={14} style={{ color: 'var(--color-warning)' }} />
                        <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Security Hotspots</span>
                        <span className="text-xl font-bold text-text">{formatNumber(serviceMetrics[service.name]?.sonarqube?.securityHotspots || 0)}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <TrendingUp size={14} style={{ color: 'var(--color-success)' }} />
                        <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Cobertura</span>
                        <span className="text-xl font-bold text-text">{serviceMetrics[service.name]?.sonarqube?.coverage?.toFixed(1) || '0.0'}%</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Stage Build */}
                {serviceMetrics[service.name]?.stageBuild && (
                  <div className="mb-4 p-4 bg-background rounded-lg">
                    <h4 className="text-sm font-semibold text-text mb-3 mt-0">CI/CD Stage</h4>
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center text-[13px]">
                        <span className="font-semibold text-text-secondary">Status:</span>
                        <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-semibold capitalize ${serviceMetrics[service.name]?.stageBuild?.status === 'succeeded' ? 'bg-[rgba(34,197,94,0.1)] text-success' : serviceMetrics[service.name]?.stageBuild?.status === 'failed' ? 'bg-[rgba(239,68,68,0.1)] text-error' : serviceMetrics[service.name]?.stageBuild?.status === 'partiallysucceeded' ? 'bg-[rgba(255,187,40,0.1)] text-[#FFBB28]' : 'bg-[rgba(156,163,175,0.1)] text-text-secondary'}`}>
                          {serviceMetrics[service.name]?.stageBuild?.status}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[13px]">
                        <span className="font-semibold text-text-secondary">Build:</span>
                        <span className="text-text font-mono text-xs">{serviceMetrics[service.name]?.stageBuild?.buildNumber}</span>
                      </div>
                      <div className="flex justify-between items-center text-[13px]">
                        <span className="font-semibold text-text-secondary">Branch:</span>
                        <span className="text-text font-mono text-xs">{serviceMetrics[service.name]?.stageBuild?.sourceBranch}</span>
                      </div>
                      <div className="flex justify-between items-center text-[13px]">
                        <span className="font-semibold text-text-secondary">Finished:</span>
                        <span className="text-text font-mono text-xs">
                          {serviceMetrics[service.name]?.stageBuild?.finishTime && new Date(serviceMetrics[service.name]?.stageBuild?.finishTime!).toLocaleString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Main Build */}
                {serviceMetrics[service.name]?.mainBuild && (
                  <div className="mb-4 p-4 bg-background rounded-lg">
                    <h4 className="text-sm font-semibold text-text mb-3 mt-0">CI/CD Prod</h4>
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center text-[13px]">
                        <span className="font-semibold text-text-secondary">Status:</span>
                        <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-semibold capitalize ${serviceMetrics[service.name]?.mainBuild?.status === 'succeeded' ? 'bg-[rgba(34,197,94,0.1)] text-success' : serviceMetrics[service.name]?.mainBuild?.status === 'failed' ? 'bg-[rgba(239,68,68,0.1)] text-error' : serviceMetrics[service.name]?.mainBuild?.status === 'partiallysucceeded' ? 'bg-[rgba(255,187,40,0.1)] text-[#FFBB28]' : 'bg-[rgba(156,163,175,0.1)] text-text-secondary'}`}>
                          {serviceMetrics[service.name]?.mainBuild?.status}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[13px]">
                        <span className="font-semibold text-text-secondary">Build:</span>
                        <span className="text-text font-mono text-xs">{serviceMetrics[service.name]?.mainBuild?.buildNumber}</span>
                      </div>
                      <div className="flex justify-between items-center text-[13px]">
                        <span className="font-semibold text-text-secondary">Branch:</span>
                        <span className="text-text font-mono text-xs">{serviceMetrics[service.name]?.mainBuild?.sourceBranch}</span>
                      </div>
                      <div className="flex justify-between items-center text-[13px]">
                        <span className="font-semibold text-text-secondary">Finished:</span>
                        <span className="text-text font-mono text-xs">
                          {serviceMetrics[service.name]?.mainBuild?.finishTime && new Date(serviceMetrics[service.name]?.mainBuild?.finishTime!).toLocaleString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Kubernetes Pods - Stage */}
                {serviceStatus[service.name]?.stageStatus?.pods && serviceStatus[service.name]?.stageStatus?.pods!.length > 0 && (
                  <div className="mb-4 p-4 bg-background rounded-lg">
                    <h4 className="text-sm font-semibold text-text mb-3 mt-0">Pods - Stage ({serviceStatus[service.name]?.stageStatus?.pods!.length})</h4>
                    <div className="space-y-2">
                      {serviceStatus[service.name]?.stageStatus?.pods!.map((pod, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs p-2 bg-surface rounded border border-border">
                          <div className="flex-1 min-w-0">
                            <div className="font-mono text-text truncate">{pod.name}</div>
                            <div className="text-text-secondary mt-1">
                              Namespace: {pod.namespace} • Age: {pod.age}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-2">
                            <span className={`px-2 py-1 rounded text-xs font-semibold whitespace-nowrap ${
                              pod.status === 'Running' ? 'bg-success/10 text-success' :
                              pod.status === 'Pending' ? 'bg-warning/10 text-warning' :
                              'bg-error/10 text-error'
                            }`}>
                              {pod.status}
                            </span>
                            <span className="text-text-secondary">{pod.ready}</span>
                            {pod.restarts > 0 && (
                              <span className="text-warning text-xs">↻{pod.restarts}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Kubernetes Pods - Prod */}
                {serviceStatus[service.name]?.prodStatus?.pods && serviceStatus[service.name]?.prodStatus?.pods!.length > 0 && (
                  <div className="mb-4 p-4 bg-background rounded-lg">
                    <h4 className="text-sm font-semibold text-text mb-3 mt-0">Pods - Prod ({serviceStatus[service.name]?.prodStatus?.pods!.length})</h4>
                    <div className="space-y-2">
                      {serviceStatus[service.name]?.prodStatus?.pods!.map((pod, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs p-2 bg-surface rounded border border-border">
                          <div className="flex-1 min-w-0">
                            <div className="font-mono text-text truncate">{pod.name}</div>
                            <div className="text-text-secondary mt-1">
                              Namespace: {pod.namespace} • Age: {pod.age}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-2">
                            <span className={`px-2 py-1 rounded text-xs font-semibold whitespace-nowrap ${
                              pod.status === 'Running' ? 'bg-success/10 text-success' :
                              pod.status === 'Pending' ? 'bg-warning/10 text-warning' :
                              'bg-error/10 text-error'
                            }`}>
                              {pod.status}
                            </span>
                            <span className="text-text-secondary">{pod.ready}</span>
                            {pod.restarts > 0 && (
                              <span className="text-warning text-xs">↻{pod.restarts}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-border">
                  {service.repositoryUrl && (
                    <a
                      href={service.repositoryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-background text-primary border border-border rounded-md text-[13px] font-medium no-underline transition-all duration-200 hover:bg-primary hover:text-white hover:border-primary hover:-translate-y-px"
                    >
                      <ExternalLink size={16} />
                      <span>Repositório</span>
                    </a>
                  )}
                  <a
                    href={`/ci?repo=${service.name}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-background text-primary border border-border rounded-md text-[13px] font-medium no-underline transition-all duration-200 hover:bg-primary hover:text-white hover:border-primary hover:-translate-y-px"
                    title="Ver pipelines no CI/CD"
                  >
                    <GitMerge size={16} />
                    <span>Pipeline</span>
                  </a>
                  <a
                    href={`/quality?project=${service.name}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-background text-primary border border-border rounded-md text-[13px] font-medium no-underline transition-all duration-200 hover:bg-primary hover:text-white hover:border-primary hover:-translate-y-px"
                    title="Ver qualidade no SonarQube"
                  >
                    <Shield size={16} />
                    <span>Qualidade</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ServicesPage
