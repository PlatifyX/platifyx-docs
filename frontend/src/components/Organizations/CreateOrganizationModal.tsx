import { useState } from 'react'
import { X } from 'lucide-react'

interface CreateOrganizationModalProps {
  onSave: (data: any) => Promise<void>
  onClose: () => void
}

function CreateOrganizationModal({ onSave, onClose }: CreateOrganizationModalProps) {
  const [name, setName] = useState('')
  const [ssoActive, setSsoActive] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Nome da organização é obrigatório')
      return
    }

    setSaving(true)
    try {
      await onSave({
        name: name.trim(),
        ssoActive,
      })
    } catch (err: any) {
      setError(err.message || 'Erro ao criar organização')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] backdrop-blur-sm">
      <div className="bg-[#1E1E1E] rounded-lg border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        <div className="sticky top-0 bg-[#1E1E1E] border-b border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Criar Nova Organização</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">
              Nome da Organização <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#2A2A2A] border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-[#1B998B]"
              placeholder="Ex: Empresa ABC"
              required
            />
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="ssoActive"
              checked={ssoActive}
              onChange={(e) => setSsoActive(e.target.checked)}
              className="w-4 h-4 rounded border-gray-600 bg-[#2A2A2A] text-[#1B998B] focus:ring-[#1B998B]"
            />
            <label htmlFor="ssoActive" className="text-sm">
              SSO Ativo
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#1B998B] hover:bg-[#1B998B]/90 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={saving}
            >
              {saving ? 'Criando...' : 'Criar Organização'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateOrganizationModal

