-- Seed de roles padrão e permissões
-- Este arquivo popula o banco com roles e permissões iniciais

-- Inserir permissões básicas (se não existirem)
INSERT INTO permissions (name, display_name, description, resource, action, created_at, updated_at)
VALUES
    -- User permissions
    ('users.view', 'View Users', 'View user list and details', 'users', 'view', NOW(), NOW()),
    ('users.create', 'Create Users', 'Create new users', 'users', 'create', NOW(), NOW()),
    ('users.update', 'Update Users', 'Update user information', 'users', 'update', NOW(), NOW()),
    ('users.delete', 'Delete Users', 'Delete users', 'users', 'delete', NOW(), NOW()),
    ('users.manage_roles', 'Manage User Roles', 'Assign or remove roles from users', 'users', 'manage_roles', NOW(), NOW()),

    -- Role permissions
    ('roles.view', 'View Roles', 'View role list and details', 'roles', 'view', NOW(), NOW()),
    ('roles.create', 'Create Roles', 'Create new roles', 'roles', 'create', NOW(), NOW()),
    ('roles.update', 'Update Roles', 'Update role information', 'roles', 'update', NOW(), NOW()),
    ('roles.delete', 'Delete Roles', 'Delete roles', 'roles', 'delete', NOW(), NOW()),
    ('roles.manage_permissions', 'Manage Permissions', 'Assign or remove permissions from roles', 'roles', 'manage_permissions', NOW(), NOW()),

    -- Team permissions
    ('teams.view', 'View Teams', 'View team list and details', 'teams', 'view', NOW(), NOW()),
    ('teams.create', 'Create Teams', 'Create new teams', 'teams', 'create', NOW(), NOW()),
    ('teams.update', 'Update Teams', 'Update team information', 'teams', 'update', NOW(), NOW()),
    ('teams.delete', 'Delete Teams', 'Delete teams', 'teams', 'delete', NOW(), NOW()),
    ('teams.manage_members', 'Manage Team Members', 'Add or remove team members', 'teams', 'manage_members', NOW(), NOW()),

    -- SSO permissions
    ('sso.view', 'View SSO Configs', 'View SSO configuration', 'sso', 'view', NOW(), NOW()),
    ('sso.manage', 'Manage SSO', 'Create, update or delete SSO configurations', 'sso', 'manage', NOW(), NOW()),

    -- Audit permissions
    ('audit.view', 'View Audit Logs', 'View audit logs and statistics', 'audit', 'view', NOW(), NOW()),

    -- Project permissions
    ('projects.view', 'View Projects', 'View project list and details', 'projects', 'view', NOW(), NOW()),
    ('projects.create', 'Create Projects', 'Create new projects', 'projects', 'create', NOW(), NOW()),
    ('projects.update', 'Update Projects', 'Update project information', 'projects', 'update', NOW(), NOW()),
    ('projects.delete', 'Delete Projects', 'Delete projects', 'projects', 'delete', NOW(), NOW()),

    -- Pipeline permissions
    ('pipelines.view', 'View Pipelines', 'View pipeline list and details', 'pipelines', 'view', NOW(), NOW()),
    ('pipelines.create', 'Create Pipelines', 'Create new pipelines', 'pipelines', 'create', NOW(), NOW()),
    ('pipelines.update', 'Update Pipelines', 'Update pipeline configuration', 'pipelines', 'update', NOW(), NOW()),
    ('pipelines.delete', 'Delete Pipelines', 'Delete pipelines', 'pipelines', 'delete', NOW(), NOW()),
    ('pipelines.execute', 'Execute Pipelines', 'Run pipelines manually', 'pipelines', 'execute', NOW(), NOW()),

    -- Environment permissions
    ('environments.view', 'View Environments', 'View environment list and details', 'environments', 'view', NOW(), NOW()),
    ('environments.create', 'Create Environments', 'Create new environments', 'environments', 'create', NOW(), NOW()),
    ('environments.update', 'Update Environments', 'Update environment configuration', 'environments', 'update', NOW(), NOW()),
    ('environments.delete', 'Delete Environments', 'Delete environments', 'environments', 'delete', NOW(), NOW()),

    -- Deployment permissions
    ('deployments.view', 'View Deployments', 'View deployment history', 'deployments', 'view', NOW(), NOW()),
    ('deployments.create', 'Create Deployments', 'Trigger new deployments', 'deployments', 'create', NOW(), NOW()),
    ('deployments.approve', 'Approve Deployments', 'Approve deployment requests', 'deployments', 'approve', NOW(), NOW()),
    ('deployments.rollback', 'Rollback Deployments', 'Rollback deployments', 'deployments', 'rollback', NOW(), NOW()),

    -- Settings permissions
    ('settings.view', 'View Settings', 'View system settings', 'settings', 'view', NOW(), NOW()),
    ('settings.manage', 'Manage Settings', 'Update system settings', 'settings', 'manage', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

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
        -- Permissões de visualização
        FOR perm_id IN
            SELECT id FROM permissions
            WHERE action = 'view'
        LOOP
            INSERT INTO role_permissions (role_id, permission_id)
            VALUES (pe_role_id, perm_id)
            ON CONFLICT (role_id, permission_id) DO NOTHING;
        END LOOP;

        -- Permissões específicas
        FOR perm_id IN
            SELECT id FROM permissions
            WHERE name IN (
                'projects.create', 'projects.update',
                'pipelines.create', 'pipelines.update', 'pipelines.execute',
                'environments.create', 'environments.update', 'environments.delete',
                'deployments.create', 'deployments.approve', 'deployments.rollback',
                'teams.create', 'teams.update', 'teams.manage_members'
            )
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
        -- Permissões de visualização
        FOR perm_id IN
            SELECT id FROM permissions
            WHERE action = 'view' AND resource IN ('projects', 'pipelines', 'environments', 'deployments', 'teams', 'users')
        LOOP
            INSERT INTO role_permissions (role_id, permission_id)
            VALUES (dev_role_id, perm_id)
            ON CONFLICT (role_id, permission_id) DO NOTHING;
        END LOOP;

        -- Permissões específicas
        FOR perm_id IN
            SELECT id FROM permissions
            WHERE name IN (
                'projects.create', 'projects.update',
                'pipelines.execute',
                'deployments.create'
            )
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
            INSERT INTO user_roles (user_id, role_id, assigned_at)
            VALUES (admin_user_id, admin_role_id, NOW());
        END IF;
    END IF;
END $$;

-- Confirmar seed
SELECT 'Roles e permissões criados com sucesso!' AS status,
       (SELECT COUNT(*) FROM permissions) AS total_permissions,
       (SELECT COUNT(*) FROM roles) AS total_roles,
       (SELECT COUNT(*) FROM role_permissions) AS total_role_permissions;
