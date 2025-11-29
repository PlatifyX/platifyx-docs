import { useState, useEffect } from 'react'
import { Plug, CheckCircle, XCircle, Plus, MessageSquare } from 'lucide-react'
import IntegrationCard from '../components/Integrations/IntegrationCard'
import { IntegrationApi, type Integration } from '../utils/integrationApi'
import AzureDevOpsModal from '../components/Integrations/AzureDevOpsModal'
import RequestIntegrationModal, { type RequestIntegrationData } from '../components/Integrations/RequestIntegrationModal'
import SonarQubeModal from '../components/Integrations/SonarQubeModal'
import AzureCloudModal from '../components/Integrations/AzureCloudModal'
import GCPModal from '../components/Integrations/GCPModal'
import AWSModal from '../components/Integrations/AWSModal'
import KubernetesModal from '../components/Integrations/KubernetesModal'
import GrafanaModal from '../components/Integrations/GrafanaModal'
import GitHubModal from '../components/Integrations/GitHubModal'
import OpenAIModal from '../components/Integrations/OpenAIModal'
import GeminiModal from '../components/Integrations/GeminiModal'
import ClaudeModal from '../components/Integrations/ClaudeModal'
import JiraModal from '../components/Integrations/JiraModal'
import SlackModal from '../components/Integrations/SlackModal'
import TeamsModal from '../components/Integrations/TeamsModal'
import ArgoCDModal from '../components/Integrations/ArgoCDModal'
import PrometheusModal from '../components/Integrations/PrometheusModal'
import LokiModal from '../components/Integrations/LokiModal'
import VaultModal from '../components/Integrations/VaultModal'
import AWSSecretsModal from '../components/Integrations/AWSSecretsModal'
import OpenVPNModal from '../components/Integrations/OpenVPNModal'
import IntegrationTypeSelector from '../components/Integrations/IntegrationTypeSelector'

