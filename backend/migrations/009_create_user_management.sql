-- Criação das tabelas para gerenciamento de usuários, equipes, permissões e auditoria

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    password_hash VARCHAR(255), -- NULL para SSO users
    is_active BOOLEAN DEFAULT true,
    is_sso BOOLEAN DEFAULT false,
    sso_provider VARCHAR(50), -- 'google', 'microsoft', etc.
    sso_id VARCHAR(255), -- ID do provedor SSO
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_sso_user UNIQUE (sso_provider, sso_id)
);

-- Tabela de Roles (Papéis/Perfis)
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT false, -- Roles do sistema não podem ser deletados
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Permissões
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource VARCHAR(100) NOT NULL, -- ex: 'users', 'teams', 'services', 'kubernetes'
    action VARCHAR(50) NOT NULL, -- ex: 'read', 'write', 'delete', 'manage'
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_permission UNIQUE (resource, action)
);

-- Tabela de Equipes
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Relacionamento Role-Permission
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID NOT NULL,
    permission_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id, permission_id)
);

-- Tabela de Relacionamento User-Role
CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID NOT NULL,
    role_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id)
);

-- Tabela de Relacionamento User-Team
CREATE TABLE IF NOT EXISTS user_teams (
    user_id UUID NOT NULL,
    team_id UUID NOT NULL,
    role VARCHAR(50) DEFAULT 'member', -- 'owner', 'admin', 'member'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, team_id)
);

-- Adicionar Foreign Keys (após todas as tabelas serem criadas)
DO $$
BEGIN
    -- role_permissions foreign keys
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'role_permissions_role_id_fkey') THEN
        ALTER TABLE role_permissions ADD CONSTRAINT role_permissions_role_id_fkey
            FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'role_permissions_permission_id_fkey') THEN
        ALTER TABLE role_permissions ADD CONSTRAINT role_permissions_permission_id_fkey
            FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE;
    END IF;

    -- user_roles foreign keys
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_roles_user_id_fkey') THEN
        ALTER TABLE user_roles ADD CONSTRAINT user_roles_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_roles_role_id_fkey') THEN
        ALTER TABLE user_roles ADD CONSTRAINT user_roles_role_id_fkey
            FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE;
    END IF;

    -- user_teams foreign keys
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_teams_user_id_fkey') THEN
        ALTER TABLE user_teams ADD CONSTRAINT user_teams_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_teams_team_id_fkey') THEN
        ALTER TABLE user_teams ADD CONSTRAINT user_teams_team_id_fkey
            FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Tabela de Configuração de SSO
CREATE TABLE IF NOT EXISTS sso_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider VARCHAR(50) NOT NULL UNIQUE, -- 'google', 'microsoft'
    enabled BOOLEAN DEFAULT false,
    client_id VARCHAR(255) NOT NULL,
    client_secret VARCHAR(255) NOT NULL,
    tenant_id VARCHAR(255), -- Para Microsoft/Azure AD
    redirect_uri VARCHAR(255) NOT NULL,
    allowed_domains TEXT, -- JSON array de domínios permitidos
    config JSONB, -- Configurações adicionais
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Auditoria
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_email VARCHAR(255),
    action VARCHAR(100) NOT NULL, -- ex: 'user.create', 'user.update', 'role.delete'
    resource VARCHAR(100) NOT NULL, -- ex: 'user', 'team', 'role'
    resource_id VARCHAR(255), -- ID do recurso afetado
    details JSONB, -- Detalhes adicionais da ação
    ip_address VARCHAR(45),
    user_agent TEXT,
    status VARCHAR(20) DEFAULT 'success', -- 'success', 'failure'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Sessões
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL UNIQUE,
    refresh_token VARCHAR(500),
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhor performance

-- Usuários
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_sso_provider ON users(sso_provider) WHERE sso_provider IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login_at DESC NULLS LAST);

-- Roles
CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);
CREATE INDEX IF NOT EXISTS idx_roles_is_system ON roles(is_system);

-- Permissões
CREATE INDEX IF NOT EXISTS idx_permissions_resource ON permissions(resource);
CREATE INDEX IF NOT EXISTS idx_permissions_action ON permissions(action);

-- Teams
CREATE INDEX IF NOT EXISTS idx_teams_name ON teams(name);

-- Relacionamentos
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_teams_user ON user_teams(user_id);
CREATE INDEX IF NOT EXISTS idx_user_teams_team ON user_teams(team_id);
CREATE INDEX IF NOT EXISTS idx_user_teams_role ON user_teams(role);

-- SSO
CREATE INDEX IF NOT EXISTS idx_sso_configs_provider ON sso_configs(provider);
CREATE INDEX IF NOT EXISTS idx_sso_configs_enabled ON sso_configs(enabled) WHERE enabled = true;

-- Auditoria
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_email ON audit_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_id ON audit_logs(resource_id) WHERE resource_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_logs_status ON audit_logs(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_composite ON audit_logs(resource, action, created_at DESC);

-- Sessões
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON sessions(user_id, expires_at) WHERE expires_at > CURRENT_TIMESTAMP;

-- Adicionar check constraints para validações
ALTER TABLE users ADD CONSTRAINT check_email_format
    CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE users ADD CONSTRAINT check_name_not_empty
    CHECK (LENGTH(TRIM(name)) > 0);

ALTER TABLE roles ADD CONSTRAINT check_role_name_not_empty
    CHECK (LENGTH(TRIM(name)) > 0);

ALTER TABLE roles ADD CONSTRAINT check_role_display_name_not_empty
    CHECK (LENGTH(TRIM(display_name)) > 0);

ALTER TABLE teams ADD CONSTRAINT check_team_name_not_empty
    CHECK (LENGTH(TRIM(name)) > 0);

ALTER TABLE teams ADD CONSTRAINT check_team_display_name_not_empty
    CHECK (LENGTH(TRIM(display_name)) > 0);

-- Nota: Roles e permissões padrão foram movidos para migration 010_seed_roles_permissions.sql
-- para melhor organização e evitar duplicação de lógica
