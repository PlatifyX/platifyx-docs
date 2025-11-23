import { useState, useEffect } from 'react'
import { Key, Plus, Eye, EyeOff, Trash2, RefreshCw, Search, Lock, Folder, FileKey, ChevronRight } from 'lucide-react'
import { SecretsApi, type VaultSecretListItem, type VaultStats } from '../../services/secretsApi'

interface VaultTabProps {
  integrationId: number
}

function VaultTab({ integrationId }: VaultTabProps) {
  const [secrets, setSecrets] = useState<VaultSecretListItem[]>([])
  const [stats, setStats] = useState<VaultStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPath, setCurrentPath] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedSecretPath, setSelectedSecretPath] = useState<string | null>(null)
  const [secretData, setSecretData] = useState<Record<string, any>>({})
  const [showSecretValues, setShowSecretValues] = useState(false)
  const [newSecretPath, setNewSecretPath] = useState('')
  const [newSecretData, setNewSecretData] = useState('{}')

  useEffect(() => {
    loadData()
  }, [integrationId, currentPath])

  const loadData = async () => {
    setLoading(true)
    try {
      const [secretsList, statsData] = await Promise.all([
        SecretsApi.listVaultSecrets(integrationId, currentPath),
        SecretsApi.getVaultStats(integrationId),
      ])
      setSecrets(secretsList)
      setStats(statsData)
    } catch (error) {
      console.error('Error loading Vault secrets:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleNavigateToFolder = (path: string) => {
    const newPath = currentPath ? `${currentPath}/${path}` : path
    setCurrentPath(newPath)
  }

  const handleNavigateUp = () => {
    const parts = currentPath.split('/')
    parts.pop()
    setCurrentPath(parts.join('/'))
  }

  const handleViewSecret = async (path: string) => {
    try {
      const fullPath = currentPath ? `${currentPath}/${path}` : path
      const data = await SecretsApi.readVaultSecret(integrationId, fullPath)
      setSelectedSecretPath(fullPath)
      setSecretData(data.data || {})
      setShowSecretValues(false)
      setShowViewModal(true)
    } catch (error) {
      console.error('Error viewing secret:', error)
      alert('Erro ao visualizar secret')
    }
  }

  const handleCreateSecret = async () => {
    if (!newSecretPath) {
      alert('Path é obrigatório')
      return
    }

    try {
      const data = JSON.parse(newSecretData)
      const fullPath = currentPath ? `${currentPath}/${newSecretPath}` : newSecretPath
      await SecretsApi.writeVaultSecret(integrationId, fullPath, data)
      setShowCreateModal(false)
      setNewSecretPath('')
      setNewSecretData('{}')
      await loadData()
    } catch (error: any) {
      console.error('Error creating secret:', error)
      alert(error.message || 'Erro ao criar secret')
    }
  }

  const handleDeleteSecret = async (path: string) => {
    const fullPath = currentPath ? `${currentPath}/${path}` : path
    if (!confirm(`Tem certeza que deseja deletar o secret "${fullPath}"?`)) {
      return
    }

    try {
      await SecretsApi.deleteVaultSecret(integrationId, fullPath)
      await loadData()
    } catch (error: any) {
      console.error('Error deleting secret:', error)
      alert(error.message || 'Erro ao deletar secret')
    }
  }

  const filteredSecrets = secrets.filter((secret: VaultSecretListItem) =>
    secret.path.toLowerCase().includes(searchTerm.toLowerCase())
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
                <p className="text-sm text-muted">Status</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {stats.initialized && !stats.sealed ? 'Ativo' : 'Inativo'}
                </p>
              </div>
              <Lock className={stats.initialized && !stats.sealed ? 'text-green-400' : 'text-red-400'} size={32} />
            </div>
          </div>
          <div className="bg-surface p-4 rounded-lg border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted">Inicializado</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {stats.initialized ? 'Sim' : 'Não'}
                </p>
              </div>
              <Key className={stats.initialized ? 'text-green-400' : 'text-gray-400'} size={32} />
            </div>
          </div>
          <div className="bg-surface p-4 rounded-lg border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted">Selado</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {stats.sealed ? 'Sim' : 'Não'}
                </p>
              </div>
              <Lock className={stats.sealed ? 'text-red-400' : 'text-green-400'} size={32} />
            </div>
          </div>
        </div>
      )}

      {currentPath && (
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() => setCurrentPath('')}
            className="text-primary hover:text-primary-dark transition-colors"
          >
            root
          </button>
          {currentPath.split('/').map((part: string, index: number, arr: string[]) => (
            <div key={index} className="flex items-center gap-2">
              <ChevronRight size={16} className="text-muted" />
              <button
                onClick={() => {
                  const newPath = arr.slice(0, index + 1).join('/')
                  setCurrentPath(newPath)
                }}
                className="text-primary hover:text-primary-dark transition-colors"
              >
                {part}
              </button>
            </div>
          ))}
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
        {currentPath && (
          <button
            onClick={handleNavigateUp}
            className="flex items-center gap-2 px-4 py-2 bg-surface hover:bg-surface-light border border-border rounded-lg text-white transition-colors"
          >
            Voltar
          </button>
        )}
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
              <th className="text-left px-4 py-3 text-sm font-semibold text-white">Tipo</th>
              <th className="text-right px-4 py-3 text-sm font-semibold text-white">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredSecrets.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-muted">
                  {searchTerm ? 'Nenhum secret encontrado' : 'Nenhum secret neste path'}
                </td>
              </tr>
            ) : (
              filteredSecrets.map((item: VaultSecretListItem) => (
                <tr key={item.path} className="hover:bg-surface-light transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {item.isFolder ? (
                        <Folder size={16} className="text-yellow-400" />
                      ) : (
                        <FileKey size={16} className="text-primary" />
                      )}
                      <span className="text-white font-medium">{item.path}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted text-sm">
                    {item.isFolder ? 'Pasta' : 'Secret'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {item.isFolder ? (
                        <button
                          onClick={() => handleNavigateToFolder(item.path)}
                          className="p-2 hover:bg-surface rounded-lg text-blue-400 hover:text-blue-300 transition-colors"
                          title="Abrir pasta"
                        >
                          <ChevronRight size={18} />
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => handleViewSecret(item.path)}
                            className="p-2 hover:bg-surface rounded-lg text-blue-400 hover:text-blue-300 transition-colors"
                            title="Visualizar"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteSecret(item.path)}
                            className="p-2 hover:bg-surface rounded-lg text-red-400 hover:text-red-300 transition-colors"
                            title="Deletar"
                          >
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
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
                  Path *
                </label>
                <input
                  type="text"
                  value={newSecretPath}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewSecretPath(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-white focus:outline-none focus:border-primary"
                  placeholder={currentPath ? `${currentPath}/my-secret` : 'my-secret'}
                />
                {currentPath && (
                  <p className="text-xs text-muted mt-1">
                    Path completo: {currentPath}/{newSecretPath}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-1">
                  Data (JSON) *
                </label>
                <textarea
                  value={newSecretData}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewSecretData(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-white focus:outline-none focus:border-primary font-mono text-sm"
                  placeholder='{"key": "value"}'
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
          <div className="bg-surface border border-border rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-xl font-bold text-white mb-4">Visualizar Secret</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-1">
                  Path
                </label>
                <div className="px-3 py-2 bg-background border border-border rounded-lg text-white">
                  {selectedSecretPath}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-1 flex items-center justify-between">
                  <span>Data</span>
                  <button
                    onClick={() => setShowSecretValues(!showSecretValues)}
                    className="flex items-center gap-2 text-sm text-primary hover:text-primary-dark transition-colors"
                  >
                    {showSecretValues ? (
                      <>
                        <EyeOff size={16} />
                        Ocultar
                      </>
                    ) : (
                      <>
                        <Eye size={16} />
                        Mostrar
                      </>
                    )}
                  </button>
                </label>
                <div className="bg-background border border-border rounded-lg p-3 max-h-96 overflow-auto">
                  <pre className="text-white font-mono text-sm">
                    {showSecretValues
                      ? JSON.stringify(secretData, null, 2)
                      : JSON.stringify(
                          Object.keys(secretData).reduce((acc, key) => {
                            acc[key] = '••••••••'
                            return acc
                          }, {} as Record<string, string>),
                          null,
                          2
                        )}
                  </pre>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowViewModal(false)
                  setSelectedSecretPath(null)
                  setSecretData({})
                  setShowSecretValues(false)
                }}
                className="flex-1 px-4 py-2 bg-primary hover:bg-primary-dark rounded-lg text-white font-medium transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default VaultTab
