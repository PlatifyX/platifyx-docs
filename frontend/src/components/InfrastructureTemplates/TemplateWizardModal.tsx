import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronRight, ChevronLeft, Download, CheckCircle2, FileText } from 'lucide-react'
import JSZip from 'jszip'
import { buildApiUrl } from '../../config/api'

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
      const response = await fetch(buildApiUrl('infrastructure-templates/preview'), {
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
      const response = await fetch(buildApiUrl('infrastructure-templates/generate'), {
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
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-text">Informações Básicas</h3>
            <div>
              <label className="block text-sm font-medium text-text mb-2">Squad *</label>
              <input
                type="text"
                value={formData.squad}
                onChange={(e) => setFormData({ ...formData, squad: e.target.value })}
                placeholder="ex: cxm"
                required
                className="w-full p-3 bg-background border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <small className="text-text-secondary text-sm">Nome da squad responsável pelo serviço</small>
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-2">Nome da Aplicação *</label>
              <input
                type="text"
                value={formData.appName}
                onChange={(e) => setFormData({ ...formData, appName: e.target.value })}
                placeholder="ex: distribution"
                required
                className="w-full p-3 bg-background border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <small className="text-text-secondary text-sm">Nome da aplicação (será usado como: {formData.squad || 'squad'}-{formData.appName || 'app'})</small>
            </div>
          </div>
        )

      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-text">Tecnologia</h3>
            <div>
              <label className="block text-sm font-medium text-text mb-2">Linguagem *</label>
              <select
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                className="w-full p-3 bg-background border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {template.languages.map((lang) => (
                  <option key={lang} value={lang.toLowerCase()}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-2">Versão *</label>
              <input
                type="text"
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                placeholder="ex: 1.23.0"
                className="w-full p-3 bg-background border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <small className="text-text-secondary text-sm">Versão da linguagem/runtime</small>
            </div>
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.hasTests}
                  onChange={(e) => setFormData({ ...formData, hasTests: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-text">Possui testes unitários</span>
              </label>
            </div>
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isMonorepo}
                  onChange={(e) => setFormData({ ...formData, isMonorepo: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-text">É um monorepo</span>
              </label>
            </div>
            {formData.isMonorepo && (
              <div>
                <label className="block text-sm font-medium text-text mb-2">Caminho da aplicação</label>
                <input
                  type="text"
                  value={formData.appPath}
                  onChange={(e) => setFormData({ ...formData, appPath: e.target.value })}
                  placeholder="ex: services/api"
                  className="w-full p-3 bg-background border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            )}
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-text">Configuração</h3>
            <div>
              <label className="block text-sm font-medium text-text mb-2">Porta do Container</label>
              <input
                type="number"
                value={formData.port}
                onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
                className="w-full p-3 bg-background border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <small className="text-text-secondary text-sm">Porta que a aplicação escuta (padrão: 80)</small>
            </div>
            {template.type === 'cronjob' && (
              <div>
                <label className="block text-sm font-medium text-text mb-2">Cron Schedule *</label>
                <input
                  type="text"
                  value={formData.cronSchedule}
                  onChange={(e) => setFormData({ ...formData, cronSchedule: e.target.value })}
                  placeholder="0 2 * * *"
                  className="w-full p-3 bg-background border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <small className="text-text-secondary text-sm">Expressão cron (ex: 0 2 * * * = todo dia às 2h)</small>
              </div>
            )}
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.useSecret}
                  onChange={(e) => setFormData({ ...formData, useSecret: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-text">Usar External Secret (AWS Secrets Manager)</span>
              </label>
            </div>
            {template.type === 'api' && (
              <>
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.useIngress}
                      onChange={(e) => setFormData({ ...formData, useIngress: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium text-text">Usar Ingress (expor externamente)</span>
                  </label>
                </div>
                {formData.useIngress && (
                  <div>
                    <label className="block text-sm font-medium text-text mb-2">Hostname do Ingress *</label>
                    <input
                      type="text"
                      value={formData.ingressHost}
                      onChange={(e) => setFormData({ ...formData, ingressHost: e.target.value })}
                      placeholder="ex: api.example.com"
                      className="w-full p-3 bg-background border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <small className="text-text-secondary text-sm">Stage será: stage-{formData.ingressHost}</small>
                  </div>
                )}
              </>
            )}
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-text">Recursos</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text mb-2">CPU Request</label>
                <input
                  type="text"
                  value={formData.cpuRequest}
                  onChange={(e) => setFormData({ ...formData, cpuRequest: e.target.value })}
                  placeholder="250m"
                  className="w-full p-3 bg-background border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-2">CPU Limit</label>
                <input
                  type="text"
                  value={formData.cpuLimit}
                  onChange={(e) => setFormData({ ...formData, cpuLimit: e.target.value })}
                  placeholder="500m"
                  className="w-full p-3 bg-background border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text mb-2">Memory Request</label>
                <input
                  type="text"
                  value={formData.memoryRequest}
                  onChange={(e) => setFormData({ ...formData, memoryRequest: e.target.value })}
                  placeholder="256Mi"
                  className="w-full p-3 bg-background border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-2">Memory Limit</label>
                <input
                  type="text"
                  value={formData.memoryLimit}
                  onChange={(e) => setFormData({ ...formData, memoryLimit: e.target.value })}
                  placeholder="512Mi"
                  className="w-full p-3 bg-background border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-2">Replicas</label>
              <input
                type="number"
                min="1"
                value={formData.replicas}
                onChange={(e) => setFormData({ ...formData, replicas: parseInt(e.target.value) })}
                className="w-full p-3 bg-background border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <small className="text-text-secondary text-sm">Número de pods para o deployment</small>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-text">Preview e Geração</h3>
            {loading && <div className="text-center py-8 text-text-secondary">Gerando preview...</div>}
            {generatedTemplate && (
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-surface border border-border rounded-lg">
                  <h4 className="text-lg font-semibold text-text">Repositório: {generatedTemplate.repositoryName}</h4>
                  <span className="text-sm text-text-secondary">
                    {Object.keys(generatedTemplate.files).length} arquivos
                  </span>
                </div>

                <div className="border border-border rounded-lg p-4">
                  <h5 className="font-semibold text-text mb-3">Arquivos que serão gerados:</h5>
                  <div className="space-y-2">
                    {Object.keys(generatedTemplate.files).map((path) => (
                      <div key={path} className="flex items-center gap-2 text-sm text-text">
                        <FileText size={16} className="text-primary" />
                        <span>{path}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border border-border rounded-lg p-4">
                  <h5 className="font-semibold text-text mb-3">Instruções de Setup:</h5>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-text">
                    {generatedTemplate.instructions.map((instruction, idx) => (
                      <li key={idx}>{instruction}</li>
                    ))}
                  </ol>
                </div>

                <div className="flex gap-3">
                  <button onClick={handleDownloadZip} className="flex items-center gap-2 py-3 px-6 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium">
                    <Download size={18} />
                    Baixar ZIP
                  </button>
                  {previewMode && (
                    <button onClick={handleGenerate} className="flex items-center gap-2 py-3 px-6 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium">
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

  const modalContent = (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-surface rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-bold text-text">Criar {template.name}</h2>
            <p className="text-sm text-text-secondary mt-1">{template.description}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-hover rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex gap-2 p-6 border-b border-border overflow-x-auto">
          {steps.map((step, idx) => (
            <div
              key={step.id}
              className={`flex items-center gap-3 min-w-[200px] p-3 rounded-lg border transition-colors ${
                idx === currentStep
                  ? 'bg-primary/10 border-primary'
                  : completedSteps[idx]
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  : 'bg-surface border-border'
              }`}
            >
              <div className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold ${
                idx === currentStep
                  ? 'bg-primary text-white'
                  : completedSteps[idx]
                  ? 'bg-green-500 text-white'
                  : 'bg-background text-text-secondary'
              }`}>
                {completedSteps[idx] ? <CheckCircle2 size={18} /> : idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-text text-sm">{step.title}</div>
                <div className="text-xs text-text-secondary truncate">{step.description}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">{renderStepContent()}</div>

        <div className="flex justify-between items-center p-6 border-t border-border">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="flex items-center gap-2 py-3 px-6 bg-transparent text-text border border-border rounded-lg hover:bg-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            <ChevronLeft size={18} />
            Voltar
          </button>
          {currentStep < steps.length - 1 ? (
            <button
              onClick={handleNext}
              disabled={!isStepValid() || loading}
              className="flex items-center gap-2 py-3 px-6 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {currentStep === steps.length - 2 ? 'Gerar Preview' : 'Próximo'}
              <ChevronRight size={18} />
            </button>
          ) : (
            <button onClick={onClose} className="py-3 px-6 bg-transparent text-text border border-border rounded-lg hover:bg-hover transition-colors font-medium">
              Fechar
            </button>
          )}
        </div>
      </div>
    </div>
  )

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  if (!mounted) return null

  return createPortal(modalContent, document.body)
}

export default TemplateWizardModal
