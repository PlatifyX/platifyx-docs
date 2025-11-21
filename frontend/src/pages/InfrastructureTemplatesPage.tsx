import { useState, useEffect, useMemo } from 'react'
import { Package, Clock, Cog, Layers, Plus, Search, Filter, Database, Globe, MessageSquare, Box } from 'lucide-react'
import TemplateWizardModal from '../components/InfrastructureTemplates/TemplateWizardModal'
import PageContainer from '../components/Layout/PageContainer'
import PageHeader from '../components/Layout/PageHeader'
import Section from '../components/Layout/Section'
import EmptyState from '../components/UI/EmptyState'
import styles from './InfrastructureTemplatesPage.module.css'
import { buildApiUrl } from '../config/api'

interface Template {
  type: string
  name: string
  description: string
  languages: string[]
  icon: string
}

const categories = [
  { id: 'all', name: 'Todos', icon: <Layers size={18} /> },
  { id: 'services', name: 'Serviços', icon: <Globe size={18} /> },
  { id: 'data', name: 'Dados', icon: <Database size={18} /> },
  { id: 'jobs', name: 'Jobs', icon: <Clock size={18} /> },
  { id: 'infra', name: 'Infraestrutura', icon: <Box size={18} /> },
]

const templateCategories: { [key: string]: string } = {
  'api': 'services',
  'frontend': 'services',
  'worker': 'services',
  'cronjob': 'jobs',
  'statefulset': 'data',
  'database': 'data',
  'messaging': 'infra',
  'deployment': 'infra',
}

function InfrastructureTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [showWizard, setShowWizard] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedLanguage, setSelectedLanguage] = useState('all')

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await fetch(buildApiUrl('infrastructure-templates'))
      const data = await response.json()
      setTemplates(data.templates || [])
    } catch (error) {
      console.error('Error fetching templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const getIcon = (iconEmoji: string, type: string) => {
    const iconMap: { [key: string]: JSX.Element } = {
      '🌐': <Globe className={styles.templateIcon} />,
      '💻': <Package className={styles.templateIcon} />,
      '⚙️': <Cog className={styles.templateIcon} />,
      '⏰': <Clock className={styles.templateIcon} />,
      '💾': <Database className={styles.templateIcon} />,
      '🗄️': <Database className={styles.templateIcon} />,
      '📨': <MessageSquare className={styles.templateIcon} />,
      '📦': <Box className={styles.templateIcon} />
    }
    return iconMap[iconEmoji] || <Package className={styles.templateIcon} />
  }

  const allLanguages = useMemo(() => {
    const langs = new Set<string>()
    templates.forEach(t => t.languages.forEach(l => langs.add(l)))
    return Array.from(langs).sort()
  }, [templates])

  const filteredTemplates = useMemo(() => {
    return templates.filter(template => {
      const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          template.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory === 'all' || templateCategories[template.type] === selectedCategory
      const matchesLanguage = selectedLanguage === 'all' || template.languages.includes(selectedLanguage)

      return matchesSearch && matchesCategory && matchesLanguage
    })
  }, [templates, searchTerm, selectedCategory, selectedLanguage])

  const handleCreateService = (template: Template) => {
    setSelectedTemplate(template)
    setShowWizard(true)
  }

  const handleCloseWizard = () => {
    setShowWizard(false)
    setSelectedTemplate(null)
  }

  const getCategoryColor = (type: string) => {
    const category = templateCategories[type]
    const colors: { [key: string]: string } = {
      'services': '#4caf50',
      'data': '#2196f3',
      'jobs': '#ff9800',
      'infra': '#9c27b0',
    }
    return colors[category] || '#757575'
  }

  if (loading) {
    return (
      <PageContainer>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Carregando templates...</p>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer maxWidth="xl">
      <PageHeader
        icon={Package}
        title="Infrastructure Templates"
        subtitle="Crie novos serviços seguindo os padrões da plataforma em minutos"
      />

      <div className={styles.headerStats}>
        <div className={styles.statCard}>
          <span className={styles.statNumber}>{templates.length}</span>
          <span className={styles.statLabel}>Templates</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNumber}>{allLanguages.length}</span>
          <span className={styles.statLabel}>Linguagens</span>
        </div>
      </div>

      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <Search size={20} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Buscar templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filterGroup}>
          <Filter size={18} />
          <span className={styles.filterLabel}>Categoria:</span>
          <div className={styles.categoryTabs}>
            {categories.map((cat) => (
              <button
                key={cat.id}
                className={`${styles.categoryTab} ${selectedCategory === cat.id ? styles.categoryTabActive : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.icon}
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.languageFilter}>
          <label>Linguagem:</label>
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className={styles.languageSelect}
          >
            <option value="all">Todas</option>
            {allLanguages.map((lang) => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
        </div>
      </div>

      <Section spacing="lg">
        {filteredTemplates.length === 0 ? (
          <EmptyState
            icon={Package}
            title="Nenhum template encontrado"
            description="Tente ajustar os filtros ou termo de busca"
          />
        ) : (
          <div className={styles.templatesGrid}>
            {filteredTemplates.map((template) => (
            <div
              key={template.type}
              className={styles.templateCard}
              style={{ borderTopColor: getCategoryColor(template.type) }}
            >
              <div className={styles.templateHeader}>
                <div className={styles.templateIconWrapper}>
                  {getIcon(template.icon, template.type)}
                </div>
                <div className={styles.templateBadge} style={{ backgroundColor: getCategoryColor(template.type) }}>
                  {templateCategories[template.type]}
                </div>
              </div>

              <h3 className={styles.templateName}>{template.name}</h3>
              <p className={styles.templateDescription}>{template.description}</p>

              <div className={styles.templateLanguages}>
                <span className={styles.languagesLabel}>Linguagens disponíveis:</span>
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
                <Plus size={18} />
                Criar Serviço
              </button>
            </div>
            ))}
          </div>
        )}
      </Section>

      {showWizard && selectedTemplate && (
        <TemplateWizardModal
          template={selectedTemplate}
          onClose={handleCloseWizard}
        />
      )}
    </PageContainer>
  )
}

export default InfrastructureTemplatesPage
