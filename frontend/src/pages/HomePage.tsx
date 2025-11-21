import { ArrowRight, Zap, Shield, TrendingUp, Home as HomeIcon } from 'lucide-react'
import PageContainer from '../components/Layout/PageContainer'
import PageHeader from '../components/Layout/PageHeader'
import Section from '../components/Layout/Section'
import Card from '../components/UI/Card'
import styles from './HomePage.module.css'

function HomePage() {
  return (
    <PageContainer maxWidth="xl">
      <PageHeader
        icon={HomeIcon}
        title="Bem-vindo ao PlatifyX"
        subtitle="Developer Portal & Platform Engineering Hub"
      />

      <Section spacing="lg">
        <Card padding="lg" style={{ textAlign: 'center', background: 'linear-gradient(135deg, var(--deep-sea-blue-slate) 0%, var(--deep-sea-space-blue) 100%)' }}>
          <p className={styles.description}>
            Centralize DevOps, Kubernetes, Observabilidade, Qualidade e Governança em um único lugar.
            Self-service, padronização e autonomia para times de engenharia.
          </p>
        </Card>
      </Section>

      <Section title="Recursos" icon="✨" spacing="lg">
        <div className={styles.features}>
          <Card hover padding="lg">
            <div className={styles.featureIcon}>
              <Zap size={32} />
            </div>
            <h3 className={styles.featureTitle}>Self-Service</h3>
            <p className={styles.featureDescription}>
              Crie serviços, pipelines e infraestrutura com templates padronizados em minutos
            </p>
          </Card>

          <Card hover padding="lg">
            <div className={styles.featureIcon}>
              <Shield size={32} />
            </div>
            <h3 className={styles.featureTitle}>Governança</h3>
            <p className={styles.featureDescription}>
              Segurança, compliance e políticas automatizadas desde o início
            </p>
          </Card>

          <Card hover padding="lg">
            <div className={styles.featureIcon}>
              <TrendingUp size={32} />
            </div>
            <h3 className={styles.featureTitle}>Observabilidade</h3>
            <p className={styles.featureDescription}>
              Logs, métricas e traces centralizados com Grafana Stack completo
            </p>
          </Card>
        </div>
      </Section>

      <Section title="Ações Rápidas" icon="🚀" spacing="lg">
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
      </Section>
    </PageContainer>
  )
}

export default HomePage
