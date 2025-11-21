import React, { useState, useEffect } from 'react';
import { FileText, Filter, Download, Calendar, User, Activity } from 'lucide-react';

interface AuditLog {
  id: string;
  user_email: string;
  action: string;
  resource: string;
  resource_id?: string;
  status: string;
  ip_address?: string;
  created_at: string;
}

const AuditTab: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    action: '',
    resource: '',
    status: '',
  });

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      // Mock data
      setLogs([
        {
          id: '1',
          user_email: 'admin@platifyx.com',
          action: 'user.login',
          resource: 'user',
          resource_id: '1',
          status: 'success',
          ip_address: '192.168.1.100',
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          user_email: 'admin@platifyx.com',
          action: 'user.create',
          resource: 'user',
          resource_id: '5',
          status: 'success',
          ip_address: '192.168.1.100',
          created_at: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: '3',
          user_email: 'developer@platifyx.com',
          action: 'user.login',
          resource: 'user',
          resource_id: '2',
          status: 'success',
          ip_address: '192.168.1.101',
          created_at: new Date(Date.now() - 7200000).toISOString(),
        },
        {
          id: '4',
          user_email: 'developer@platifyx.com',
          action: 'role.update',
          resource: 'role',
          resource_id: '3',
          status: 'success',
          ip_address: '192.168.1.101',
          created_at: new Date(Date.now() - 10800000).toISOString(),
        },
        {
          id: '5',
          user_email: 'admin@platifyx.com',
          action: 'user.delete',
          resource: 'user',
          resource_id: '4',
          status: 'failure',
          ip_address: '192.168.1.100',
          created_at: new Date(Date.now() - 14400000).toISOString(),
        },
      ]);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes('create')) return 'text-green-400';
    if (action.includes('update')) return 'text-blue-400';
    if (action.includes('delete')) return 'text-red-400';
    if (action.includes('login')) return 'text-purple-400';
    return 'text-gray-400';
  };

  const getActionIcon = (action: string) => {
    return <Activity className="w-4 h-4" />;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 60) return `${minutes} minutos atrás`;
    if (hours < 24) return `${hours} horas atrás`;
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-1">Log de Auditoria</h2>
          <p className="text-gray-400">
            Histórico de ações e atividades do sistema
          </p>
        </div>
        <button className="flex items-center space-x-2 px-4 py-2 bg-[#1B998B] text-white rounded-lg hover:bg-[#17836F] transition-colors">
          <Download className="w-4 h-4" />
          <span>Exportar</span>
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Ação</label>
          <select
            value={filter.action}
            onChange={(e) => setFilter({ ...filter, action: e.target.value })}
            className="w-full bg-[#2A2A2A] border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#1B998B]"
          >
            <option value="">Todas</option>
            <option value="login">Login</option>
            <option value="create">Criar</option>
            <option value="update">Atualizar</option>
            <option value="delete">Deletar</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Recurso</label>
          <select
            value={filter.resource}
            onChange={(e) => setFilter({ ...filter, resource: e.target.value })}
            className="w-full bg-[#2A2A2A] border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#1B998B]"
          >
            <option value="">Todos</option>
            <option value="user">Usuário</option>
            <option value="role">Role</option>
            <option value="team">Equipe</option>
            <option value="sso">SSO</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Status</label>
          <select
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            className="w-full bg-[#2A2A2A] border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#1B998B]"
          >
            <option value="">Todos</option>
            <option value="success">Sucesso</option>
            <option value="failure">Falha</option>
          </select>
        </div>
        <div className="flex items-end">
          <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-[#3A3A3A] text-white rounded-lg hover:bg-[#4A4A4A] transition-colors">
            <Filter className="w-4 h-4" />
            <span>Filtrar</span>
          </button>
        </div>
      </div>

      {/* Logs Timeline */}
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B998B]"></div>
          <p className="text-gray-400 mt-2">Carregando logs...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <div
              key={log.id}
              className="bg-[#2A2A2A] border border-gray-700 rounded-lg p-4 hover:border-[#1B998B] transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className={`p-2 rounded-lg ${
                    log.status === 'success' ? 'bg-green-500/20' : 'bg-red-500/20'
                  }`}>
                    <div className={getActionColor(log.action)}>
                      {getActionIcon(log.action)}
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-1">
                      <span className={`font-semibold ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                      <span className="text-sm text-gray-400">•</span>
                      <span className="text-sm text-gray-400">{log.resource}</span>
                      {log.status === 'success' ? (
                        <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">
                          Sucesso
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs">
                          Falha
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <span className="flex items-center">
                        <User className="w-3 h-3 mr-1" />
                        {log.user_email}
                      </span>
                      {log.ip_address && (
                        <span>{log.ip_address}</span>
                      )}
                      <span className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {formatDate(log.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {logs.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-400">
          Nenhum log de auditoria encontrado
        </div>
      )}
    </div>
  );
};

export default AuditTab;
