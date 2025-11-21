import { useState, useEffect } from 'react'
import { Plug, CheckCircle, XCircle, Plus } from 'lucide-react'
import IntegrationCard from '../components/Integrations/IntegrationCard'
import { IntegrationApi, type Integration } from '../utils/integrationApi'
import PageContainer from '../components/Layout/PageContainer'
import PageHeader from '../components/Layout/PageHeader'
import Section from '../components/Layout/Section'
import AzureDevOpsModal from '../components/Integrations/AzureDevOpsModal'
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
import IntegrationTypeSelector from '../components/Integrations/IntegrationTypeSelector'
import styles from './IntegrationsPage.module.css'

function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [showTypeSelector, setShowTypeSelector] = useState(false)
  const [selectedType, setSelectedType] = useState<string | null>(null)

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

  if (loading) {
    return (
      <PageContainer>
        <div className={styles.loading}>Carregando integrações...</div>
      </PageContainer>
    )
  }

  return (
    <PageContainer maxWidth="xl">
      <PageHeader
        icon={Plug}
        title="Integrações"
        subtitle="Configure as integrações com ferramentas externas"
        actions={
          <button className={styles.addButton} onClick={handleCreateNew}>
            <Plus size={20} />
            <span>Nova Integração</span>
          </button>
        }
      />

      <div className={styles.stats}>
        <div className={styles.statItem}>
          <CheckCircle size={20} className={styles.statIconSuccess} />
          <span>{integrations.filter(i => i.enabled).length} Ativas</span>
        </div>
        <div className={styles.statItem}>
          <XCircle size={20} className={styles.statIconInactive} />
          <span>{integrations.filter(i => !i.enabled).length} Inativas</span>
        </div>
      </div>

      <Section spacing="lg">
        <div className={styles.grid}>
          {integrations.map((integration) => (
            <IntegrationCard
              key={integration.id}
              integration={integration}
              onConfigure={() => handleConfigure(integration)}
              onToggle={() => handleToggle(integration)}
              onDelete={() => handleDelete(integration)}
            />
          ))}
        </div>
      </Section>

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
    </PageContainer>
  )
}

export default IntegrationsPage
