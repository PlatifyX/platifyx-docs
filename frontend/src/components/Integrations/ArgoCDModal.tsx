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
      const response = await fetch('http://localhost:8060/api/v1/integrations/test/argocd', {
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
        name: name || 'ArgoCD Integration',
        config: {
          serverUrl,
          authToken,
          insecure,
        },
      })
      onClose()
    } catch (err) {
      console.error('Error saving integration:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>{isCreating ? 'Nova Integração ArgoCD' : 'Editar Integração ArgoCD'}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="name">Nome da Integração *</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex: ArgoCD Production"
              required={isCreating}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="serverUrl">Server URL *</label>
            <input
              type="url"
              id="serverUrl"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder="https://argocd.example.com"
              required
            />
            <small>URL do servidor ArgoCD (ex: https://argocd.example.com)</small>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="authToken">Auth Token *</label>
            <input
              type="password"
              id="authToken"
              value={authToken}
              onChange={(e) => setAuthToken(e.target.value)}
              placeholder="Token de autenticação do ArgoCD"
              required
            />
            <small>Obtenha o token em: ArgoCD UI → User Info → Generate New Token</small>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={insecure}
                onChange={(e) => setInsecure(e.target.checked)}
              />
              <span>Ignorar verificação TLS (inseguro - apenas para desenvolvimento)</span>
            </label>
          </div>

          {testResult && (
            <div className={`${styles.testResult} ${testResult.success ? styles.success : styles.error}`}>
              {testResult.success ? (
                <CheckCircle size={20} />
              ) : (
                <XCircle size={20} />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          <div className={styles.modalActions}>
            <button
              type="button"
              className={styles.testButton}
              onClick={handleTestConnection}
              disabled={testing || !serverUrl || !authToken}
            >
              {testing ? 'Testando...' : 'Testar Conexão'}
            </button>

            <div className={styles.actionButtons}>
              <button type="button" className={styles.cancelButton} onClick={onClose}>
                Cancelar
              </button>
              <button
                type="submit"
                className={styles.saveButton}
                disabled={saving || !testResult?.success}
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ArgoCDModal
