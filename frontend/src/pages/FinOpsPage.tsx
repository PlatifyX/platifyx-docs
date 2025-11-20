import { useState, useEffect } from 'react'
import { DollarSign, TrendingUp, TrendingDown, Server, Activity, Package, Filter } from 'lucide-react'
import styles from './FinOpsPage.module.css'
import { buildApiUrl } from '../config/api'

interface FinOpsStats {
  totalCost: number
  monthlyCost: number
  dailyCost: number
  costTrend: number
  totalResources: number
  activeResources: number
  inactiveResources: number
  costByProvider: { [key: string]: number }
  costByService: { [key: string]: number }
  currency: string
}

interface CloudResource {
  provider: string
  integration: string
  resourceId: string
  resourceName: string
  resourceType: string
  resourceGroup?: string
  region: string
  status: string
  cost?: number
  tags?: { [key: string]: string }
}

type TabType = 'overview' | 'resources' | 'costs'

function FinOpsPage() {
  const [stats, setStats] = useState<FinOpsStats | null>(null)
  const [resources, setResources] = useState<CloudResource[]>([])
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [providerFilter, setProviderFilter] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
    fetchResources()
  }, [providerFilter])

  const fetchStats = async () => {
    try {
      const queryParams = new URLSearchParams()
      if (providerFilter) queryParams.append('provider', providerFilter)

      console.log('Fetching stats from:', buildApiUrl(`finops/stats?${queryParams}`))
      const response = await fetch(buildApiUrl(`finops/stats?${queryParams}`))

      if (!response.ok) {
        console.error('Stats response not OK:', response.status, response.statusText)
        const errorText = await response.text()
        console.error('Error response:', errorText)
        return
      }

      const data = await response.json()
      console.log('Stats data:', data)
      setStats(data)
    } catch (error) {
      console.error('Error fetching FinOps stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchResources = async () => {
    try {
      const queryParams = new URLSearchParams()
      if (providerFilter) queryParams.append('provider', providerFilter)

      console.log('Fetching resources from:', buildApiUrl(`finops/resources?${queryParams}`))
      const response = await fetch(buildApiUrl(`finops/resources?${queryParams}`))

      if (!response.ok) {
        console.error('Resources response not OK:', response.status, response.statusText)
        return
      }

      const data = await response.json()
      console.log('Resources data:', data)
      setResources(data || [])
    } catch (error) {
      console.error('Error fetching resources:', error)
    }
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: stats?.currency || 'USD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const getStatusColor = (status: string): string => {
    const lowerStatus = status.toLowerCase()
    if (lowerStatus.includes('running') || lowerStatus.includes('active') || lowerStatus.includes('available')) {
      return styles.statusActive
    }
    return styles.statusInactive
  }

  if (loading) {
    return <div className={styles.loading}>Loading...</div>
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <DollarSign size={40} className={styles.headerIcon} />
          <div>
            <h1 className={styles.title}>FinOps</h1>
            <p className={styles.subtitle}>Gestão de custos e otimização de recursos cloud</p>
          </div>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.filterBox}>
            <Filter size={18} />
            <select
              className={styles.filterSelect}
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value)}
            >
              <option value="">Todos os Provedores</option>
              <option value="azure">Azure</option>
              <option value="gcp">GCP</option>
              <option value="aws">AWS</option>
            </select>
          </div>
        </div>
      </div>

      {stats && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIconWrapper} style={{ backgroundColor: '#10b98115' }}>
              <DollarSign size={24} style={{ color: '#10b981' }} />
            </div>
            <div className={styles.statContent}>
              <div className={styles.statLabel}>Custo Mensal</div>
              <div className={styles.statValue}>{formatCurrency(stats.monthlyCost)}</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIconWrapper} style={{ backgroundColor: '#3b82f615' }}>
              <Activity size={24} style={{ color: '#3b82f6' }} />
            </div>
            <div className={styles.statContent}>
              <div className={styles.statLabel}>Custo Diário</div>
              <div className={styles.statValue}>{formatCurrency(stats.dailyCost)}</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIconWrapper} style={{ backgroundColor: stats.costTrend >= 0 ? '#10b98115' : '#ef444415' }}>
              {stats.costTrend >= 0 ? (
                <TrendingUp size={24} style={{ color: '#10b981' }} />
              ) : (
                <TrendingDown size={24} style={{ color: '#ef4444' }} />
              )}
            </div>
            <div className={styles.statContent}>
              <div className={styles.statLabel}>Tendência</div>
              <div className={`${styles.statValue} ${stats.costTrend >= 0 ? styles.trendUp : styles.trendDown}`}>
                {stats.costTrend >= 0 ? '+' : ''}{stats.costTrend.toFixed(1)}%
              </div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIconWrapper} style={{ backgroundColor: '#8b5cf615' }}>
              <Package size={24} style={{ color: '#8b5cf6' }} />
            </div>
            <div className={styles.statContent}>
              <div className={styles.statLabel}>Total de Recursos</div>
              <div className={styles.statValue}>{stats.totalResources}</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIconWrapper} style={{ backgroundColor: '#10b98115' }}>
              <Server size={24} style={{ color: '#10b981' }} />
            </div>
            <div className={styles.statContent}>
              <div className={styles.statLabel}>Recursos Ativos</div>
              <div className={styles.statValue}>{stats.activeResources}</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIconWrapper} style={{ backgroundColor: '#64748b15' }}>
              <Server size={24} style={{ color: '#64748b' }} />
            </div>
            <div className={styles.statContent}>
              <div className={styles.statLabel}>Recursos Inativos</div>
              <div className={styles.statValue}>{stats.inactiveResources}</div>
            </div>
          </div>
        </div>
      )}

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'overview' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Visão Geral
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'resources' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('resources')}
        >
          Recursos ({resources.length})
        </button>
      </div>

      <div className={styles.content}>
        {activeTab === 'overview' && stats && (
          <div className={styles.overview}>
            <div className={styles.chartSection}>
              <h3>Custo por Provedor</h3>
              <div className={styles.providerList}>
                {Object.entries(stats.costByProvider).map(([provider, cost]) => (
                  <div key={provider} className={styles.providerItem}>
                    <span className={styles.providerName}>{provider.toUpperCase()}</span>
                    <span className={styles.providerCost}>{formatCurrency(cost)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.chartSection}>
              <h3>Top Serviços por Custo</h3>
              <div className={styles.serviceList}>
                {Object.entries(stats.costByService)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 5)
                  .map(([service, cost]) => (
                    <div key={service} className={styles.serviceItem}>
                      <span className={styles.serviceName}>{service}</span>
                      <span className={styles.serviceCost}>{formatCurrency(cost)}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'resources' && (
          <div className={styles.resourcesGrid}>
            {resources.map((resource, index) => (
              <div key={index} className={styles.resourceCard}>
                <div className={styles.resourceHeader}>
                  <h4 className={styles.resourceName}>{resource.resourceName}</h4>
                  <span className={`${styles.resourceStatus} ${getStatusColor(resource.status)}`}>
                    {resource.status}
                  </span>
                </div>
                <div className={styles.resourceDetails}>
                  <div className={styles.resourceDetail}>
                    <span className={styles.detailLabel}>Provedor:</span>
                    <span className={styles.detailValue}>{resource.provider.toUpperCase()}</span>
                  </div>
                  <div className={styles.resourceDetail}>
                    <span className={styles.detailLabel}>Tipo:</span>
                    <span className={styles.detailValue}>{resource.resourceType}</span>
                  </div>
                  <div className={styles.resourceDetail}>
                    <span className={styles.detailLabel}>Região:</span>
                    <span className={styles.detailValue}>{resource.region}</span>
                  </div>
                  {resource.cost && (
                    <div className={styles.resourceDetail}>
                      <span className={styles.detailLabel}>Custo:</span>
                      <span className={styles.detailValue}>{formatCurrency(resource.cost)}</span>
                    </div>
                  )}
                  {resource.tags && Object.keys(resource.tags).length > 0 && (
                    <div className={styles.resourceTags}>
                      {Object.entries(resource.tags).map(([key, value]) => (
                        <span key={key} className={styles.tag}>
                          {key}: {value}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default FinOpsPage
