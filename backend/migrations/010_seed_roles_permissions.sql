-- Seed de roles padrão e permissões
-- Este arquivo popula o banco com roles e permissões iniciais

-- Adicionar coluna display_name na tabela de permissões se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'permissions' AND column_name = 'display_name') THEN
        ALTER TABLE permissions ADD COLUMN display_name VARCHAR(255);
    END IF;
END $$;

-- Adicionar coluna name na tabela de permissões se não existir (para compatibilidade)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'permissions' AND column_name = 'name') THEN
        ALTER TABLE permissions ADD COLUMN name VARCHAR(255);
    END IF;
END $$;

-- Inserir permissões básicas (se não existirem)
INSERT INTO permissions (resource, action, name, display_name, description, created_at)
VALUES
    -- User permissions
    ('users', 'view', 'users.view', 'Visualizar Usuários', 'View user list and details', NOW()),
    ('users', 'create', 'users.create', 'Criar Usuários', 'Create new users', NOW()),
    ('users', 'update', 'users.update', 'Atualizar Usuários', 'Update user information', NOW()),
    ('users', 'delete', 'users.delete', 'Deletar Usuários', 'Delete users', NOW()),
    ('users', 'manage_roles', 'users.manage_roles', 'Gerenciar Roles de Usuários', 'Assign or remove roles from users', NOW()),

    -- Role permissions
    ('roles', 'view', 'roles.view', 'Visualizar Roles', 'View role list and details', NOW()),
    ('roles', 'create', 'roles.create', 'Criar Roles', 'Create new roles', NOW()),
    ('roles', 'update', 'roles.update', 'Atualizar Roles', 'Update role information', NOW()),
    ('roles', 'delete', 'roles.delete', 'Deletar Roles', 'Delete roles', NOW()),
    ('roles', 'manage_permissions', 'roles.manage_permissions', 'Gerenciar Permissões', 'Assign or remove permissions from roles', NOW()),

    -- Team permissions
    ('teams', 'view', 'teams.view', 'Visualizar Equipes', 'View team list and details', NOW()),
    ('teams', 'create', 'teams.create', 'Criar Equipes', 'Create new teams', NOW()),
    ('teams', 'update', 'teams.update', 'Atualizar Equipes', 'Update team information', NOW()),
    ('teams', 'delete', 'teams.delete', 'Deletar Equipes', 'Delete teams', NOW()),
    ('teams', 'manage_members', 'teams.manage_members', 'Gerenciar Membros', 'Add or remove team members', NOW()),

    -- SSO permissions
    ('sso', 'view', 'sso.view', 'Visualizar SSO', 'View SSO configuration', NOW()),
    ('sso', 'manage', 'sso.manage', 'Gerenciar SSO', 'Create, update or delete SSO configurations', NOW()),

    -- Audit permissions
    ('audit', 'view', 'audit.view', 'Visualizar Auditoria', 'View audit logs and statistics', NOW()),

    -- Project permissions
    ('projects', 'view', 'projects.view', 'Visualizar Projetos', 'View project list and details', NOW()),
    ('projects', 'create', 'projects.create', 'Criar Projetos', 'Create new projects', NOW()),
    ('projects', 'update', 'projects.update', 'Atualizar Projetos', 'Update project information', NOW()),
    ('projects', 'delete', 'projects.delete', 'Deletar Projetos', 'Delete projects', NOW()),

    -- Pipeline permissions
    ('pipelines', 'view', 'pipelines.view', 'Visualizar Pipelines', 'View pipeline list and details', NOW()),
    ('pipelines', 'create', 'pipelines.create', 'Criar Pipelines', 'Create new pipelines', NOW()),
    ('pipelines', 'update', 'pipelines.update', 'Atualizar Pipelines', 'Update pipeline configuration', NOW()),
    ('pipelines', 'delete', 'pipelines.delete', 'Deletar Pipelines', 'Delete pipelines', NOW()),
    ('pipelines', 'execute', 'pipelines.execute', 'Executar Pipelines', 'Run pipelines manually', NOW()),

    -- Environment permissions
    ('environments', 'view', 'environments.view', 'Visualizar Ambientes', 'View environment list and details', NOW()),
    ('environments', 'create', 'environments.create', 'Criar Ambientes', 'Create new environments', NOW()),
    ('environments', 'update', 'environments.update', 'Atualizar Ambientes', 'Update environment configuration', NOW()),
    ('environments', 'delete', 'environments.delete', 'Deletar Ambientes', 'Delete environments', NOW()),

    -- Deployment permissions
    ('deployments', 'view', 'deployments.view', 'Visualizar Deployments', 'View deployment history', NOW()),
    ('deployments', 'create', 'deployments.create', 'Criar Deployments', 'Trigger new deployments', NOW()),
    ('deployments', 'approve', 'deployments.approve', 'Aprovar Deployments', 'Approve deployment requests', NOW()),
    ('deployments', 'rollback', 'deployments.rollback', 'Reverter Deployments', 'Rollback deployments', NOW()),

    -- Settings permissions
    ('settings', 'view', 'settings.view', 'Visualizar Configurações', 'View system settings', NOW()),
    ('settings', 'manage', 'settings.manage', 'Gerenciar Configurações', 'Update system settings', NOW())
ON CONFLICT (resource, action) DO UPDATE SET
    name = EXCLUDED.name,
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description;