function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [showTypeSelector, setShowTypeSelector] = useState(false)
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [showRequestModal, setShowRequestModal] = useState(false)

  useEffect(() => {
    fetchIntegrations()
  }, [])

  const fetchIntegrations = async () => {
    try {
      const data = await IntegrationApi.getAll()
      setIntegrations(data)
    } catch (err) {
      console.error('Error fetching integrations:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleConfigure = (integration: Integration) => {
    setSelectedIntegration(integration)
    setIsCreating(false)
    setShowModal(true)
  }

  const handleCreateNew = () => {
    setShowTypeSelector(true)
  }

  const handleTypeSelected = (type: string) => {
    setSelectedType(type)
    setShowTypeSelector(false)
    setSelectedIntegration(null)
    setIsCreating(true)
    setShowModal(true)
  }

  const handleSave = async (integrationData: any) => {
    try {
      if (isCreating) {
        await IntegrationApi.create(
          selectedType || 'azuredevops',
          integrationData.name,
          integrationData.config
        )
      } else if (selectedIntegration) {
        await IntegrationApi.update(selectedIntegration.id, {
          name: integrationData.name,
          enabled: true,
          config: integrationData.config,
        })
      }

      await fetchIntegrations()
      setShowModal(false)
      setSelectedIntegration(null)
      setIsCreating(false)
      setSelectedType(null)
    } catch (err: any) {
      console.error('Error saving integration:', err)
      alert(err.message || 'Erro ao salvar integração')
      throw err
    }
  }

  const handleToggle = async (integration: Integration) => {
    try {
      await IntegrationApi.toggle(integration)
      await fetchIntegrations()
    } catch (err) {
      console.error('Error toggling integration:', err)
      alert('Erro ao alterar status da integração')
    }
  }

  const handleDelete = async (integration: Integration) => {
    const confirmed = window.confirm(`Tem certeza que deseja deletar a integração "${integration.name}"? Esta ação não pode ser desfeita.`)

    if (!confirmed) return

    try {
      await IntegrationApi.delete(integration.id)
      await fetchIntegrations()
    } catch (err) {
      console.error('Error deleting integration:', err)
      alert('Erro ao deletar integração')
    }
  }

  const handleRequestIntegration = async (data: RequestIntegrationData) => {
    try {
      await IntegrationApi.requestIntegration(data)
      console.log('Solicitação de integração enviada com sucesso')
    } catch (err: any) {
      console.error('Erro ao solicitar integração:', err)
      throw err
    }
  }

  if (loading) {
    return (
      <div className="max-w-[1400px] mx-auto">
        <div className="text-center py-15 px-5 text-base text-text-secondary">Carregando integrações...</div>
      </div>
    )
  }

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Plug size={32} className="text-primary" />
          <div>
            <h1 className="text-[32px] font-bold text-text mb-1">Integrações</h1>
            <p className="text-base text-text-secondary">Configure as integrações com ferramentas externas</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            className="flex items-center gap-2 py-3 px-6 bg-gray-700 hover:bg-gray-600 text-white border-none rounded-lg text-[15px] font-semibold cursor-pointer transition-all duration-200 ease-in-out whitespace-nowrap" 
            onClick={() => setShowRequestModal(true)}
          >
            <MessageSquare size={20} />
            <span>Solicitar Integração</span>
          </button>
          <button className="flex items-center gap-2 py-3 px-6 bg-primary text-white border-none rounded-lg text-[15px] font-semibold cursor-pointer transition-all duration-200 ease-in-out whitespace-nowrap hover:bg-primary-dark hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(99,102,241,0.3)]" onClick={handleCreateNew}>
            <Plus size={20} />
            <span>Nova Integração</span>
          </button>
        </div>
      </div>

      <div className="flex gap-6 mb-8 p-5 bg-surface border border-border rounded-xl">
        <div className="flex items-center gap-2 text-[15px] font-semibold text-text">
          <CheckCircle size={20} className="text-success" />
          <span>{integrations.filter(i => i.enabled).length} Ativas</span>
        </div>
        <div className="flex items-center gap-2 text-[15px] font-semibold text-text">
          <XCircle size={20} className="text-text-secondary" />
          <span>{integrations.filter(i => !i.enabled).length} Inativas</span>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(350px,1fr))] gap-6">
        {integrations.map((integration) => (
          <IntegrationCard
            key={integration.id}
            integration={integration}
            onConfigure={() => handleConfigure(integration)}
            onToggle={() => handleToggle(integration)}
            onDelete={() => handleDelete(integration)}
          />
        ))}
        
        <div 
          className="bg-gradient-to-br from-[#1B998B]/20 to-[#1B998B]/10 rounded-lg border-2 border-dashed border-[#1B998B]/50 p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-[#1B998B] hover:bg-[#1B998B]/20 transition-all"
          onClick={() => setShowRequestModal(true)}
        >
          <div className="w-16 h-16 bg-[#1B998B]/20 rounded-full flex items-center justify-center mb-4">
            <MessageSquare className="w-8 h-8 text-[#1B998B]" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Não encontrou a integração que precisa?</h3>
          <p className="text-sm text-gray-400 mb-4">
            Solicite uma nova integração e nossa equipe entrará em contato
          </p>
          <button className="px-4 py-2 bg-[#1B998B] hover:bg-[#1B998B]/90 text-white rounded-lg transition-colors text-sm font-medium">
            Solicitar Integração
          </button>
        </div>
      </div>

      {showTypeSelector && (
        <IntegrationTypeSelector
          onSelect={handleTypeSelected}
          onClose={() => setShowTypeSelector(false)}
        />
      )}

      {showModal && (isCreating ? selectedType === 'azuredevops' : selectedIntegration?.type === 'azuredevops') && (
        <AzureDevOpsModal
          integration={selectedIntegration}
          isCreating={isCreating}
          onSave={handleSave}
          onClose={() => {
            setShowModal(false)
            setSelectedIntegration(null)
            setIsCreating(false)
            setSelectedType(null)
          }}
        />
      )}

      {showModal && (isCreating ? selectedType === 'sonarqube' : selectedIntegration?.type === 'sonarqube') && (
        <SonarQubeModal
          integration={selectedIntegration}
          isCreating={isCreating}
          onSave={handleSave}
          onClose={() => {
            setShowModal(false)
            setSelectedIntegration(null)
            setIsCreating(false)
            setSelectedType(null)
          }}
        />
      )}

      {showModal && (isCreating ? selectedType === 'azure' : selectedIntegration?.type === 'azure') && (
        <AzureCloudModal
          integration={selectedIntegration}
          isCreating={isCreating}
          onSave={handleSave}
          onClose={() => {
            setShowModal(false)
            setSelectedIntegration(null)
            setIsCreating(false)
            setSelectedType(null)
          }}
        />
      )}

      {showModal && (isCreating ? selectedType === 'gcp' : selectedIntegration?.type === 'gcp') && (
        <GCPModal
          integration={selectedIntegration}
          isCreating={isCreating}
          onSave={handleSave}
          onClose={() => {
            setShowModal(false)
            setSelectedIntegration(null)
            setIsCreating(false)
            setSelectedType(null)
          }}
        />
      )}

      {showModal && (isCreating ? selectedType === 'aws' : selectedIntegration?.type === 'aws') && (
        <AWSModal
          integration={selectedIntegration}
          isCreating={isCreating}
          onSave={handleSave}
          onClose={() => {
            setShowModal(false)
            setSelectedIntegration(null)
            setIsCreating(false)
            setSelectedType(null)
          }}
        />
      )}

      {showModal && (isCreating ? selectedType === 'openai' : selectedIntegration?.type === 'openai') && (
        <OpenAIModal
          integration={selectedIntegration}
          isCreating={isCreating}
          onSave={handleSave}
          onClose={() => {
            setShowModal(false)
            setSelectedIntegration(null)
            setIsCreating(false)
            setSelectedType(null)
          }}
        />
      )}

      {showModal && (isCreating ? selectedType === 'gemini' : selectedIntegration?.type === 'gemini') && (
        <GeminiModal
          integration={selectedIntegration}
          isCreating={isCreating}
          onSave={handleSave}
          onClose={() => {
            setShowModal(false)
            setSelectedIntegration(null)
            setIsCreating(false)
            setSelectedType(null)
          }}
        />
      )}

      {showModal && (isCreating ? selectedType === 'claude' : selectedIntegration?.type === 'claude') && (
        <ClaudeModal
          integration={selectedIntegration}
          isCreating={isCreating}
          onSave={handleSave}
          onClose={() => {
            setShowModal(false)
            setSelectedIntegration(null)
            setIsCreating(false)
            setSelectedType(null)
          }}
        />
      )}

      {showModal && (isCreating ? selectedType === 'jira' : selectedIntegration?.type === 'jira') && (
        <JiraModal
          integration={selectedIntegration}
          isCreating={isCreating}
          onSave={handleSave}
          onClose={() => {
            setShowModal(false)
            setSelectedIntegration(null)
            setIsCreating(false)
            setSelectedType(null)
          }}
        />
      )}

      {showModal && (isCreating ? selectedType === 'slack' : selectedIntegration?.type === 'slack') && (
        <SlackModal
          integration={selectedIntegration}
          isCreating={isCreating}
          onSave={handleSave}
          onClose={() => {
            setShowModal(false)
            setSelectedIntegration(null)
            setIsCreating(false)
            setSelectedType(null)
          }}
        />
      )}

      {showModal && (isCreating ? selectedType === 'teams' : selectedIntegration?.type === 'teams') && (
        <TeamsModal
          integration={selectedIntegration}
          isCreating={isCreating}
          onSave={handleSave}
          onClose={() => {
            setShowModal(false)
            setSelectedIntegration(null)
            setIsCreating(false)
            setSelectedType(null)
          }}
        />
      )}

      {showModal && (isCreating ? selectedType === 'argocd' : selectedIntegration?.type === 'argocd') && (
        <ArgoCDModal
          integration={selectedIntegration}
          isCreating={isCreating}
          onSave={handleSave}
          onClose={() => {
            setShowModal(false)
            setSelectedIntegration(null)
            setIsCreating(false)
            setSelectedType(null)
          }}
        />
      )}

      {showModal && (isCreating ? selectedType === 'prometheus' : selectedIntegration?.type === 'prometheus') && (
        <PrometheusModal
          integration={selectedIntegration}
          isCreating={isCreating}
          onSave={handleSave}
          onClose={() => {
            setShowModal(false)
            setSelectedIntegration(null)
            setIsCreating(false)
            setSelectedType(null)
          }}
        />
      )}

      {showModal && (isCreating ? selectedType === 'loki' : selectedIntegration?.type === 'loki') && (
        <LokiModal
          integration={selectedIntegration}
          isCreating={isCreating}
          onSave={handleSave}
          onClose={() => {
            setShowModal(false)
            setSelectedIntegration(null)
            setIsCreating(false)
            setSelectedType(null)
          }}
        />
      )}

      {showModal && (isCreating ? selectedType === 'vault' : selectedIntegration?.type === 'vault') && (
        <VaultModal
          integration={selectedIntegration}
          isCreating={isCreating}
          onSave={handleSave}
          onClose={() => {
            setShowModal(false)
            setSelectedIntegration(null)
            setIsCreating(false)
            setSelectedType(null)
          }}
        />
      )}

      {showModal && (isCreating ? selectedType === 'awssecrets' : selectedIntegration?.type === 'awssecrets') && (
        <AWSSecretsModal
          integration={selectedIntegration}
          isCreating={isCreating}
          onSave={handleSave}
          onClose={() => {
            setShowModal(false)
            setSelectedIntegration(null)
            setIsCreating(false)
            setSelectedType(null)
          }}
        />
      )}

      {showModal && (isCreating ? selectedType === 'openvpn' : selectedIntegration?.type === 'openvpn') && (
        <OpenVPNModal
          integration={selectedIntegration}
          isCreating={isCreating}
          onSave={handleSave}
          onClose={() => {
            setShowModal(false)
            setSelectedIntegration(null)
            setIsCreating(false)
            setSelectedType(null)
          }}
        />
      )}

      {showModal && (isCreating ? selectedType === 'kubernetes' : selectedIntegration?.type === 'kubernetes') && (
        <KubernetesModal
          integration={selectedIntegration}
          isCreating={isCreating}
          onSave={handleSave}
          onClose={() => {
            setShowModal(false)
            setSelectedIntegration(null)
            setIsCreating(false)
            setSelectedType(null)
          }}
        />
      )}

      {showModal && (isCreating ? selectedType === 'grafana' : selectedIntegration?.type === 'grafana') && (
        <GrafanaModal
          integration={selectedIntegration}
          isCreating={isCreating}
          onSave={handleSave}
          onClose={() => {
            setShowModal(false)
            setSelectedIntegration(null)
            setIsCreating(false)
            setSelectedType(null)
          }}
        />
      )}

      {showModal && (isCreating ? selectedType === 'github' : selectedIntegration?.type === 'github') && (
        <GitHubModal
          integration={selectedIntegration}
          isCreating={isCreating}
          onSave={handleSave}
          onClose={() => {
            setShowModal(false)
            setSelectedIntegration(null)
            setIsCreating(false)
            setSelectedType(null)
          }}
        />
      )}

      {showRequestModal && (
        <RequestIntegrationModal
          onClose={() => setShowRequestModal(false)}
          onSubmit={handleRequestIntegration}
        />
      )}
    </div>
  )
}

export default IntegrationsPage
