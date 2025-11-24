import { useState, useEffect } from 'react'
import { Plus, Code, Rocket } from 'lucide-react'
import { buildApiUrl } from '../config/api'

interface Template {
  id: string
  name: string
  description: string
  category: string
  language: string
  framework: string
  icon: string
  tags: string[]
}

function ServiceTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [serviceName, setServiceName] = useState('')
  const [description, setDescription] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await fetch(buildApiUrl('templates'))
      const data = await response.json()
      setTemplates(data.templates || [])
    } catch (err) {
      console.error('Error fetching templates:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateService = async () => {
    if (!selectedTemplate || !serviceName) return

    setCreating(true)
    try {
      const response = await fetch(buildApiUrl('services/create'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          serviceName,
          description,
          parameters: { port: 8080 },
        }),
      })

      if (response.ok) {
        alert(`Serviço ${serviceName} criado com sucesso!`)
        setShowCreateModal(false)
        setServiceName('')
        setDescription('')
        setSelectedTemplate(null)
      }
    } catch (err) {
      console.error('Error creating service:', err)
      alert('Erro ao criar serviço')
    } finally {
      setCreating(false)
    }
  }

  if (loading) return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-center min-h-screen text-gray-400">Carregando...</div>
    </div>
  )

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <Code className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Templates de Serviços</h1>
            <p className="text-gray-400 text-sm mt-1">Crie novos serviços a partir de templates</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <div key={template.id} className="bg-[#1E1E1E] border border-gray-700 rounded-lg p-6 hover:border-[#1B998B] transition-all">
            <div className="text-5xl mb-4">{template.icon}</div>
            <h3 className="text-xl font-bold mb-2">{template.name}</h3>
            <p className="text-sm text-gray-400 mb-4">{template.description}</p>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-medium">{template.language}</span>
              <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded text-xs font-medium">{template.category}</span>
            </div>
            <button
              onClick={() => {
                setSelectedTemplate(template)
                setShowCreateModal(true)
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all"
            >
              <Plus size={16} />
              Usar Template
            </button>
          </div>
        ))}
      </div>

      {showCreateModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCreateModal(false)}>
          <div className="bg-[#1E1E1E] border border-gray-700 rounded-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-6">Criar Serviço: {selectedTemplate.name}</h2>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-gray-300">Nome do Serviço *</label>
              <input
                type="text"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                placeholder="my-awesome-service"
                className="w-full px-4 py-2 bg-[#2A2A2A] border border-gray-600 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-[#1B998B]"
              />
            </div>
            <div className="mb-6">
              <label className="block mb-2 font-medium text-gray-300">Descrição</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrição do serviço..."
                rows={3}
                className="w-full px-4 py-2 bg-[#2A2A2A] border border-gray-600 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-[#1B998B]"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateService}
                disabled={!serviceName || creating}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  creating || !serviceName
                    ? 'bg-blue-600/50 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                } text-white`}
              >
                <Rocket size={16} />
                {creating ? 'Criando...' : 'Criar Serviço'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ServiceTemplatesPage
