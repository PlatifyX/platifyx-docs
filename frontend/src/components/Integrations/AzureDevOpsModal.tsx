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

interface AzureDevOpsModalProps {
  integration: Integration | null
  isCreating: boolean
  onSave: (data: any) => Promise<void>
  onClose: () => void
}

function AzureDevOpsModal({ integration, isCreating, onSave, onClose }: AzureDevOpsModalProps) {
  const [name, setName] = useState(integration?.name || '')
  const [organization, setOrganization] = useState(integration?.config?.organization || '')
  const [url, setUrl] = useState(integration?.config?.url || 'https://dev.azure.com')
  const [project, setProject] = useState(integration?.config?.project || '')
  const [pat, setPat] = useState(integration?.config?.pat || '')
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleTestConnection = async () => {
    if (!organization || !url || !pat) {
      alert('Preencha Organization, URL e Token para testar a conexão')
      return
    }

    setTesting(true)
    setTestResult(null)

    try {
      const response = await fetch('http://localhost:6000/api/v1/integrations/test/azuredevops', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organization,
          url,
          pat,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setTestResult({ success: true, message: 'Conexão estabelecida com sucesso!' })
      } else {
        setTestResult({ success: false, message: data.error || 'Falha ao conectar' })
      }
    } catch (err) {
      setTestResult({ success: false, message: 'Erro ao testar conexão' })
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

    if (!organization || !url || !pat) {
      alert('Organization, URL e Token são obrigatórios')
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
          organization,
          url,
          pat,
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
            {isCreating ? 'Nova Integração Azure DevOps' : 'Configurar Azure DevOps'}
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
                placeholder="Ex: Azure DevOps - Produção"
                required
              />
              <p className={styles.hint}>
                Nome identificador desta integração
              </p>
            </div>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="organization" className={styles.label}>
              Organization *
            </label>
            <input
              id="organization"
              type="text"
              className={styles.input}
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              placeholder="your-organization"
              required
            />
            <p className={styles.hint}>
              Nome da organização no Azure DevOps
            </p>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="url" className={styles.label}>
              URL *
            </label>
            <input
              id="url"
              type="text"
              className={styles.input}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://dev.azure.com"
              required
            />
            <p className={styles.hint}>
              URL base do Azure DevOps
            </p>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="pat" className={styles.label}>
              Personal Access Token (PAT) *
            </label>
            <input
              id="pat"
              type="password"
              className={styles.input}
              value={pat}
              onChange={(e) => setPat(e.target.value)}
              placeholder="••••••••••••••••"
              required
            />
            <p className={styles.hint}>
              Token de acesso pessoal com permissões de leitura em Pipelines, Builds e Releases de TODOS os projetos da organização
            </p>
          </div>

          <div className={styles.infoBox}>
            <p>ℹ️ Esta integração conectará com <strong>todos os projetos</strong> da organização automaticamente.</p>
          </div>

          <div className={styles.testSection}>
            <button
              type="button"
              className={styles.testButton}
              onClick={handleTestConnection}
              disabled={testing || !organization || !url || !pat}
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

export default AzureDevOpsModal
