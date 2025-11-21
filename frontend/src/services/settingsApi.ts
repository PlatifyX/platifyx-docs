import { apiFetch, API_CONFIG } from '../config/api';

// Types
export interface User {
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

export interface Role {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  is_system: boolean;
  permissions?: Permission[];
}

export interface Permission {
  id: string;
  resource: string;
  action: string;
  name?: string; // Adicionado para compatibilidade
  display_name?: string; // Nome amigável para exibição
  description?: string;
}

export interface Team {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  members?: TeamMember[];
}

export interface TeamMember {
  user_id: string;
  role: string;
  user?: {
    name: string;
    email: string;
  };
}

export interface SSOConfig {
  id?: string;
  provider: string;
  enabled: boolean;
  client_id: string;
  client_secret?: string;
  tenant_id?: string;
  redirect_uri: string;
  allowed_domains?: string[];
}

export interface AuditLog {
  id: string;
  user_email: string;
  action: string;
  resource: string;
  resource_id?: string;
  status: string;
  ip_address?: string;
  created_at: string;
}

// API Functions

// Users
export const fetchUsers = async (params?: {
  search?: string;
  is_active?: boolean;
  is_sso?: boolean;
  role_id?: string;
  team_id?: string;
  page?: number;
  size?: number;
}): Promise<{ users: User[]; total: number; page: number; size: number }> => {
  const queryParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
  }

  const response = await apiFetch(`settings/users?${queryParams.toString()}`);
  return response.json();
};

export const fetchUserById = async (id: string): Promise<User> => {
  const response = await apiFetch(`settings/users/${id}`);
  return response.json();
};

export const createUser = async (data: {
  email: string;
  name: string;
  password?: string;
  is_sso?: boolean;
  role_ids?: string[];
  team_ids?: string[];
}): Promise<User> => {
  const response = await apiFetch('settings/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
};

export const updateUser = async (id: string, data: {
  name?: string;
  avatar_url?: string;
  is_active?: boolean;
  role_ids?: string[];
  team_ids?: string[];
}): Promise<User> => {
  const response = await apiFetch(`settings/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
};

export const deleteUser = async (id: string): Promise<void> => {
  await apiFetch(`settings/users/${id}`, { method: 'DELETE' });
};

// Roles
export const fetchRoles = async (): Promise<{ roles: Role[]; total: number }> => {
  const response = await apiFetch('settings/roles');
  return response.json();
};

export const fetchRoleById = async (id: string): Promise<Role> => {
  const response = await apiFetch(`settings/roles/${id}`);
  return response.json();
};

export const createRole = async (data: {
  name: string;
  display_name: string;
  description?: string;
  permission_ids?: string[];
}): Promise<Role> => {
  const response = await apiFetch('settings/roles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
};

export const updateRole = async (id: string, data: {
  display_name?: string;
  description?: string;
  permission_ids?: string[];
}): Promise<Role> => {
  const response = await apiFetch(`settings/roles/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
};

export const deleteRole = async (id: string): Promise<void> => {
  await apiFetch(`settings/roles/${id}`, { method: 'DELETE' });
};

// Permissions
export const fetchPermissions = async (): Promise<{ permissions: Permission[]; total: number }> => {
  const response = await apiFetch('settings/permissions');
  return response.json();
};

// Teams
export const fetchTeams = async (params?: {
  search?: string;
  page?: number;
  size?: number;
}): Promise<{ teams: Team[]; total: number }> => {
  const queryParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
  }

  const response = await apiFetch(`settings/teams?${queryParams.toString()}`);
  return response.json();
};

export const fetchTeamById = async (id: string): Promise<Team> => {
  const response = await apiFetch(`settings/teams/${id}`);
  return response.json();
};

export const createTeam = async (data: {
  name: string;
  display_name: string;
  description?: string;
  avatar_url?: string;
  member_ids?: string[];
}): Promise<Team> => {
  const response = await apiFetch('settings/teams', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
};

export const updateTeam = async (id: string, data: {
  display_name?: string;
  description?: string;
  avatar_url?: string;
}): Promise<Team> => {
  const response = await apiFetch(`settings/teams/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
};

export const deleteTeam = async (id: string): Promise<void> => {
  await apiFetch(`settings/teams/${id}`, { method: 'DELETE' });
};

export const addTeamMember = async (teamId: string, data: {
  user_ids: string[];
  role?: string;
}): Promise<void> => {
  await apiFetch(`settings/teams/${teamId}/members`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
};

export const removeTeamMember = async (teamId: string, userId: string): Promise<void> => {
  await apiFetch(`settings/teams/${teamId}/members/${userId}`, { method: 'DELETE' });
};

// SSO
export const fetchSSOConfigs = async (): Promise<{ configs: SSOConfig[]; total: number }> => {
  const response = await apiFetch('settings/sso');
  return response.json();
};

export const fetchSSOConfig = async (provider: string): Promise<SSOConfig> => {
  const response = await apiFetch(`settings/sso/${provider}`);
  return response.json();
};

export const createOrUpdateSSOConfig = async (data: {
  provider: string;
  enabled: boolean;
  client_id: string;
  client_secret: string;
  tenant_id?: string;
  redirect_uri: string;
  allowed_domains?: string[];
}): Promise<SSOConfig> => {
  const response = await apiFetch('settings/sso', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
};

export const deleteSSOConfig = async (provider: string): Promise<void> => {
  await apiFetch(`settings/sso/${provider}`, { method: 'DELETE' });
};

// Audit
export const fetchAuditLogs = async (params?: {
  user_id?: string;
  user_email?: string;
  action?: string;
  resource?: string;
  resource_id?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  size?: number;
}): Promise<{ logs: AuditLog[]; total: number; page: number; size: number }> => {
  const queryParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
  }

  const response = await apiFetch(`settings/audit?${queryParams.toString()}`);
  return response.json();
};

export const fetchAuditStats = async (params?: {
  start_date?: string;
  end_date?: string;
}): Promise<any> => {
  const queryParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
  }

  const response = await apiFetch(`settings/audit/stats?${queryParams.toString()}`);
  return response.json();
};

// Helper to build SSO redirect URI
export const buildSSORedirectUri = (provider: string): string => {
  return `${API_CONFIG.APP_URL}/auth/callback/${provider}`;
};

// Convenience aliases for consistency
export const getUsers = fetchUsers;
export const getUserById = fetchUserById;
export const getRoles = fetchRoles;
export const getRoleById = fetchRoleById;
export const getPermissions = fetchPermissions;
export const getTeams = fetchTeams;
export const getTeamById = fetchTeamById;
export const getSSOConfigs = fetchSSOConfigs;
export const getSSOConfig = fetchSSOConfig;
export const getAuditLogs = fetchAuditLogs;
export const getAuditStats = fetchAuditStats;
export const getUserStats = async (): Promise<any> => {
  const response = await apiFetch('settings/users/stats');
  return response.json();
};
