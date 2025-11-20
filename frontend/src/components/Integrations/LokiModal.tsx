import { useState } from 'react'
import { X, CheckCircle, XCircle } from 'lucide-react'
import styles from './AzureDevOpsModal.module.css'
import { buildApiUrl } from '../../config/api'

interface Integration {
  id: number
  name: string
  type: string
  enabled: boolean
  config: any
}

interface LokiModalProps {
  integration: Integration | null
  isCreating: boolean
  onSave: (data: any) => Promise<void>
  onClose: () => void
}

function LokiModal({ integration, isCreating, onSave, onClose }: LokiModalProps) {
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
      const response = await fetch(buildApiUrl('integrations/test/loki'), {
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
        const labelsMsg = data.labels ? ` (${data.labels} labels encontrados)` : ''
        setTestResult({
          success: true,
          message: `Conexão estabelecida!${labelsMsg}`
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
        name: name || integration?.name,
        config: {
          url,
          username: username || undefined,
          password: password || undefined,
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
            {isCreating ? 'Nova Integração Loki' : 'Configurar Loki'}
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
                placeholder="Ex: Loki - Produção"
                required
              />
              <p className={styles.hint}>
                Nome identificador desta integração
              </p>
            </div>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="url" className={styles.label}>
              URL do Loki *
            </label>
            <input
              id="url"
              type="url"
              className={styles.input}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="http://loki.example.com:3100"
              required
            />
            <p className={styles.hint}>
              URL do servidor Loki (ex: http://localhost:3100)
            </p>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="username" className={styles.label}>
              Usuário (opcional)
            </label>
            <input
              id="username"
              type="text"
              className={styles.input}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Usuário para autenticação básica"
            />
            <p className={styles.hint}>
              Deixe em branco se não houver autenticação
            </p>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>
              Senha (opcional)
            </label>
            <input
              id="password"
              type="password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••••••"
            />
            <p className={styles.hint}>
              Deixe em branco se não houver autenticação
            </p>
          </div>

          <div className={styles.testSection}>
            <button
              type="button"
              className={styles.testButton}
              onClick={handleTestConnection}
              disabled={testing || !url}
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

export default LokiModal
