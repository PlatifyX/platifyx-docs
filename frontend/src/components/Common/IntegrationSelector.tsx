import { useState, useEffect } from 'react'
import { Building2 } from 'lucide-react'
import { apiFetch } from '../../config/api'

interface Integration {
  id: number
  name: string
  type: string
}

interface IntegrationSelectorProps {
  integrationType: string
  selectedIntegration: string
  onIntegrationChange: (integration: string) => void
}

function IntegrationSelector({ integrationType, selectedIntegration, onIntegrationChange }: IntegrationSelectorProps) {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchIntegrations()
  }, [integrationType])

  const fetchIntegrations = async () => {
    try {
      const response = await apiFetch('integrations')
      if (response.ok) {
        const data = await response.json()
        const filtered = data.integrations.filter((int: Integration) => int.type === integrationType)
        setIntegrations(filtered)

        // Auto-select first integration if none selected and there's only one
        if (!selectedIntegration && filtered.length === 1) {
          onIntegrationChange(filtered[0].name)
        }
      }
    } catch (err) {
      console.error('Failed to fetch integrations:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 mb-6">
        <label className="flex items-center gap-2 text-sm font-semibold text-text">
          <Building2 size={18} className="text-text-secondary" />
          Integração:
        </label>
        <div className="text-sm text-text-secondary">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 mb-6">
      <label className="flex items-center gap-2 text-sm font-semibold text-text">
        <Building2 size={18} className="text-text-secondary" />
        Integração:
      </label>
      <select
        className="py-2 px-3 border border-border rounded-md bg-background text-text text-sm transition-all duration-200 ease-in-out focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)] min-w-[200px]"
        value={selectedIntegration}
        onChange={(e) => onIntegrationChange(e.target.value)}
      >
        <option value="">Todas as integrações</option>
        {integrations.map((integration) => (
          <option key={integration.id} value={integration.name}>
            {integration.name}
          </option>
        ))}
      </select>
    </div>
  )
}

export default IntegrationSelector
