import { useState } from 'react'
import { X, CheckCircle, XCircle } from 'lucide-react'
import styles from './AzureDevOpsModal.module.css'

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
      const response = await fetch('http://localhost:8060/api/v1/integrations/test/kubernetes', {
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
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            {isCreating ? 'Nova Integração Kubernetes' : 'Configurar Kubernetes'}
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
                placeholder="Ex: Kubernetes - Produção"
                required
              />
              <p className={styles.hint}>
                Nome identificador desta integração
              </p>
            </div>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="clusterName" className={styles.label}>
              Nome do Cluster *
            </label>
            <input
              id="clusterName"
              type="text"
              className={styles.input}
              value={clusterName}
              onChange={(e) => setClusterName(e.target.value)}
              placeholder="production-cluster"
              required
            />
            <p className={styles.hint}>
              Nome identificador do cluster Kubernetes
            </p>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="kubeconfig" className={styles.label}>
              Kubeconfig *
            </label>
            <textarea
              id="kubeconfig"
              className={styles.input}
              value={kubeconfig}
              onChange={(e) => setKubeconfig(e.target.value)}
              placeholder="Cole o conteúdo do arquivo kubeconfig aqui..."
              rows={8}
              required
              style={{ fontFamily: 'monospace', fontSize: '12px' }}
            />
            <p className={styles.hint}>
              Conteúdo completo do arquivo kubeconfig (YAML)
            </p>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="context" className={styles.label}>
              Context (opcional)
            </label>
            <input
              id="context"
              type="text"
              className={styles.input}
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="default"
            />
            <p className={styles.hint}>
              Contexto específico do kubeconfig (deixe em branco para usar o padrão)
            </p>
          </div>

          <div className={styles.testSection}>
            <button
              type="button"
              className={styles.testButton}
              onClick={handleTestConnection}
              disabled={testing || !clusterName || !kubeconfig}
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

export default KubernetesModal
