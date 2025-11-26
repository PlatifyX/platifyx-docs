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

interface OpenVPNModalProps {
  integration: Integration | null
  isCreating: boolean
  onSave: (data: any) => Promise<void>
  onClose: () => void
}

function OpenVPNModal({ integration, isCreating, onSave, onClose }: OpenVPNModalProps) {
  const [name, setName] = useState(integration?.name || '')
  const [url, setUrl] = useState(integration?.config?.url || '')
  const [username, setUsername] = useState(integration?.config?.username || '')
  const [password, setPassword] = useState(integration?.config?.password || '')
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleTestConnection = async () => {
    if (!url || !username || !password) {
      alert('Preencha URL, Username e Password para testar a conexão')
      return
    }

    setTesting(true)
    setTestResult(null)

    try {
      const response = await apiFetch('integrations/test/openvpn', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          username,
          password,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setTestResult({
          success: true,
          message: 'Conexão estabelecida com sucesso!'
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

    if (!url || !username || !password) {
      alert('URL, Username e Password são obrigatórios')
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
          url,
          username,
          password,
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
            {isCreating ? 'Nova Integração OpenVPN' : 'Configurar OpenVPN'}
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
                placeholder="Ex: OpenVPN - Produção"
                required
              />
              <p className="mt-2 text-sm text-text-secondary">
                Nome identificador desta integração
              </p>
            </div>
          )}

          <div className="mb-6">
            <label htmlFor="url" className="block text-sm font-semibold text-text mb-2">
              URL da API OpenVPN *
            </label>
            <input
              id="url"
              type="url"
              className="w-full p-3 bg-background border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://vpn.example.com"
              required
            />
            <p className="mt-2 text-sm text-text-secondary">
              URL completa da API do OpenVPN (ex: https://vpn.example.com)
            </p>
          </div>

          <div className="mb-6">
            <label htmlFor="username" className="block text-sm font-semibold text-text mb-2">
              Username *
            </label>
            <input
              id="username"
              type="text"
              className="w-full p-3 bg-background border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="api-user"
              required
            />
            <p className="mt-2 text-sm text-text-secondary">
              Username para autenticação na API do OpenVPN
            </p>
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-semibold text-text mb-2">
              Password *
            </label>
            <input
              id="password"
              type="password"
              className="w-full p-3 bg-background border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <p className="mt-2 text-sm text-text-secondary">
              Password para autenticação na API do OpenVPN
            </p>
          </div>

          <div className="flex flex-col gap-3 mb-6">
            <button
              type="button"
              className="py-3 px-6 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleTestConnection}
              disabled={testing || !url || !username || !password}
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

export default OpenVPNModal
