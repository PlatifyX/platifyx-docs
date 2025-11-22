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

interface KubernetesModalProps {
  integration: Integration | null
  isCreating: boolean
  onSave: (data: any) => Promise<void>
  onClose: () => void
}

function KubernetesModal({ integration, isCreating, onSave, onClose }: KubernetesModalProps) {
  const [name, setName] = useState(integration?.name || '')
  const [clusterName, setClusterName] = useState(integration?.config?.name || '')
  const [kubeconfig, setKubeconfig] = useState(integration?.config?.kubeconfig || '')
  const [context, setContext] = useState(integration?.config?.context || '')
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleTestConnection = async () => {
    if (!clusterName || !kubeconfig) {
      alert('Preencha Nome do Cluster e Kubeconfig para testar a conexão')
      return
    }

    setTesting(true)
    setTestResult(null)

    try {
      const response = await fetch(buildApiUrl('integrations/test/kubernetes'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: clusterName,
          kubeconfig,
          context: context || undefined,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setTestResult({
          success: true,
          message: `Conexão estabelecida! Cluster conectado com sucesso`
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

    if (!clusterName || !kubeconfig) {
      alert('Nome do Cluster e Kubeconfig são obrigatórios')
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
          name: clusterName,
          kubeconfig,
          context: context || undefined,
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
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isCreating ? 'Nova Integração Kubernetes' : 'Configurar Kubernetes'}
          </h2>
          <button
            className="text-gray-400 hover:text-gray-600 transition-colors"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-160px)] space-y-4">
            {isCreating && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Integração *
                </label>
                <input
                  id="name"
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Kubernetes - Produção"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Nome identificador desta integração
                </p>
              </div>
            )}

            <div>
              <label htmlFor="clusterName" className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Cluster *
              </label>
              <input
                id="clusterName"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={clusterName}
                onChange={(e) => setClusterName(e.target.value)}
                placeholder="production-cluster"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Nome identificador do cluster Kubernetes
              </p>
            </div>

            <div>
              <label htmlFor="kubeconfig" className="block text-sm font-medium text-gray-700 mb-1">
                Kubeconfig *
              </label>
              <textarea
                id="kubeconfig"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-xs"
                value={kubeconfig}
                onChange={(e) => setKubeconfig(e.target.value)}
                placeholder="Cole o conteúdo do arquivo kubeconfig aqui..."
                rows={8}
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Conteúdo completo do arquivo kubeconfig (YAML)
              </p>
            </div>

            <div>
              <label htmlFor="context" className="block text-sm font-medium text-gray-700 mb-1">
                Context (opcional)
              </label>
              <input
                id="context"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="default"
              />
              <p className="mt-1 text-xs text-gray-500">
                Contexto específico do kubeconfig (deixe em branco para usar o padrão)
              </p>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleTestConnection}
                disabled={testing || !clusterName || !kubeconfig}
              >
                {testing ? 'Testando...' : 'Testar Conexão'}
              </button>

              {testResult && (
                <div className={`flex items-center gap-2 p-3 rounded-lg ${
                  testResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                }`}>
                  {testResult.success ? (
                    <CheckCircle size={16} className="flex-shrink-0" />
                  ) : (
                    <XCircle size={16} className="flex-shrink-0" />
                  )}
                  <span className="text-sm">{testResult.message}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors disabled:opacity-50"
              onClick={onClose}
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

export default KubernetesModal
