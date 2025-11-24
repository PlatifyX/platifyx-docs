import { useState, useEffect } from 'react'
import { X, Plus, Trash2, User } from 'lucide-react'
import { OrganizationApi, type UserOrganization, type Organization } from '../../utils/organizationApi'
import { fetchUsers, type User as SystemUser } from '../../services/settingsApi'

interface ManageUsersModalProps {
  organization: Organization
  onClose: () => void
}

function ManageUsersModal({ organization, onClose }: ManageUsersModalProps) {
  const [users, setUsers] = useState<UserOrganization[]>([])
  const [allUsers, setAllUsers] = useState<SystemUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedRole, setSelectedRole] = useState('member')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [orgUsers, systemUsers] = await Promise.all([
        OrganizationApi.getOrganizationUsers(organization.uuid),
        fetchUsers(),
      ])
      setUsers(orgUsers)
      setAllUsers(systemUsers.users)
    } catch (err: any) {
      console.error('Error fetching data:', err)
      setError(err.message || 'Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const handleAddUser = async () => {
    if (!selectedUserId) {
      setError('Selecione um usuário')
      return
    }

    try {
      setError(null)
      await OrganizationApi.addUserToOrganization(organization.uuid, selectedUserId, selectedRole)
      await fetchData()
      setShowAddModal(false)
      setSelectedUserId('')
      setSelectedRole('member')
    } catch (err: any) {
      setError(err.message || 'Erro ao adicionar usuário')
    }
  }

  const handleRemoveUser = async (userId: string) => {
    const confirmed = window.confirm('Tem certeza que deseja remover este usuário da organização?')
    if (!confirmed) return

    try {
      setError(null)
      await OrganizationApi.removeUserFromOrganization(organization.uuid, userId)
      await fetchData()
    } catch (err: any) {
      setError(err.message || 'Erro ao remover usuário')
    }
  }

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      setError(null)
      await OrganizationApi.updateUserRole(organization.uuid, userId, newRole)
      await fetchData()
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar role')
    }
  }

  const availableUsers = allUsers.filter(
    (user) => !users.some((uo) => uo.userId === user.id)
  )

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-500/20 text-purple-400'
      case 'admin':
        return 'bg-blue-500/20 text-blue-400'
      default:
        return 'bg-gray-500/20 text-gray-400'
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] backdrop-blur-sm">
        <div className="bg-[#1E1E1E] rounded-lg border border-gray-700 p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1B998B] mx-auto mb-4"></div>
          <p className="text-gray-400 text-center">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] backdrop-blur-sm">
      <div className="bg-[#1E1E1E] rounded-lg border border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
        <div className="sticky top-0 bg-[#1E1E1E] border-b border-gray-700 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Gerenciar Usuários</h2>
            <p className="text-gray-400 text-sm mt-1">{organization.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Usuários da Organização</h3>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-2 bg-[#1B998B] hover:bg-[#1B998B]/90 text-white px-4 py-2 rounded-lg transition-colors"
              disabled={availableUsers.length === 0}
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Usuário</span>
            </button>
          </div>

          {users.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <User className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Nenhum usuário associado a esta organização</p>
            </div>
          ) : (
            <div className="space-y-2">
              {users.map((uo) => (
                <div
                  key={uo.id}
                  className="bg-[#2A2A2A] rounded-lg border border-gray-700 p-4 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="w-10 h-10 bg-[#1B998B]/20 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-[#1B998B]" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{uo.user?.name || 'Usuário desconhecido'}</p>
                      <p className="text-sm text-gray-400">{uo.user?.email}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <select
                        value={uo.role}
                        onChange={(e) => handleUpdateRole(uo.userId, e.target.value)}
                        className="bg-[#1E1E1E] border border-gray-600 rounded-lg px-3 py-1 text-sm focus:outline-none focus:border-[#1B998B]"
                      >
                        <option value="member">Membro</option>
                        <option value="admin">Admin</option>
                        <option value="owner">Owner</option>
                      </select>
                      <span
                        className={`px-2 py-1 rounded text-xs ${getRoleBadgeColor(uo.role)}`}
                      >
                        {uo.role}
                      </span>
                      <button
                        onClick={() => handleRemoveUser(uo.userId)}
                        className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Remover usuário"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1100] backdrop-blur-sm">
          <div className="bg-[#1E1E1E] rounded-lg border border-gray-700 w-full max-w-md m-4">
            <div className="border-b border-gray-700 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold">Adicionar Usuário</h3>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setSelectedUserId('')
                  setSelectedRole('member')
                }}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">
                  Usuário <span className="text-red-400">*</span>
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full bg-[#2A2A2A] border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-[#1B998B]"
                  required
                >
                  <option value="">Selecione um usuário</option>
                  {availableUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Role <span className="text-red-400">*</span>
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full bg-[#2A2A2A] border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-[#1B998B]"
                  required
                >
                  <option value="member">Membro</option>
                  <option value="admin">Admin</option>
                  <option value="owner">Owner</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setSelectedUserId('')
                    setSelectedRole('member')
                  }}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAddUser}
                  className="px-4 py-2 bg-[#1B998B] hover:bg-[#1B998B]/90 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!selectedUserId}
                >
                  Adicionar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ManageUsersModal

