import { TrendingUp, TrendingDown, Activity, CheckCircle, AlertCircle, Server, GitBranch } from 'lucide-react'
import styles from './DashboardPage.module.css'

function DashboardPage() {
  // Remover dados mockados - estas métricas devem vir de APIs reais
  const metrics: any[] = []
  const services: any[] = []
  const recentDeployments: any[] = []
  const quickStats: any[] = []

  return (
    <div className={styles.container}>
      {/* Header with Gradient */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.pageTitle}>Dashboard</h1>
          <p className={styles.pageSubtitle}>Visão geral da plataforma e serviços</p>
        </div>
        {quickStats.length > 0 && (
          <div className={styles.quickStatsBar}>
            {quickStats.map((stat) => (
              <div key={stat.label} className={styles.quickStat}>
                <div className={styles.quickStatIcon} style={{ color: stat.color }}>
                  {stat.icon}
                </div>
                <div className={styles.quickStatInfo}>
                  <div className={styles.quickStatValue}>{stat.value}</div>
                  <div className={styles.quickStatLabel}>{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Metrics Grid */}
      {metrics.length > 0 ? (
        <section className={styles.metricsGrid}>
          {metrics.map((metric) => (
            <div key={metric.label} className={styles.metricCard}>
              <div className={styles.metricIconWrapper} style={{ backgroundColor: `${metric.color}15` }}>
                <div style={{ color: metric.color }}>
                  {metric.icon}
                </div>
              </div>
              <div className={styles.metricContent}>
                <div className={styles.metricHeader}>
                  <span className={styles.metricLabel}>{metric.label}</span>
                  <span className={`${styles.metricChange} ${styles[metric.trend]}`}>
                    {metric.trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {metric.change}
                  </span>
                </div>
                <div className={styles.metricValue}>{metric.value}</div>
              </div>
            </div>
          ))}
        </section>
      ) : (
        <div className={styles.emptyState}>
          <Activity size={48} style={{ color: '#cbd5e1', marginBottom: '1rem' }} />
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#64748b' }}>Nenhuma métrica disponível</h3>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.875rem' }}>
            Configure as integrações para visualizar métricas da plataforma
          </p>
        </div>
      )}

      <div className={styles.contentGrid}>
        {/* Services Section */}
        <section className={styles.servicesSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <Server size={20} />
              Serviços em Produção
            </h2>
            {services.length > 0 && (
              <span className={styles.badge}>{services.length} ativos</span>
            )}
          </div>
          {services.length > 0 ? (
            <div className={styles.servicesList}>
              {services.map((service) => (
                <div key={service.name} className={styles.serviceCard}>
                  <div className={styles.serviceMain}>
                    <div className={styles.serviceStatus}>
                      {service.status === 'healthy' ? (
                        <CheckCircle className={styles.statusHealthy} size={20} />
                      ) : service.status === 'warning' ? (
                        <AlertCircle className={styles.statusWarning} size={20} />
                      ) : (
                        <Activity className={styles.statusError} size={20} />
                      )}
                    </div>
                    <div className={styles.serviceInfo}>
                      <div className={styles.serviceName}>{service.name}</div>
                      <div className={styles.serviceDetails}>
                        <span className={styles.serviceVersion}>{service.version}</span>
                        <span className={styles.separator}>•</span>
                        <span className={styles.serviceTime}>{service.deployedAt}</span>
                      </div>
                    </div>
                  </div>
                  <div className={styles.serviceStats}>
                    <div className={styles.serviceStat}>
                      <span className={styles.serviceStatLabel}>Requests</span>
                      <span className={styles.serviceStatValue}>{service.requests}</span>
                    </div>
                    <div className={styles.serviceStat}>
                      <span className={styles.serviceStatLabel}>Uptime</span>
                      <span className={styles.serviceStatValue}>{service.uptime}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <Server size={48} style={{ color: '#cbd5e1', marginBottom: '1rem' }} />
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.875rem' }}>
                Nenhum serviço encontrado. Configure o Kubernetes para visualizar serviços.
              </p>
            </div>
          )}
        </section>

        {/* Recent Deployments */}
        <section className={styles.deploymentsSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <GitBranch size={20} />
              Deployments Recentes
            </h2>
          </div>
          {recentDeployments.length > 0 ? (
            <div className={styles.deploymentsList}>
              {recentDeployments.map((deploy, idx) => (
                <div key={idx} className={styles.deploymentCard}>
                  <div className={styles.deploymentTimeline}>
                    <div className={`${styles.deploymentDot} ${styles[deploy.status]}`}></div>
                    {idx < recentDeployments.length - 1 && <div className={styles.deploymentLine}></div>}
                  </div>
                  <div className={styles.deploymentContent}>
                    <div className={styles.deploymentHeader}>
                      <span className={styles.deploymentService}>{deploy.service}</span>
                      <span className={styles.deploymentVersion}>{deploy.version}</span>
                    </div>
                    <div className={styles.deploymentMeta}>
                      <span className={styles.deploymentAuthor}>{deploy.author}</span>
                      <span className={styles.separator}>•</span>
                      <span className={styles.deploymentTime}>{deploy.time}</span>
                    </div>
                  </div>
                  <div className={`${styles.deploymentStatus} ${styles[deploy.status]}`}>
                    {deploy.status === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <GitBranch size={48} style={{ color: '#cbd5e1', marginBottom: '1rem' }} />
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.875rem' }}>
                Nenhum deployment recente. Configure Azure DevOps para visualizar deployments.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default DashboardPage
