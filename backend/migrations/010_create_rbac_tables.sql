-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255),
    avatar_url VARCHAR(500),
    provider VARCHAR(50), -- google, microsoft, local
    provider_id VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT false, -- system roles cannot be deleted
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    resource VARCHAR(100) NOT NULL, -- e.g., 'users', 'services', 'integrations'
    action VARCHAR(50) NOT NULL,    -- e.g., 'create', 'read', 'update', 'delete'
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(resource, action)
);

-- Create role_permissions junction table
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id, permission_id)
);

-- Create user_roles junction table
CREATE TABLE IF NOT EXISTS user_roles (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by INTEGER REFERENCES users(id),
    PRIMARY KEY (user_id, role_id)
);

-- Create audit_logs table for tracking permission changes
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    resource_id INTEGER,
    details JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_provider ON users(provider, provider_id);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);
CREATE INDEX IF NOT EXISTS idx_permissions_resource ON permissions(resource);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource);

-- Insert default system roles
INSERT INTO roles (name, display_name, description, is_system) VALUES
    ('admin', 'Administrador', 'Acesso total ao sistema', true),
    ('developer', 'Desenvolvedor', 'Acesso a recursos de desenvolvimento', true),
    ('viewer', 'Visualizador', 'Somente leitura', true),
    ('devops', 'DevOps', 'Acesso a recursos de infraestrutura e CI/CD', true)
ON CONFLICT (name) DO NOTHING;

-- Insert default permissions
INSERT INTO permissions (resource, action, description) VALUES
    -- Users management
    ('users', 'create', 'Criar novos usuários'),
    ('users', 'read', 'Visualizar usuários'),
    ('users', 'update', 'Atualizar usuários'),
    ('users', 'delete', 'Deletar usuários'),

    -- Roles management
    ('roles', 'create', 'Criar novos perfis'),
    ('roles', 'read', 'Visualizar perfis'),
    ('roles', 'update', 'Atualizar perfis'),
    ('roles', 'delete', 'Deletar perfis'),

    -- Permissions management
    ('permissions', 'read', 'Visualizar permissões'),
    ('permissions', 'assign', 'Atribuir permissões'),

    -- Services
    ('services', 'create', 'Criar serviços'),
    ('services', 'read', 'Visualizar serviços'),
    ('services', 'update', 'Atualizar serviços'),
    ('services', 'delete', 'Deletar serviços'),

    -- Integrations
    ('integrations', 'create', 'Criar integrações'),
    ('integrations', 'read', 'Visualizar integrações'),
    ('integrations', 'update', 'Atualizar integrações'),
    ('integrations', 'delete', 'Deletar integrações'),

    -- Templates
    ('templates', 'create', 'Criar templates'),
    ('templates', 'read', 'Visualizar templates'),
    ('templates', 'update', 'Atualizar templates'),
    ('templates', 'delete', 'Deletar templates'),

    -- CI/CD
    ('ci', 'read', 'Visualizar pipelines CI/CD'),
    ('ci', 'trigger', 'Executar pipelines'),
    ('ci', 'approve', 'Aprovar releases'),

    -- Infrastructure
    ('kubernetes', 'read', 'Visualizar recursos Kubernetes'),
    ('kubernetes', 'update', 'Atualizar recursos Kubernetes'),
    ('kubernetes', 'delete', 'Deletar recursos Kubernetes'),

    -- Settings
    ('settings', 'read', 'Visualizar configurações'),
    ('settings', 'update', 'Atualizar configurações'),

    -- Audit logs
    ('audit', 'read', 'Visualizar logs de auditoria')
ON CONFLICT (resource, action) DO NOTHING;

-- Assign permissions to admin role (all permissions)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin'
ON CONFLICT DO NOTHING;

-- Assign permissions to developer role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'developer'
  AND p.resource IN ('services', 'templates', 'ci', 'kubernetes')
ON CONFLICT DO NOTHING;

-- Assign permissions to viewer role (read-only)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'viewer'
  AND p.action = 'read'
ON CONFLICT DO NOTHING;

-- Assign permissions to devops role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'devops'
  AND (
    p.resource IN ('kubernetes', 'ci', 'integrations', 'services') OR
    (p.resource = 'settings' AND p.action = 'read')
  )
ON CONFLICT DO NOTHING;

-- Add comments
COMMENT ON TABLE users IS 'Sistema de usuários para autenticação e autorização';
COMMENT ON TABLE roles IS 'Perfis/papéis que agrupam permissões';
COMMENT ON TABLE permissions IS 'Permissões granulares do sistema';
COMMENT ON TABLE role_permissions IS 'Relacionamento entre roles e permissões';
COMMENT ON TABLE user_roles IS 'Relacionamento entre usuários e roles';
COMMENT ON TABLE audit_logs IS 'Logs de auditoria de ações no sistema';
