import { X } from 'lucide-react'
import styles from './IntegrationTypeSelector.module.css'

interface IntegrationTypeSelectorProps {
  onSelect: (type: string) => void
  onClose: () => void
}

const integrationTypes = [
  {
    id: 'azuredevops',
    name: 'Azure DevOps',
    description: 'Conecte com pipelines, builds e releases',
    logo: '/logos/azuredevops.png',
  },
  {
    id: 'sonarqube',
    name: 'SonarQube',
    description: 'Análise de qualidade de código',
    logo: '/logos/sonarqube.png',
  },
  {
    id: 'azure',
    name: 'Microsoft Azure',
    description: 'Gerenciamento de custos e recursos da nuvem Azure',
    logo: '/logos/azure.png',
  },
  {
    id: 'gcp',
    name: 'Google Cloud Platform',
    description: 'Gerenciamento de custos e recursos do GCP',
    logo: '/logos/gcp.png',
  },
  {
    id: 'aws',
    name: 'Amazon Web Services',
    description: 'Gerenciamento de custos e recursos da AWS',
    logo: '/logos/aws.png',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'Integração com GPT-4, GPT-3.5 e outros modelos',
    logo: '/logos/openai.png',
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    description: 'Integração com Gemini Pro e outros modelos do Google',
    logo: '/logos/gemini.png',
  },
  {
    id: 'claude',
    name: 'Anthropic Claude',
    description: 'Integração com Claude 3 Opus, Sonnet e Haiku',
    logo: '/logos/claude.png',
  },
  {
    id: 'jira',
    name: 'Jira',
    description: 'Gerenciamento de projetos, issues, sprints e boards',
    logo: '/logos/jira.png',
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Notificações e comunicação via Slack',
    logo: '/logos/slack.png',
  },
  {
    id: 'teams',
    name: 'Microsoft Teams',
    description: 'Notificações e comunicação via Teams',
    logo: '/logos/teams.png',
  },
  {
    id: 'argocd',
    name: 'ArgoCD',
    description: 'GitOps e deploy contínuo com ArgoCD',
    logo: '/logos/argocd.png',
  },
  {
    id: 'prometheus',
    name: 'Prometheus',
    description: 'Monitoramento de métricas e alertas',
    logo: '/logos/prometheus.png',
  },
  {
    id: 'vault',
    name: 'HashiCorp Vault',
    description: 'Gerenciamento seguro de secrets e credenciais',
    logo: '/logos/vault.png',
  },
  {
    id: 'awssecrets',
    name: 'AWS Secrets Manager',
    description: 'Gerenciamento de secrets na AWS',
    logo: '/logos/aws-secrets.png',
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Integração com GitHub Actions (em breve)',
    logo: '/logos/github.png',
    disabled: true,
  },
  {
    id: 'gitlab',
    name: 'GitLab',
    description: 'Integração com GitLab CI/CD (em breve)',
    logo: '/logos/gitlab.png',
    disabled: true,
  },
  {
    id: 'jenkins',
    name: 'Jenkins',
    description: 'Integração com Jenkins (em breve)',
    logo: '/logos/jenkins.png',
    disabled: true,
  },
]

function IntegrationTypeSelector({ onSelect, onClose }: IntegrationTypeSelectorProps) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Selecione o Tipo de Integração</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.grid}>
            {integrationTypes.map((type) => (
              <button
                key={type.id}
                className={`${styles.typeCard} ${type.disabled ? styles.disabled : ''}`}
                onClick={() => !type.disabled && onSelect(type.id)}
                disabled={type.disabled}
              >
                <div className={styles.typeIcon}>
                  <img src={type.logo} alt={type.name} />
                </div>
                <div className={styles.typeInfo}>
                  <h3 className={styles.typeName}>{type.name}</h3>
                  <p className={styles.typeDescription}>{type.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default IntegrationTypeSelector
