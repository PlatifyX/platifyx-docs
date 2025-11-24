#!/bin/bash

set -e

echo "🔐 Corrigindo usuário admin..."

PASSWORD_HASH='$2a$10$8AtrnsYBOad9XdQngXwJEuNJjc28hT2m1cwYXEeDbgwQeRINh7iEO'

export PGPASSWORD=platifyx123 && psql -U platifyx -p 5432 -h localhost -d platifyx <<SQL
-- Verificar se o usuário existe
SELECT 
    email as "Email",
    name as "Nome",
    is_active as "Ativo",
    is_sso as "SSO",
    password_hash IS NOT NULL as "Tem Senha"
FROM users 
WHERE email = 'admin@platifyx.com';

-- Atualizar ou criar usuário admin
INSERT INTO users (id, email, name, password_hash, is_active, is_sso, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'admin@platifyx.com',
    'System Administrator',
    '$PASSWORD_HASH',
    true,
    false,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE
SET 
    password_hash = EXCLUDED.password_hash,
    is_active = true,
    is_sso = false,
    updated_at = NOW();

-- Verificar resultado
SELECT 
    email as "📧 Email",
    name as "👤 Nome",
    is_active as "✓ Ativo",
    is_sso as "🔐 SSO",
    LEFT(password_hash, 20) || '...' as "🔑 Hash (início)"
FROM users 
WHERE email = 'admin@platifyx.com';
SQL

echo ""
echo "✅ Usuário admin corrigido!"
echo ""
echo "📋 Credenciais:"
echo "   📧 Email: admin@platifyx.com"
echo "   🔑 Senha: admin123"
echo ""

