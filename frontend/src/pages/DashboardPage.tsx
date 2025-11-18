import { TrendingUp, TrendingDown, Activity, CheckCircle, AlertCircle } from 'lucide-react'
import styles from './DashboardPage.module.css'

function DashboardPage() {
  const metrics = [
    { label: 'Serviços Ativos', value: '42', change: '+5', trend: 'up' },
    { label: 'Deploy Frequency', value: '23/dia', change: '+12%', trend: 'up' },
    { label: 'MTTR', value: '18min', change: '-8%', trend: 'down' },
    { label: 'Success Rate', value: '99.2%', change: '+0.3%', trend: 'up' },
  ]

  const services = [
    { name: 'api-gateway', status: 'healthy', version: 'v2.4.1', deployedAt: '2h atrás' },
    { name: 'auth-service', status: 'healthy', version: 'v1.8.0', deployedAt: '5h atrás' },
    { name: 'payment-service', status: 'warning', version: 'v3.2.1', deployedAt: '1d atrás' },
    { name: 'notification-service', status: 'healthy', version: 'v1.5.2', deployedAt: '3h atrás' },
  ]

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Dashboard</h1>

      <section className={styles.metricsGrid}>
        {metrics.map((metric) => (
          <div key={metric.label} className={styles.metricCard}>
            <div className={styles.metricHeader}>
              <span className={styles.metricLabel}>{metric.label}</span>
              <span className={`${styles.metricChange} ${styles[metric.trend]}`}>
                {metric.trend === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                {metric.change}
              </span>
            </div>
            <div className={styles.metricValue}>{metric.value}</div>
          </div>
        ))}
      </section>

      <section className={styles.servicesSection}>
        <h2 className={styles.sectionTitle}>Serviços Recentes</h2>
        <div className={styles.servicesList}>
          {services.map((service) => (
            <div key={service.name} className={styles.serviceCard}>
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
                  <span>{service.version}</span>
                  <span className={styles.separator}>•</span>
                  <span>{service.deployedAt}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default DashboardPage
