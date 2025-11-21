import { useState, useEffect } from 'react'
import { Plus, Code, Rocket } from 'lucide-react'
import PageContainer from '../components/Layout/PageContainer'
import PageHeader from '../components/Layout/PageHeader'
import Section from '../components/Layout/Section'
import styles from './IntegrationsPage.module.css'
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

  if (loading) {
    return (
      <PageContainer>
        <div className={styles.loading}>Carregando...</div>
      </PageContainer>
    )
  }

  return (
    <PageContainer maxWidth="xl">
      <PageHeader
        icon={Code}
        title="Templates de Serviços"
        subtitle="Crie novos serviços a partir de templates"
      />

      <Section spacing="lg">
        <div className={styles.grid}>
          {templates.map((template) => (
          <div key={template.id} className={styles.card}>
            <div style={{ fontSize: '2rem' }}>{template.icon}</div>
            <h3>{template.name}</h3>
            <p>{template.description}</p>
            <div style={{ marginTop: '8px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              <span style={{ background: '#e3f2fd', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>{template.language}</span>
              <span style={{ background: '#f3e5f5', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>{template.category}</span>
            </div>
            <button
              onClick={() => {
                setSelectedTemplate(template)
                setShowCreateModal(true)
              }}
              style={{
                marginTop: '12px',
                padding: '8px 16px',
                background: '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                justifyContent: 'center',
              }}
            >
              <Plus size={16} />
              Usar Template
            </button>
          </div>
          ))}
        </div>
      </Section>

      {showCreateModal && selectedTemplate && (
        <div className={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <h2>Criar Serviço: {selectedTemplate.name}</h2>
            <div style={{ marginTop: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Nome do Serviço *</label>
              <input
                type="text"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                placeholder="my-awesome-service"
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
            <div style={{ marginTop: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Descrição</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrição do serviço..."
                rows={3}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
            <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ padding: '8px 16px', border: '1px solid #ddd', borderRadius: '4px', background: 'white', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateService}
                disabled={!serviceName || creating}
                style={{
                  padding: '8px 16px',
                  background: '#1976d2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: creating || !serviceName ? 'not-allowed' : 'pointer',
                  opacity: creating || !serviceName ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Rocket size={16} />
                {creating ? 'Criando...' : 'Criar Serviço'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  )
}

export default ServiceTemplatesPage
