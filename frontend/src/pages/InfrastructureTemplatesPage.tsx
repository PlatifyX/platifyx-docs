import { useState, useEffect } from 'react'
import {  Package, Clock, Cog, Layers, Plus } from 'lucide-react'
import TemplateWizardModal from '../components/InfrastructureTemplates/TemplateWizardModal'
import styles from './InfrastructureTemplatesPage.module.css'

interface Template {
  type: string
  name: string
  description: string
  languages: string[]
  icon: string
}

function InfrastructureTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [showWizard, setShowWizard] = useState(false)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/v1/infrastructure-templates')
      const data = await response.json()
      setTemplates(data.templates || [])
    } catch (error) {
      console.error('Error fetching templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const getIcon = (iconName: string) => {
    const icons: { [key: string]: JSX.Element } = {
      '🌐': <Package className={styles.templateIcon} />,
      '⚙️': <Cog className={styles.templateIcon} />,
      '⏰': <Clock className={styles.templateIcon} />,
      '📦': <Layers className={styles.templateIcon} />
    }
    return icons[iconName] || <Package className={styles.templateIcon} />
  }

  const handleCreateService = (template: Template) => {
    setSelectedTemplate(template)
    setShowWizard(true)
  }

  const handleCloseWizard = () => {
    setShowWizard(false)
    setSelectedTemplate(null)
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>Carregando templates...</div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Infrastructure Templates</h1>
          <p className={styles.subtitle}>
            Crie novos serviços seguindo os padrões da infraestrutura
          </p>
        </div>
      </div>

      <div className={styles.templatesGrid}>
        {templates.map((template) => (
          <div key={template.type} className={styles.templateCard}>
            <div className={styles.templateHeader}>
              {getIcon(template.icon)}
              <h3 className={styles.templateName}>{template.name}</h3>
            </div>

            <p className={styles.templateDescription}>{template.description}</p>

            <div className={styles.templateLanguages}>
              <span className={styles.languagesLabel}>Linguagens:</span>
              <div className={styles.languagesList}>
                {template.languages.map((lang) => (
                  <span key={lang} className={styles.languageBadge}>
                    {lang}
                  </span>
                ))}
              </div>
            </div>

            <button
              className={styles.createButton}
              onClick={() => handleCreateService(template)}
            >
              <Plus size={16} />
              Criar Serviço
            </button>
          </div>
        ))}
      </div>

      {showWizard && selectedTemplate && (
        <TemplateWizardModal
          template={selectedTemplate}
          onClose={handleCloseWizard}
        />
      )}
    </div>
  )
}

export default InfrastructureTemplatesPage
