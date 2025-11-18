import { useState } from 'react'
import styles from './IntegrationModal.module.css'

interface AWSModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => void
  integration?: any
}

function AWSModal({ isOpen, onClose, onSave, integration }: AWSModalProps) {
  const [name, setName] = useState(integration?.name || '')
  const [accessKeyId, setAccessKeyId] = useState(integration?.config?.accessKeyId || '')
  const [secretAccessKey, setSecretAccessKey] = useState(integration?.config?.secretAccessKey || '')
  const [region, setRegion] = useState(integration?.config?.region || 'us-east-1')
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  if (!isOpen) return null

  const handleTestConnection = async () => {
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
          message: 'Conexão realizada com sucesso!',
        })
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Falha ao conectar',
        })
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Erro ao testar conexão: ' + (error as Error).message,
      })
    } finally {
      setTesting(false)
    }
  }

  const handleSave = () => {
    const config = {
      accessKeyId,
      secretAccessKey,
      region,
    }

    onSave({
      name,
      type: 'aws',
      config,
      enabled: true,
    })
  }

  const awsRegions = [
    'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
    'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-central-1',
    'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'ap-northeast-2',
    'sa-east-1', 'ca-central-1'
  ]

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>{integration ? 'Editar' : 'Adicionar'} Integração - Amazon Web Services</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.formGroup}>
            <label htmlFor="name">Nome da Integração</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: AWS Produção"
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="accessKeyId">
              Access Key ID
              <span className={styles.tooltip}>
                Chave de acesso AWS (IAM &gt; Users &gt; Security credentials)
              </span>
            </label>
            <input
              id="accessKeyId"
              type="text"
              value={accessKeyId}
              onChange={(e) => setAccessKeyId(e.target.value)}
              placeholder="AKIAIOSFODNN7EXAMPLE"
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="secretAccessKey">
              Secret Access Key
              <span className={styles.tooltip}>
                Chave secreta de acesso AWS
              </span>
            </label>
            <input
              id="secretAccessKey"
              type="password"
              value={secretAccessKey}
              onChange={(e) => setSecretAccessKey(e.target.value)}
              placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="region">
              Região
              <span className={styles.tooltip}>
                Região principal da AWS
              </span>
            </label>
            <select
              id="region"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className={styles.select}
            >
              {awsRegions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {testResult && (
            <div className={`${styles.testResult} ${testResult.success ? styles.success : styles.error}`}>
              {testResult.message}
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button
            className={styles.testButton}
            onClick={handleTestConnection}
            disabled={testing || !accessKeyId || !secretAccessKey || !region}
          >
            {testing ? 'Testando...' : 'Testar Conexão'}
          </button>
          <button className={styles.cancelButton} onClick={onClose}>
            Cancelar
          </button>
          <button
            className={styles.saveButton}
            onClick={handleSave}
            disabled={!name || !accessKeyId || !secretAccessKey || !region}
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
}

export default AWSModal
