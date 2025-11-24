import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Edit2, Trash2, Shield, Mail, Calendar, CheckCircle, XCircle, X, Loader2, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import * as settingsApi from '../../services/settingsApi';
import Toast from '../Common/Toast';
import ConfirmDialog from '../Common/ConfirmDialog';
import { useToast } from '../../hooks/useToast';

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

interface ConfirmState {
  isOpen: boolean;
  userId: string | null;
  userName: string;
}

const ITEMS_PER_PAGE = 10;

const UsersTab: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ConfirmState>({ isOpen: false, userId: null, userName: '' });

  const { toasts, hideToast, success, error: showError } = useToast();

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
      showError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    let filtered = users.filter(user =>
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
    );

    if (statusFilter !== 'all') {
      filtered = filtered.filter(user =>
        statusFilter === 'active' ? user.is_active : !user.is_active
      );
    }

    if (roleFilter) {
      filtered = filtered.filter(user =>
        user.roles?.some(role => role.id === roleFilter)
      );
    }

    return filtered;
  }, [users, search, statusFilter, roleFilter]);

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredUsers, currentPage]);

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);

  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter(u => u.is_active).length,
    inactive: users.filter(u => !u.is_active).length,
    sso: users.filter(u => u.is_sso).length,
  }), [users]);

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

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): string | null => {
    if (!password) return null;
    if (password.length < 8) {
      return 'Senha deve ter no mínimo 8 caracteres';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Senha deve conter pelo menos uma letra maiúscula';
    }
    if (!/[a-z]/.test(password)) {
      return 'Senha deve conter pelo menos uma letra minúscula';
    }
    if (!/[0-9]/.test(password)) {
      return 'Senha deve conter pelo menos um número';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (!formData.name.trim()) {
        setError('Nome é obrigatório');
        setSubmitting(false);
        return;
      }

      if (!selectedUser && !validateEmail(formData.email)) {
        setError('Email inválido');
        setSubmitting(false);
        return;
      }

      if (selectedUser) {
        const updateData: any = {
          name: formData.name,
          is_active: formData.is_active,
          role_ids: formData.role_ids,
          team_ids: formData.team_ids
        };

        if (formData.password) {
          const passwordError = validatePassword(formData.password);
          if (passwordError) {
            setError(passwordError);
            setSubmitting(false);
            return;
          }
          updateData.password = formData.password;
        }

        await settingsApi.updateUser(selectedUser.id, updateData);
        success('Usuário atualizado com sucesso!');
      } else {
        if (!formData.password) {
          setError('Senha é obrigatória para novos usuários');
          setSubmitting(false);
          return;
        }

        const passwordError = validatePassword(formData.password);
        if (passwordError) {
          setError(passwordError);
          setSubmitting(false);
          return;
        }

        await settingsApi.createUser({
          email: formData.email,
          name: formData.name,
          password: formData.password,
          role_ids: formData.role_ids,
          team_ids: formData.team_ids
        });
        success('Usuário criado com sucesso!');
      }

      await fetchData();
      handleCloseModal();
    } catch (error: any) {
      console.error('Error saving user:', error);
      setError(error.message || 'Erro ao salvar usuário');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (user: User) => {
    setConfirmDelete({
      isOpen: true,
      userId: user.id,
      userName: user.name
    });
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDelete.userId) return;

    try {
      await settingsApi.deleteUser(confirmDelete.userId);
      setUsers(users.filter(u => u.id !== confirmDelete.userId));
      success('Usuário deletado com sucesso!');
    } catch (error) {
      console.error('Error deleting user:', error);
      showError('Erro ao deletar usuário');
    } finally {
      setConfirmDelete({ isOpen: false, userId: null, userName: '' });
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

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setRoleFilter('');
    setCurrentPage(1);
  };

  const hasActiveFilters = search || statusFilter !== 'all' || roleFilter;

  return (
    <div className="p-6">
      {/* Toast Notifications */}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => hideToast(toast.id)}
        />
      ))}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={confirmDelete.isOpen}
        title="Deletar Usuário"
        message={`Tem certeza que deseja deletar o usuário "${confirmDelete.userName}"? Esta ação não pode ser desfeita.`}
        confirmText="Deletar"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmDelete({ isOpen: false, userId: null, userName: '' })}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#2A2A2A] border border-gray-700 rounded-lg p-4 hover:border-[#1B998B] transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-[#2A2A2A] border border-gray-700 rounded-lg p-4 hover:border-green-500 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Ativos</p>
              <p className="text-2xl font-bold text-green-400 mt-1">{stats.active}</p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-[#2A2A2A] border border-gray-700 rounded-lg p-4 hover:border-red-500 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Inativos</p>
              <p className="text-2xl font-bold text-red-400 mt-1">{stats.inactive}</p>
            </div>
            <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-400" />
            </div>
          </div>
        </div>

        <div className="bg-[#2A2A2A] border border-gray-700 rounded-lg p-4 hover:border-purple-500 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">SSO</p>
              <p className="text-2xl font-bold text-purple-400 mt-1">{stats.sso}</p>
            </div>
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-1 text-white">Gerenciamento de Usuários</h2>
          <p className="text-gray-400">
            Exibindo {paginatedUsers.length} de {filteredUsers.length} usuários
            {hasActiveFilters && ' (filtrado)'}
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center space-x-2 px-4 py-2 bg-[#1B998B] text-white rounded-lg hover:bg-[#17836F] transition-all hover:scale-105"
        >
          <Plus className="w-5 h-5" />
          <span>Novo Usuário</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="md:col-span-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-[#2A2A2A] border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#1B998B] transition-colors"
            />
          </div>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 bg-[#2A2A2A] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#1B998B] transition-colors"
          >
            <option value="all">Todos os status</option>
            <option value="active">Apenas ativos</option>
            <option value="inactive">Apenas inativos</option>
          </select>
        </div>

        <div>
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 bg-[#2A2A2A] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#1B998B] transition-colors"
          >
            <option value="">Todos os roles</option>
            {roles.map(role => (
              <option key={role.id} value={role.id}>{role.display_name}</option>
            ))}
          </select>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="mb-4 flex items-center justify-between bg-[#1B998B]/10 border border-[#1B998B]/30 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-[#1B998B]" />
            <span className="text-sm text-[#1B998B]">Filtros ativos</span>
          </div>
          <button
            onClick={clearFilters}
            className="text-sm text-[#1B998B] hover:text-[#17836F] transition-colors"
          >
            Limpar filtros
          </button>
        </div>
      )}

      {/* Users Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#1B998B]"></div>
          <p className="text-gray-400 mt-4">Carregando usuários...</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto bg-[#2A2A2A] rounded-lg border border-gray-700">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700 text-left bg-[#1E1E1E]">
                  <th className="p-4 font-semibold text-gray-300">Usuário</th>
                  <th className="p-4 font-semibold text-gray-300">Status</th>
                  <th className="p-4 font-semibold text-gray-300">Tipo</th>
                  <th className="p-4 font-semibold text-gray-300">Roles</th>
                  <th className="p-4 font-semibold text-gray-300">Equipes</th>
                  <th className="p-4 font-semibold text-gray-300">Último Login</th>
                  <th className="p-4 font-semibold text-gray-300">Ações</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((user) => (
                  <tr key={user.id} className="border-b border-gray-800 hover:bg-[#3A3A3A] transition-colors">
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1B998B] to-[#17836F] flex items-center justify-center text-white font-semibold">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-white">{user.name}</div>
                          <div className="text-sm text-gray-400 flex items-center">
                            <Mail className="w-3 h-3 mr-1" />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
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
                    <td className="p-4">
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
                    <td className="p-4">
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
                    <td className="p-4">
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
                    <td className="p-4 text-sm text-gray-400">
                      {user.last_login_at ? (
                        <div className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(user.last_login_at).toLocaleDateString('pt-BR')}
                        </div>
                      ) : (
                        'Nunca'
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(user)}
                          className="p-2 hover:bg-[#1B998B]/20 rounded transition-all hover:scale-110"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4 text-[#1B998B]" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(user)}
                          className="p-2 hover:bg-red-500/20 rounded transition-all hover:scale-110"
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

            {paginatedUsers.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                {hasActiveFilters ? 'Nenhum usuário encontrado com os filtros aplicados' : 'Nenhum usuário encontrado'}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-400">
                Página {currentPage} de {totalPages}
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 bg-[#2A2A2A] border border-gray-700 rounded-lg text-white hover:bg-[#3A3A3A] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center space-x-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Anterior</span>
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 bg-[#2A2A2A] border border-gray-700 rounded-lg text-white hover:bg-[#3A3A3A] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center space-x-1"
                >
                  <span>Próxima</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-[#1E1E1E] border border-gray-700 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">
                  {selectedUser ? 'Editar Usuário' : 'Novo Usuário'}
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="Fechar modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-400 animate-slide-down">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-white">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      disabled={!!selectedUser}
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 bg-[#2A2A2A] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#1B998B] disabled:opacity-50 transition-colors"
                    />
                    {selectedUser && (
                      <p className="text-xs text-gray-400 mt-1">Email não pode ser alterado</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-white">
                      Nome *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 bg-[#2A2A2A] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#1B998B] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-white">
                      Senha {!selectedUser && '*'}
                    </label>
                    <input
                      type="password"
                      required={!selectedUser}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-3 py-2 bg-[#2A2A2A] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#1B998B] transition-colors"
                      placeholder={selectedUser ? 'Deixe em branco para não alterar' : ''}
                    />
                    {!selectedUser && (
                      <p className="text-xs text-gray-400 mt-1">
                        Mínimo 8 caracteres, com letras maiúsculas, minúsculas e números
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-700 bg-[#2A2A2A] text-[#1B998B] focus:ring-[#1B998B]"
                      />
                      <span className="text-white">Usuário ativo</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-white">
                      Roles
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {roles.map(role => (
                        <label key={role.id} className="flex items-center space-x-2 p-2 bg-[#2A2A2A] rounded cursor-pointer hover:bg-[#3A3A3A] transition-colors">
                          <input
                            type="checkbox"
                            checked={formData.role_ids.includes(role.id)}
                            onChange={() => toggleRole(role.id)}
                            className="w-4 h-4 rounded border-gray-700 text-[#1B998B] focus:ring-[#1B998B]"
                          />
                          <span className="text-white">{role.display_name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-white">
                      Equipes
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {teams.map(team => (
                        <label key={team.id} className="flex items-center space-x-2 p-2 bg-[#2A2A2A] rounded cursor-pointer hover:bg-[#3A3A3A] transition-colors">
                          <input
                            type="checkbox"
                            checked={formData.team_ids.includes(team.id)}
                            onChange={() => toggleTeam(team.id)}
                            className="w-4 h-4 rounded border-gray-700 text-[#1B998B] focus:ring-[#1B998B]"
                          />
                          <span className="text-white">{team.display_name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-700">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    disabled={submitting}
                    className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-[#1B998B] text-white rounded-lg hover:bg-[#17836F] transition-all disabled:opacity-50 flex items-center space-x-2 hover:scale-105"
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
