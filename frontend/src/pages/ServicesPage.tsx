import { useState, useEffect } from 'react'
import { Box, RefreshCw, ExternalLink, Activity, Code, Users, GitBranch, BarChart3, GitMerge, Shield } from 'lucide-react'
import { buildApiUrl } from '../config/api'
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
  const [filter, setFilter] = useState('')
  const [squadFilter, setSquadFilter] = useState('all')

  const fetchServices = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(buildApiUrl('service-catalog'))
      if (!response.ok) {
        throw new Error('Failed to fetch services')
      }

      const data = await response.json()
      setServices(data.services || [])
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar serviços')
    } finally {
      setLoading(false)
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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <Box size={32} className={styles.headerIcon} />
          <div>
            <h1 className={styles.title}>Catálogo de Serviços</h1>
            <p className={styles.subtitle}>
              {services.length} serviços descobertos automaticamente do Kubernetes
            </p>
          </div>
        </div>
        <div className={styles.headerActions}>
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
        </div>
      </div>

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

      <div className={styles.content}>
        {error && (
          <div className={styles.error}>
            <Activity size={20} />
            <span>{error}</span>
          </div>
        )}

        {loading && !error && <div className={styles.loading}>Carregando serviços...</div>}

        {!loading && !error && filteredServices.length === 0 && (
          <div className={styles.empty}>
            <Box size={64} className={styles.emptyIcon} />
            <h2>Nenhum serviço encontrado</h2>
            <p>
              {filter || squadFilter !== 'all'
                ? 'Tente ajustar os filtros de busca'
                : 'Clique em "Sincronizar" para descobrir serviços do Kubernetes'}
            </p>
          </div>
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
      </div>
    </div>
  )
}

export default ServicesPage
