import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Shield, Mail, Calendar, CheckCircle, XCircle } from 'lucide-react';

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

const UsersTab: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // TODO: Implementar chamada à API
      // const response = await fetch('/api/v1/settings/users');
      // const data = await response.json();

      // Mock data para desenvolvimento
      setUsers([
        {
          id: '1',
          email: 'admin@platifyx.com',
          name: 'Administrador',
          is_active: true,
          is_sso: false,
          roles: [{ id: '1', name: 'admin', display_name: 'Administrator' }],
          teams: [{ id: '1', name: 'platform', display_name: 'Platform Team' }],
          last_login_at: new Date().toISOString(),
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: '2',
          email: 'developer@platifyx.com',
          name: 'Developer User',
          is_active: true,
          is_sso: true,
          sso_provider: 'google',
          roles: [{ id: '2', name: 'developer', display_name: 'Developer' }],
          teams: [{ id: '2', name: 'backend', display_name: 'Backend Team' }],
          last_login_at: new Date().toISOString(),
          created_at: '2024-01-15T00:00:00Z',
        },
      ]);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(search.toLowerCase()) ||
    user.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Tem certeza que deseja deletar este usuário?')) return;

    try {
      // TODO: Implementar chamada à API
      // await fetch(`/api/v1/settings/users/${userId}`, { method: 'DELETE' });
      setUsers(users.filter(u => u.id !== userId));
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-1">Gerenciamento de Usuários</h2>
          <p className="text-gray-400">
            Total: {users.length} usuários • {users.filter(u => u.is_active).length} ativos
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-[#1B998B] text-white rounded-lg hover:bg-[#17836F] transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Novo Usuário</span>
        </button>
      </div>

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
                        <div className="font-medium">{user.name}</div>
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
                      {user.roles?.map(role => (
                        <span key={role.id} className="px-2 py-1 bg-[#1B998B]/20 text-[#1B998B] rounded text-xs flex items-center">
                          <Shield className="w-3 h-3 mr-1" />
                          {role.display_name}
                        </span>
                      )) || '-'}
                    </div>
                  </td>
                  <td className="py-4">
                    <div className="flex flex-wrap gap-1">
                      {user.teams?.map(team => (
                        <span key={team.id} className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">
                          {team.display_name}
                        </span>
                      )) || '-'}
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
                        onClick={() => setSelectedUser(user)}
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

      {/* Create/Edit Modal (TODO: Implementar) */}
      {(showCreateModal || selectedUser) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1E1E1E] border border-gray-700 rounded-lg p-6 max-w-2xl w-full mx-4">
            <h3 className="text-xl font-bold mb-4">
              {selectedUser ? 'Editar Usuário' : 'Novo Usuário'}
            </h3>
            <p className="text-gray-400 mb-4">
              Formulário de criação/edição de usuário (em desenvolvimento)
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedUser(null);
                }}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 bg-[#1B998B] text-white rounded-lg hover:bg-[#17836F] transition-colors"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersTab;
