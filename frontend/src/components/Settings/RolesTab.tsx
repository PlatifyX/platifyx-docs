import React, { useState, useEffect } from 'react';
import { Shield, Plus, Edit2, Trash2, Lock, X, Loader2, CheckSquare, Square, Search } from 'lucide-react';
import * as settingsApi from '../../services/settingsApi';

interface Permission {
  id: string;
  name?: string;
  display_name?: string;
  description?: string;
  resource: string;
  action: string;
}

interface Role {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  is_system: boolean;
  permissions?: Permission[];
}

interface RoleFormData {
  name: string;
  display_name: string;
  description: string;
  permission_ids: string[];
}

const RolesTab: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState<RoleFormData>({
    name: '',
    display_name: '',
    description: '',
    permission_ids: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rolesResp, permsResp] = await Promise.all([
        settingsApi.getRoles(),
        settingsApi.getPermissions()
      ]);

      setRoles(rolesResp.roles || []);
      setPermissions(permsResp.permissions || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const groupPermissionsByResource = () => {
    const grouped: { [key: string]: Permission[] } = {};
    permissions.forEach(perm => {
      if (!grouped[perm.resource]) {
        grouped[perm.resource] = [];
      }
      grouped[perm.resource].push(perm);
    });
    return grouped;
  };

  const handleOpenCreateModal = () => {
    setSelectedRole(null);
    setFormData({
      name: '',
      display_name: '',
      description: '',
      permission_ids: []
    });
    setError(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (role: Role) => {
    setSelectedRole(role);
    setFormData({
      name: role.name,
      display_name: role.display_name,
      description: role.description || '',
      permission_ids: role.permissions?.map(p => p.id) || []
    });
    setError(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedRole(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (selectedRole) {
        // Editar role
        await settingsApi.updateRole(selectedRole.id, {
          display_name: formData.display_name,
          description: formData.description,
          permission_ids: formData.permission_ids
        });
      } else {
        // Criar role
        await settingsApi.createRole({
          name: formData.name,
          display_name: formData.display_name,
          description: formData.description,
          permission_ids: formData.permission_ids
        });
      }

      await fetchData();
      handleCloseModal();
    } catch (error: any) {
      console.error('Error saving role:', error);
      setError(error.message || 'Erro ao salvar role');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRole = async (roleId: string, isSystem: boolean) => {
    if (isSystem) {
      alert('Roles do sistema não podem ser deletados');
      return;
    }
    if (!confirm('Tem certeza que deseja deletar este role?')) return;

    try {
      await settingsApi.deleteRole(roleId);
      setRoles(roles.filter(r => r.id !== roleId));
    } catch (error) {
      console.error('Error deleting role:', error);
      alert('Erro ao deletar role');
    }
  };

  const togglePermission = (permId: string) => {
    setFormData(prev => ({
      ...prev,
      permission_ids: prev.permission_ids.includes(permId)
        ? prev.permission_ids.filter(id => id !== permId)
        : [...prev.permission_ids, permId]
    }));
  };

  const toggleAllResourcePermissions = (resource: string, perms: Permission[]) => {
    const permIds = perms.map(p => p.id);
    const allSelected = permIds.every(id => formData.permission_ids.includes(id));

    if (allSelected) {
      // Remover todas
      setFormData(prev => ({
        ...prev,
        permission_ids: prev.permission_ids.filter(id => !permIds.includes(id))
      }));
    } else {
      // Adicionar todas
      setFormData(prev => ({
        ...prev,
        permission_ids: [...new Set([...prev.permission_ids, ...permIds])]
      }));
    }
  };

  const getRoleStats = (role: Role) => {
    const permCount = role.permissions?.length || 0;
    const totalPerms = permissions.length;
    const percentage = totalPerms > 0 ? Math.round((permCount / totalPerms) * 100) : 0;
    return { count: permCount, total: totalPerms, percentage };
  };

  const getPermissionDisplay = (perm: Permission): string => {
    return perm.display_name || perm.name || `${perm.resource}.${perm.action}`;
  };

  const filteredRoles = roles.filter(role =>
    role.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (role.description && role.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-1 text-white">Roles & Permissões</h2>
          <p className="text-gray-400">
            {roles.length} roles • {permissions.length} permissões disponíveis
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center space-x-2 px-4 py-2 bg-[#1B998B] text-white rounded-lg hover:bg-[#17836F] transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Novo Role</span>
        </button>
      </div>

      {/* Error Message */}
      {error && !showModal && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar roles por nome ou descrição..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#2A2A2A] border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#1B998B]"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B998B]"></div>
          <p className="text-gray-400 mt-2">Carregando roles...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Roles List */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Roles</h3>
            <div className="space-y-3">
              {filteredRoles.map((role) => {
                const stats = getRoleStats(role);
                return (
                  <div
                    key={role.id}
                    className="bg-[#2A2A2A] border border-gray-700 rounded-lg p-4 hover:border-[#1B998B] transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <Shield className="w-5 h-5 text-[#1B998B]" />
                          <h4 className="font-semibold text-white">{role.display_name}</h4>
                          {role.is_system && (
                            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs flex items-center">
                              <Lock className="w-3 h-3 mr-1" />
                              Sistema
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400">{role.description || 'Sem descrição'}</p>
                      </div>
                      <div className="flex space-x-1 ml-2">
                        <button
                          onClick={() => handleOpenEditModal(role)}
                          className="p-1 hover:bg-[#3A3A3A] rounded transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4 text-[#1B998B]" />
                        </button>
                        {!role.is_system && (
                          <button
                            onClick={() => handleDeleteRole(role.id, role.is_system)}
                            className="p-1 hover:bg-[#3A3A3A] rounded transition-colors"
                            title="Deletar"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Permission Progress */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">{stats.count} de {stats.total} permissões</span>
                        <span className="text-[#1B998B] font-medium">{stats.percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-[#1B998B] h-full transition-all duration-300"
                          style={{ width: `${stats.percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredRoles.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  {searchQuery ? 'Nenhum role encontrado com esse filtro' : 'Nenhum role encontrado'}
                </div>
              )}
            </div>
          </div>

          {/* Permissions Overview */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Permissões por Recurso</h3>
            <div className="space-y-3">
              {Object.entries(groupPermissionsByResource()).map(([resource, perms]) => (
                <div key={resource} className="bg-[#2A2A2A] border border-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-[#1B998B] mb-3 flex items-center">
                    <Lock className="w-4 h-4 mr-2" />
                    {resource.charAt(0).toUpperCase() + resource.slice(1)}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {perms.map(perm => (
                      <div
                        key={perm.id}
                        className="px-2 py-1 bg-[#1B998B]/20 text-[#1B998B] rounded text-xs font-medium"
                        title={perm.description || ''}
                      >
                        {getPermissionDisplay(perm)}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {Object.keys(groupPermissionsByResource()).length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  Nenhuma permissão encontrada
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1E1E1E] border border-gray-700 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">
                  {selectedRole ? `Editar Role: ${selectedRole.display_name}` : 'Novo Role'}
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-400">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  {/* Name (apenas na criação) */}
                  {!selectedRole && (
                    <div>
                      <label className="block text-sm font-medium mb-2 text-white">
                        Nome Interno (slug) *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                        className="w-full px-3 py-2 bg-[#2A2A2A] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#1B998B]"
                        placeholder="ex: custom_role"
                      />
                      <p className="text-xs text-gray-400 mt-1">Usado internamente. Use apenas letras minúsculas e underscores.</p>
                    </div>
                  )}

                  {/* Display Name */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-white">
                      Nome de Exibição *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.display_name}
                      onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                      className="w-full px-3 py-2 bg-[#2A2A2A] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#1B998B]"
                      placeholder="ex: Gerente de Projetos"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-white">
                      Descrição
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 bg-[#2A2A2A] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#1B998B] resize-none"
                      placeholder="Descreva as responsabilidades deste role..."
                    />
                  </div>

                  {/* Permissions */}
                  <div>
                    <label className="block text-sm font-medium mb-3 text-white">
                      Permissões ({formData.permission_ids.length} selecionadas)
                    </label>

                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                      {Object.entries(groupPermissionsByResource()).map(([resource, perms]) => {
                        const allSelected = perms.every(p => formData.permission_ids.includes(p.id));
                        const someSelected = perms.some(p => formData.permission_ids.includes(p.id));

                        return (
                          <div key={resource} className="bg-[#2A2A2A] rounded-lg p-3 border border-gray-700">
                            <div
                              className="flex items-center space-x-2 mb-2 cursor-pointer hover:bg-[#3A3A3A] p-1 rounded"
                              onClick={() => toggleAllResourcePermissions(resource, perms)}
                            >
                              {allSelected ? (
                                <CheckSquare className="w-5 h-5 text-[#1B998B]" />
                              ) : someSelected ? (
                                <div className="w-5 h-5 border-2 border-[#1B998B] rounded flex items-center justify-center">
                                  <div className="w-2.5 h-2.5 bg-[#1B998B] rounded-sm" />
                                </div>
                              ) : (
                                <Square className="w-5 h-5 text-gray-500" />
                              )}
                              <span className="font-semibold text-[#1B998B]">
                                {resource.charAt(0).toUpperCase() + resource.slice(1)}
                              </span>
                              <span className="text-xs text-gray-500">
                                ({perms.filter(p => formData.permission_ids.includes(p.id)).length}/{perms.length})
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-7">
                              {perms.map(perm => (
                                <label
                                  key={perm.id}
                                  className="flex items-start space-x-2 p-2 rounded cursor-pointer hover:bg-[#3A3A3A] transition-colors"
                                >
                                  <input
                                    type="checkbox"
                                    checked={formData.permission_ids.includes(perm.id)}
                                    onChange={() => togglePermission(perm.id)}
                                    className="w-4 h-4 mt-0.5 rounded border-gray-700 text-[#1B998B] focus:ring-[#1B998B]"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-white">
                                      {getPermissionDisplay(perm)}
                                    </div>
                                    {perm.description && (
                                      <div className="text-xs text-gray-400 truncate">
                                        {perm.description}
                                      </div>
                                    )}
                                  </div>
                                </label>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-700">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    disabled={submitting}
                    className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-[#1B998B] text-white rounded-lg hover:bg-[#17836F] transition-colors disabled:opacity-50 flex items-center space-x-2"
                  >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>{submitting ? 'Salvando...' : 'Salvar'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RolesTab;
