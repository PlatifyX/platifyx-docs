import { useState } from 'react'
import { X, Send, AlertCircle } from 'lucide-react'

interface RequestIntegrationModalProps {
  onClose: () => void
  onSubmit?: (data: RequestIntegrationData) => Promise<void>
}

export interface RequestIntegrationData {
  name: string
  description: string
  useCase: string
  website?: string
  apiDocumentation?: string
  priority: 'low' | 'medium' | 'high'
}

function RequestIntegrationModal({ onClose, onSubmit }: RequestIntegrationModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [useCase, setUseCase] = useState('')
  const [website, setWebsite] = useState('')
  const [apiDocumentation, setApiDocumentation] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Nome da integração é obrigatório')
      return
    }

    if (!description.trim()) {
      setError('Descrição é obrigatória')
      return
    }

    if (!useCase.trim()) {
      setError('Caso de uso é obrigatório')
      return
    }

    setSubmitting(true)

    const data: RequestIntegrationData = {
      name: name.trim(),
      description: description.trim(),
      useCase: useCase.trim(),
      website: website.trim() || undefined,
      apiDocumentation: apiDocumentation.trim() || undefined,
      priority,
    }

    try {
      if (onSubmit) {
        await onSubmit(data)
      } else {
        console.log('Solicitação de integração:', data)
      }
      
      setSuccess(true)
      setTimeout(() => {
        onClose()
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar solicitação')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#1E1E1E] rounded-lg border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-[#1E1E1E] border-b border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Solicitar Nova Integração</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-green-500/10 border border-green-500/50 text-green-400 px-4 py-3 rounded-lg">
              Solicitação enviada com sucesso! Entraremos em contato em breve.
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">
              Nome da Integração <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#2A2A2A] border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-[#1B998B]"
              placeholder="Ex: GitLab, Bitbucket, etc."
              required
              disabled={submitting || success}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Descrição <span className="text-red-400">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#2A2A2A] border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-[#1B998B] min-h-[100px] resize-y"
              placeholder="Descreva brevemente o que esta integração faz..."
              required
              disabled={submitting || success}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Caso de Uso <span className="text-red-400">*</span>
            </label>
            <textarea
              value={useCase}
              onChange={(e) => setUseCase(e.target.value)}
              className="w-full bg-[#2A2A2A] border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-[#1B998B] min-h-[120px] resize-y"
              placeholder="Descreva como você pretende usar esta integração e qual problema ela resolveria..."
              required
              disabled={submitting || success}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Website da Integração
            </label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="w-full bg-[#2A2A2A] border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-[#1B998B]"
              placeholder="https://exemplo.com"
              disabled={submitting || success}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Documentação da API (se disponível)
            </label>
            <input
              type="url"
              value={apiDocumentation}
              onChange={(e) => setApiDocumentation(e.target.value)}
              className="w-full bg-[#2A2A2A] border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-[#1B998B]"
              placeholder="https://docs.exemplo.com/api"
              disabled={submitting || success}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Prioridade <span className="text-red-400">*</span>
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
              className="w-full bg-[#2A2A2A] border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-[#1B998B]"
              required
              disabled={submitting || success}
            >
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Indique o quão importante esta integração é para você
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              disabled={submitting || success}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#1B998B] hover:bg-[#1B998B]/90 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={submitting || success}
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Enviando...</span>
                </>
              ) : success ? (
                <>
                  <Send className="w-4 h-4" />
                  <span>Enviado!</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Solicitar Integração</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RequestIntegrationModal

