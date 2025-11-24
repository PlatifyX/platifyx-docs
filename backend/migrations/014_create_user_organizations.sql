-- Migration: User Organizations
-- Cria tabela para associar usuários a organizações no banco core

CREATE TABLE IF NOT EXISTS user_organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_uuid UUID NOT NULL REFERENCES organizations(uuid) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_organization UNIQUE (user_id, organization_uuid)
);

CREATE INDEX IF NOT EXISTS idx_user_organizations_user_id ON user_organizations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_organizations_organization_uuid ON user_organizations(organization_uuid);
CREATE INDEX IF NOT EXISTS idx_user_organizations_role ON user_organizations(role);

COMMENT ON TABLE user_organizations IS 'Associação entre usuários e organizações';
COMMENT ON COLUMN user_organizations.role IS 'Papel do usuário na organização: owner, admin, member';
COMMENT ON COLUMN user_organizations.user_id IS 'ID do usuário no banco core';
COMMENT ON COLUMN user_organizations.organization_uuid IS 'UUID da organização';


