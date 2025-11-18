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

interface AWSSecretsModalProps {
  integration: Integration | null
  isCreating: boolean
  onSave: (data: any) => Promise<void>
  onClose: () => void
}

function AWSSecretsModal({ integration, isCreating, onSave, onClose }: AWSSecretsModalProps) {
  const [name, setName] = useState(integration?.name || '')
  const [accessKeyId, setAccessKeyId] = useState(integration?.config?.accessKeyId || '')
  const [secretAccessKey, setSecretAccessKey] = useState(integration?.config?.secretAccessKey || '')
  const [region, setRegion] = useState(integration?.config?.region || 'us-east-1')
  const [sessionToken, setSessionToken] = useState(integration?.config?.sessionToken || '')
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleTestConnection = async () => {
    if (!accessKeyId || !secretAccessKey || !region) {
      alert('Preencha Access Key ID, Secret Access Key e Region para testar a conexão')
      return
    }

    setTesting(true)
    setTestResult(null)

    try {
      const response = await fetch('http://localhost:8060/api/v1/integrations/test/awssecrets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessKeyId,
          secretAccessKey,
          region,
          sessionToken: sessionToken || undefined,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setTestResult({
          success: true,
          message: `Conexão estabelecida! Região: ${data.region}`
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

    if (!accessKeyId || !secretAccessKey || !region) {
      alert('Access Key ID, Secret Access Key e Region são obrigatórios')
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
          sessionToken: sessionToken || undefined,
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
            {isCreating ? 'Nova Integração AWS Secrets Manager' : 'Configurar AWS Secrets Manager'}
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
                placeholder="Ex: AWS Secrets - Produção"
                required
              />
              <p className={styles.hint}>
                Nome identificador desta integração
              </p>
            </div>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="accessKeyId" className={styles.label}>
              Access Key ID *
            </label>
            <input
              id="accessKeyId"
              type="text"
              className={styles.input}
              value={accessKeyId}
              onChange={(e) => setAccessKeyId(e.target.value)}
              placeholder="AKIAIOSFODNN7EXAMPLE"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="secretAccessKey" className={styles.label}>
              Secret Access Key *
            </label>
            <input
              id="secretAccessKey"
              type="password"
              className={styles.input}
              value={secretAccessKey}
              onChange={(e) => setSecretAccessKey(e.target.value)}
              placeholder="••••••••••••••••"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="region" className={styles.label}>
              AWS Region *
            </label>
            <select
              id="region"
              className={styles.input}
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              required
            >
              <option value="us-east-1">US East (N. Virginia) - us-east-1</option>
              <option value="us-east-2">US East (Ohio) - us-east-2</option>
              <option value="us-west-1">US West (N. California) - us-west-1</option>
              <option value="us-west-2">US West (Oregon) - us-west-2</option>
              <option value="eu-west-1">Europe (Ireland) - eu-west-1</option>
              <option value="eu-central-1">Europe (Frankfurt) - eu-central-1</option>
              <option value="ap-southeast-1">Asia Pacific (Singapore) - ap-southeast-1</option>
              <option value="ap-northeast-1">Asia Pacific (Tokyo) - ap-northeast-1</option>
              <option value="sa-east-1">South America (São Paulo) - sa-east-1</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="sessionToken" className={styles.label}>
              Session Token (opcional)
            </label>
            <input
              id="sessionToken"
              type="password"
              className={styles.input}
              value={sessionToken}
              onChange={(e) => setSessionToken(e.target.value)}
              placeholder="Para temporary credentials"
            />
            <p className={styles.hint}>
              Apenas necessário para credenciais temporárias
            </p>
          </div>

          <div className={styles.testSection}>
            <button
              type="button"
              className={styles.testButton}
              onClick={handleTestConnection}
              disabled={testing || !accessKeyId || !secretAccessKey || !region}
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

export default AWSSecretsModal
