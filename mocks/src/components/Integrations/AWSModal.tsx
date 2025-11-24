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

interface AWSModalProps {
  integration: Integration | null
  isCreating: boolean
  onSave: (data: any) => Promise<void>
  onClose: () => void
}

function AWSModal({ integration, isCreating, onSave, onClose }: AWSModalProps) {
  const [name, setName] = useState(integration?.name || '')
  const [accessKeyId, setAccessKeyId] = useState(integration?.config?.accessKeyId || '')
  const [secretAccessKey, setSecretAccessKey] = useState(integration?.config?.secretAccessKey || '')
  const [region, setRegion] = useState(integration?.config?.region || 'us-east-1')
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const awsRegions = [
    'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
    'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-central-1',
    'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'ap-northeast-2',
    'sa-east-1', 'ca-central-1'
  ]

  const handleTestConnection = async () => {
    if (!accessKeyId || !secretAccessKey || !region) {
      alert('Preencha Access Key ID, Secret Access Key e Região para testar a conexão')
      return
    }

    setTesting(true)
    setTestResult(null)

    try {
      const response = await apiFetch('integrations/test/aws', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessKeyId,
          secretAccessKey,
          region,
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

    if (!accessKeyId || !secretAccessKey || !region) {
      alert('Access Key ID, Secret Access Key e Região são obrigatórios')
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
          accessKeyId,
          secretAccessKey,
          region,
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
            {isCreating ? 'Nova Integração AWS' : 'Configurar AWS'}
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
                placeholder="Ex: AWS - Produção"
                required
              />
              <p className="mt-2 text-sm text-text-secondary">
                Nome identificador desta integração
              </p>
            </div>
          )}

          <div className="mb-6">
            <label htmlFor="accessKeyId" className="block text-sm font-semibold text-text mb-2">
              Access Key ID *
            </label>
            <input
              id="accessKeyId"
              type="text"
              className="w-full p-3 bg-background border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
              value={accessKeyId}
              onChange={(e) => setAccessKeyId(e.target.value)}
              placeholder="AKIAIOSFODNN7EXAMPLE"
              required
            />
            <p className="mt-2 text-sm text-text-secondary">
              Chave de acesso AWS (IAM &gt; Users &gt; Security credentials)
            </p>
          </div>

          <div className="mb-6">
            <label htmlFor="secretAccessKey" className="block text-sm font-semibold text-text mb-2">
              Secret Access Key *
            </label>
            <input
              id="secretAccessKey"
              type="password"
              className="w-full p-3 bg-background border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
              value={secretAccessKey}
              onChange={(e) => setSecretAccessKey(e.target.value)}
              placeholder="••••••••••••••••"
              required
            />
            <p className="mt-2 text-sm text-text-secondary">
              Chave secreta de acesso AWS (disponível apenas na criação da chave)
            </p>
          </div>

          <div className="mb-6">
            <label htmlFor="region" className="block text-sm font-semibold text-text mb-2">
              Região *
            </label>
            <select
              id="region"
              className="w-full p-3 bg-background border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              required
            >
              {awsRegions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <p className="mt-2 text-sm text-text-secondary">
              Região principal da AWS para consultas de custo e recursos
            </p>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm mb-6">
            <p>ℹ️ As credenciais AWS devem ter permissões para <strong>Cost Explorer</strong> e <strong>Resource Groups Tagging API</strong>.</p>
          </div>

          <div className="flex flex-col gap-3 mb-6">
            <button
              type="button"
              className="py-3 px-6 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleTestConnection}
              disabled={testing || !accessKeyId || !secretAccessKey || !region}
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

export default AWSModal
