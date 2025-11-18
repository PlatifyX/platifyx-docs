import { useState } from 'react'
import { X, CheckCircle, XCircle } from 'lucide-react'
import { useIntegrationTest } from '../../hooks/useIntegrationTest'
import type { Integration } from '../../utils/integrationApi'
import styles from './AzureDevOpsModal.module.css'

interface OpenAIModalProps {
  integration: Integration | null
  isCreating: boolean
  onSave: (data: any) => Promise<void>
  onClose: () => void
}

function OpenAIModal({ integration, isCreating, onSave, onClose }: OpenAIModalProps) {
  const [name, setName] = useState(integration?.name || '')
  const [apiKey, setApiKey] = useState(integration?.config?.apiKey || '')
  const [organization, setOrganization] = useState(integration?.config?.organization || '')
  const [saving, setSaving] = useState(false)

  const { testing, testResult, testConnection } = useIntegrationTest()

  const handleTestConnection = async () => {
    if (!apiKey) {
      alert('Preencha a API Key para testar a conexão')
      return
    }

    await testConnection('openai', {
      apiKey,
      organization: organization || undefined,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isCreating && !name) {
      alert('Nome da integração é obrigatório')
      return
    }

    if (!apiKey) {
      alert('API Key é obrigatória')
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
          apiKey,
          organization: organization || undefined,
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
            {isCreating ? 'Nova Integração OpenAI' : 'Configurar OpenAI'}
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
                placeholder="Ex: OpenAI - Produção"
                required
              />
              <p className={styles.hint}>
                Nome identificador desta integração
              </p>
            </div>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="apiKey" className={styles.label}>
              API Key *
            </label>
            <input
              id="apiKey"
              type="password"
              className={styles.input}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              required
            />
            <p className={styles.hint}>
              Obtenha sua API key em <strong>https://platform.openai.com/api-keys</strong>
            </p>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="organization" className={styles.label}>
              Organization ID (opcional)
            </label>
            <input
              id="organization"
              type="text"
              className={styles.input}
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              placeholder="org-..."
            />
            <p className={styles.hint}>
              Necessário apenas se você pertence a múltiplas organizações
            </p>
          </div>

          <div className={styles.testSection}>
            <button
              type="button"
              className={styles.testButton}
              onClick={handleTestConnection}
              disabled={testing || !apiKey}
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

export default OpenAIModal
