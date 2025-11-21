import { useState, useEffect } from 'react'
import { Box, RefreshCw, ExternalLink, Activity, Code, Users, GitBranch, BarChart3, GitMerge, Shield, Bug, TrendingUp, AlertTriangle } from 'lucide-react'
import { buildApiUrl } from '../config/api'
import PageContainer from '../components/Layout/PageContainer'
import PageHeader from '../components/Layout/PageHeader'
import Section from '../components/Layout/Section'
import EmptyState from '../components/UI/EmptyState'
import styles from './ServicesPage.module.css'

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

interface ServiceStatus {
  serviceName: string
  stageStatus?: {
    environment: string
    status: string
    replicas: number
    availableReplicas: number
    image: string
  }
  prodStatus?: {
    environment: string
    status: string
    replicas: number
    availableReplicas: number
    image: string
  }
}

function ServicesPage() {
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [serviceMetrics, setServiceMetrics] = useState<Record<string, ServiceMetrics>>({})
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
      console.log('Services API response:', data)
      console.log('Services data structure:', data.data)
      const fetchedServices = data.data?.services || []
      console.log('Fetched services:', fetchedServices.length, 'services', fetchedServices)
      setServices(fetchedServices)

      // Fetch metrics for all services
      if (fetchedServices.length > 0) {
        await fetchServicesMetrics(fetchedServices.map((s: Service) => s.name))
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
      console.log('Service metrics:', data.data?.metrics)
      setServiceMetrics(data.data?.metrics || {})
    } catch (err: any) {
      console.error('Failed to fetch service metrics:', err)
      // Don't show error to user, just log it
    } finally {
      setLoadingMetrics(false)
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Running':
        return styles.statusRunning
      case 'Failed':
        return styles.statusFailed
      case 'Pending':
        return styles.statusPending
      default:
        return styles.statusUnknown
    }
  }

  const squads = Array.from(new Set(services.map(s => s.squad))).sort()

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(filter.toLowerCase()) ||
      service.squad.toLowerCase().includes(filter.toLowerCase()) ||
      service.application.toLowerCase().includes(filter.toLowerCase())
    const matchesSquad = squadFilter === 'all' || service.squad === squadFilter

    return matchesSearch && matchesSquad
  })

  console.log('ServicesPage render:', {
    totalServices: services.length,
    filteredServices: filteredServices.length,
    filter,
    squadFilter,
    loading,
    error
  })

  return (
    <PageContainer maxWidth="xl">
      <PageHeader
        icon={Box}
        title="Catálogo de Serviços"
        subtitle={`${services.length} serviços descobertos automaticamente do Kubernetes`}
        actions={
          <>
            <button
              className={styles.syncButton}
              onClick={syncServices}
              disabled={syncing}
            >
              <RefreshCw size={20} className={syncing ? styles.spinning : ''} />
              <span>{syncing ? 'Sincronizando...' : 'Sincronizar'}</span>
            </button>
            <button className={styles.refreshButton} onClick={fetchServices} disabled={loading}>
              <RefreshCw size={20} />
              <span>Atualizar</span>
            </button>
          </>
        }
      />

      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Buscar por nome, squad ou aplicação..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className={styles.searchInput}
        />
        <select
          value={squadFilter}
          onChange={(e) => setSquadFilter(e.target.value)}
          className={styles.squadFilter}
        >
          <option value="all">Todas as Squads</option>
          {squads.map(squad => (
            <option key={squad} value={squad}>{squad}</option>
          ))}
        </select>
      </div>

      <Section spacing="lg">
        {error && (
          <div className={styles.error}>
            <Activity size={20} />
            <span>{error}</span>
          </div>
        )}

        {loading && !error && <div className={styles.loading}>Carregando serviços...</div>}

        {!loading && !error && filteredServices.length === 0 && (
          <EmptyState
            icon={Box}
            title="Nenhum serviço encontrado"
            description={
              filter || squadFilter !== 'all'
                ? 'Tente ajustar os filtros de busca'
                : 'Clique em "Sincronizar" para descobrir serviços do Kubernetes'
            }
          />
        )}

        {!loading && !error && filteredServices.length > 0 && (
          <div className={styles.grid}>
            {filteredServices.map(service => (
              <div key={service.id} className={styles.serviceCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.serviceName}>
                    <Box size={20} />
                    <h3>{service.name}</h3>
                  </div>
                  <div className={styles.squad}>
                    <Users size={16} />
                    <span>{service.squad}</span>
                  </div>
                </div>

                <div className={styles.cardBody}>
                  <div className={styles.info}>
                    <Code size={16} />
                    <span>{service.language} {service.version}</span>
                  </div>
                  <div className={styles.info}>
                    <GitBranch size={16} />
                    <span>{service.repositoryType}</span>
                  </div>
                </div>

                <div className={styles.environments}>
                  {service.hasStage && (
                    <div className={styles.env}>
                      <span className={styles.envLabel}>Stage</span>
                      <span className={`${styles.envStatus} ${styles.statusRunning}`}>
                        Disponível
                      </span>
                    </div>
                  )}
                  {service.hasProd && (
                    <div className={styles.env}>
                      <span className={styles.envLabel}>Prod</span>
                      <span className={`${styles.envStatus} ${styles.statusRunning}`}>
                        Disponível
                      </span>
                    </div>
                  )}
                </div>

                {/* Loading Metrics */}
                {loadingMetrics && !serviceMetrics[service.name] && (
                  <div className={styles.metricsLoading}>
                    <RefreshCw size={20} className={styles.spinning} />
                    <span>Carregando métricas e pipelines...</span>
                  </div>
                )}

                {/* SonarQube Metrics */}
                {serviceMetrics[service.name]?.sonarqube && (
                  <div className={styles.metricsSection}>
                    <h4 className={styles.metricsTitle}>SonarQube</h4>
                    <div className={styles.metricsGrid}>
                      <div className={styles.metric}>
                        <Bug size={14} style={{ color: 'var(--color-error)' }} />
                        <span className={styles.metricLabel}>Bugs</span>
                        <span className={styles.metricValue}>{formatNumber(serviceMetrics[service.name].sonarqube.bugs)}</span>
                      </div>
                      <div className={styles.metric}>
                        <Shield size={14} style={{ color: 'var(--color-error)' }} />
                        <span className={styles.metricLabel}>Vulnerabilidades</span>
                        <span className={styles.metricValue}>{formatNumber(serviceMetrics[service.name].sonarqube.vulnerabilities)}</span>
                      </div>
                      <div className={styles.metric}>
                        <Code size={14} style={{ color: 'var(--color-warning)' }} />
                        <span className={styles.metricLabel}>Code Smells</span>
                        <span className={styles.metricValue}>{formatNumber(serviceMetrics[service.name].sonarqube.codeSmells)}</span>
                      </div>
                      <div className={styles.metric}>
                        <AlertTriangle size={14} style={{ color: 'var(--color-warning)' }} />
                        <span className={styles.metricLabel}>Security Hotspots</span>
                        <span className={styles.metricValue}>{formatNumber(serviceMetrics[service.name].sonarqube.securityHotspots)}</span>
                      </div>
                      <div className={styles.metric}>
                        <TrendingUp size={14} style={{ color: 'var(--color-success)' }} />
                        <span className={styles.metricLabel}>Cobertura</span>
                        <span className={styles.metricValue}>{serviceMetrics[service.name].sonarqube.coverage.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Stage Build */}
                {serviceMetrics[service.name]?.stageBuild && (
                  <div className={styles.buildSection}>
                    <h4 className={styles.buildTitle}>CI/CD Stage</h4>
                    <div className={styles.buildInfo}>
                      <div className={styles.buildRow}>
                        <span className={styles.buildLabel}>Status:</span>
                        <span className={`${styles.buildStatus} ${styles[`status${serviceMetrics[service.name].stageBuild.status}`]}`}>
                          {serviceMetrics[service.name].stageBuild.status}
                        </span>
                      </div>
                      <div className={styles.buildRow}>
                        <span className={styles.buildLabel}>Build:</span>
                        <span className={styles.buildValue}>{serviceMetrics[service.name].stageBuild.buildNumber}</span>
                      </div>
                      <div className={styles.buildRow}>
                        <span className={styles.buildLabel}>Branch:</span>
                        <span className={styles.buildValue}>{serviceMetrics[service.name].stageBuild.sourceBranch}</span>
                      </div>
                      <div className={styles.buildRow}>
                        <span className={styles.buildLabel}>Finished:</span>
                        <span className={styles.buildValue}>
                          {new Date(serviceMetrics[service.name].stageBuild.finishTime).toLocaleString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Main Build */}
                {serviceMetrics[service.name]?.mainBuild && (
                  <div className={styles.buildSection}>
                    <h4 className={styles.buildTitle}>CI/CD Prod</h4>
                    <div className={styles.buildInfo}>
                      <div className={styles.buildRow}>
                        <span className={styles.buildLabel}>Status:</span>
                        <span className={`${styles.buildStatus} ${styles[`status${serviceMetrics[service.name].mainBuild.status}`]}`}>
                          {serviceMetrics[service.name].mainBuild.status}
                        </span>
                      </div>
                      <div className={styles.buildRow}>
                        <span className={styles.buildLabel}>Build:</span>
                        <span className={styles.buildValue}>{serviceMetrics[service.name].mainBuild.buildNumber}</span>
                      </div>
                      <div className={styles.buildRow}>
                        <span className={styles.buildLabel}>Branch:</span>
                        <span className={styles.buildValue}>{serviceMetrics[service.name].mainBuild.sourceBranch}</span>
                      </div>
                      <div className={styles.buildRow}>
                        <span className={styles.buildLabel}>Finished:</span>
                        <span className={styles.buildValue}>
                          {new Date(serviceMetrics[service.name].mainBuild.finishTime).toLocaleString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className={styles.cardFooter}>
                  {service.repositoryUrl && (
                    <a
                      href={service.repositoryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.link}
                    >
                      <ExternalLink size={16} />
                      <span>Repositório</span>
                    </a>
                  )}
                  <a
                    href={`/ci?repo=${service.name}`}
                    className={styles.link}
                    title="Ver pipelines no CI/CD"
                  >
                    <GitMerge size={16} />
                    <span>Pipeline</span>
                  </a>
                  <a
                    href={`/quality?project=${service.name}`}
                    className={styles.link}
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
      </Section>
    </PageContainer>
  )
}

export default ServicesPage
