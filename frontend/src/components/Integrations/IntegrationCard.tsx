import { Settings, CheckCircle, XCircle, Trash2 } from 'lucide-react'

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
      default:
        return '/logos/platifyx-logo-white.png'
    }
  }

  return (
    <div className="bg-[#1E1E1E] rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 flex items-center justify-center bg-gray-50 rounded-lg">
          <img
            src={getIntegrationLogo(integration.type)}
            alt={integration.name}
            className="w-8 h-8 object-contain"
          />
        </div>
        <div>
          {integration.enabled ? (
            <CheckCircle size={20} className="text-green-500" />
          ) : (
            <XCircle size={20} className="text-gray-400" />
          )}
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white mb-1">{integration.name}</h3>
        <p className="text-sm text-white-600">{getIntegrationDescription(integration.type)}</p>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
            onClick={onConfigure}
          >
            <Settings size={16} />
            <span>Configurar</span>
          </button>
          <button
            className="p-1.5 text-white hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
            onClick={onDelete}
            title="Deletar integração"
          >
            <Trash2 size={16} />
          </button>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={integration.enabled}
            onChange={onToggle}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>
    </div>
  )
}

export default IntegrationCard
