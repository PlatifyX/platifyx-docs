import { useState } from 'react'
import { X, CheckCircle, XCircle } from 'lucide-react'
import styles from './AzureDevOpsModal.module.css'
import { buildApiUrl } from '../../config/api'

interface Integration {
  id: number
  name: string
  type: string
  enabled: boolean
  config: any
}

interface AzureCloudModalProps {
  integration: Integration | null
  isCreating: boolean
  onSave: (data: any) => Promise<void>
  onClose: () => void
}

function AzureCloudModal({ integration, isCreating, onSave, onClose }: AzureCloudModalProps) {
  const [name, setName] = useState(integration?.name || '')
  const [subscriptionId, setSubscriptionId] = useState(integration?.config?.subscriptionId || '')
  const [tenantId, setTenantId] = useState(integration?.config?.tenantId || '')
  const [clientId, setClientId] = useState(integration?.config?.clientId || '')
  const [clientSecret, setClientSecret] = useState(integration?.config?.clientSecret || '')
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleTestConnection = async () => {
    if (!subscriptionId || !tenantId || !clientId || !clientSecret) {
      alert('Preencha todos os campos para testar a conexão')
      return
    }

    setTesting(true)
    setTestResult(null)

    try {
      const response = await fetch(buildApiUrl('integrations/test/azure'), {
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
          message: 'Conexão estabelecida! Credenciais validadas com sucesso'
        })
      } else {
        const errorMsg = data.details ? `${data.error}: ${data.details}` : data.error || 'Falha ao conectar'
        setTestResult({ success: false, message: errorMsg })
      }
    } catch (err: any) {
      console.error('Connection test error:', err)
      setTestResult({
        success: false,
        message: `Erro ao testar conexão: ${err.message || 'Verifique se o backend está rodando'}`
      })
    } finally {
      setTesting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isCreating && !name) {
      alert('Nome da integração é obrigatório')
      return
    }

    if (!subscriptionId || !tenantId || !clientId || !clientSecret) {
      alert('Todos os campos são obrigatórios')
      return
    }

    if (!testResult?.success) {
      alert('Por favor, teste a conexão antes de salvar')
      return
    }

    setSaving(true)
    try {
      await onSave({
        name: name || integration?.name,
        config: {
          subscriptionId,
          tenantId,
          clientId,
          clientSecret,
        },
      })
    } catch (err) {
      // Error handled by parent
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            {isCreating ? 'Nova Integração Azure Cloud' : 'Configurar Azure Cloud'}
          </h2>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {isCreating && (
            <div className={styles.formGroup}>
              <label htmlFor="name" className={styles.label}>
                Nome da Integração *
              </label>
              <input
                id="name"
                type="text"
                className={styles.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Azure - Produção"
                required
              />
              <p className={styles.hint}>
                Nome identificador desta integração
              </p>
            </div>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="subscriptionId" className={styles.label}>
              Subscription ID *
            </label>
            <input
              id="subscriptionId"
              type="text"
              className={styles.input}
              value={subscriptionId}
              onChange={(e) => setSubscriptionId(e.target.value)}
              placeholder="00000000-0000-0000-0000-000000000000"
              required
            />
            <p className={styles.hint}>
              ID da assinatura Azure (encontrado no Portal Azure)
            </p>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="tenantId" className={styles.label}>
              Tenant ID *
            </label>
            <input
              id="tenantId"
              type="text"
              className={styles.input}
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              placeholder="00000000-0000-0000-0000-000000000000"
              required
            />
            <p className={styles.hint}>
              ID do inquilino Azure Active Directory
            </p>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="clientId" className={styles.label}>
              Client ID *
            </label>
            <input
              id="clientId"
              type="text"
              className={styles.input}
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="00000000-0000-0000-0000-000000000000"
              required
            />
            <p className={styles.hint}>
              ID do aplicativo (App Registration no Azure AD)
            </p>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="clientSecret" className={styles.label}>
              Client Secret *
            </label>
            <input
              id="clientSecret"
              type="password"
              className={styles.input}
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              placeholder="••••••••••••••••"
              required
            />
            <p className={styles.hint}>
              Segredo do aplicativo (App Registration &gt; Certificates & secrets)
            </p>
          </div>

          <div className={styles.infoBox}>
            <p>ℹ️ O aplicativo deve ter permissões de <strong>Reader</strong> na assinatura e acesso ao <strong>Cost Management</strong>.</p>
          </div>

          <div className={styles.testSection}>
            <button
              type="button"
              className={styles.testButton}
              onClick={handleTestConnection}
              disabled={testing || !subscriptionId || !tenantId || !clientId || !clientSecret}
            >
              {testing ? 'Testando...' : 'Testar Conexão'}
            </button>

            {testResult && (
              <div className={testResult.success ? styles.testSuccess : styles.testError}>
                {testResult.success ? (
                  <CheckCircle size={16} />
                ) : (
                  <XCircle size={16} />
                )}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>

          <div className={styles.footer}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onClose}
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.saveButton}
              disabled={saving}
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AzureCloudModal
