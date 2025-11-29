import { useState, useEffect } from 'react'
import { Box, RefreshCw, ExternalLink, Activity, Code, Users, GitBranch, Shield, Bug, TrendingUp, AlertTriangle, Server, Container, CheckCircle2, XCircle, Search, Folder, RotateCw } from 'lucide-react'
import { getMockServiceCatalog, getMockServiceCatalogMetrics, getMockServiceCatalogStatus } from '../mocks/data/services'

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
      const data = await getMockServiceCatalog()
      const fetchedServices = data.services || []
      setServices(fetchedServices)

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
      const data = await getMockServiceCatalogMetrics(serviceNames)
      setServiceMetrics(data.metrics || {})
    } catch (err: any) {
      console.error('Failed to fetch service metrics:', err)
    } finally {
      setLoadingMetrics(false)
    }
  }

  const fetchServicesStatus = async (serviceNames: string[]) => {
    try {
      const statusPromises = serviceNames.map(async (serviceName) => {
        try {
          const status = await getMockServiceCatalogStatus(serviceName)
          if (status) {
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
      await new Promise(resolve => setTimeout(resolve, 1000))
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

  const stats = {
    total: services.length,
    withStage: services.filter(s => s.hasStage).length,
    withProd: services.filter(s => s.hasProd).length,
    squads: squads.length,
  }

  return (
    <div className="max-w-[1800px] mx-auto px-6 py-8 min-h-screen bg-background">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center shadow-lg">
              <Box className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-text m-0 mb-2">Catálogo de Serviços</h1>
              <p className="text-lg text-text-secondary m-0">Descoberta automática via Kubernetes</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              className="flex items-center gap-2 px-6 py-3 bg-success text-white border-0 rounded-xl text-sm font-semibold cursor-pointer transition-all duration-200 hover:bg-success/90 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed shadow-md"
              onClick={syncServices}
              disabled={syncing}
            >
              <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
              <span>{syncing ? 'Sincronizando...' : 'Sincronizar'}</span>
            </button>
            <button
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white border-0 rounded-xl text-sm font-semibold cursor-pointer transition-all duration-200 hover:bg-primary/90 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed shadow-md"
              onClick={fetchServices}
              disabled={loading}
            >
              <RefreshCw size={18} />
              <span>Atualizar</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-surface border border-border rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center">
                <Box className="w-7 h-7 text-primary" />
              </div>
              <div>
                <div className="text-3xl font-bold text-text">{stats.total}</div>
                <div className="text-sm font-medium text-text-secondary">Total de Serviços</div>
              </div>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-warning/10 rounded-xl flex items-center justify-center">
                <Server className="w-7 h-7 text-warning" />
              </div>
              <div>
                <div className="text-3xl font-bold text-text">{stats.withStage}</div>
                <div className="text-sm font-medium text-text-secondary">Ambientes Staging</div>
              </div>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-success/10 rounded-xl flex items-center justify-center">
                <Server className="w-7 h-7 text-success" />
              </div>
              <div>
                <div className="text-3xl font-bold text-text">{stats.withProd}</div>
                <div className="text-sm font-medium text-text-secondary">Ambientes Production</div>
              </div>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center">
                <Users className="w-7 h-7 text-primary" />
              </div>
              <div>
                <div className="text-3xl font-bold text-text">{stats.squads}</div>
                <div className="text-sm font-medium text-text-secondary">Squads</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary" />
            <input
              type="text"
              placeholder="Buscar por nome, squad ou aplicação..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full pl-12 pr-5 py-3 border border-border rounded-xl text-sm bg-surface text-text transition-all duration-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm"
            />
          </div>
          <div className="relative">
            <Folder className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary pointer-events-none" />
            <select
              value={squadFilter}
              onChange={(e) => setSquadFilter(e.target.value)}
              className="pl-12 pr-5 py-3 border border-border rounded-xl text-sm bg-surface text-text cursor-pointer min-w-[220px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm"
            >
              <option value="all">Todas as Squads</option>
              {squads.map(squad => (
                <option key={squad} value={squad}>{squad}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="min-h-[400px]">
        {error && (
          <div className="flex items-center gap-3 bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6 text-red-700">
            <AlertTriangle size={20} />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {loading && !error && (
          <div className="text-center py-20">
            <RefreshCw size={64} className="animate-spin mx-auto mb-4 text-primary" />
            <p className="text-lg font-medium text-text-secondary">Carregando serviços...</p>
          </div>
        )}

        {!loading && !error && filteredServices.length === 0 && (
          <div className="text-center py-20">
            <Box size={80} className="text-text-secondary/20 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-text mb-2">Nenhum serviço encontrado</h2>
            <p className="text-text-secondary">
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
              const metrics = serviceMetrics[service.name]

              return (
                <div key={service.id} className="bg-surface border-2 border-border rounded-2xl overflow-hidden transition-all duration-300 hover:border-primary hover:shadow-2xl hover:-translate-y-1">
                  <div className="p-6 border-b border-border bg-background/30">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Box size={20} className="text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-text truncate mb-1">{service.name}</h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-1 bg-surface text-text-secondary rounded-lg text-xs font-semibold flex items-center gap-1.5">
                              <Users size={12} />
                              {service.squad}
                            </span>
                            <span className="px-2.5 py-1 bg-surface text-text-secondary rounded-lg text-xs font-semibold flex items-center gap-1.5">
                              <Code size={12} />
                              {service.language}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 ml-3">
                        {service.hasStage && (
                          <span className="px-3 py-1 bg-warning/10 text-warning rounded-lg text-xs font-bold text-center">STAGING</span>
                        )}
                        {service.hasProd && (
                          <span className="px-3 py-1 bg-success/10 text-success rounded-lg text-xs font-bold text-center">PROD</span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-background border border-border rounded-lg">
                        <div className="text-xs font-semibold text-text-secondary uppercase mb-1">Aplicação</div>
                        <div className="text-sm font-bold text-text">{service.application}</div>
                      </div>
                      <div className="p-3 bg-background border border-border rounded-lg">
                        <div className="text-xs font-semibold text-text-secondary uppercase mb-1">Versão</div>
                        <div className="text-sm font-bold text-text font-mono">{service.version}</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    {metrics?.sonarqube && (
                      <div>
                        <h4 className="text-xs font-bold text-text-secondary uppercase mb-3 flex items-center gap-2">
                          <Shield size={14} />
                          Qualidade de Código
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                            <div className="flex items-center gap-2 mb-2">
                              <Bug size={16} className="text-red-400" />
                              <span className="text-xs font-bold text-text-secondary">Bugs</span>
                            </div>
                            <div className="text-2xl font-bold text-red-400">{formatNumber(metrics.sonarqube.bugs)}</div>
                          </div>
                          <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                            <div className="flex items-center gap-2 mb-2">
                              <Shield size={16} className="text-orange-400" />
                              <span className="text-xs font-bold text-text-secondary">Vulnerab.</span>
                            </div>
                            <div className="text-2xl font-bold text-orange-400">{formatNumber(metrics.sonarqube.vulnerabilities)}</div>
                          </div>
                          <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                            <div className="flex items-center gap-2 mb-2">
                              <Code size={16} className="text-yellow-400" />
                              <span className="text-xs font-bold text-text-secondary">Code Smells</span>
                            </div>
                            <div className="text-2xl font-bold text-yellow-400">{formatNumber(metrics.sonarqube.codeSmells)}</div>
                          </div>
                          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                            <div className="flex items-center gap-2 mb-2">
                              <TrendingUp size={16} className="text-green-400" />
                              <span className="text-xs font-bold text-text-secondary">Cobertura</span>
                            </div>
                            <div className="text-2xl font-bold text-green-400">{metrics.sonarqube.coverage?.toFixed(1) || '0.0'}%</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {(metrics?.stageBuild || metrics?.mainBuild) && (
                      <div>
                        <h4 className="text-xs font-bold text-text-secondary uppercase mb-3 flex items-center gap-2">
                          <GitBranch size={14} />
                          CI/CD Status
                        </h4>
                        <div className="space-y-3">
                          {metrics.stageBuild && (
                            <div className="p-4 bg-background border border-border rounded-xl">
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-bold text-text-secondary uppercase">Staging</span>
                                <span className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
                                  metrics.stageBuild.status === 'succeeded' ? 'bg-green-500/20 text-green-400' :
                                  metrics.stageBuild.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                                  'bg-yellow-500/20 text-yellow-400'
                                }`}>
                                  {metrics.stageBuild.status === 'succeeded' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                                  {metrics.stageBuild.status}
                                </span>
                              </div>
                              <div className="space-y-1.5 text-xs">
                                <div className="flex justify-between">
                                  <span className="text-text-secondary">Build:</span>
                                  <span className="text-text font-mono font-semibold">{metrics.stageBuild.buildNumber}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-text-secondary">Branch:</span>
                                  <span className="text-text font-mono">{metrics.stageBuild.sourceBranch}</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {metrics.mainBuild && (
                            <div className="p-4 bg-background border border-border rounded-xl">
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-bold text-text-secondary uppercase">Production</span>
                                <span className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
                                  metrics.mainBuild.status === 'succeeded' ? 'bg-green-500/20 text-green-400' :
                                  metrics.mainBuild.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                                  'bg-yellow-500/20 text-yellow-400'
                                }`}>
                                  {metrics.mainBuild.status === 'succeeded' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                                  {metrics.mainBuild.status}
                                </span>
                              </div>
                              <div className="space-y-1.5 text-xs">
                                <div className="flex justify-between">
                                  <span className="text-text-secondary">Build:</span>
                                  <span className="text-text font-mono font-semibold">{metrics.mainBuild.buildNumber}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-text-secondary">Branch:</span>
                                  <span className="text-text font-mono">{metrics.mainBuild.sourceBranch}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {hasPods && (
                      <div>
                        <h4 className="text-xs font-bold text-text-secondary uppercase mb-3 flex items-center gap-2">
                          <Container size={14} />
                          Infraestrutura
                        </h4>
                        <div className="space-y-4">
                          {serviceStatus[service.name]?.stageStatus?.pods && serviceStatus[service.name]?.stageStatus?.pods!.length > 0 && (
                            <div>
                              <div className="text-xs font-bold text-text-secondary mb-2 flex items-center gap-2">
                                <Container size={12} className="text-warning" />
                                STAGING ({serviceStatus[service.name]?.stageStatus?.pods!.length} pods)
                              </div>
                              <div className="space-y-2">
                                {serviceStatus[service.name]?.stageStatus?.pods!.map((pod, idx) => (
                                  <div key={idx} className="p-3 bg-background border border-border rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-xs font-mono text-text truncate flex-1 mr-2">{pod.name}</span>
                                      <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                          pod.status === 'Running' ? 'bg-green-500/20 text-green-400' :
                                          pod.status === 'Pending' ? 'bg-yellow-500/20 text-yellow-400' :
                                          'bg-red-500/20 text-red-400'
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
                                          <span className="text-warning font-semibold flex items-center gap-1">
                                            <RotateCw size={12} />
                                            {pod.restarts}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {serviceStatus[service.name]?.prodStatus?.pods && serviceStatus[service.name]?.prodStatus?.pods!.length > 0 && (
                            <div className={serviceStatus[service.name]?.stageStatus?.pods && serviceStatus[service.name]?.stageStatus?.pods!.length > 0 ? 'pt-4 border-t border-border' : ''}>
                              <div className="text-xs font-bold text-text-secondary mb-2 flex items-center gap-2">
                                <Container size={12} className="text-success" />
                                PRODUCTION ({serviceStatus[service.name]?.prodStatus?.pods!.length} pods)
                              </div>
                              <div className="space-y-2">
                                {serviceStatus[service.name]?.prodStatus?.pods!.map((pod, idx) => (
                                  <div key={idx} className="p-3 bg-background border border-border rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-xs font-mono text-text truncate flex-1 mr-2">{pod.name}</span>
                                      <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                          pod.status === 'Running' ? 'bg-green-500/20 text-green-400' :
                                          pod.status === 'Pending' ? 'bg-yellow-500/20 text-yellow-400' :
                                          'bg-red-500/20 text-red-400'
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
                                          <span className="text-warning font-semibold flex items-center gap-1">
                                            <RotateCw size={12} />
                                            {pod.restarts}
                                          </span>
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

                    {service.repositoryUrl && (
                      <a
                        href={service.repositoryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all shadow-md hover:shadow-lg"
                      >
                        <ExternalLink size={16} />
                        <span>Ver Repositório</span>
                      </a>
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
