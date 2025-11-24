-- Migration: Node Default Schema
-- Schema padrão que será replicado para cada organização no banco node
-- Este arquivo serve como template para criar schemas por organização

-- Este arquivo não será executado diretamente nas migrations
-- Ele será usado como template pelo OrganizationService para criar schemas dinamicamente
-- O schema será criado com o nome do UUID da organização

-- Tabela de Usuários (exemplo - pode ser expandida conforme necessário)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    password_hash VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    is_sso BOOLEAN DEFAULT false,
    sso_provider VARCHAR(50),
    sso_id VARCHAR(255),
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_sso_user UNIQUE (sso_provider, sso_id)
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_sso_provider ON users(sso_provider) WHERE sso_provider IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login_at DESC NULLS LAST);

-- Adicionar outras tabelas conforme necessário para os dados dos clientes
-- Por exemplo: products, orders, etc.


