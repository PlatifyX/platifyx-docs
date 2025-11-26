import { X } from 'lucide-react'

interface IntegrationTypeSelectorProps {
  onSelect: (type: string) => void
  onClose: () => void
}

const getIntegrationId = (name: string): string => {
  const mapping: Record<string, string> = {
    'ArgoCD': 'argocd',
    'GitLab CI/CD': 'gitlab',
    'Jenkins': 'jenkins',
    'CircleCI': 'circleci',
    'Azure': 'azure',
    'GCP': 'gcp',
    'Slack': 'slack',
    'Microsoft Teams': 'teams',
    'Discord': 'discord',
    'Claude': 'claude',
    'Gemini': 'gemini',
    'Datadog': 'datadog',
    'New Relic': 'newrelic',
    'ELK': 'elk',
    'Grafana': 'grafana',
    'Jira': 'jira',
    'Linear': 'linear',
    'Trello': 'trello',
    'Snyk': 'snyk',
    'Azure DevOps': 'azuredevops',
    'AWS': 'aws',
    'OpenAI': 'openai',
    'Kubernetes': 'kubernetes',
    'Loki': 'loki',
    'Prometheus': 'prometheus',
    'Sonarqube': 'sonarqube',
    'Vault': 'vault',
    'Github': 'github',
    'OpenVPN': 'openvpn',
  }
  return mapping[name] || name.toLowerCase().replace(/\s+/g, '-')
}

const getDescription = (name: string): string => {
  const descriptions: Record<string, string> = {
    'ArgoCD': 'GitOps e deploy contínuo com ArgoCD',
    'GitLab CI/CD': 'Integração completa com GitLab: CI/CD, Repositórios, Issues, Epics e Merge Requests',
    'Jenkins': 'Integração com Jenkins',
    'CircleCI': 'Integração com CircleCI',
    'Azure': 'Gerenciamento de custos, recursos e secrets (Key Vault) da nuvem Azure',
    'GCP': 'Gerenciamento de custos, recursos e secrets (Secret Manager) do GCP',
    'Slack': 'Notificações e comunicação via Slack',
    'Microsoft Teams': 'Notificações e comunicação via Teams',
    'Discord': 'Notificações e comunicação via Discord',
    'Claude': 'Integração com Claude 3 Opus, Sonnet e Haiku',
    'Gemini': 'Integração com Gemini Pro e outros modelos do Google',
    'Datadog': 'Monitoramento e observabilidade com Datadog',
    'New Relic': 'Monitoramento de aplicações com New Relic',
    'ELK': 'Stack ELK para análise de logs',
    'Grafana': 'Visualização de métricas e dashboards',
    'Jira': 'Gerenciamento de projetos, issues, sprints e boards',
    'Linear': 'Gerenciamento de projetos e issues',
    'Trello': 'Gerenciamento de projetos e quadros Kanban',
    'Snyk': 'Análise de segurança e vulnerabilidades',
    'Azure DevOps': 'Integração completa com Azure DevOps: Repos, Boards, Pipelines, Builds e Releases',
    'AWS': 'Gerenciamento de custos, recursos e secrets (Secrets Manager) da AWS',
    'OpenAI': 'Integração com GPT-4, GPT-3.5 e outros modelos',
    'Kubernetes': 'Integração com clusters Kubernetes',
    'Loki': 'Agregação e visualização de logs',
    'Prometheus': 'Monitoramento de métricas e alertas',
    'Sonarqube': 'Análise de qualidade de código',
    'Vault': 'Gerenciamento de secrets',
    'Github': 'Integração completa com GitHub: Repositórios, GitHub Actions, Projects, Issues e Pull Requests',
    'OpenVPN': 'Gerenciamento de usuários VPN e acesso à rede',
  }
  return descriptions[name] || `Integração com ${name}`
}

