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
        name: name || 'AWS Secrets Manager',
        config: {
          accessKeyId,
          secretAccessKey,
          region,
          sessionToken: sessionToken || undefined,
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
          <h2>{isCreating ? 'Nova Integração AWS Secrets Manager' : 'Editar Integração AWS Secrets Manager'}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="name">Nome da Integração *</label>
            <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="ex: AWS Secrets Production" required={isCreating} />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="accessKeyId">Access Key ID *</label>
            <input type="text" id="accessKeyId" value={accessKeyId} onChange={(e) => setAccessKeyId(e.target.value)} placeholder="AKIAIOSFODNN7EXAMPLE" required />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="secretAccessKey">Secret Access Key *</label>
            <input type="password" id="secretAccessKey" value={secretAccessKey} onChange={(e) => setSecretAccessKey(e.target.value)} placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY" required />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="region">AWS Region *</label>
            <select id="region" value={region} onChange={(e) => setRegion(e.target.value)} required>
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
            <label htmlFor="sessionToken">Session Token (opcional)</label>
            <input type="password" id="sessionToken" value={sessionToken} onChange={(e) => setSessionToken(e.target.value)} placeholder="Para temporary credentials" />
            <small>Apenas necessário para credenciais temporárias</small>
          </div>

          {testResult && (
            <div className={`${styles.testResult} ${testResult.success ? styles.success : styles.error}`}>
              {testResult.success ? <CheckCircle size={20} /> : <XCircle size={20} />}
              <span>{testResult.message}</span>
            </div>
          )}

          <div className={styles.modalActions}>
            <button type="button" className={styles.testButton} onClick={handleTestConnection} disabled={testing || !accessKeyId || !secretAccessKey || !region}>
              {testing ? 'Testando...' : 'Testar Conexão'}
            </button>

            <div className={styles.actionButtons}>
              <button type="button" className={styles.cancelButton} onClick={onClose}>Cancelar</button>
              <button type="submit" className={styles.saveButton} disabled={saving || !testResult?.success}>
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AWSSecretsModal
