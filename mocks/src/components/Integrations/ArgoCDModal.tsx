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

interface ArgoCDModalProps {
  integration: Integration | null
  isCreating: boolean
  onSave: (data: any) => Promise<void>
  onClose: () => void
}

function ArgoCDModal({ integration, isCreating, onSave, onClose }: ArgoCDModalProps) {
  const [name, setName] = useState(integration?.name || '')
  const [serverUrl, setServerUrl] = useState(integration?.config?.serverUrl || '')
  const [authToken, setAuthToken] = useState(integration?.config?.authToken || '')
  const [insecure, setInsecure] = useState(integration?.config?.insecure || false)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleTestConnection = async () => {
    if (!serverUrl || !authToken) {
      alert('Preencha Server URL e Auth Token para testar a conexão')
      return
    }

    setTesting(true)
    setTestResult(null)

    try {
      const response = await apiFetch('integrations/test/argocd', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serverUrl,
          authToken,
          insecure,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setTestResult({
          success: true,
          message: `Conexão estabelecida! ${data.applicationsCount || 0} aplicações encontradas`
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

    if (!serverUrl || !authToken) {
      alert('Server URL e Auth Token são obrigatórios')
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
          serverUrl,
          authToken,
          insecure,
        },
      })
    } catch (err) {
      // Error handled by parent
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000] backdrop-blur-sm" onClick={onClose}>
      <div className="bg-background border border-border rounded-xl w-[90%] max-w-[500px] max-h-[90vh] overflow-y-auto shadow-[0_20px_60px_rgba(0,0,0,0.3)]" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-6 border-b border-border">
          <h2 className="text-2xl font-semibold text-text m-0">
            {isCreating ? 'Nova Integração ArgoCD' : 'Configurar ArgoCD'}
          </h2>
          <button className="bg-transparent border-none text-text-secondary cursor-pointer p-1 flex items-center justify-center rounded transition-all duration-200 hover:bg-surface hover:text-text" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {isCreating && (
            <div className="mb-5">
              <label htmlFor="name" className="block text-sm font-medium text-text mb-2">
                Nome da Integração *
              </label>
              <input
                id="name"
                type="text"
                className="w-full px-3 py-2.5 text-sm text-text bg-surface border border-border rounded-md transition-all duration-200 focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)]"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: ArgoCD - Produção"
                required
              />
              <p className="mt-1.5 text-xs text-text-secondary leading-snug">
                Nome identificador desta integração
              </p>
            </div>
          )}

          <div className="mb-5">
            <label htmlFor="serverUrl" className="block text-sm font-medium text-text mb-2">
              Server URL *
            </label>
            <input
              id="serverUrl"
              type="url"
              className="w-full px-3 py-2.5 text-sm text-text bg-surface border border-border rounded-md transition-all duration-200 focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)]"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder="https://argocd.example.com"
              required
            />
            <p className="mt-1.5 text-xs text-text-secondary leading-snug">
              URL do servidor ArgoCD (ex: https://argocd.example.com)
            </p>
          </div>

          <div className="mb-5">
            <label htmlFor="authToken" className="block text-sm font-medium text-text mb-2">
              Auth Token *
            </label>
            <input
              id="authToken"
              type="password"
              className="w-full px-3 py-2.5 text-sm text-text bg-surface border border-border rounded-md transition-all duration-200 focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)]"
              value={authToken}
              onChange={(e) => setAuthToken(e.target.value)}
              placeholder="••••••••••••••••"
              required
            />
            <p className="mt-1.5 text-xs text-text-secondary leading-snug">
              Obtenha o token em: ArgoCD UI → User Info → Generate New Token
            </p>
          </div>

          <div className="mb-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={insecure}
                onChange={(e) => setInsecure(e.target.checked)}
                className="w-4 h-4 text-primary bg-surface border-border rounded focus:ring-primary focus:ring-2"
              />
              <span className="text-sm text-text">Ignorar verificação TLS (inseguro - apenas para desenvolvimento)</span>
            </label>
          </div>

          <div className="my-6 p-5 bg-surface border border-border rounded-lg">
            <button
              type="button"
              className="w-full px-5 py-3 text-sm font-medium text-white bg-[#0078d4] border-none rounded-md cursor-pointer transition-all duration-200 hover:bg-[#106ebe] disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleTestConnection}
              disabled={testing || !serverUrl || !authToken}
            >
              {testing ? 'Testando...' : 'Testar Conexão'}
            </button>

            {testResult && (
              <div className={testResult.success ? 'mt-3 p-3 flex items-center gap-2 bg-success/10 border border-success rounded-md text-success text-sm' : 'mt-3 p-3 flex items-center gap-2 bg-[rgba(239,68,68,0.1)] border border-[#ef4444] rounded-md text-[#ef4444] text-sm'}>
                {testResult.success ? (
                  <CheckCircle size={16} />
                ) : (
                  <XCircle size={16} />
                )}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-end p-6 border-t border-border -mx-6 -mb-6">
            <button
              type="button"
              className="px-5 py-2.5 text-sm font-medium text-text bg-surface border border-border rounded-md cursor-pointer transition-all duration-200 hover:bg-border disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={onClose}
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-sm font-medium text-white bg-primary border-none rounded-md cursor-pointer transition-all duration-200 hover:bg-primary-dark hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed"
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

export default ArgoCDModal
