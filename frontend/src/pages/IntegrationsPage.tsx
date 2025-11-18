import { useState, useEffect } from 'react'
import { Plug, CheckCircle, XCircle, Plus } from 'lucide-react'
import IntegrationCard from '../components/Integrations/IntegrationCard'
import AzureDevOpsModal from '../components/Integrations/AzureDevOpsModal'
import IntegrationTypeSelector from '../components/Integrations/IntegrationTypeSelector'
import styles from './IntegrationsPage.module.css'

interface Integration {
  id: number
  name: string
  type: string
  enabled: boolean
  config: any
}

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
      const response = await fetch('http://localhost:8080/api/v1/integrations')
      if (!response.ok) throw new Error('Failed to fetch integrations')
      const data = await response.json()
      setIntegrations(data.integrations || [])
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
        // Create new integration
        const response = await fetch('http://localhost:8080/api/v1/integrations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: integrationData.name,
            type: selectedType || 'azuredevops',
            enabled: true,
            config: integrationData.config,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to create integration')
        }
      } else if (selectedIntegration) {
        // Update existing integration
        const response = await fetch(`http://localhost:8080/api/v1/integrations/${selectedIntegration.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: integrationData.name,
            enabled: true,
            config: integrationData.config,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to update integration')
        }
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
      const response = await fetch(`http://localhost:8080/api/v1/integrations/${integration.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enabled: !integration.enabled,
          config: integration.config || {},
        }),
      })

      if (!response.ok) throw new Error('Failed to toggle integration')

      await fetchIntegrations()
    } catch (err) {
      console.error('Error toggling integration:', err)
      alert('Erro ao alterar status da integração')
    }
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Carregando integrações...</div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <Plug size={32} className={styles.headerIcon} />
          <div>
            <h1 className={styles.title}>Integrações</h1>
            <p className={styles.subtitle}>Configure as integrações com ferramentas externas</p>
          </div>
        </div>
        <button className={styles.addButton} onClick={handleCreateNew}>
          <Plus size={20} />
          <span>Nova Integração</span>
        </button>
      </div>

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

      <div className={styles.grid}>
        {integrations.map((integration) => (
          <IntegrationCard
            key={integration.id}
            integration={integration}
            onConfigure={() => handleConfigure(integration)}
            onToggle={() => handleToggle(integration)}
          />
        ))}
      </div>

      {showTypeSelector && (
        <IntegrationTypeSelector
          onSelect={handleTypeSelected}
          onClose={() => setShowTypeSelector(false)}
        />
      )}

      {showModal && (isCreating || selectedIntegration?.type === 'azuredevops') && (
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
    </div>
  )
}

export default IntegrationsPage
