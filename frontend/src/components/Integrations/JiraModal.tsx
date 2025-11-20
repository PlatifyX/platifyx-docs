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

interface JiraModalProps {
  integration: Integration | null
  isCreating: boolean
  onSave: (data: any) => Promise<void>
  onClose: () => void
}

function JiraModal({ integration, isCreating, onSave, onClose }: JiraModalProps) {
  const [name, setName] = useState(integration?.name || '')
  const [url, setUrl] = useState(integration?.config?.url || '')
  const [email, setEmail] = useState(integration?.config?.email || '')
  const [apiToken, setApiToken] = useState(integration?.config?.apiToken || '')
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleTestConnection = async () => {
    if (!url || !email || !apiToken) {
      alert('Preencha URL, Email e API Token para testar a conexão')
      return
    }

    setTesting(true)
    setTestResult(null)

    try {
      const response = await fetch(buildApiUrl('integrations/test/jira'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          email,
          apiToken,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setTestResult({
          success: true,
          message: `Conexão estabelecida! Usuário: ${data.user?.displayName || 'Desconhecido'}`
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

    if (!url || !email || !apiToken) {
      alert('URL, Email e API Token são obrigatórios')
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
          email,
          apiToken,
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
            {isCreating ? 'Nova Integração Jira' : 'Configurar Jira'}
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
                placeholder="Ex: Jira - Produção"
                required
              />
              <p className={styles.hint}>
                Nome identificador desta integração
              </p>
            </div>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="url" className={styles.label}>
              URL do Jira *
            </label>
            <input
              id="url"
              type="url"
              className={styles.input}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://your-domain.atlassian.net"
              required
            />
            <p className={styles.hint}>
              URL da sua instância do Jira (ex: <strong>https://company.atlassian.net</strong>)
            </p>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>
              Email *
            </label>
            <input
              id="email"
              type="email"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu.email@empresa.com"
              required
            />
            <p className={styles.hint}>
              Email da conta Atlassian
            </p>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="apiToken" className={styles.label}>
              API Token *
            </label>
            <input
              id="apiToken"
              type="password"
              className={styles.input}
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              placeholder="••••••••••••••••"
              required
            />
            <p className={styles.hint}>
              Crie um API token em <strong>https://id.atlassian.com/manage-profile/security/api-tokens</strong>
            </p>
          </div>

          <div className={styles.testSection}>
            <button
              type="button"
              className={styles.testButton}
              onClick={handleTestConnection}
              disabled={testing || !url || !email || !apiToken}
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

export default JiraModal
