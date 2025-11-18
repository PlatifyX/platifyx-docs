import { useState } from 'react'
import styles from './IntegrationModal.module.css'

interface AzureCloudModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => void
  integration?: any
}

function AzureCloudModal({ isOpen, onClose, onSave, integration }: AzureCloudModalProps) {
  const [name, setName] = useState(integration?.name || '')
  const [subscriptionId, setSubscriptionId] = useState(integration?.config?.subscriptionId || '')
  const [tenantId, setTenantId] = useState(integration?.config?.tenantId || '')
  const [clientId, setClientId] = useState(integration?.config?.clientId || '')
  const [clientSecret, setClientSecret] = useState(integration?.config?.clientSecret || '')
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  if (!isOpen) return null

  const handleTestConnection = async () => {
    setTesting(true)
    setTestResult(null)

    try {
      const response = await fetch('http://localhost:8060/api/v1/integrations/test/azure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId,
          tenantId,
          clientId,
          clientSecret,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setTestResult({
          success: true,
          message: 'Conexão realizada com sucesso!',
        })
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Falha ao conectar',
        })
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Erro ao testar conexão: ' + (error as Error).message,
      })
    } finally {
      setTesting(false)
    }
  }

  const handleSave = () => {
    const config = {
      subscriptionId,
      tenantId,
      clientId,
      clientSecret,
    }

    onSave({
      name,
      type: 'azure',
      config,
      enabled: true,
    })
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>{integration ? 'Editar' : 'Adicionar'} Integração - Microsoft Azure</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.formGroup}>
            <label htmlFor="name">Nome da Integração</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Azure Produção"
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="subscriptionId">
              Subscription ID
              <span className={styles.tooltip}>
                ID da assinatura Azure (encontrado no Portal Azure)
              </span>
            </label>
            <input
              id="subscriptionId"
              type="text"
              value={subscriptionId}
              onChange={(e) => setSubscriptionId(e.target.value)}
              placeholder="00000000-0000-0000-0000-000000000000"
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="tenantId">
              Tenant ID
              <span className={styles.tooltip}>
                ID do inquilino Azure AD
              </span>
            </label>
            <input
              id="tenantId"
              type="text"
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              placeholder="00000000-0000-0000-0000-000000000000"
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="clientId">
              Client ID
              <span className={styles.tooltip}>
                ID do aplicativo (App Registration)
              </span>
            </label>
            <input
              id="clientId"
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="00000000-0000-0000-0000-000000000000"
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="clientSecret">
              Client Secret
              <span className={styles.tooltip}>
                Segredo do aplicativo (App Registration &gt; Certificates & secrets)
              </span>
            </label>
            <input
              id="clientSecret"
              type="password"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              placeholder="••••••••••••••••"
              className={styles.input}
            />
          </div>

          {testResult && (
            <div className={`${styles.testResult} ${testResult.success ? styles.success : styles.error}`}>
              {testResult.message}
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button
            className={styles.testButton}
            onClick={handleTestConnection}
            disabled={testing || !subscriptionId || !tenantId || !clientId || !clientSecret}
          >
            {testing ? 'Testando...' : 'Testar Conexão'}
          </button>
          <button className={styles.cancelButton} onClick={onClose}>
            Cancelar
          </button>
          <button
            className={styles.saveButton}
            onClick={handleSave}
            disabled={!name || !subscriptionId || !tenantId || !clientId || !clientSecret}
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
}

export default AzureCloudModal