const integrationTypesData = [
  { name: 'ArgoCD', tipo: 'CI/CD', implementado: 'Em breve', logo: '/logos/argocd.png' },
  { name: 'GitLab CI/CD', tipo: 'CI/CD', implementado: 'Em breve', logo: 'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/gitlab.svg' },
  { name: 'Jenkins', tipo: 'CI/CD', implementado: 'Em breve', logo: 'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/jenkins.svg' },
  { name: 'CircleCI', tipo: 'CI/CD', implementado: 'Em breve', logo: 'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/circleci.svg' },
  { name: 'Azure', tipo: 'Cloud/FinOps', implementado: 'Em breve', logo: 'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/microsoftazure.svg' },
  { name: 'GCP', tipo: 'Cloud/FinOps', implementado: 'Em breve', logo: 'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/googlecloud.svg' },
  { name: 'Slack', tipo: 'Communication', implementado: 'Em breve', logo: 'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/slack.svg' },
  { name: 'Microsoft Teams', tipo: 'Communication', implementado: 'Em breve', logo: 'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/microsoftteams.svg' },
  { name: 'Discord', tipo: 'Communication', implementado: 'Em breve', logo: 'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/discord.svg' },
  { name: 'Claude', tipo: 'IA', implementado: 'Em breve', logo: '/logos/claude.png' },
  { name: 'Gemini', tipo: 'IA', implementado: 'Em breve', logo: '/logos/gemini.png' },
  { name: 'Datadog', tipo: 'Observability', implementado: 'Em breve', logo: 'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/datadog.svg' },
  { name: 'New Relic', tipo: 'Observability', implementado: 'Em breve', logo: 'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/newrelic.svg' },
  { name: 'ELK', tipo: 'Observability', implementado: 'Em breve', logo: 'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/elasticsearch.svg' },
  { name: 'Grafana', tipo: 'Observability', implementado: 'Em breve', logo: 'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/grafana.svg' },
  { name: 'Jira', tipo: 'Project Management', implementado: 'Sim', logo: 'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/jira.svg' },
  { name: 'Linear', tipo: 'Project Management', implementado: 'Em breve', logo: 'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/linear.svg' },
  { name: 'Trello', tipo: 'Project Management', implementado: 'Em breve', logo: 'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/trello.svg' },
  { name: 'Snyk', tipo: 'Quality', implementado: 'Em breve', logo: 'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/snyk.svg' },
  { name: 'Azure DevOps', tipo: 'CI/CD', implementado: 'Sim', logo: 'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/azuredevops.svg' },
  { name: 'AWS', tipo: 'Cloud/FinOps', implementado: 'Sim', logo: 'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/amazonaws.svg' },
  { name: 'OpenAI', tipo: 'IA', implementado: 'Sim', logo: 'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/openai.svg' },
  { name: 'Kubernetes', tipo: 'Infrastructure', implementado: 'Sim', logo: 'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/kubernetes.svg' },
  { name: 'Loki', tipo: 'Observability', implementado: 'Sim', logo: 'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/grafana.svg' },
  { name: 'Prometheus', tipo: 'Observability', implementado: 'Sim', logo: 'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/prometheus.svg' },
  { name: 'Sonarqube', tipo: 'Quality', implementado: 'Sim', logo: 'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/sonarqube.svg' },
  { name: 'Vault', tipo: 'Secrets', implementado: 'Sim', logo: 'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/vault.svg' },
  { name: 'Github', tipo: 'Version Control', implementado: 'Sim', logo: 'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/github.svg' },
  { name: 'OpenVPN', tipo: 'VPN', implementado: 'Em breve', logo: 'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/openvpn.svg' },
]

const integrationTypes = integrationTypesData.map(item => ({
  id: getIntegrationId(item.name),
  name: item.name,
  description: getDescription(item.name),
  logo: item.logo.startsWith('http') ? item.logo : item.logo.startsWith('/') ? item.logo : `/${item.logo}`,
  disabled: item.implementado === 'Em breve',
  category: item.tipo,
}))

const implementedIntegrations = integrationTypes.filter(i => !i.disabled)
const comingSoonIntegrations = integrationTypes.filter(i => i.disabled)

function IntegrationTypeSelector({ onSelect, onClose }: IntegrationTypeSelectorProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
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
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Integrações Disponíveis</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {implementedIntegrations.map((type) => (
                <button
                  key={type.id}
                  className="flex items-start gap-3 p-4 rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-md text-left transition-all"
                  onClick={() => onSelect(type.id)}
                >
                  <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-gray-50 rounded-lg">
                    <img src={type.logo} alt={type.name} className="w-6 h-6 object-contain" style={{ filter: 'brightness(0) saturate(100%) invert(27%) sepia(100%) saturate(2000%) hue-rotate(210deg) brightness(1) contrast(1)' }} onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = '/logos/default.png'
                    }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 mb-1">{type.name}</h3>
                    <p className="text-xs text-gray-600">{type.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Em Breve</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {comingSoonIntegrations.map((type) => (
                <div
                  key={type.id}
                  className="flex items-start gap-3 p-4 rounded-lg border border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
                >
                  <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-gray-100 rounded-lg">
                    <img src={type.logo} alt={type.name} className="w-6 h-6 object-contain" style={{ filter: 'brightness(0) saturate(100%) invert(27%) sepia(100%) saturate(2000%) hue-rotate(210deg) brightness(1) contrast(1)' }} onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = '/logos/default.png'
                    }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 mb-1">{type.name}</h3>
                    <p className="text-xs text-gray-600">{type.description}</p>
                    <span className="inline-block mt-1 text-xs text-blue-600 font-medium">Em breve</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default IntegrationTypeSelector
