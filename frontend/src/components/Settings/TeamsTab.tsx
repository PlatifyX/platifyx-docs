import React, { useState, useEffect } from 'react';
import { Users2, Plus, Edit2, Trash2, UserPlus } from 'lucide-react';

interface Team {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  members?: TeamMember[];
}

interface TeamMember {
  user_id: string;
  role: string;
  user?: {
    name: string;
    email: string;
  };
}

const TeamsTab: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      // Mock data
      setTeams([
        {
          id: '1',
          name: 'platform',
          display_name: 'Platform Team',
          description: 'Equipe de plataforma e infraestrutura',
          members: [
            { user_id: '1', role: 'owner', user: { name: 'Admin User', email: 'admin@platifyx.com' } },
            { user_id: '2', role: 'member', user: { name: 'Platform Engineer', email: 'platform@platifyx.com' } },
          ],
        },
        {
          id: '2',
          name: 'backend',
          display_name: 'Backend Team',
          description: 'Equipe de desenvolvimento backend',
          members: [
            { user_id: '3', role: 'owner', user: { name: 'Backend Lead', email: 'backend-lead@platifyx.com' } },
            { user_id: '4', role: 'member', user: { name: 'Developer 1', email: 'dev1@platifyx.com' } },
            { user_id: '5', role: 'member', user: { name: 'Developer 2', email: 'dev2@platifyx.com' } },
          ],
        },
      ]);
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm('Tem certeza que deseja deletar esta equipe?')) return;
    try {
      setTeams(teams.filter(t => t.id !== teamId));
    } catch (error) {
      console.error('Error deleting team:', error);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-1">Gerenciamento de Equipes</h2>
          <p className="text-gray-400">Total: {teams.length} equipes</p>
        </div>
        <button className="flex items-center space-x-2 px-4 py-2 bg-[#1B998B] text-white rounded-lg hover:bg-[#17836F] transition-colors">
          <Plus className="w-5 h-5" />
          <span>Nova Equipe</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {teams.map((team) => (
          <div key={team.id} className="bg-[#2A2A2A] border border-gray-700 rounded-lg p-6 hover:border-[#1B998B] transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-lg bg-[#1B998B]/20 flex items-center justify-center">
                  <Users2 className="w-6 h-6 text-[#1B998B]" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{team.display_name}</h3>
                  <p className="text-sm text-gray-400">{team.description}</p>
                </div>
              </div>
              <div className="flex space-x-1">
                <button className="p-1 hover:bg-[#3A3A3A] rounded transition-colors">
                  <Edit2 className="w-4 h-4 text-[#1B998B]" />
                </button>
                <button
                  onClick={() => handleDeleteTeam(team.id)}
                  className="p-1 hover:bg-[#3A3A3A] rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </div>

            <div className="border-t border-gray-700 pt-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-400">
                  {team.members?.length || 0} membros
                </span>
                <button className="text-xs text-[#1B998B] hover:text-[#17836F] flex items-center">
                  <UserPlus className="w-3 h-3 mr-1" />
                  Adicionar
                </button>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto">
                {team.members?.map((member, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 px-3 bg-[#1E1E1E] rounded">
                    <div>
                      <div className="text-sm font-medium">{member.user?.name}</div>
                      <div className="text-xs text-gray-400">{member.user?.email}</div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      member.role === 'owner' ? 'bg-yellow-500/20 text-yellow-400' :
                      member.role === 'admin' ? 'bg-purple-500/20 text-purple-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {member.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {teams.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-400">
          Nenhuma equipe encontrada
        </div>
      )}
    </div>
  );
};

export default TeamsTab;
