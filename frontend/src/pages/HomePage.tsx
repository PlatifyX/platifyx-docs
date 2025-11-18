import { ArrowRight, Zap, Shield, TrendingUp } from 'lucide-react'
import styles from './HomePage.module.css'

function HomePage() {
  return (
    <div className={styles.container}>
      <section className={styles.hero}>
        <h1 className={styles.title}>
          Bem-vindo ao <span className={styles.highlight}>PlatifyX</span>
        </h1>
        <p className={styles.subtitle}>
          Developer Portal & Platform Engineering Hub
        </p>
        <p className={styles.description}>
          Centralize DevOps, Kubernetes, Observabilidade, Qualidade e Governança em um único lugar.
          Self-service, padronização e autonomia para times de engenharia.
        </p>
      </section>

      <section className={styles.features}>
        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>
            <Zap size={32} />
          </div>
          <h3 className={styles.featureTitle}>Self-Service</h3>
          <p className={styles.featureDescription}>
            Crie serviços, pipelines e infraestrutura com templates padronizados em minutos
          </p>
        </div>

        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>
            <Shield size={32} />
          </div>
          <h3 className={styles.featureTitle}>Governança</h3>
          <p className={styles.featureDescription}>
            Segurança, compliance e políticas automatizadas desde o início
          </p>
        </div>

        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>
            <TrendingUp size={32} />
          </div>
          <h3 className={styles.featureTitle}>Observabilidade</h3>
          <p className={styles.featureDescription}>
            Logs, métricas e traces centralizados com Grafana Stack completo
          </p>
        </div>
      </section>

      <section className={styles.quickActions}>
        <h2 className={styles.sectionTitle}>Ações Rápidas</h2>
        <div className={styles.actions}>
          <button className={styles.actionButton}>
            Criar Novo Serviço
            <ArrowRight size={18} />
          </button>
          <button className={styles.actionButton}>
            Ver Catálogo
            <ArrowRight size={18} />
          </button>
          <button className={styles.actionButton}>
            Explorar Templates
            <ArrowRight size={18} />
          </button>
        </div>
      </section>
    </div>
  )
}

export default HomePage
