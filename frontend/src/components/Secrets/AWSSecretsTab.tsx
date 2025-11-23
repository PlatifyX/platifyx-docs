import { useState, useEffect } from 'react'
import { Key, Plus, Eye, EyeOff, Trash2, RefreshCw, Search, Lock, Edit } from 'lucide-react'
import { SecretsApi, type AWSSecret, type AWSSecretsStats } from '../../services/secretsApi'

interface AWSSecretsTabProps {
  integrationId: number
}

function AWSSecretsTab({ integrationId }: AWSSecretsTabProps) {
  const [secrets, setSecrets] = useState<AWSSecret[]>([])
  const [stats, setStats] = useState<AWSSecretsStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedSecret, setSelectedSecret] = useState<string | null>(null)
  const [secretValue, setSecretValue] = useState<string>('')
  const [showSecretValue, setShowSecretValue] = useState(false)
  const [newSecretName, setNewSecretName] = useState('')
  const [newSecretValue, setNewSecretValue] = useState('')
  const [newSecretDescription, setNewSecretDescription] = useState('')
  const [showEditModal, setShowEditModal] = useState(false)
  const [editSecretName, setEditSecretName] = useState('')
  const [editSecretValue, setEditSecretValue] = useState('')

  useEffect(() => {
    loadData()
  }, [integrationId])

  const loadData = async () => {
    setLoading(true)
    try {
      const [secretsList, statsData] = await Promise.all([
        SecretsApi.listAWSSecrets(integrationId),
        SecretsApi.getAWSStats(integrationId),
      ])
      setSecrets(secretsList)
      setStats(statsData)
    } catch (error) {
      console.error('Error loading AWS Secrets:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewSecret = async (name: string) => {
    try {
      const data = await SecretsApi.getAWSSecret(integrationId, name)
      setSelectedSecret(name)
      setSecretValue(data.secretString || '')
      setShowSecretValue(false)
      setShowViewModal(true)
    } catch (error) {
      console.error('Error viewing secret:', error)
      alert('Erro ao visualizar secret')
    }
  }

  const handleEditSecret = async (name: string) => {
    try {
      const data = await SecretsApi.getAWSSecret(integrationId, name)
      setEditSecretName(name)
      setEditSecretValue(data.secretString || '')
      setShowEditModal(true)
    } catch (error) {
      console.error('Error loading secret for edit:', error)
      alert('Erro ao carregar secret para edição')
    }
  }

  const handleUpdateSecret = async () => {
    if (!editSecretValue) {
      alert('Valor é obrigatório')
      return
    }

    try {
      await SecretsApi.updateAWSSecret(integrationId, editSecretName, editSecretValue)
      setShowEditModal(false)
      setEditSecretName('')
      setEditSecretValue('')
      await loadData()
    } catch (error: any) {
      console.error('Error updating secret:', error)
      alert(error.message || 'Erro ao atualizar secret')
    }
  }

  const handleCreateSecret = async () => {
    if (!newSecretName || !newSecretValue) {
      alert('Nome e valor são obrigatórios')
      return
    }

    try {
      await SecretsApi.createAWSSecret(integrationId, newSecretName, newSecretValue, newSecretDescription)
      setShowCreateModal(false)
      setNewSecretName('')
      setNewSecretValue('')
      setNewSecretDescription('')
      await loadData()
    } catch (error: any) {
      console.error('Error creating secret:', error)
      alert(error.message || 'Erro ao criar secret')
    }
  }

  const handleDeleteSecret = async (name: string) => {
    if (!confirm(`Tem certeza que deseja deletar o secret "${name}"?`)) {
      return
    }

    try {
      await SecretsApi.deleteAWSSecret(integrationId, name)
      await loadData()
    } catch (error: any) {
      console.error('Error deleting secret:', error)
      alert(error.message || 'Erro ao deletar secret')
    }
  }

  const filteredSecrets = secrets.filter((secret: AWSSecret) =>
    secret.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-surface p-4 rounded-lg border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted">Total de Secrets</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.total_secrets}</p>
              </div>
              <Key className="text-primary" size={32} />
            </div>
          </div>
          <div className="bg-surface p-4 rounded-lg border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted">Acessados Recentemente</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.recently_accessed}</p>
              </div>
              <Eye className="text-blue-400" size={32} />
            </div>
          </div>
          <div className="bg-surface p-4 rounded-lg border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted">Pendente Deleção</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.pending_deletion}</p>
              </div>
              <Trash2 className="text-red-400" size={32} />
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted" size={20} />
          <input
            type="text"
            placeholder="Buscar secrets..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface border border-border rounded-lg text-white focus:outline-none focus:border-primary"
          />
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark rounded-lg text-white font-medium transition-colors"
        >
          <Plus size={20} />
          Criar Secret
        </button>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 bg-surface hover:bg-surface-light border border-border rounded-lg text-white transition-colors"
        >
          <RefreshCw size={20} />
        </button>
      </div>

      <div className="bg-surface rounded-lg border border-border overflow-hidden">
        <table className="w-full">
          <thead className="bg-surface-light">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-semibold text-white">Nome</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-white">Descrição</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-white">Última Modificação</th>
              <th className="text-right px-4 py-3 text-sm font-semibold text-white">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredSecrets.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted">
                  {searchTerm ? 'Nenhum secret encontrado' : 'Nenhum secret configurado'}
                </td>
              </tr>
            ) : (
              filteredSecrets.map((secret: AWSSecret) => (
                <tr key={secret.name} className="hover:bg-surface-light transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Lock size={16} className="text-primary" />
                      <span className="text-white font-medium">{secret.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted text-sm">
                    {secret.description || '-'}
                  </td>
                  <td className="px-4 py-3 text-muted text-sm">
                    {secret.lastChangedDate
                      ? new Date(secret.lastChangedDate).toLocaleDateString('pt-BR')
                      : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleViewSecret(secret.name)}
                        className="p-2 hover:bg-surface rounded-lg text-blue-400 hover:text-blue-300 transition-colors"
                        title="Visualizar"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => handleEditSecret(secret.name)}
                        className="p-2 hover:bg-surface rounded-lg text-green-400 hover:text-green-300 transition-colors"
                        title="Editar"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteSecret(secret.name)}
                        className="p-2 hover:bg-surface rounded-lg text-red-400 hover:text-red-300 transition-colors"
                        title="Deletar"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-surface border border-border rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">Criar Novo Secret</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-1">
                  Nome *
                </label>
                <input
                  type="text"
                  value={newSecretName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewSecretName(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-white focus:outline-none focus:border-primary"
                  placeholder="my-secret-name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-1">
                  Descrição
                </label>
                <input
                  type="text"
                  value={newSecretDescription}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewSecretDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-white focus:outline-none focus:border-primary"
                  placeholder="Descrição do secret"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-1">
                  Valor *
                </label>
                <textarea
                  value={newSecretValue}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewSecretValue(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-white focus:outline-none focus:border-primary font-mono text-sm"
                  placeholder="Valor do secret..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 border border-border rounded-lg text-white hover:bg-surface-light transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateSecret}
                className="flex-1 px-4 py-2 bg-primary hover:bg-primary-dark rounded-lg text-white font-medium transition-colors"
              >
                Criar
              </button>
            </div>
          </div>
        </div>
      )}

      {showViewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-surface border border-border rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">Visualizar Secret</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-1">
                  Nome
                </label>
                <div className="px-3 py-2 bg-background border border-border rounded-lg text-white">
                  {selectedSecret}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-1">
                  Valor
                </label>
                <div className="relative">
                  <textarea
                    value={showSecretValue ? secretValue : '••••••••••••••••'}
                    readOnly
                    rows={4}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-white font-mono text-sm"
                  />
                  <button
                    onClick={() => setShowSecretValue(!showSecretValue)}
                    className="absolute right-2 top-2 p-2 hover:bg-surface rounded-lg text-muted hover:text-white transition-colors"
                  >
                    {showSecretValue ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowViewModal(false)
                  setSelectedSecret(null)
                  setSecretValue('')
                  setShowSecretValue(false)
                }}
                className="flex-1 px-4 py-2 bg-primary hover:bg-primary-dark rounded-lg text-white font-medium transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-surface border border-border rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">Editar Secret</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-1">
                  Nome
                </label>
                <div className="px-3 py-2 bg-background border border-border rounded-lg text-muted">
                  {editSecretName}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-1">
                  Novo Valor *
                </label>
                <textarea
                  value={editSecretValue}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditSecretValue(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-white focus:outline-none focus:border-primary font-mono text-sm"
                  placeholder="Novo valor do secret..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setEditSecretName('')
                  setEditSecretValue('')
                }}
                className="flex-1 px-4 py-2 border border-border rounded-lg text-white hover:bg-surface-light transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdateSecret}
                className="flex-1 px-4 py-2 bg-primary hover:bg-primary-dark rounded-lg text-white font-medium transition-colors"
              >
                Atualizar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AWSSecretsTab
