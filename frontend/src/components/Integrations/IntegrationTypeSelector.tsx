import { X } from 'lucide-react'

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
    id: 'loki',
    name: 'Grafana Loki',
    description: 'Agregação e visualização de logs',
    logo: '/logos/loki.png',
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
    id: 'kubernetes',
    name: 'Kubernetes',
    description: 'Integração com clusters Kubernetes',
    logo: '/logos/kubernetes.png',
  },
  {
    id: 'grafana',
    name: 'Grafana',
    description: 'Visualização de métricas e dashboards',
    logo: '/logos/grafana.png',
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Integração com repositórios e GitHub Actions',
    logo: '/logos/github.png',
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Selecione o Tipo de Integração</h2>
          <button
            className="text-gray-400 hover:text-gray-600 transition-colors"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-88px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrationTypes.map((type) => (
              <button
                key={type.id}
                className={`flex items-start gap-3 p-4 rounded-lg border text-left transition-all ${
                  type.disabled
                    ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                    : 'border-gray-200 hover:border-blue-500 hover:shadow-md'
                }`}
                onClick={() => !type.disabled && onSelect(type.id)}
                disabled={type.disabled}
              >
                <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-gray-50 rounded-lg">
                  <img src={type.logo} alt={type.name} className="w-6 h-6 object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-900 mb-1">{type.name}</h3>
                  <p className="text-xs text-gray-600">{type.description}</p>
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
