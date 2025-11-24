import { useState, useEffect } from 'react'
import { Building2, Plus, Edit, Trash2, Key, Users } from 'lucide-react'
import { OrganizationApi, type Organization } from '../utils/organizationApi'
import CreateOrganizationModal from '../components/Organizations/CreateOrganizationModal'
import EditOrganizationModal from '../components/Organizations/EditOrganizationModal'
import ManageUsersModal from '../components/Organizations/ManageUsersModal'

function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showManageUsersModal, setShowManageUsersModal] = useState(false)
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null)

  useEffect(() => {
    fetchOrganizations()
  }, [])

  const fetchOrganizations = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await OrganizationApi.getAll()
      setOrganizations(data)
    } catch (err: any) {
      console.error('Error fetching organizations:', err)
      setError(err.message || 'Erro ao carregar organizações')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (data: any) => {
    try {
      await OrganizationApi.create(data)
      await fetchOrganizations()
      setShowCreateModal(false)
    } catch (err: any) {
      console.error('Error creating organization:', err)
      alert(err.message || 'Erro ao criar organização')
      throw err
    }
  }

  const handleEdit = (org: Organization) => {
    setSelectedOrganization(org)
    setShowEditModal(true)
  }

  const handleManageUsers = (org: Organization) => {
    setSelectedOrganization(org)
    setShowManageUsersModal(true)
  }

  const handleUpdate = async (uuid: string, data: any) => {
    try {
      await OrganizationApi.update(uuid, data)
      await fetchOrganizations()
      setShowEditModal(false)
      setSelectedOrganization(null)
    } catch (err: any) {
      console.error('Error updating organization:', err)
      alert(err.message || 'Erro ao atualizar organização')
      throw err
    }
  }

  const handleDelete = async (org: Organization) => {
    const confirmed = window.confirm(
      `Tem certeza que deseja deletar a organização "${org.name}"? Esta ação não pode ser desfeita e irá remover o schema do banco node.`
    )

    if (!confirmed) return

    try {
      await OrganizationApi.delete(org.uuid)
      await fetchOrganizations()
    } catch (err: any) {
      console.error('Error deleting organization:', err)
      alert(err.message || 'Erro ao deletar organização')
    }
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1B998B] mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando organizações...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-[#1B998B]/20 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-[#1B998B]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Organizações</h1>
              <p className="text-gray-400 text-sm mt-1">
                Gerencie as organizações e seus usuários
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 bg-[#1B998B] hover:bg-[#1B998B]/90 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Nova Organização</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {organizations.length === 0 ? (
        <div className="bg-[#1E1E1E] rounded-lg border border-gray-700 p-12 text-center">
          <Building2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Nenhuma organização encontrada</h3>
          <p className="text-gray-400 mb-6">Comece criando sua primeira organização</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center space-x-2 bg-[#1B998B] hover:bg-[#1B998B]/90 text-white px-6 py-3 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Criar Organização</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {organizations.map((org) => (
            <div
              key={org.uuid}
              className="bg-[#1E1E1E] rounded-lg border border-gray-700 p-6 hover:border-[#1B998B]/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-1">{org.name}</h3>
                  <p className="text-xs text-gray-500 font-mono">{org.uuid}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleManageUsers(org)}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                    title="Gerenciar Usuários"
                  >
                    <Users className="w-4 h-4 text-gray-400" />
                  </button>
                  <button
                    onClick={() => handleEdit(org)}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4 text-gray-400" />
                  </button>
                  <button
                    onClick={() => handleDelete(org)}
                    className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Deletar"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm">
                  <Key className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-400">SSO:</span>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      org.ssoActive
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}
                  >
                    {org.ssoActive ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateOrganizationModal
          onSave={handleCreate}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {showEditModal && selectedOrganization && (
        <EditOrganizationModal
          organization={selectedOrganization}
          onSave={(data) => handleUpdate(selectedOrganization.uuid, data)}
          onClose={() => {
            setShowEditModal(false)
            setSelectedOrganization(null)
          }}
        />
      )}

      {showManageUsersModal && selectedOrganization && (
        <ManageUsersModal
          organization={selectedOrganization}
          onClose={() => {
            setShowManageUsersModal(false)
            setSelectedOrganization(null)
          }}
        />
      )}
    </div>
  )
}

export default OrganizationsPage

