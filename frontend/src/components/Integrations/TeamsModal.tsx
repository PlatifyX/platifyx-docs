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

interface TeamsModalProps {
  integration: Integration | null
  isCreating: boolean
  onSave: (data: any) => Promise<void>
  onClose: () => void
}

function TeamsModal({ integration, isCreating, onSave, onClose }: TeamsModalProps) {
  const [name, setName] = useState(integration?.name || '')
  const [webhookUrl, setWebhookUrl] = useState(integration?.config?.webhookUrl || '')
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleTestConnection = async () => {
    if (!webhookUrl) {
      alert('Preencha o Webhook URL para testar a conexão')
      return
    }

    setTesting(true)
    setTestResult(null)

    try {
      const response = await fetch(buildApiUrl('integrations/test/teams'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          webhookUrl,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setTestResult({
          success: true,
          message: 'Conexão estabelecida! Uma mensagem de teste foi enviada ao Teams'
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

    if (!webhookUrl) {
      alert('Webhook URL é obrigatório')
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
          webhookUrl,
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
            {isCreating ? 'Nova Integração Teams' : 'Configurar Teams'}
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
                placeholder="Ex: Teams - Notificações"
                required
              />
              <p className={styles.hint}>
                Nome identificador desta integração
              </p>
            </div>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="webhookUrl" className={styles.label}>
              Webhook URL *
            </label>
            <input
              id="webhookUrl"
              type="url"
              className={styles.input}
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://outlook.office.com/webhook/..."
              required
            />
            <p className={styles.hint}>
              Crie um Incoming Webhook no Teams: <strong>Canal → Conectores → Incoming Webhook</strong>
            </p>
          </div>

          <div className={styles.testSection}>
            <button
              type="button"
              className={styles.testButton}
              onClick={handleTestConnection}
              disabled={testing || !webhookUrl}
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

export default TeamsModal
