-- Migration: Organizations
-- Cria tabela para armazenar informações das organizações no banco core

CREATE TABLE IF NOT EXISTS organizations (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    sso_active BOOLEAN DEFAULT false,
    database_address_write VARCHAR(500) NOT NULL,
    database_address_read VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_organizations_name ON organizations(name);
CREATE INDEX IF NOT EXISTS idx_organizations_uuid ON organizations(uuid);
CREATE INDEX IF NOT EXISTS idx_organizations_sso_active ON organizations(sso_active) WHERE sso_active = true;

COMMENT ON TABLE organizations IS 'Tabela de organizações no banco core';
COMMENT ON COLUMN organizations.uuid IS 'UUID único da organização (usado como nome do schema no banco node)';
COMMENT ON COLUMN organizations.name IS 'Nome da organização';
COMMENT ON COLUMN organizations.sso_active IS 'Indica se SSO está ativo para esta organização';
COMMENT ON COLUMN organizations.database_address_write IS 'Endereço do banco de dados para escrita';
COMMENT ON COLUMN organizations.database_address_read IS 'Endereço do banco de dados para leitura (opcional, usa write se não especificado)';


