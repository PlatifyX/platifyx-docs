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
      case 'kubernetes':
        return 'Integração com clusters Kubernetes'
      case 'grafana':
        return 'Visualização de métricas e dashboards'
      case 'github':
        return 'Integração com repositórios e GitHub Actions'
      case 'openai':
        return 'Integração com GPT-4, GPT-3.5 e outros modelos'
      case 'gemini':
        return 'Integração com Gemini Pro e outros modelos do Google'
      case 'claude':
        return 'Integração com Claude 3 Opus, Sonnet e Haiku'
      case 'jira':
        return 'Gerenciamento de projetos, issues, sprints e boards'
      case 'slack':
        return 'Notificações e comunicação via Slack'
      case 'teams':
        return 'Notificações e comunicação via Microsoft Teams'
      case 'argocd':
        return 'GitOps e deploy contínuo com ArgoCD'
      case 'prometheus':
        return 'Monitoramento de métricas e alertas'
      case 'vault':
        return 'Gerenciamento seguro de secrets e credenciais'
      case 'awssecrets':
        return 'Gerenciamento de secrets na AWS'
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
      case 'kubernetes':
        return '/logos/kubernetes.png'
      case 'grafana':
        return '/logos/grafana.png'
      case 'github':
        return '/logos/github.png'
      case 'gitlab':
        return '/logos/gitlab.png'
      case 'jenkins':
        return '/logos/jenkins.png'
      case 'openai':
        return '/logos/openai.png'
      case 'gemini':
        return '/logos/gemini.png'
      case 'claude':
        return '/logos/claude.png'
      case 'jira':
        return '/logos/jira.png'
      case 'slack':
        return '/logos/slack.png'
      case 'teams':
        return '/logos/teams.png'
      case 'argocd':
        return '/logos/argocd.png'
      case 'prometheus':
        return '/logos/prometheus.png'
      case 'vault':
        return '/logos/vault.png'
      case 'awssecrets':
        return '/logos/aws-secrets.png'
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
