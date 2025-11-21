import { TrendingUp, TrendingDown, Activity, CheckCircle, AlertCircle, Server, GitBranch, LayoutDashboard } from 'lucide-react'
import PageContainer from '../components/Layout/PageContainer'
import PageHeader from '../components/Layout/PageHeader'
import Section from '../components/Layout/Section'
import Card from '../components/UI/Card'
import StatCard from '../components/UI/StatCard'
import EmptyState from '../components/UI/EmptyState'
import styles from './DashboardPage.module.css'

function DashboardPage() {
  // Remover dados mockados - estas métricas devem vir de APIs reais
  const metrics: any[] = []
  const services: any[] = []
  const recentDeployments: any[] = []
  const quickStats: any[] = []

  return (
    <PageContainer maxWidth="xl">
      <PageHeader
        icon={LayoutDashboard}
        title="Dashboard"
        subtitle="Visão geral da plataforma e serviços"
      />

      {/* Quick Stats - usando StatCard */}
      {quickStats.length > 0 && (
        <div className={styles.quickStatsBar}>
          {quickStats.map((stat) => (
            <StatCard
              key={stat.label}
              icon={stat.icon}
              label={stat.label}
              value={stat.value}
              color={stat.colorType || 'blue'}
            />
          ))}
        </div>
      )}

      {/* Main Metrics Grid */}
      <Section title="Métricas Principais" icon="📊" spacing="lg">
        {metrics.length > 0 ? (
          <div className={styles.metricsGrid}>
            {metrics.map((metric) => (
              <StatCard
                key={metric.label}
                icon={metric.icon}
                label={metric.label}
                value={metric.value}
                trend={{
                  value: parseFloat(metric.change.replace('%', '')),
                  isPositive: metric.trend === 'up'
                }}
                color={metric.colorType || 'blue'}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Activity}
            title="Nenhuma métrica disponível"
            description="Configure as integrações para visualizar métricas da plataforma"
          />
        )}
      </Section>

      <div className={styles.contentGrid}>
        {/* Services Section */}
        <Section title="Serviços em Produção" icon="🖥️" spacing="md">
          <Card padding="lg">
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
              <EmptyState
                icon={Server}
                title="Nenhum serviço encontrado"
                description="Configure o Kubernetes para visualizar serviços"
              />
            )}
          </Card>
        </Section>

        {/* Recent Deployments */}
        <Section title="Deployments Recentes" icon="🚀" spacing="md">
          <Card padding="lg">
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
              <EmptyState
                icon={GitBranch}
                title="Nenhum deployment recente"
                description="Configure Azure DevOps para visualizar deployments"
              />
            )}
          </Card>
        </Section>
      </div>
    </PageContainer>
  )
}

export default DashboardPage
