import React, { useState, useEffect } from 'react';
import { Users2, Plus, Edit2, Trash2, UserPlus, X, Loader2, Crown, Shield as ShieldIcon, User as UserIcon } from 'lucide-react';
import * as settingsApi from '../../services/settingsApi';

type User = settingsApi.User;
type Team = settingsApi.Team;

interface TeamFormData {
  name: string;
  display_name: string;
  description: string;
  avatar_url: string;
  member_ids: string[];
}

const TeamsTab: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<TeamFormData>({
    name: '',
    display_name: '',
    description: '',
    avatar_url: '',
    member_ids: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [teamsResp, usersResp] = await Promise.all([
        settingsApi.getTeams(),
        settingsApi.getUsers()
      ]);

      setTeams(teamsResp.teams || []);
      setUsers(usersResp.users || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setSelectedTeam(null);
    setFormData({
      name: '',
      display_name: '',
      description: '',
      avatar_url: '',
      member_ids: []
    });
    setError(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (team: Team) => {
    setSelectedTeam(team);
    setFormData({
      name: team.name,
      display_name: team.display_name,
      description: team.description || '',
      avatar_url: team.avatar_url || '',
      member_ids: team.members?.map(m => m.user_id) || []
    });
    setError(null);
    setShowModal(true);
  };

  const handleOpenMembersModal = (team: Team) => {
    setSelectedTeam(team);
    setShowMembersModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setShowMembersModal(false);
    setSelectedTeam(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (selectedTeam) {
        // Editar team
        await settingsApi.updateTeam(selectedTeam.id, {
          display_name: formData.display_name,
          description: formData.description,
          avatar_url: formData.avatar_url || undefined
        });
      } else {
        // Criar team
        await settingsApi.createTeam({
          name: formData.name,
          display_name: formData.display_name,
          description: formData.description,
          avatar_url: formData.avatar_url || undefined,
          member_ids: formData.member_ids
        });
      }

      await fetchData();
      handleCloseModal();
    } catch (error: any) {
      console.error('Error saving team:', error);
      setError(error.message || 'Erro ao salvar equipe');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm('Tem certeza que deseja deletar esta equipe?')) return;

    try {
      await settingsApi.deleteTeam(teamId);
      setTeams(teams.filter(t => t.id !== teamId));
    } catch (error) {
      console.error('Error deleting team:', error);
      alert('Erro ao deletar equipe');
    }
  };

  const handleAddMember = async (userId: string, role: string = 'member') => {
    if (!selectedTeam) return;

    try {
      await settingsApi.addTeamMember(selectedTeam.id, { user_ids: [userId], role });
      await fetchData();

      // Atualizar selectedTeam
      const updated = teams.find(t => t.id === selectedTeam.id);
      if (updated) setSelectedTeam(updated);
    } catch (error) {
      console.error('Error adding member:', error);
      alert('Erro ao adicionar membro');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!selectedTeam) return;
    if (!confirm('Tem certeza que deseja remover este membro?')) return;

    try {
      await settingsApi.removeTeamMember(selectedTeam.id, userId);
      await fetchData();

      // Atualizar selectedTeam
      const updated = teams.find(t => t.id === selectedTeam.id);
      if (updated) setSelectedTeam(updated);
    } catch (error) {
      console.error('Error removing member:', error);
      alert('Erro ao remover membro');
    }
  };

  const toggleMember = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      member_ids: prev.member_ids.includes(userId)
        ? prev.member_ids.filter(id => id !== userId)
        : [...prev.member_ids, userId]
    }));
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-3 h-3" />;
      case 'admin':
        return <ShieldIcon className="w-3 h-3" />;
      default:
        return <UserIcon className="w-3 h-3" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'admin':
        return 'bg-purple-500/20 text-purple-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getAvailableUsers = () => {
    if (!selectedTeam) return users;
    const memberIds = selectedTeam.members?.map(m => m.user_id) || [];
    return users.filter(u => !memberIds.includes(u.id));
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-1 text-white">Gerenciamento de Equipes</h2>
          <p className="text-gray-400">
            {teams.length} equipes • {teams.reduce((acc, t) => acc + (t.members?.length || 0), 0)} membros no total
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center space-x-2 px-4 py-2 bg-[#1B998B] text-white rounded-lg hover:bg-[#17836F] transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Nova Equipe</span>
        </button>
      </div>

      {/* Error Message */}
      {error && !showModal && !showMembersModal && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B998B]"></div>
          <p className="text-gray-400 mt-2">Carregando equipes...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {teams.map((team) => (
            <div
              key={team.id}
              className="bg-[#2A2A2A] border border-gray-700 rounded-lg p-5 hover:border-[#1B998B] transition-colors"
            >
              {/* Team Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-lg bg-[#1B998B]/20 flex items-center justify-center flex-shrink-0">
                    {team.avatar_url ? (
                      <img src={team.avatar_url} alt={team.display_name} className="w-12 h-12 rounded-lg" />
                    ) : (
                      <Users2 className="w-6 h-6 text-[#1B998B]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate text-white">
                      {team.display_name}
                    </h3>
                    <p className="text-sm text-gray-400 truncate">{team.description || 'Sem descrição'}</p>
                  </div>
                </div>
                <div className="flex space-x-1 ml-2">
                  <button
                    onClick={() => handleOpenEditModal(team)}
                    className="p-1 hover:bg-[#3A3A3A] rounded transition-colors"
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4 text-[#1B998B]" />
                  </button>
                  <button
                    onClick={() => handleDeleteTeam(team.id)}
                    className="p-1 hover:bg-[#3A3A3A] rounded transition-colors"
                    title="Deletar"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>

              {/* Members Section */}
              <div className="border-t border-gray-700 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-400">
                    {team.members?.length || 0} {(team.members?.length || 0) === 1 ? 'membro' : 'membros'}
                  </span>
                  <button
                    onClick={() => handleOpenMembersModal(team)}
                    className="text-xs text-[#1B998B] hover:text-[#17836F] flex items-center transition-colors"
                  >
                    <UserPlus className="w-3 h-3 mr-1" />
                    Gerenciar
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {team.members && team.members.length > 0 ? (
                    team.members.slice(0, 3).map((member, idx) => (
                      <div key={idx} className="flex items-center justify-between py-2 px-3 bg-[#1E1E1E] rounded">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate text-white">
                            {member.user?.name}
                          </div>
                          <div className="text-xs text-gray-400 truncate">{member.user?.email}</div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded flex items-center space-x-1 ml-2 ${getRoleColor(member.role)}`}>
                          {getRoleIcon(member.role)}
                          <span>{member.role}</span>
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      Nenhum membro ainda
                    </div>
                  )}

                  {team.members && team.members.length > 3 && (
                    <button
                      onClick={() => handleOpenMembersModal(team)}
                      className="w-full text-center text-xs text-[#1B998B] hover:text-[#17836F] py-2"
                    >
                      +{team.members.length - 3} mais
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {teams.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-400">
              Nenhuma equipe encontrada
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Team Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1E1E1E] border border-gray-700 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">
                  {selectedTeam ? 'Editar Equipe' : 'Nova Equipe'}
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
                  {!selectedTeam && (
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
                        placeholder="ex: backend_team"
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
                      placeholder="ex: Equipe de Backend"
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
                      rows={3}
                      className="w-full px-3 py-2 bg-[#2A2A2A] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#1B998B] resize-none"
                      placeholder="Descreva o propósito desta equipe..."
                    />
                  </div>

                  {/* Avatar URL */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-white">
                      URL do Avatar (opcional)
                    </label>
                    <input
                      type="url"
                      value={formData.avatar_url}
                      onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                      className="w-full px-3 py-2 bg-[#2A2A2A] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#1B998B]"
                      placeholder="https://exemplo.com/avatar.png"
                    />
                  </div>

                  {/* Initial Members (apenas na criação) */}
                  {!selectedTeam && users.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium mb-3 text-white">
                        Membros Iniciais (opcional)
                      </label>
                      <div className="max-h-60 overflow-y-auto space-y-2 border border-gray-700 rounded-lg p-3">
                        {users.map(user => (
                          <label
                            key={user.id}
                            className="flex items-center space-x-3 p-2 hover:bg-[#2A2A2A] rounded cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={formData.member_ids.includes(user.id)}
                              onChange={() => toggleMember(user.id)}
                              className="w-4 h-4 rounded border-gray-700 text-[#1B998B] focus:ring-[#1B998B]"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate text-white">
                                {user.name}
                              </div>
                              <div className="text-xs text-gray-400 truncate">{user.email}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        Membros selecionados: {formData.member_ids.length}
                      </p>
                    </div>
                  )}
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

      {/* Manage Members Modal */}
      {showMembersModal && selectedTeam && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1E1E1E] border border-gray-700 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">
                  Membros: {selectedTeam.display_name}
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Current Members */}
                <div>
                  <h4 className="text-sm font-semibold mb-3 text-white">
                    Membros Atuais ({selectedTeam.members?.length || 0})
                  </h4>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {selectedTeam.members && selectedTeam.members.length > 0 ? (
                      selectedTeam.members.map((member, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-[#2A2A2A] rounded-lg border border-gray-700">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate text-white">
                              {member.user?.name}
                            </div>
                            <div className="text-xs text-gray-400 truncate">{member.user?.email}</div>
                          </div>
                          <div className="flex items-center space-x-2 ml-3">
                            <span className={`text-xs px-2 py-1 rounded flex items-center space-x-1 ${getRoleColor(member.role)}`}>
                              {getRoleIcon(member.role)}
                              <span>{member.role}</span>
                            </span>
                            {member.role !== 'owner' && (
                              <button
                                onClick={() => handleRemoveMember(member.user_id)}
                                className="p-1 hover:bg-red-500/20 rounded transition-colors"
                                title="Remover"
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        Nenhum membro nesta equipe
                      </div>
                    )}
                  </div>
                </div>

                {/* Available Users */}
                <div>
                  <h4 className="text-sm font-semibold mb-3 text-white">
                    Adicionar Membros ({getAvailableUsers().length} disponíveis)
                  </h4>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {getAvailableUsers().length > 0 ? (
                      getAvailableUsers().map(user => (
                        <div key={user.id} className="flex items-center justify-between p-3 bg-[#2A2A2A] rounded-lg border border-gray-700">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate text-white">
                              {user.name}
                            </div>
                            <div className="text-xs text-gray-400 truncate">{user.email}</div>
                          </div>
                          <button
                            onClick={() => handleAddMember(user.id, 'member')}
                            className="ml-3 p-1 hover:bg-[#1B998B]/20 rounded transition-colors"
                            title="Adicionar"
                          >
                            <UserPlus className="w-4 h-4 text-[#1B998B]" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        Todos os usuários já são membros
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6 pt-6 border-t border-gray-700">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamsTab;
