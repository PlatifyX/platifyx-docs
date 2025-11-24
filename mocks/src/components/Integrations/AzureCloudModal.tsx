import { useState } from 'react'
import { X, CheckCircle, XCircle } from 'lucide-react'
import { apiFetch } from '../../config/api'

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
      const response = await apiFetch('integrations/test/azure', {
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-surface rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold text-text">
            {isCreating ? 'Nova Integração Azure Cloud' : 'Configurar Azure Cloud'}
          </h2>
          <button className="p-2 hover:bg-hover rounded-lg transition-colors" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {isCreating && (
            <div className="mb-6">
              <label htmlFor="name" className="block text-sm font-semibold text-text mb-2">
                Nome da Integração *
              </label>
              <input
                id="name"
                type="text"
                className="w-full p-3 bg-background border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Azure - Produção"
                required
              />
              <p className="mt-2 text-sm text-text-secondary">
                Nome identificador desta integração
              </p>
            </div>
          )}

          <div className="mb-6">
            <label htmlFor="subscriptionId" className="block text-sm font-semibold text-text mb-2">
              Subscription ID *
            </label>
            <input
              id="subscriptionId"
              type="text"
              className="w-full p-3 bg-background border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
              value={subscriptionId}
              onChange={(e) => setSubscriptionId(e.target.value)}
              placeholder="00000000-0000-0000-0000-000000000000"
              required
            />
            <p className="mt-2 text-sm text-text-secondary">
              ID da assinatura Azure (encontrado no Portal Azure)
            </p>
          </div>

          <div className="mb-6">
            <label htmlFor="tenantId" className="block text-sm font-semibold text-text mb-2">
              Tenant ID *
            </label>
            <input
              id="tenantId"
              type="text"
              className="w-full p-3 bg-background border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              placeholder="00000000-0000-0000-0000-000000000000"
              required
            />
            <p className="mt-2 text-sm text-text-secondary">
              ID do inquilino Azure Active Directory
            </p>
          </div>

          <div className="mb-6">
            <label htmlFor="clientId" className="block text-sm font-semibold text-text mb-2">
              Client ID *
            </label>
            <input
              id="clientId"
              type="text"
              className="w-full p-3 bg-background border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="00000000-0000-0000-0000-000000000000"
              required
            />
            <p className="mt-2 text-sm text-text-secondary">
              ID do aplicativo (App Registration no Azure AD)
            </p>
          </div>

          <div className="mb-6">
            <label htmlFor="clientSecret" className="block text-sm font-semibold text-text mb-2">
              Client Secret *
            </label>
            <input
              id="clientSecret"
              type="password"
              className="w-full p-3 bg-background border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              placeholder="••••••••••••••••"
              required
            />
            <p className="mt-2 text-sm text-text-secondary">
              Segredo do aplicativo (App Registration &gt; Certificates & secrets)
            </p>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm mb-6">
            <p>ℹ️ O aplicativo deve ter permissões de <strong>Reader</strong> na assinatura e acesso ao <strong>Cost Management</strong>.</p>
          </div>

          <div className="flex flex-col gap-3 mb-6">
            <button
              type="button"
              className="py-3 px-6 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleTestConnection}
              disabled={testing || !subscriptionId || !tenantId || !clientId || !clientSecret}
            >
              {testing ? 'Testando...' : 'Testar Conexão'}
            </button>

            {testResult && (
              <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                testResult.success
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
                  : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
              }`}>
                {testResult.success ? (
                  <CheckCircle size={16} />
                ) : (
                  <XCircle size={16} />
                )}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-border">
            <button
              type="button"
              className="py-3 px-6 bg-transparent text-text border border-border rounded-lg hover:bg-hover transition-colors disabled:opacity-50"
              onClick={onClose}
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="py-3 px-6 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
