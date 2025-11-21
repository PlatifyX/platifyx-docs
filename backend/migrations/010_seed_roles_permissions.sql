-- Seed de roles padrão e permissões
-- Este arquivo popula o banco com roles e permissões iniciais

-- Inserir permissões básicas (se não existirem)
INSERT INTO permissions (resource, action, description, created_at)
VALUES
    -- User permissions
    ('users', 'view', 'View user list and details', NOW()),
    ('users', 'create', 'Create new users', NOW()),
    ('users', 'update', 'Update user information', NOW()),
    ('users', 'delete', 'Delete users', NOW()),
    ('users', 'manage_roles', 'Assign or remove roles from users', NOW()),

    -- Role permissions
    ('roles', 'view', 'View role list and details', NOW()),
    ('roles', 'create', 'Create new roles', NOW()),
    ('roles', 'update', 'Update role information', NOW()),
    ('roles', 'delete', 'Delete roles', NOW()),
    ('roles', 'manage_permissions', 'Assign or remove permissions from roles', NOW()),

    -- Team permissions
    ('teams', 'view', 'View team list and details', NOW()),
    ('teams', 'create', 'Create new teams', NOW()),
    ('teams', 'update', 'Update team information', NOW()),
    ('teams', 'delete', 'Delete teams', NOW()),
    ('teams', 'manage_members', 'Add or remove team members', NOW()),

    -- SSO permissions
    ('sso', 'view', 'View SSO configuration', NOW()),
    ('sso', 'manage', 'Create, update or delete SSO configurations', NOW()),

    -- Audit permissions
    ('audit', 'view', 'View audit logs and statistics', NOW()),

    -- Project permissions
    ('projects', 'view', 'View project list and details', NOW()),
    ('projects', 'create', 'Create new projects', NOW()),
    ('projects', 'update', 'Update project information', NOW()),
    ('projects', 'delete', 'Delete projects', NOW()),

    -- Pipeline permissions
    ('pipelines', 'view', 'View pipeline list and details', NOW()),
    ('pipelines', 'create', 'Create new pipelines', NOW()),
    ('pipelines', 'update', 'Update pipeline configuration', NOW()),
    ('pipelines', 'delete', 'Delete pipelines', NOW()),
    ('pipelines', 'execute', 'Run pipelines manually', NOW()),

    -- Environment permissions
    ('environments', 'view', 'View environment list and details', NOW()),
    ('environments', 'create', 'Create new environments', NOW()),
    ('environments', 'update', 'Update environment configuration', NOW()),
    ('environments', 'delete', 'Delete environments', NOW()),

    -- Deployment permissions
    ('deployments', 'view', 'View deployment history', NOW()),
    ('deployments', 'create', 'Trigger new deployments', NOW()),
    ('deployments', 'approve', 'Approve deployment requests', NOW()),
    ('deployments', 'rollback', 'Rollback deployments', NOW()),

    -- Settings permissions
    ('settings', 'view', 'View system settings', NOW()),
    ('settings', 'manage', 'Update system settings', NOW())
ON CONFLICT (resource, action) DO NOTHING;

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
