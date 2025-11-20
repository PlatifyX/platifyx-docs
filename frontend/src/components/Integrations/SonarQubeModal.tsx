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

interface SonarQubeModalProps {
  integration: Integration | null
  isCreating: boolean
  onSave: (data: any) => Promise<void>
  onClose: () => void
}

function SonarQubeModal({ integration, isCreating, onSave, onClose }: SonarQubeModalProps) {
  const [name, setName] = useState(integration?.name || '')
  const [url, setUrl] = useState(integration?.config?.url || '')
  const [token, setToken] = useState(integration?.config?.token || '')
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleTestConnection = async () => {
    if (!url || !token) {
      alert('Preencha URL e Token para testar a conexão')
      return
    }

    setTesting(true)
    setTestResult(null)

    try {
      const response = await fetch(buildApiUrl('integrations/test/sonarqube'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          token,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setTestResult({
          success: true,
          message: `Conexão estabelecida! ${data.projectCount} projeto(s) encontrado(s)`
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

    if (!url || !token) {
      alert('URL e Token são obrigatórios')
      return
    }

    setSaving(true)

    try {
      await onSave({
        name: name || integration?.name || 'SonarQube',
        config: {
          url,
          token,
        },
      })
    } catch (err) {
      console.error('Failed to save:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>{isCreating ? 'Nova Integração - SonarQube' : 'Editar Integração - SonarQube'}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            {isCreating && (
              <div className={styles.field}>
                <label className={styles.label}>
                  Nome da Integração
                  <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  className={styles.input}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: SonarQube Produção"
                  required
                />
              </div>
            )}

            <div className={styles.field}>
              <label className={styles.label}>
                URL do SonarQube
                <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                className={styles.input}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://sonarqube.company.com"
                required
              />
              <p className={styles.hint}>URL completa do seu servidor SonarQube</p>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                Token de Acesso
                <span className={styles.required}>*</span>
              </label>
              <input
                type="password"
                className={styles.input}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="squ_xxxxxxxxxxxxxxxxxxxxxxx"
                required
              />
              <p className={styles.hint}>
                Token de autenticação do SonarQube (User &gt; My Account &gt; Security &gt; Generate Tokens)
              </p>
            </div>

            {testResult && (
              <div className={`${styles.testResult} ${testResult.success ? styles.success : styles.error}`}>
                {testResult.success ? (
                  <CheckCircle size={18} />
                ) : (
                  <XCircle size={18} />
                )}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>

          <div className={styles.modalFooter}>
            <button
              type="button"
              className={styles.testButton}
              onClick={handleTestConnection}
              disabled={testing || !url || !token}
            >
              {testing ? 'Testando...' : 'Testar Conexão'}
            </button>
            <div className={styles.actionButtons}>
              <button type="button" className={styles.cancelButton} onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className={styles.saveButton} disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SonarQubeModal
