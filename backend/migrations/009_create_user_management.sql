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

-- Tabela de Relacionamento Role-Permission
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id, permission_id)
);

-- Tabela de Relacionamento User-Role
CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id)
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

-- Tabela de Relacionamento User-Team
CREATE TABLE IF NOT EXISTS user_teams (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member', -- 'owner', 'admin', 'member'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, team_id)
);

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
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_sso_provider ON users(sso_provider);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- Inserir roles padrão do sistema
INSERT INTO roles (name, display_name, description, is_system) VALUES
    ('admin', 'Administrator', 'Full system access with all permissions', true),
    ('developer', 'Developer', 'Access to development resources and tools', true),
    ('viewer', 'Viewer', 'Read-only access to resources', true),
    ('platform-engineer', 'Platform Engineer', 'Access to infrastructure and platform resources', true)
ON CONFLICT (name) DO NOTHING;

-- Inserir permissões padrão
INSERT INTO permissions (resource, action, description) VALUES
    -- Usuários
    ('users', 'read', 'View users'),
    ('users', 'write', 'Create and update users'),
    ('users', 'delete', 'Delete users'),
    ('users', 'manage', 'Full user management including roles and permissions'),

    -- Equipes
    ('teams', 'read', 'View teams'),
    ('teams', 'write', 'Create and update teams'),
    ('teams', 'delete', 'Delete teams'),
    ('teams', 'manage', 'Full team management'),

    -- Roles/Permissões
    ('roles', 'read', 'View roles and permissions'),
    ('roles', 'write', 'Create and update roles'),
    ('roles', 'delete', 'Delete roles'),
    ('roles', 'manage', 'Full role and permission management'),

    -- SSO
    ('sso', 'read', 'View SSO configuration'),
    ('sso', 'write', 'Configure SSO providers'),
    ('sso', 'manage', 'Full SSO management'),

    -- Auditoria
    ('audit', 'read', 'View audit logs'),
    ('audit', 'export', 'Export audit logs'),

    -- Serviços
    ('services', 'read', 'View services'),
    ('services', 'write', 'Create and update services'),
    ('services', 'delete', 'Delete services'),

    -- Kubernetes
    ('kubernetes', 'read', 'View Kubernetes resources'),
    ('kubernetes', 'write', 'Modify Kubernetes resources'),
    ('kubernetes', 'delete', 'Delete Kubernetes resources'),

    -- Integrações
    ('integrations', 'read', 'View integrations'),
    ('integrations', 'write', 'Create and update integrations'),
    ('integrations', 'delete', 'Delete integrations'),
    ('integrations', 'manage', 'Full integration management'),

    -- Métricas e Observabilidade
    ('observability', 'read', 'View metrics and dashboards'),
    ('observability', 'write', 'Configure monitoring and alerts'),

    -- CI/CD
    ('cicd', 'read', 'View CI/CD pipelines and builds'),
    ('cicd', 'write', 'Trigger and modify pipelines'),

    -- FinOps
    ('finops', 'read', 'View cost and billing information'),
    ('finops', 'write', 'Manage cost allocation and budgets')
ON CONFLICT (resource, action) DO NOTHING;

-- Associar permissões aos roles padrão

-- Admin: todas as permissões
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'admin'
ON CONFLICT DO NOTHING;

-- Developer: permissões de leitura e escrita (exceto usuários, roles e SSO)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'developer'
  AND p.resource IN ('services', 'kubernetes', 'integrations', 'observability', 'cicd', 'finops', 'teams')
  AND p.action IN ('read', 'write')
ON CONFLICT DO NOTHING;

-- Developer: leitura de audit
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'developer'
  AND p.resource = 'audit'
  AND p.action = 'read'
ON CONFLICT DO NOTHING;

-- Viewer: apenas leitura
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'viewer'
  AND p.action = 'read'
ON CONFLICT DO NOTHING;

-- Platform Engineer: permissões de infraestrutura e plataforma
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'platform-engineer'
  AND p.resource IN ('services', 'kubernetes', 'integrations', 'observability', 'cicd', 'teams')
ON CONFLICT DO NOTHING;

-- Platform Engineer: leitura de audit e finops
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'platform-engineer'
  AND p.resource IN ('audit', 'finops')
  AND p.action = 'read'
ON CONFLICT DO NOTHING;
