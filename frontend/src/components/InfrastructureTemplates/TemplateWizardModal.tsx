import { useState } from 'react'
import { X, ChevronRight, ChevronLeft, Download, CheckCircle2, FileText } from 'lucide-react'
import JSZip from 'jszip'
import styles from './TemplateWizardModal.module.css'

interface Template {
  type: string
  name: string
  description: string
  languages: string[]
}

interface TemplateWizardModalProps {
  template: Template
  onClose: () => void
}

interface FormData {
  squad: string
  appName: string
  language: string
  version: string
  port: number
  useSecret: boolean
  useIngress: boolean
  ingressHost: string
  hasTests: boolean
  isMonorepo: boolean
  appPath: string
  cpuLimit: string
  cpuRequest: string
  memoryLimit: string
  memoryRequest: string
  replicas: number
  cronSchedule?: string
}

interface GeneratedTemplate {
  repositoryName: string
  files: { [key: string]: string }
  instructions: string[]
  metadata: any
}

function TemplateWizardModal({ template, onClose }: TemplateWizardModalProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<FormData>({
    squad: '',
    appName: '',
    language: template.languages[0] || 'go',
    version: '1.23.0',
    port: 80,
    useSecret: true,
    useIngress: template.type === 'api',
    ingressHost: '',
    hasTests: true,
    isMonorepo: false,
    appPath: '.',
    cpuLimit: '500m',
    cpuRequest: '250m',
    memoryLimit: '512Mi',
    memoryRequest: '256Mi',
    replicas: 1,
    cronSchedule: template.type === 'cronjob' ? '0 2 * * *' : undefined
  })
  const [generatedTemplate, setGeneratedTemplate] = useState<GeneratedTemplate | null>(null)
  const [loading, setLoading] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [completedSteps, setCompletedSteps] = useState<{ [key: number]: boolean }>({})

  const steps = [
    { id: 0, title: 'Informações Básicas', description: 'Squad e nome da aplicação' },
    { id: 1, title: 'Tecnologia', description: 'Linguagem e versão' },
    { id: 2, title: 'Configuração', description: 'Portas, secrets e ingress' },
    { id: 3, title: 'Recursos', description: 'CPU, memória e replicas' },
    { id: 4, title: 'Preview', description: 'Revisar antes de gerar' }
  ]

  const handleNext = () => {
    setCompletedSteps({ ...completedSteps, [currentStep]: true })
    if (currentStep === steps.length - 2) {
      handlePreview()
    }
    setCurrentStep(Math.min(currentStep + 1, steps.length - 1))
  }

  const handlePrevious = () => {
    setCurrentStep(Math.max(currentStep - 1, 0))
  }

  const handlePreview = async () => {
    setPreviewMode(true)
    setLoading(true)
    try {
      const response = await fetch('http://localhost:8060/api/v1/infrastructure-templates/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          templateType: template.type
        }),
      })
      const data = await response.json()
      setGeneratedTemplate(data)
    } catch (error) {
      console.error('Error previewing template:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:8060/api/v1/infrastructure-templates/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          templateType: template.type
        }),
      })
      const data = await response.json()
      setGeneratedTemplate(data)
    } catch (error) {
      console.error('Error generating template:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadZip = async () => {
    if (!generatedTemplate) return

    const zip = new JSZip()

    // Add all files to zip
    Object.entries(generatedTemplate.files).forEach(([path, content]) => {
      zip.file(path, content)
    })

    // Generate and download
    const blob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${generatedTemplate.repositoryName}.zip`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className={styles.stepContent}>
            <h3>Informações Básicas</h3>
            <div className={styles.formGroup}>
              <label>Squad *</label>
              <input
                type="text"
                value={formData.squad}
                onChange={(e) => setFormData({ ...formData, squad: e.target.value })}
                placeholder="ex: cxm"
                required
              />
              <small>Nome da squad responsável pelo serviço</small>
            </div>
            <div className={styles.formGroup}>
              <label>Nome da Aplicação *</label>
              <input
                type="text"
                value={formData.appName}
                onChange={(e) => setFormData({ ...formData, appName: e.target.value })}
                placeholder="ex: distribution"
                required
              />
              <small>Nome da aplicação (será usado como: {formData.squad || 'squad'}-{formData.appName || 'app'})</small>
            </div>
          </div>
        )

      case 1:
        return (
          <div className={styles.stepContent}>
            <h3>Tecnologia</h3>
            <div className={styles.formGroup}>
              <label>Linguagem *</label>
              <select
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
              >
                {template.languages.map((lang) => (
                  <option key={lang} value={lang.toLowerCase()}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Versão *</label>
              <input
                type="text"
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                placeholder="ex: 1.23.0"
              />
              <small>Versão da linguagem/runtime</small>
            </div>
            <div className={styles.formGroup}>
              <label>
                <input
                  type="checkbox"
                  checked={formData.hasTests}
                  onChange={(e) => setFormData({ ...formData, hasTests: e.target.checked })}
                />
                Possui testes unitários
              </label>
            </div>
            <div className={styles.formGroup}>
              <label>
                <input
                  type="checkbox"
                  checked={formData.isMonorepo}
                  onChange={(e) => setFormData({ ...formData, isMonorepo: e.target.checked })}
                />
                É um monorepo
              </label>
            </div>
            {formData.isMonorepo && (
              <div className={styles.formGroup}>
                <label>Caminho da aplicação</label>
                <input
                  type="text"
                  value={formData.appPath}
                  onChange={(e) => setFormData({ ...formData, appPath: e.target.value })}
                  placeholder="ex: services/api"
                />
              </div>
            )}
          </div>
        )

      case 2:
        return (
          <div className={styles.stepContent}>
            <h3>Configuração</h3>
            <div className={styles.formGroup}>
              <label>Porta do Container</label>
              <input
                type="number"
                value={formData.port}
                onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
              />
              <small>Porta que a aplicação escuta (padrão: 80)</small>
            </div>
            {template.type === 'cronjob' && (
              <div className={styles.formGroup}>
                <label>Cron Schedule *</label>
                <input
                  type="text"
                  value={formData.cronSchedule}
                  onChange={(e) => setFormData({ ...formData, cronSchedule: e.target.value })}
                  placeholder="0 2 * * *"
                />
                <small>Expressão cron (ex: 0 2 * * * = todo dia às 2h)</small>
              </div>
            )}
            <div className={styles.formGroup}>
              <label>
                <input
                  type="checkbox"
                  checked={formData.useSecret}
                  onChange={(e) => setFormData({ ...formData, useSecret: e.target.checked })}
                />
                Usar External Secret (AWS Secrets Manager)
              </label>
            </div>
            {template.type === 'api' && (
              <>
                <div className={styles.formGroup}>
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.useIngress}
                      onChange={(e) => setFormData({ ...formData, useIngress: e.target.checked })}
                    />
                    Usar Ingress (expor externamente)
                  </label>
                </div>
                {formData.useIngress && (
                  <div className={styles.formGroup}>
                    <label>Hostname do Ingress *</label>
                    <input
                      type="text"
                      value={formData.ingressHost}
                      onChange={(e) => setFormData({ ...formData, ingressHost: e.target.value })}
                      placeholder="ex: api.example.com"
                    />
                    <small>Stage será: stage-{formData.ingressHost}</small>
                  </div>
                )}
              </>
            )}
          </div>
        )

      case 3:
        return (
          <div className={styles.stepContent}>
            <h3>Recursos</h3>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>CPU Request</label>
                <input
                  type="text"
                  value={formData.cpuRequest}
                  onChange={(e) => setFormData({ ...formData, cpuRequest: e.target.value })}
                  placeholder="250m"
                />
              </div>
              <div className={styles.formGroup}>
                <label>CPU Limit</label>
                <input
                  type="text"
                  value={formData.cpuLimit}
                  onChange={(e) => setFormData({ ...formData, cpuLimit: e.target.value })}
                  placeholder="500m"
                />
              </div>
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Memory Request</label>
                <input
                  type="text"
                  value={formData.memoryRequest}
                  onChange={(e) => setFormData({ ...formData, memoryRequest: e.target.value })}
                  placeholder="256Mi"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Memory Limit</label>
                <input
                  type="text"
                  value={formData.memoryLimit}
                  onChange={(e) => setFormData({ ...formData, memoryLimit: e.target.value })}
                  placeholder="512Mi"
                />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label>Replicas</label>
              <input
                type="number"
                min="1"
                value={formData.replicas}
                onChange={(e) => setFormData({ ...formData, replicas: parseInt(e.target.value) })}
              />
              <small>Número de pods para o deployment</small>
            </div>
          </div>
        )

      case 4:
        return (
          <div className={styles.stepContent}>
            <h3>Preview e Geração</h3>
            {loading && <div className={styles.loading}>Gerando preview...</div>}
            {generatedTemplate && (
              <div className={styles.previewContainer}>
                <div className={styles.previewHeader}>
                  <h4>Repositório: {generatedTemplate.repositoryName}</h4>
                  <span className={styles.fileCount}>
                    {Object.keys(generatedTemplate.files).length} arquivos
                  </span>
                </div>

                <div className={styles.filesList}>
                  <h5>Arquivos que serão gerados:</h5>
                  {Object.keys(generatedTemplate.files).map((path) => (
                    <div key={path} className={styles.fileItem}>
                      <FileText size={16} />
                      <span>{path}</span>
                    </div>
                  ))}
                </div>

                <div className={styles.instructions}>
                  <h5>Instruções de Setup:</h5>
                  <ol>
                    {generatedTemplate.instructions.map((instruction, idx) => (
                      <li key={idx}>{instruction}</li>
                    ))}
                  </ol>
                </div>

                <div className={styles.actions}>
                  <button onClick={handleDownloadZip} className={styles.downloadButton}>
                    <Download size={18} />
                    Baixar ZIP
                  </button>
                  {previewMode && (
                    <button onClick={handleGenerate} className={styles.generateButton}>
                      <CheckCircle2 size={18} />
                      Confirmar e Gerar
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  const isStepValid = () => {
    switch (currentStep) {
      case 0:
        return formData.squad && formData.appName
      case 1:
        return formData.language && formData.version
      case 2:
        if (template.type === 'cronjob' && !formData.cronSchedule) return false
        if (formData.useIngress && !formData.ingressHost) return false
        return true
      case 3:
        return true
      default:
        return true
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div>
            <h2>Criar {template.name}</h2>
            <p>{template.description}</p>
          </div>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.stepsIndicator}>
          {steps.map((step, idx) => (
            <div
              key={step.id}
              className={`${styles.stepIndicator} ${
                idx === currentStep ? styles.stepIndicatorActive : ''
              } ${completedSteps[idx] ? styles.stepIndicatorCompleted : ''}`}
            >
              <div className={styles.stepNumber}>
                {completedSteps[idx] ? <CheckCircle2 size={18} /> : idx + 1}
              </div>
              <div className={styles.stepInfo}>
                <div className={styles.stepTitle}>{step.title}</div>
                <div className={styles.stepDescription}>{step.description}</div>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.modalBody}>{renderStepContent()}</div>

        <div className={styles.modalFooter}>
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className={styles.backButton}
          >
            <ChevronLeft size={18} />
            Voltar
          </button>
          {currentStep < steps.length - 1 ? (
            <button
              onClick={handleNext}
              disabled={!isStepValid() || loading}
              className={styles.nextButton}
            >
              {currentStep === steps.length - 2 ? 'Gerar Preview' : 'Próximo'}
              <ChevronRight size={18} />
            </button>
          ) : (
            <button onClick={onClose} className={styles.closeButtonSecondary}>
              Fechar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default TemplateWizardModal
