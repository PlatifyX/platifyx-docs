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

interface AWSModalProps {
  integration: Integration | null
  isCreating: boolean
  onSave: (data: any) => Promise<void>
  onClose: () => void
}

function AWSModal({ integration, isCreating, onSave, onClose }: AWSModalProps) {
  const [name, setName] = useState(integration?.name || '')
  const [accessKeyId, setAccessKeyId] = useState(integration?.config?.accessKeyId || '')
  const [secretAccessKey, setSecretAccessKey] = useState(integration?.config?.secretAccessKey || '')
  const [region, setRegion] = useState(integration?.config?.region || 'us-east-1')
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const awsRegions = [
    'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
    'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-central-1',
    'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'ap-northeast-2',
    'sa-east-1', 'ca-central-1'
  ]

  const handleTestConnection = async () => {
    if (!accessKeyId || !secretAccessKey || !region) {
      alert('Preencha Access Key ID, Secret Access Key e Região para testar a conexão')
      return
    }

    setTesting(true)
    setTestResult(null)

    try {
      const response = await fetch('http://localhost:8060/api/v1/integrations/test/aws', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessKeyId,
          secretAccessKey,
          region,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setTestResult({
          success: true,
          message: 'Conexão estabelecida! Credenciais validadas com sucesso'
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

    if (!accessKeyId || !secretAccessKey || !region) {
      alert('Access Key ID, Secret Access Key e Região são obrigatórios')
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
            {isCreating ? 'Nova Integração AWS' : 'Configurar AWS'}
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
                placeholder="Ex: AWS - Produção"
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
            <p className={styles.hint}>
              Chave de acesso AWS (IAM &gt; Users &gt; Security credentials)
            </p>
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
            <p className={styles.hint}>
              Chave secreta de acesso AWS (disponível apenas na criação da chave)
            </p>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="region" className={styles.label}>
              Região *
            </label>
            <select
              id="region"
              className={styles.input}
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              required
            >
              {awsRegions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <p className={styles.hint}>
              Região principal da AWS para consultas de custo e recursos
            </p>
          </div>

          <div className={styles.infoBox}>
            <p>ℹ️ As credenciais AWS devem ter permissões para <strong>Cost Explorer</strong> e <strong>Resource Groups Tagging API</strong>.</p>
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

export default AWSModal