-- Inserir roles padrão
INSERT INTO roles (name, display_name, description, is_system, created_at, updated_at)
VALUES
    ('admin', 'Administrator', 'Full system access with all permissions', true, NOW(), NOW()),
    ('platform_engineer', 'Platform Engineer', 'Manage infrastructure, pipelines, and environments', true, NOW(), NOW()),
    ('developer', 'Developer', 'Create and manage projects, view deployments', true, NOW(), NOW()),
    ('viewer', 'Viewer', 'Read-only access to projects and deployments', true, NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Atribuir todas as permissões ao Admin
DO $$
DECLARE
    admin_role_id UUID;
    perm RECORD;
BEGIN
    -- Buscar ID do role admin
    SELECT id INTO admin_role_id FROM roles WHERE name = 'admin';

    IF admin_role_id IS NOT NULL THEN
        -- Atribuir todas as permissões
        FOR perm IN SELECT id FROM permissions
        LOOP
            INSERT INTO role_permissions (role_id, permission_id)
            VALUES (admin_role_id, perm.id)
            ON CONFLICT (role_id, permission_id) DO NOTHING;
        END LOOP;
    END IF;
END $$;

-- Atribuir permissões ao Platform Engineer
DO $$
DECLARE
    pe_role_id UUID;
    perm_id UUID;
BEGIN
    SELECT id INTO pe_role_id FROM roles WHERE name = 'platform_engineer';

    IF pe_role_id IS NOT NULL THEN
        -- Permissões de visualização (todas com action = 'view')
        FOR perm_id IN
            SELECT id FROM permissions
            WHERE action = 'view'
        LOOP
            INSERT INTO role_permissions (role_id, permission_id)
            VALUES (pe_role_id, perm_id)
            ON CONFLICT (role_id, permission_id) DO NOTHING;
        END LOOP;

        -- Permissões específicas por resource e action
        FOR perm_id IN
            SELECT id FROM permissions
            WHERE (resource = 'projects' AND action IN ('create', 'update'))
               OR (resource = 'pipelines' AND action IN ('create', 'update', 'execute'))
               OR (resource = 'environments' AND action IN ('create', 'update', 'delete'))
               OR (resource = 'deployments' AND action IN ('create', 'approve', 'rollback'))
               OR (resource = 'teams' AND action IN ('create', 'update', 'manage_members'))
        LOOP
            INSERT INTO role_permissions (role_id, permission_id)
            VALUES (pe_role_id, perm_id)
            ON CONFLICT (role_id, permission_id) DO NOTHING;
        END LOOP;
    END IF;
END $$;

-- Atribuir permissões ao Developer
DO $$
DECLARE
    dev_role_id UUID;
    perm_id UUID;
BEGIN
    SELECT id INTO dev_role_id FROM roles WHERE name = 'developer';

    IF dev_role_id IS NOT NULL THEN
        -- Permissões de visualização específicas
        FOR perm_id IN
            SELECT id FROM permissions
            WHERE action = 'view'
              AND resource IN ('projects', 'pipelines', 'environments', 'deployments', 'teams', 'users')
        LOOP
            INSERT INTO role_permissions (role_id, permission_id)
            VALUES (dev_role_id, perm_id)
            ON CONFLICT (role_id, permission_id) DO NOTHING;
        END LOOP;

        -- Permissões específicas
        FOR perm_id IN
            SELECT id FROM permissions
            WHERE (resource = 'projects' AND action IN ('create', 'update'))
               OR (resource = 'pipelines' AND action = 'execute')
               OR (resource = 'deployments' AND action = 'create')
        LOOP
            INSERT INTO role_permissions (role_id, permission_id)
            VALUES (dev_role_id, perm_id)
            ON CONFLICT (role_id, permission_id) DO NOTHING;
        END LOOP;
    END IF;
END $$;

-- Atribuir permissões ao Viewer
DO $$
DECLARE
    viewer_role_id UUID;
    perm_id UUID;
BEGIN
    SELECT id INTO viewer_role_id FROM roles WHERE name = 'viewer';

    IF viewer_role_id IS NOT NULL THEN
        -- Apenas permissões de visualização
        FOR perm_id IN
            SELECT id FROM permissions
            WHERE action = 'view'
        LOOP
            INSERT INTO role_permissions (role_id, permission_id)
            VALUES (viewer_role_id, perm_id)
            ON CONFLICT (role_id, permission_id) DO NOTHING;
        END LOOP;
    END IF;
END $$;

-- Criar usuário admin padrão (se não existir)
DO $$
DECLARE
    admin_user_id UUID;
    admin_role_id UUID;
BEGIN
    -- Verificar se já existe usuário admin
    SELECT id INTO admin_user_id FROM users WHERE email = 'admin@platifyx.com';

    IF admin_user_id IS NULL THEN
        -- Criar usuário admin
        -- Senha padrão: 'admin123' (hash bcrypt)
        -- IMPORTANTE: Alterar senha no primeiro login!
        INSERT INTO users (email, name, password_hash, is_active, is_sso, created_at, updated_at)
        VALUES (
            'admin@platifyx.com',
            'System Administrator',
            '$2a$10$rXZCqH3jN5X8TQKYGxJhVOj3vYr7.MqxZQGQxNXWxK5VzJ8YZJ8XK', -- admin123
            true,
            false,
            NOW(),
            NOW()
        )
        RETURNING id INTO admin_user_id;

        -- Atribuir role admin ao usuário
        SELECT id INTO admin_role_id FROM roles WHERE name = 'admin';

        IF admin_role_id IS NOT NULL THEN
            INSERT INTO user_roles (user_id, role_id, created_at)
            VALUES (admin_user_id, admin_role_id, NOW());
        END IF;
    END IF;
END $$;

-- Confirmar seed
SELECT 'Roles e permissões criados com sucesso!' AS status,
       (SELECT COUNT(*) FROM permissions) AS total_permissions,
       (SELECT COUNT(*) FROM roles) AS total_roles,
       (SELECT COUNT(*) FROM role_permissions) AS total_role_permissions;
