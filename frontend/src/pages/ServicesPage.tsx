import { useState, useEffect } from 'react'
import { Box, RefreshCw, ExternalLink, Activity, Code, Users, GitBranch, Shield, Bug, TrendingUp, AlertTriangle, Server, Container } from 'lucide-react'
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

  // Calculate stats
  const stats = {
    total: services.length,
    withStage: services.filter(s => s.hasStage).length,
    withProd: services.filter(s => s.hasProd).length,
    squads: squads.length,
  }

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
              <Box className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-text m-0">Catálogo de Serviços</h1>
              <p className="text-sm text-text-secondary mt-1">Descoberta automática via Kubernetes</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              className="flex items-center gap-2 px-5 py-2.5 bg-success text-white border-0 rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200 hover:bg-success/90 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={syncServices}
              disabled={syncing}
            >
              <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
              <span>{syncing ? 'Sincronizando...' : 'Sincronizar'}</span>
            </button>
            <button
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white border-0 rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200 hover:bg-primary/90 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={fetchServices}
              disabled={loading}
            >
              <RefreshCw size={18} />
              <span>Atualizar</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-surface border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Box className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold text-text">{stats.total}</div>
                <div className="text-sm text-text-secondary">Total de Serviços</div>
              </div>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                <Server className="w-6 h-6 text-warning" />
              </div>
              <div>
                <div className="text-2xl font-bold text-text">{stats.withStage}</div>
                <div className="text-sm text-text-secondary">Ambientes Staging</div>
              </div>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                <Server className="w-6 h-6 text-success" />
              </div>
              <div>
                <div className="text-2xl font-bold text-text">{stats.withProd}</div>
                <div className="text-sm text-text-secondary">Ambientes Production</div>
              </div>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold text-text">{stats.squads}</div>
                <div className="text-sm text-text-secondary">Squads</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="🔍 Buscar por nome, squad ou aplicação..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="flex-1 px-4 py-2.5 border border-border rounded-lg text-sm bg-surface text-text transition-all duration-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <select
            value={squadFilter}
            onChange={(e) => setSquadFilter(e.target.value)}
            className="px-4 py-2.5 border border-border rounded-lg text-sm bg-surface text-text cursor-pointer min-w-[200px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">📂 Todas as Squads</option>
            {squads.map(squad => (
              <option key={squad} value={squad}>{squad}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {error && (
          <div className="flex items-center gap-3 bg-error/10 border border-error rounded-xl p-4 mb-6 text-error">
            <Activity size={20} />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {loading && !error && (
          <div className="text-center py-20 text-text-secondary">
            <RefreshCw size={48} className="animate-spin mx-auto mb-4 opacity-50" />
            <p className="text-lg">Carregando serviços...</p>
          </div>
        )}

        {!loading && !error && filteredServices.length === 0 && (
          <div className="text-center py-20">
            <Box size={64} className="text-text-secondary opacity-20 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-text mb-2">Nenhum serviço encontrado</h2>
            <p className="text-sm text-text-secondary">
              {filter || squadFilter !== 'all'
                ? 'Tente ajustar os filtros de busca'
                : 'Clique em "Sincronizar" para descobrir serviços do Kubernetes'}
            </p>
          </div>
        )}

        {!loading && !error && filteredServices.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredServices.map(service => {
              const hasPods = (serviceStatus[service.name]?.stageStatus?.pods && serviceStatus[service.name]?.stageStatus?.pods!.length > 0) ||
                             (serviceStatus[service.name]?.prodStatus?.pods && serviceStatus[service.name]?.prodStatus?.pods!.length > 0)

              return (
                <div key={service.id} className="bg-[#1E1E1E] border border-border rounded-xl overflow-hidden transition-all duration-200 hover:border-primary hover:shadow-xl">
                  {/* Card Header */}
                  <div className="p-5 border-b border-border bg-background/50">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Box size={18} className="text-primary flex-shrink-0" />
                        <h3 className="text-base font-semibold text-text truncate">{service.name}</h3>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        {service.hasStage && (
                          <span className="px-2 py-1 bg-warning/10 text-warning rounded text-xs font-semibold">Staging</span>
                        )}
                        {service.hasProd && (
                          <span className="px-2 py-1 bg-success/10 text-success rounded text-xs font-semibold">Production</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-surface text-text-secondary rounded-md text-xs font-medium border border-border">
                        <Users size={14} />
                        <span>{service.squad}</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-surface text-text-secondary rounded-md text-xs font-medium border border-border">
                        <Code size={14} />
                        <span>{service.language}</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-surface text-text-secondary rounded-md text-xs font-medium border border-border">
                        <GitBranch size={14} />
                        <span>{service.repositoryType}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-5">
                    {/* Info Section */}
                    <div className="mb-5">
                      <h4 className="text-xs font-bold text-text-secondary uppercase mb-3 flex items-center gap-2">
                        <Activity size={14} />
                        Informações
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-text-secondary">Aplicação:</span>
                          <span className="text-text font-medium">{service.application}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-text-secondary">Versão da linguagem:</span>
                          <span className="text-text font-mono">{service.version}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-text-secondary">Namespace:</span>
                          <span className="text-text font-mono">{service.namespace}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-text-secondary">Infraestrutura:</span>
                          <span className="text-text">{service.infra}</span>
                        </div>
                        {service.repositoryUrl && (
                          <div className="pt-3 mt-3 border-t border-border">
                            <a
                              href={service.repositoryUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors no-underline"
                            >
                              <ExternalLink size={16} />
                              <span>Ver Repositório</span>
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quality Section */}
                    <div className="mb-5 pb-5 border-t border-border pt-5">
                      <h4 className="text-xs font-bold text-text-secondary uppercase mb-3 flex items-center gap-2">
                        <Shield size={14} />
                        Qualidade
                      </h4>
                      {loadingMetrics && !serviceMetrics[service.name] ? (
                        <div className="flex items-center justify-center py-8 text-text-secondary">
                          <RefreshCw size={20} className="animate-spin mr-2" />
                          <span className="text-sm">Carregando métricas...</span>
                        </div>
                      ) : serviceMetrics[service.name]?.sonarqube ? (
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-background rounded-lg border border-border">
                              <div className="flex items-center gap-2 mb-1">
                                <Bug size={16} className="text-error" />
                                <span className="text-xs text-text-secondary font-semibold">Bugs</span>
                              </div>
                              <div className="text-2xl font-bold text-text">{formatNumber(serviceMetrics[service.name]?.sonarqube?.bugs || 0)}</div>
                            </div>
                            <div className="p-3 bg-background rounded-lg border border-border">
                              <div className="flex items-center gap-2 mb-1">
                                <Shield size={16} className="text-error" />
                                <span className="text-xs text-text-secondary font-semibold">Vulnerab.</span>
                              </div>
                              <div className="text-2xl font-bold text-text">{formatNumber(serviceMetrics[service.name]?.sonarqube?.vulnerabilities || 0)}</div>
                            </div>
                            <div className="p-3 bg-background rounded-lg border border-border">
                              <div className="flex items-center gap-2 mb-1">
                                <Code size={16} className="text-warning" />
                                <span className="text-xs text-text-secondary font-semibold">Code Smells</span>
                              </div>
                              <div className="text-2xl font-bold text-text">{formatNumber(serviceMetrics[service.name]?.sonarqube?.codeSmells || 0)}</div>
                            </div>
                            <div className="p-3 bg-background rounded-lg border border-border">
                              <div className="flex items-center gap-2 mb-1">
                                <TrendingUp size={16} className="text-success" />
                                <span className="text-xs text-text-secondary font-semibold">Cobertura</span>
                              </div>
                              <div className="text-2xl font-bold text-text">{serviceMetrics[service.name]?.sonarqube?.coverage?.toFixed(1) || '0.0'}%</div>
                            </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-text-secondary text-sm">
                          Nenhuma métrica de qualidade disponível
                        </div>
                      )}
                    </div>

                    {/* CI/CD Section */}
                    <div className="mb-5 pb-5 border-t border-border pt-5">
                      <h4 className="text-xs font-bold text-text-secondary uppercase mb-3 flex items-center gap-2">
                        <GitBranch size={14} />
                        CI/CD
                      </h4>
                      {loadingMetrics && !serviceMetrics[service.name] ? (
                        <div className="flex items-center justify-center py-8 text-text-secondary">
                          <RefreshCw size={20} className="animate-spin mr-2" />
                          <span className="text-sm">Carregando builds...</span>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {serviceMetrics[service.name]?.stageBuild && (
                              <div className="p-3 bg-background rounded-lg border border-border">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs font-semibold text-text-secondary">STAGING</span>
                                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                    serviceMetrics[service.name]?.stageBuild?.status === 'succeeded' ? 'bg-success/10 text-success' :
                                    serviceMetrics[service.name]?.stageBuild?.status === 'failed' ? 'bg-error/10 text-error' :
                                    'bg-warning/10 text-warning'
                                  }`}>
                                    {serviceMetrics[service.name]?.stageBuild?.status}
                                  </span>
                                </div>
                                <div className="space-y-1.5 text-xs">
                                  <div className="flex justify-between">
                                    <span className="text-text-secondary">Build:</span>
                                    <span className="text-text font-mono">{serviceMetrics[service.name]?.stageBuild?.buildNumber}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-text-secondary">Branch:</span>
                                    <span className="text-text font-mono truncate max-w-[150px]">{serviceMetrics[service.name]?.stageBuild?.sourceBranch}</span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {serviceMetrics[service.name]?.mainBuild && (
                              <div className="p-3 bg-background rounded-lg border border-border">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs font-semibold text-text-secondary">PRODUCTION</span>
                                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                    serviceMetrics[service.name]?.mainBuild?.status === 'succeeded' ? 'bg-success/10 text-success' :
                                    serviceMetrics[service.name]?.mainBuild?.status === 'failed' ? 'bg-error/10 text-error' :
                                    'bg-warning/10 text-warning'
                                  }`}>
                                    {serviceMetrics[service.name]?.mainBuild?.status}
                                  </span>
                                </div>
                                <div className="space-y-1.5 text-xs">
                                  <div className="flex justify-between">
                                    <span className="text-text-secondary">Build:</span>
                                    <span className="text-text font-mono">{serviceMetrics[service.name]?.mainBuild?.buildNumber}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-text-secondary">Branch:</span>
                                    <span className="text-text font-mono truncate max-w-[150px]">{serviceMetrics[service.name]?.mainBuild?.sourceBranch}</span>
                                  </div>
                                </div>
                              </div>
                            )}

                          {!serviceMetrics[service.name]?.stageBuild && !serviceMetrics[service.name]?.mainBuild && (
                            <div className="text-center py-8 text-text-secondary text-sm">
                              Nenhum build disponível
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Pods Section */}
                    {hasPods && (
                      <div className="pb-5 border-t border-border pt-5">
                        <h4 className="text-xs font-bold text-text-secondary uppercase mb-3 flex items-center gap-2">
                          <Container size={14} />
                           Infraestrutura
                        </h4>
                        <div className="space-y-3">
                        {serviceStatus[service.name]?.stageStatus?.pods && serviceStatus[service.name]?.stageStatus?.pods!.length > 0 && (
                          <div>
                            <div className="text-xs font-semibold text-text-secondary mb-2 flex items-center gap-2">
                              <Container size={14} className="text-warning" />
                              STAGING ({serviceStatus[service.name]?.stageStatus?.pods!.length})
                            </div>
                            <div className="space-y-2">
                              {serviceStatus[service.name]?.stageStatus?.pods!.map((pod, idx) => (
                                <div key={idx} className="p-2.5 bg-background rounded-lg border border-border">
                                  <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-xs font-mono text-text truncate flex-1 mr-2">{pod.name}</span>
                                    <div className="flex items-center gap-1.5">
                                      <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${
                                        pod.status === 'Running' ? 'bg-success/10 text-success' :
                                        pod.status === 'Pending' ? 'bg-warning/10 text-warning' :
                                        'bg-error/10 text-error'
                                      }`}>
                                        {pod.status}
                                      </span>
                                      <span className="text-xs text-text-secondary">{pod.ready}</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-between text-xs text-text-secondary">
                                    <span>{pod.namespace}</span>
                                    <div className="flex items-center gap-2">
                                      <span>Age: {pod.age}</span>
                                      {pod.restarts > 0 && (
                                        <span className="text-warning font-semibold">↻{pod.restarts}</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {serviceStatus[service.name]?.prodStatus?.pods && serviceStatus[service.name]?.prodStatus?.pods!.length > 0 && (
                          <div className={serviceStatus[service.name]?.stageStatus?.pods && serviceStatus[service.name]?.stageStatus?.pods!.length > 0 ? 'pt-3 mt-3 border-t border-border' : ''}>
                            <div className="text-xs font-semibold text-text-secondary mb-2 flex items-center gap-2">
                              <Container size={14} className="text-success" />
                              PRODUCTION ({serviceStatus[service.name]?.prodStatus?.pods!.length})
                            </div>
                            <div className="space-y-2">
                              {serviceStatus[service.name]?.prodStatus?.pods!.map((pod, idx) => (
                                <div key={idx} className="p-2.5 bg-background rounded-lg border border-border">
                                  <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-xs font-mono text-text truncate flex-1 mr-2">{pod.name}</span>
                                    <div className="flex items-center gap-1.5">
                                      <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${
                                        pod.status === 'Running' ? 'bg-success/10 text-success' :
                                        pod.status === 'Pending' ? 'bg-warning/10 text-warning' :
                                        'bg-error/10 text-error'
                                      }`}>
                                        {pod.status}
                                      </span>
                                      <span className="text-xs text-text-secondary">{pod.ready}</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-between text-xs text-text-secondary">
                                    <span>{pod.namespace}</span>
                                    <div className="flex items-center gap-2">
                                      <span>Age: {pod.age}</span>
                                      {pod.restarts > 0 && (
                                        <span className="text-warning font-semibold">↻{pod.restarts}</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default ServicesPage
