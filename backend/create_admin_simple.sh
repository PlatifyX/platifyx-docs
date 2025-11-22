#!/bin/bash

# Script para criar usuário admin (SEM usar Golang)
# Usa hash bcrypt pré-gerado e testado para senha "admin123"

set -e

echo "🔐 Criando usuário admin..."

# Hash bcrypt válido para senha "admin123" (gerado e testado)
PASSWORD_HASH='$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'

echo "✅ Usando hash bcrypt pré-testado"

# Atualizar ou criar usuário no banco
echo "💾 Configurando usuário no banco de dados..."

export PGPASSWORD=platifyx123 && psql -U platifyx -p 5432 -h localhost -d platifyx <<SQL
-- Remover usuário existente se houver
DELETE FROM user_roles WHERE user_id IN (SELECT id FROM users WHERE email = 'admin@platifyx.com');
DELETE FROM users WHERE email = 'admin@platifyx.com';

-- Criar usuário admin
INSERT INTO users (id, email, name, password_hash, is_active, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'admin@platifyx.com',
    'System Administrator',
    '$PASSWORD_HASH',
    true,
    NOW(),
    NOW()
);

-- Associar role de admin
INSERT INTO user_roles (user_id, role_id, created_at)
SELECT
    u.id,
    r.id,
    NOW()
FROM users u
CROSS JOIN roles r
WHERE u.email = 'admin@platifyx.com'
  AND r.name = 'admin';

-- Mostrar resultado
\echo ''
\echo '✅ Usuário criado com sucesso!'
\echo ''
SELECT
    u.email as "📧 Email",
    u.name as "👤 Nome",
    r.name as "🔑 Role",
    u.is_active as "✓ Ativo"
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'admin@platifyx.com';
SQL

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ USUÁRIO ADMIN CONFIGURADO COM SUCESSO!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Credenciais de Login:"
echo "   📧 Email: admin@platifyx.com"
echo "   🔑 Senha: admin123"
echo ""
echo "🔗 Acesse: http://localhost:7000/login"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
