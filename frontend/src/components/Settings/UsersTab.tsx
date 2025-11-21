import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Shield, Mail, Calendar, CheckCircle, XCircle, X, Loader2 } from 'lucide-react';
import * as settingsApi from '../../services/settingsApi';

interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  is_active: boolean;
  is_sso: boolean;
  sso_provider?: string;
  roles?: Role[];
  teams?: Team[];
  last_login_at?: string;
  created_at: string;
}

interface Role {
  id: string;
  name: string;
  display_name: string;
}

interface Team {
  id: string;
  name: string;
  display_name: string;
}

interface UserFormData {
  email: string;
  name: string;
  password?: string;
  is_active: boolean;
  role_ids: string[];
  team_ids: string[];
}

const UsersTab: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    name: '',
    password: '',
    is_active: true,
    role_ids: [],
    team_ids: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersResp, rolesResp, teamsResp] = await Promise.all([
        settingsApi.getUsers(),
        settingsApi.getRoles(),
        settingsApi.getTeams()
      ]);

      setUsers(usersResp.users || []);
      setRoles(rolesResp.roles || []);
      setTeams(teamsResp.teams || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(search.toLowerCase()) ||
    user.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenCreateModal = () => {
    setSelectedUser(null);
    setFormData({
      email: '',
      name: '',
      password: '',
      is_active: true,
      role_ids: [],
      team_ids: []
    });
    setError(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      name: user.name,
      password: '',
      is_active: user.is_active,
      role_ids: user.roles?.map(r => r.id) || [],
      team_ids: user.teams?.map(t => t.id) || []
    });
    setError(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (selectedUser) {
        // Editar usuário
        const updateData: any = {
          name: formData.name,
          is_active: formData.is_active,
          role_ids: formData.role_ids,
          team_ids: formData.team_ids
        };

        if (formData.password) {
          updateData.password = formData.password;
        }

        await settingsApi.updateUser(selectedUser.id, updateData);
      } else {
        // Criar usuário
        if (!formData.password) {
          setError('Senha é obrigatória para novos usuários');
          setSubmitting(false);
          return;
        }

        await settingsApi.createUser({
          email: formData.email,
          name: formData.name,
          password: formData.password,
          is_active: formData.is_active,
          role_ids: formData.role_ids,
          team_ids: formData.team_ids
        });
      }

      // Recarregar lista de usuários
      await fetchData();
      handleCloseModal();
    } catch (error: any) {
      console.error('Error saving user:', error);
      setError(error.message || 'Erro ao salvar usuário');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Tem certeza que deseja deletar este usuário?')) return;

    try {
      await settingsApi.deleteUser(userId);
      setUsers(users.filter(u => u.id !== userId));
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Erro ao deletar usuário');
    }
  };

  const toggleRole = (roleId: string) => {
    setFormData(prev => ({
      ...prev,
      role_ids: prev.role_ids.includes(roleId)
        ? prev.role_ids.filter(id => id !== roleId)
        : [...prev.role_ids, roleId]
    }));
  };

  const toggleTeam = (teamId: string) => {
    setFormData(prev => ({
      ...prev,
      team_ids: prev.team_ids.includes(teamId)
        ? prev.team_ids.filter(id => id !== teamId)
        : [...prev.team_ids, teamId]
    }));
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-1" style={{ color: '#FFFFFF' }}>Gerenciamento de Usuários</h2>
          <p className="text-gray-400">
            Total: {users.length} usuários • {users.filter(u => u.is_active).length} ativos
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center space-x-2 px-4 py-2 bg-[#1B998B] text-white rounded-lg hover:bg-[#17836F] transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Novo Usuário</span>
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
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#2A2A2A] border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#1B998B]"
          />
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B998B]"></div>
          <p className="text-gray-400 mt-2">Carregando usuários...</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700 text-left">
                <th className="pb-3 font-semibold text-gray-300">Usuário</th>
                <th className="pb-3 font-semibold text-gray-300">Status</th>
                <th className="pb-3 font-semibold text-gray-300">Tipo</th>
                <th className="pb-3 font-semibold text-gray-300">Roles</th>
                <th className="pb-3 font-semibold text-gray-300">Equipes</th>
                <th className="pb-3 font-semibold text-gray-300">Último Login</th>
                <th className="pb-3 font-semibold text-gray-300">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-gray-800 hover:bg-[#2A2A2A] transition-colors">
                  <td className="py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-[#1B998B] flex items-center justify-center text-white font-semibold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium" style={{ color: '#FFFFFF' }}>{user.name}</div>
                        <div className="text-sm text-gray-400 flex items-center">
                          <Mail className="w-3 h-3 mr-1" />
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4">
                    {user.is_active ? (
                      <span className="flex items-center text-green-500">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Ativo
                      </span>
                    ) : (
                      <span className="flex items-center text-red-500">
                        <XCircle className="w-4 h-4 mr-1" />
                        Inativo
                      </span>
                    )}
                  </td>
                  <td className="py-4">
                    {user.is_sso ? (
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-sm">
                        SSO ({user.sso_provider})
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded text-sm">
                        Local
                      </span>
                    )}
                  </td>
                  <td className="py-4">
                    <div className="flex flex-wrap gap-1">
                      {user.roles && user.roles.length > 0 ? (
                        user.roles.map(role => (
                          <span key={role.id} className="px-2 py-1 bg-[#1B998B]/20 text-[#1B998B] rounded text-xs flex items-center">
                            <Shield className="w-3 h-3 mr-1" />
                            {role.display_name}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </div>
                  </td>
                  <td className="py-4">
                    <div className="flex flex-wrap gap-1">
                      {user.teams && user.teams.length > 0 ? (
                        user.teams.map(team => (
                          <span key={team.id} className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">
                            {team.display_name}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 text-sm text-gray-400">
                    {user.last_login_at ? (
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(user.last_login_at).toLocaleDateString('pt-BR')}
                      </div>
                    ) : (
                      'Nunca'
                    )}
                  </td>
                  <td className="py-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleOpenEditModal(user)}
                        className="p-1 hover:bg-[#3A3A3A] rounded transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4 text-[#1B998B]" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-1 hover:bg-[#3A3A3A] rounded transition-colors"
                        title="Deletar"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              Nenhum usuário encontrado
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1E1E1E] border border-gray-700 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold" style={{ color: '#FFFFFF' }}>
                  {selectedUser ? 'Editar Usuário' : 'Novo Usuário'}
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
                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#FFFFFF' }}>
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      disabled={!!selectedUser}
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 bg-[#2A2A2A] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#1B998B] disabled:opacity-50"
                      style={{ color: '#FFFFFF' }}
                    />
                    {selectedUser && (
                      <p className="text-xs text-gray-400 mt-1">Email não pode ser alterado</p>
                    )}
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#FFFFFF' }}>
                      Nome *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 bg-[#2A2A2A] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#1B998B]"
                      style={{ color: '#FFFFFF' }}
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#FFFFFF' }}>
                      Senha {!selectedUser && '*'}
                    </label>
                    <input
                      type="password"
                      required={!selectedUser}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-3 py-2 bg-[#2A2A2A] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#1B998B]"
                      style={{ color: '#FFFFFF' }}
                      placeholder={selectedUser ? 'Deixe em branco para não alterar' : ''}
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-700 bg-[#2A2A2A] text-[#1B998B] focus:ring-[#1B998B]"
                      />
                      <span style={{ color: '#FFFFFF' }}>Usuário ativo</span>
                    </label>
                  </div>

                  {/* Roles */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#FFFFFF' }}>
                      Roles
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {roles.map(role => (
                        <label key={role.id} className="flex items-center space-x-2 p-2 bg-[#2A2A2A] rounded cursor-pointer hover:bg-[#3A3A3A]">
                          <input
                            type="checkbox"
                            checked={formData.role_ids.includes(role.id)}
                            onChange={() => toggleRole(role.id)}
                            className="w-4 h-4 rounded border-gray-700 text-[#1B998B] focus:ring-[#1B998B]"
                          />
                          <span style={{ color: '#FFFFFF' }}>{role.display_name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Teams */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#FFFFFF' }}>
                      Equipes
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {teams.map(team => (
                        <label key={team.id} className="flex items-center space-x-2 p-2 bg-[#2A2A2A] rounded cursor-pointer hover:bg-[#3A3A3A]">
                          <input
                            type="checkbox"
                            checked={formData.team_ids.includes(team.id)}
                            onChange={() => toggleTeam(team.id)}
                            className="w-4 h-4 rounded border-gray-700 text-[#1B998B] focus:ring-[#1B998B]"
                          />
                          <span style={{ color: '#FFFFFF' }}>{team.display_name}</span>
                        </label>
                      ))}
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

export default UsersTab;
