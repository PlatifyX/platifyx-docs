-- Migration: Seed PlatifyX Organization and Admin User
-- Cria a organização PlatifyX e o usuário admin@platifyx.com como owner
-- O schema no banco node será criado automaticamente pelo código quando necessário

DO $$
DECLARE
    platifyx_org_uuid UUID := 'ebb73e53-aa9e-4a9c-bc0c-531934c519e6';
    admin_user_id UUID;
    node_db_url TEXT := 'postgres://platifyx:platifyx123@localhost:5432/platifyx?sslmode=disable';
BEGIN
    -- Criar organização PlatifyX se não existir
    INSERT INTO organizations (uuid, name, sso_active, database_address_write, database_address_read, created_at, updated_at)
    VALUES (
        platifyx_org_uuid,
        'PlatifyX',
        false,
        node_db_url,
        node_db_url,
        NOW(),
        NOW()
    )
    ON CONFLICT (uuid) DO NOTHING;

    -- Criar usuário admin@platifyx.com se não existir
    -- Senha padrão: 'admin123' (hash bcrypt)
    SELECT id INTO admin_user_id FROM users WHERE email = 'admin@platifyx.com';

    IF admin_user_id IS NULL THEN
        INSERT INTO users (id, email, name, password_hash, is_active, is_sso, created_at, updated_at)
        VALUES (
            gen_random_uuid(),
            'admin@platifyx.com',
            'System Administrator',
            '$2a$10$8AtrnsYBOad9XdQngXwJEuNJjc28hT2m1cwYXEeDbgwQeRINh7iEO',
            true,
            false,
            NOW(),
            NOW()
        )
        RETURNING id INTO admin_user_id;
    END IF;

    -- Associar usuário admin à organização PlatifyX como owner
    INSERT INTO user_organizations (user_id, organization_uuid, role, created_at, updated_at)
    VALUES (
        admin_user_id,
        platifyx_org_uuid,
        'owner',
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id, organization_uuid) DO UPDATE
    SET role = 'owner', updated_at = NOW();
END $$;

