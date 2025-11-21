import React, { useState, useEffect } from 'react';
import { Shield, Plus, Edit2, Trash2, Lock } from 'lucide-react';

interface Permission {
  id: string;
  resource: string;
  action: string;
  description?: string;
}

interface Role {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  is_system: boolean;
  permissions?: Permission[];
}

const RolesTab: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  const fetchRoles = async () => {
    try {
      // Mock data
      setRoles([
        {
          id: '1',
          name: 'admin',
          display_name: 'Administrator',
          description: 'Full system access',
          is_system: true,
          permissions: [],
        },
        {
          id: '2',
          name: 'developer',
          display_name: 'Developer',
          description: 'Development resources access',
          is_system: true,
          permissions: [],
        },
        {
          id: '3',
          name: 'viewer',
          display_name: 'Viewer',
          description: 'Read-only access',
          is_system: true,
          permissions: [],
        },
      ]);
    } catch (error) {
      console.error('Error fetching roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      // Mock data
      setPermissions([
        { id: '1', resource: 'users', action: 'read', description: 'View users' },
        { id: '2', resource: 'users', action: 'write', description: 'Create and update users' },
        { id: '3', resource: 'users', action: 'delete', description: 'Delete users' },
        { id: '4', resource: 'teams', action: 'read', description: 'View teams' },
        { id: '5', resource: 'teams', action: 'write', description: 'Create and update teams' },
        { id: '6', resource: 'services', action: 'read', description: 'View services' },
        { id: '7', resource: 'services', action: 'write', description: 'Modify services' },
        { id: '8', resource: 'kubernetes', action: 'read', description: 'View Kubernetes resources' },
        { id: '9', resource: 'kubernetes', action: 'write', description: 'Modify Kubernetes resources' },
      ]);
    } catch (error) {
      console.error('Error fetching permissions:', error);
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

  const handleDeleteRole = async (roleId: string, isSystem: boolean) => {
    if (isSystem) {
      alert('Roles do sistema não podem ser deletados');
      return;
    }
    if (!confirm('Tem certeza que deseja deletar este role?')) return;

    try {
      setRoles(roles.filter(r => r.id !== roleId));
    } catch (error) {
      console.error('Error deleting role:', error);
    }
  };

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Roles Section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Roles</h2>
            <button className="flex items-center space-x-2 px-3 py-2 bg-[#1B998B] text-white rounded-lg hover:bg-[#17836F] transition-colors text-sm">
              <Plus className="w-4 h-4" />
              <span>Novo Role</span>
            </button>
          </div>

          <div className="space-y-3">
            {roles.map((role) => (
              <div
                key={role.id}
                className="bg-[#2A2A2A] border border-gray-700 rounded-lg p-4 hover:border-[#1B998B] transition-colors cursor-pointer"
                onClick={() => setSelectedRole(role)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <Shield className="w-5 h-5 text-[#1B998B]" />
                      <h3 className="font-semibold">{role.display_name}</h3>
                      {role.is_system && (
                        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs">
                          Sistema
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 mt-1">{role.description}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {role.permissions?.length || 0} permissões
                    </p>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRole(role);
                      }}
                      className="p-1 hover:bg-[#3A3A3A] rounded transition-colors"
                    >
                      <Edit2 className="w-4 h-4 text-[#1B998B]" />
                    </button>
                    {!role.is_system && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRole(role.id, role.is_system);
                        }}
                        className="p-1 hover:bg-[#3A3A3A] rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Permissions Section */}
        <div>
          <h2 className="text-xl font-bold mb-4">Permissões Disponíveis</h2>
          <div className="space-y-4">
            {Object.entries(groupPermissionsByResource()).map(([resource, perms]) => (
              <div key={resource} className="bg-[#2A2A2A] border border-gray-700 rounded-lg p-4">
                <h3 className="font-semibold text-[#1B998B] mb-2 flex items-center">
                  <Lock className="w-4 h-4 mr-2" />
                  {resource.charAt(0).toUpperCase() + resource.slice(1)}
                </h3>
                <div className="space-y-1">
                  {perms.map(perm => (
                    <div key={perm.id} className="flex items-center justify-between text-sm py-1">
                      <span className="text-gray-300">{perm.action}</span>
                      <span className="text-gray-500 text-xs">{perm.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Selected Role Detail Modal */}
      {selectedRole && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1E1E1E] border border-gray-700 rounded-lg p-6 max-w-2xl w-full mx-4">
            <h3 className="text-xl font-bold mb-4">{selectedRole.display_name}</h3>
            <p className="text-gray-400 mb-4">
              Gerenciamento de permissões (em desenvolvimento)
            </p>
            <button
              onClick={() => setSelectedRole(null)}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RolesTab;
