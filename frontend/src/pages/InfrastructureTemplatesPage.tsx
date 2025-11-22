import { useState, useEffect, useMemo } from 'react'
import { Package, Clock, Cog, Layers, Plus, Search, Filter, Database, Globe, MessageSquare, Box } from 'lucide-react'
import TemplateWizardModal from '../components/InfrastructureTemplates/TemplateWizardModal'
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

  const getIcon = (iconEmoji: string) => {
    const iconMap: { [key: string]: JSX.Element } = {
      '🌐': <Globe className="w-8 h-8 text-blue-400" />,
      '💻': <Package className="w-8 h-8 text-green-400" />,
      '⚙️': <Cog className="w-8 h-8 text-purple-400" />,
      '⏰': <Clock className="w-8 h-8 text-orange-400" />,
      '💾': <Database className="w-8 h-8 text-blue-400" />,
      '🗄️': <Database className="w-8 h-8 text-blue-400" />,
      '📨': <MessageSquare className="w-8 h-8 text-purple-400" />,
      '📦': <Box className="w-8 h-8 text-gray-400" />
    }
    return iconMap[iconEmoji] || <Package className="w-8 h-8 text-green-400" />
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
      <div className="p-4 md:p-6">
        <div className="flex flex-col items-center justify-center min-h-screen text-gray-400">
          <div className="w-12 h-12 border-4 border-[#1B998B] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p>Carregando templates...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Infrastructure Templates</h1>
            <p className="text-gray-400 text-sm">
              Crie novos serviços seguindo os padrões da plataforma em minutos
            </p>
          </div>
          <div className="flex gap-4">
            <div className="bg-[#1E1E1E] border border-gray-700 rounded-lg p-4 text-center min-w-[100px]">
              <span className="block text-3xl font-bold text-[#1B998B]">{templates.length}</span>
              <span className="block text-sm text-gray-400 mt-1">Templates</span>
            </div>
            <div className="bg-[#1E1E1E] border border-gray-700 rounded-lg p-4 text-center min-w-[100px]">
              <span className="block text-3xl font-bold text-blue-400">{allLanguages.length}</span>
              <span className="block text-sm text-gray-400 mt-1">Linguagens</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-[#1E1E1E] border border-gray-700 rounded-lg text-gray-300 placeholder-gray-500 focus:outline-none focus:border-[#1B998B]"
          />
        </div>

        <div className="bg-[#1E1E1E] border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter size={18} className="text-gray-400" />
            <span className="font-medium text-gray-300">Categoria:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-[#1B998B] text-white'
                    : 'bg-[#2A2A2A] text-gray-400 hover:bg-gray-700'
                }`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.icon}
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-gray-300 font-medium">Linguagem:</label>
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="flex-1 px-4 py-2 bg-[#1E1E1E] border border-gray-700 rounded-lg text-gray-300 cursor-pointer focus:outline-none focus:border-[#1B998B]"
          >
            <option value="all">Todas</option>
            {allLanguages.map((lang) => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
        </div>
      </div>

      {filteredTemplates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <Package size={48} className="mb-4" />
          <h3 className="text-xl font-bold mb-2">Nenhum template encontrado</h3>
          <p className="text-sm">Tente ajustar os filtros ou termo de busca</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <div
              key={template.type}
              className="bg-[#1E1E1E] border border-gray-700 rounded-lg p-6 hover:border-[#1B998B] transition-all border-t-4"
              style={{ borderTopColor: getCategoryColor(template.type) }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center">
                  {getIcon(template.icon)}
                </div>
                <div
                  className="px-3 py-1 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: getCategoryColor(template.type) }}
                >
                  {templateCategories[template.type]}
                </div>
              </div>

              <h3 className="text-xl font-bold mb-2">{template.name}</h3>
              <p className="text-sm text-gray-400 mb-4">{template.description}</p>

              <div className="mb-4">
                <span className="text-xs text-gray-500 block mb-2">Linguagens disponíveis:</span>
                <div className="flex flex-wrap gap-2">
                  {template.languages.map((lang) => (
                    <span key={lang} className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300">
                      {lang}
                    </span>
                  ))}
                </div>
              </div>

              <button
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#1B998B] hover:bg-[#159179] text-white rounded-lg font-medium transition-all"
                onClick={() => handleCreateService(template)}
              >
                <Plus size={18} />
                Criar Serviço
              </button>
            </div>
          ))}
        </div>
      )}

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
