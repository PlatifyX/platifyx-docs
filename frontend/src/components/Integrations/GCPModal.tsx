import { useState } from 'react'
import styles from './IntegrationModal.module.css'

interface GCPModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => void
  integration?: any
}

function GCPModal({ isOpen, onClose, onSave, integration }: GCPModalProps) {
  const [name, setName] = useState(integration?.name || '')
  const [projectId, setProjectId] = useState(integration?.config?.projectId || '')
  const [serviceAccountJson, setServiceAccountJson] = useState(integration?.config?.serviceAccountJson || '')
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  if (!isOpen) return null

  const handleTestConnection = async () => {
    setTesting(true)
    setTestResult(null)

    try {
      const response = await fetch('http://localhost:8060/api/v1/integrations/test/gcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          serviceAccountJson,
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
      projectId,
      serviceAccountJson,
    }

    onSave({
      name,
      type: 'gcp',
      config,
      enabled: true,
    })
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>{integration ? 'Editar' : 'Adicionar'} Integração - Google Cloud Platform</h2>
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
              placeholder="Ex: GCP Produção"
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="projectId">
              Project ID
              <span className={styles.tooltip}>
                ID do projeto GCP (encontrado no Console GCP)
              </span>
            </label>
            <input
              id="projectId"
              type="text"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              placeholder="my-project-123456"
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="serviceAccountJson">
              Service Account JSON
              <span className={styles.tooltip}>
                JSON da conta de serviço (IAM & Admin &gt; Service Accounts &gt; Create Key)
              </span>
            </label>
            <textarea
              id="serviceAccountJson"
              value={serviceAccountJson}
              onChange={(e) => setServiceAccountJson(e.target.value)}
              placeholder='{"type": "service_account", "project_id": "...", ...}'
              className={styles.textarea}
              rows={8}
            />
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
            disabled={testing || !projectId || !serviceAccountJson}
          >
            {testing ? 'Testando...' : 'Testar Conexão'}
          </button>
          <button className={styles.cancelButton} onClick={onClose}>
            Cancelar
          </button>
          <button
            className={styles.saveButton}
            onClick={handleSave}
            disabled={!name || !projectId || !serviceAccountJson}
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
}

export default GCPModal
