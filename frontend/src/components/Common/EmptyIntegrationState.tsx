import { Settings } from 'lucide-react'

interface EmptyIntegrationStateProps {
  title?: string
  description?: string
  integrations: string[]
  icon?: React.ReactNode
}

function EmptyIntegrationState({
  title = 'Nenhum item encontrado',
  description = 'Configure uma integração para visualizar os dados',
  integrations,
  icon
}: EmptyIntegrationStateProps) {
  return (
    <div className="text-center py-20 px-5 flex flex-col items-center justify-center">
      <div className="bg-gray-700/30 p-6 rounded-full mb-6">
        {icon || <Settings size={64} className="text-gray-500" />}
      </div>
      <h2 className="text-2xl font-semibold text-text mb-2">{title}</h2>
      <p className="text-base text-text-secondary max-w-[500px] mb-4">
        {description}
      </p>
      {integrations.length > 0 && (
        <div className="mb-4">
          <p className="text-sm text-gray-400 mb-2">Configure integrações com:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {integrations.map((integration) => (
              <span
                key={integration}
                className="px-3 py-1 bg-gray-700/50 text-gray-300 rounded-full text-sm border border-gray-600"
              >
                {integration}
              </span>
            ))}
          </div>
        </div>
      )}
      <a
        href="/integrations"
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all no-underline inline-flex items-center gap-2"
      >
        <Settings size={16} />
        Ir para Integrações
      </a>
    </div>
  )
}

export default EmptyIntegrationState
