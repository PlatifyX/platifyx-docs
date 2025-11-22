import { useState } from 'react'
import { X, CheckCircle, XCircle } from 'lucide-react'
import { buildApiUrl } from '../../config/api'

interface Integration {
  id: number
  name: string
  type: string
  enabled: boolean
  config: any
}

interface VaultModalProps {
  integration: Integration | null
  isCreating: boolean
  onSave: (data: any) => Promise<void>
  onClose: () => void
}

function VaultModal({ integration, isCreating, onSave, onClose }: VaultModalProps) {
  const [name, setName] = useState(integration?.name || '')
  const [address, setAddress] = useState(integration?.config?.address || '')
  const [token, setToken] = useState(integration?.config?.token || '')
  const [namespace, setNamespace] = useState(integration?.config?.namespace || '')
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleTestConnection = async () => {
    if (!address || !token) {
      alert('Preencha Address e Token para testar a conexão')
      return
    }

    setTesting(true)
    setTestResult(null)

    try {
      const response = await fetch(buildApiUrl('integrations/test/vault'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address,
          token,
          namespace: namespace || undefined,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        const statusMsg = data.sealed ? ' (Sealed)' : data.initialized ? ' (Unsealed)' : ''
        const versionMsg = data.version ? ` Versão: ${data.version}` : ''
        setTestResult({
          success: true,
          message: `Conexão estabelecida!${statusMsg}${versionMsg}`
        })
      } else {
        const errorMsg = data.details ? `${data.error}: ${data.details}` : data.error || 'Falha ao conectar'
        setTestResult({ success: false, message: errorMsg })
      }
    } catch (err: any) {
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

    if (!address || !token) {
      alert('Address e Token são obrigatórios')
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
          address,
          token,
          namespace: namespace || undefined,
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
            {isCreating ? 'Nova Integração Vault' : 'Configurar Vault'}
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
                placeholder="Ex: Vault - Produção"
                required
              />
              <p className="mt-2 text-sm text-text-secondary">
                Nome identificador desta integração
              </p>
            </div>
          )}

          <div className="mb-6">
            <label htmlFor="address" className="block text-sm font-semibold text-text mb-2">
              Vault Address *
            </label>
            <input
              id="address"
              type="url"
              className="w-full p-3 bg-background border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="https://vault.example.com:8200"
              required
            />
            <p className="mt-2 text-sm text-text-secondary">
              URL completa do Vault (ex: https://vault.example.com:8200)
            </p>
          </div>

          <div className="mb-6">
            <label htmlFor="token" className="block text-sm font-semibold text-text mb-2">
              Vault Token *
            </label>
            <input
              id="token"
              type="password"
              className="w-full p-3 bg-background border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="s.xxxxxxxxxxxxxxxxxxxxxxxx"
              required
            />
            <p className="mt-2 text-sm text-text-secondary">
              Token de autenticação do Vault
            </p>
          </div>

          <div className="mb-6">
            <label htmlFor="namespace" className="block text-sm font-semibold text-text mb-2">
              Namespace (opcional)
            </label>
            <input
              id="namespace"
              type="text"
              className="w-full p-3 bg-background border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
              value={namespace}
              onChange={(e) => setNamespace(e.target.value)}
              placeholder="my-namespace"
            />
            <p className="mt-2 text-sm text-text-secondary">
              Vault Enterprise namespace (deixe vazio se não usar)
            </p>
          </div>

          <div className="flex flex-col gap-3 mb-6">
            <button
              type="button"
              className="py-3 px-6 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleTestConnection}
              disabled={testing || !address || !token}
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

export default VaultModal
