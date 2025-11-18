import { Settings, CheckCircle, XCircle, Trash2 } from 'lucide-react'
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
  onDelete: () => void
}

function IntegrationCard({ integration, onConfigure, onToggle, onDelete }: IntegrationCardProps) {
  const getIntegrationDescription = (type: string) => {
    switch (type) {
      case 'azuredevops':
        return 'Integração com Azure DevOps para pipelines, builds e releases'
      case 'sonarqube':
        return 'Análise de qualidade de código com SonarQube'
      case 'azure':
        return 'Gerenciamento de custos e recursos da Microsoft Azure'
      case 'gcp':
        return 'Gerenciamento de custos e recursos do Google Cloud Platform'
      case 'aws':
        return 'Gerenciamento de custos e recursos da Amazon Web Services'
      default:
        return 'Integração externa'
    }
  }

  const getIntegrationLogo = (type: string) => {
    switch (type) {
      case 'azuredevops':
        return '/logos/azuredevops.png'
      case 'sonarqube':
        return '/logos/sonarqube.png'
      case 'azure':
        return '/logos/azure.png'
      case 'gcp':
        return '/logos/gcp.png'
      case 'aws':
        return '/logos/aws.png'
      case 'github':
        return '/logos/github.png'
      case 'gitlab':
        return '/logos/gitlab.png'
      case 'jenkins':
        return '/logos/jenkins.png'
      default:
        return '/logos/platifyx.png'
    }
  }

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.iconWrapper}>
          <img
            src={getIntegrationLogo(integration.type)}
            alt={integration.name}
            className={styles.icon}
          />
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
        <div className={styles.cardActions}>
          <button className={styles.configureButton} onClick={onConfigure}>
            <Settings size={16} />
            <span>Configurar</span>
          </button>
          <button className={styles.deleteButton} onClick={onDelete} title="Deletar integração">
            <Trash2 size={16} />
          </button>
        </div>
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
