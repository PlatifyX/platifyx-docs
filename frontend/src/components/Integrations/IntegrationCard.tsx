import { Settings, CheckCircle, XCircle } from 'lucide-react'
import styles from './IntegrationCard.module.css'

interface Integration {
  id: number
  name: string
  type: string
  enabled: boolean
  config: any
}

interface IntegrationCardProps {
  integration: Integration
  onConfigure: () => void
  onToggle: () => void
}

function IntegrationCard({ integration, onConfigure, onToggle }: IntegrationCardProps) {
  const getIntegrationDescription = (type: string) => {
    switch (type) {
      case 'azuredevops':
        return 'Integração com Azure DevOps para pipelines, builds e releases'
      default:
        return 'Integração externa'
    }
  }

  const getIntegrationIcon = (type: string) => {
    switch (type) {
      case 'azuredevops':
        return '🔵'
      default:
        return '🔌'
    }
  }

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.iconWrapper}>
          <span className={styles.icon}>{getIntegrationIcon(integration.type)}</span>
        </div>
        <div className={styles.status}>
          {integration.enabled ? (
            <CheckCircle size={20} className={styles.statusIconActive} />
          ) : (
            <XCircle size={20} className={styles.statusIconInactive} />
          )}
        </div>
      </div>

      <div className={styles.cardBody}>
        <h3 className={styles.cardTitle}>{integration.name}</h3>
        <p className={styles.cardDescription}>{getIntegrationDescription(integration.type)}</p>
      </div>

      <div className={styles.cardFooter}>
        <button className={styles.configureButton} onClick={onConfigure}>
          <Settings size={16} />
          <span>Configurar</span>
        </button>
        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={integration.enabled}
            onChange={onToggle}
          />
          <span className={styles.toggleSlider}></span>
        </label>
      </div>
    </div>
  )
}

export default IntegrationCard
