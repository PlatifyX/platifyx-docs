import { useState } from 'react'
import { X } from 'lucide-react'
import styles from './AzureDevOpsModal.module.css'

interface Integration {
  id: number
  name: string
  type: string
  enabled: boolean
  config: any
}

interface AzureDevOpsModalProps {
  integration: Integration
  onSave: (config: any) => void
  onClose: () => void
}

function AzureDevOpsModal({ integration, onSave, onClose }: AzureDevOpsModalProps) {
  const [organization, setOrganization] = useState(integration.config?.organization || '')
  const [project, setProject] = useState(integration.config?.project || '')
  const [pat, setPat] = useState(integration.config?.pat || '')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!organization || !project || !pat) {
      alert('Todos os campos são obrigatórios')
      return
    }

    setSaving(true)
    try {
      await onSave({
        organization,
        project,
        pat,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Configurar Azure DevOps</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="organization" className={styles.label}>
              Organization
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
              Nome da organização no Azure DevOps (ex: dev.azure.com/<strong>your-organization</strong>)
            </p>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="project" className={styles.label}>
              Project
            </label>
            <input
              id="project"
              type="text"
              className={styles.input}
              value={project}
              onChange={(e) => setProject(e.target.value)}
              placeholder="your-project"
              required
            />
            <p className={styles.hint}>
              Nome do projeto no Azure DevOps
            </p>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="pat" className={styles.label}>
              Personal Access Token (PAT)
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
              Token de acesso pessoal com permissões de leitura em Pipelines, Builds e Releases
            </p>
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
