import { useState } from 'react'
import { X, CheckCircle, XCircle } from 'lucide-react'
import { useIntegrationTest } from '../../hooks/useIntegrationTest'
import type { Integration } from '../../utils/integrationApi'

interface OpenAIModalProps {
  integration: Integration | null
  isCreating: boolean
  onSave: (data: any) => Promise<void>
  onClose: () => void
}

function OpenAIModal({ integration, isCreating, onSave, onClose }: OpenAIModalProps) {
  const [name, setName] = useState(integration?.name || '')
  const [apiKey, setApiKey] = useState(integration?.config?.apiKey || '')
  const [organization, setOrganization] = useState(integration?.config?.organization || '')
  const [saving, setSaving] = useState(false)

  const { testing, testResult, testConnection } = useIntegrationTest()

  const handleTestConnection = async () => {
    if (!apiKey) {
      alert('Preencha a API Key para testar a conexão')
      return
    }

    await testConnection('openai', {
      apiKey,
      organization: organization || undefined,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isCreating && !name) {
      alert('Nome da integração é obrigatório')
      return
    }

    if (!apiKey) {
      alert('API Key é obrigatória')
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
          apiKey,
          organization: organization || undefined,
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
            {isCreating ? 'Nova Integração OpenAI' : 'Configurar OpenAI'}
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
                placeholder="Ex: OpenAI - Produção"
                required
              />
              <p className="mt-2 text-sm text-text-secondary">
                Nome identificador desta integração
              </p>
            </div>
          )}

          <div className="mb-6">
            <label htmlFor="apiKey" className="block text-sm font-semibold text-text mb-2">
              API Key *
            </label>
            <input
              id="apiKey"
              type="password"
              className="w-full p-3 bg-background border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              required
            />
            <p className="mt-2 text-sm text-text-secondary">
              Obtenha sua API key em <strong>https://platform.openai.com/api-keys</strong>
            </p>
          </div>

          <div className="mb-6">
            <label htmlFor="organization" className="block text-sm font-semibold text-text mb-2">
              Organization ID (opcional)
            </label>
            <input
              id="organization"
              type="text"
              className="w-full p-3 bg-background border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              placeholder="org-..."
            />
            <p className="mt-2 text-sm text-text-secondary">
              Necessário apenas se você pertence a múltiplas organizações
            </p>
          </div>

          <div className="flex flex-col gap-3 mb-6">
            <button
              type="button"
              className="py-3 px-6 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleTestConnection}
              disabled={testing || !apiKey}
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

export default OpenAIModal
