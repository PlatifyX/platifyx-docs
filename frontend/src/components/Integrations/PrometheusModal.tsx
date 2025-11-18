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

interface PrometheusModalProps {
  integration: Integration | null
  isCreating: boolean
  onSave: (data: any) => Promise<void>
  onClose: () => void
}

function PrometheusModal({ integration, isCreating, onSave, onClose }: PrometheusModalProps) {
  const [name, setName] = useState(integration?.name || '')
  const [url, setUrl] = useState(integration?.config?.url || '')
  const [username, setUsername] = useState(integration?.config?.username || '')
  const [password, setPassword] = useState(integration?.config?.password || '')
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleTestConnection = async () => {
    if (!url) {
      alert('Preencha a URL para testar a conexão')
      return
    }

    setTesting(true)
    setTestResult(null)

    try {
      const response = await fetch('http://localhost:8060/api/v1/integrations/test/prometheus', {
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
        const versionMsg = data.version ? ` (Versão: ${data.version})` : ''
        setTestResult({
          success: true,
          message: `Conexão estabelecida!${versionMsg}`
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

    if (!url) {
      alert('URL é obrigatória')
      return
    }

    if (!testResult?.success) {
      alert('Por favor, teste a conexão antes de salvar')
      return
    }

    setSaving(true)
    try {
      await onSave({
        name: name || 'Prometheus Integration',
        config: {
          url,
          username: username || undefined,
          password: password || undefined,
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
          <h2>{isCreating ? 'Nova Integração Prometheus' : 'Editar Integração Prometheus'}</h2>
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
              placeholder="ex: Prometheus Production"
              required={isCreating}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="url">URL do Prometheus *</label>
            <input
              type="url"
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="http://prometheus.example.com:9090"
              required
            />
            <small>URL do servidor Prometheus (ex: http://localhost:9090)</small>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="username">Usuário (opcional)</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Usuário para autenticação básica"
            />
            <small>Deixe em branco se não houver autenticação</small>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password">Senha (opcional)</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha para autenticação básica"
            />
            <small>Deixe em branco se não houver autenticação</small>
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
              disabled={testing || !url}
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

export default PrometheusModal
