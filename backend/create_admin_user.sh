#!/bin/bash

# Script para criar usuário admin com senha hashada corretamente
# Uso: ./create_admin_user.sh

set -e

echo "🔐 Criando usuário admin com senha hashada..."

# Criar arquivo Go temporário para gerar hash
cat > /tmp/gen_hash.go <<'EOF'
package main

import (
	"fmt"
	"golang.org/x/crypto/bcrypt"
	"os"
)

func main() {
	password := "admin123"
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Erro ao gerar hash: %v\n", err)
		os.Exit(1)
	}
	fmt.Print(string(hash))
}
EOF

# Gerar hash bcrypt
echo "📝 Gerando hash bcrypt para senha 'admin123'..."
PASSWORD_HASH=$(cd /tmp && go run gen_hash.go 2>/dev/null)

if [ -z "$PASSWORD_HASH" ]; then
    echo "❌ Erro ao gerar hash bcrypt"
    exit 1
fi

echo "✅ Hash gerado: ${PASSWORD_HASH:0:20}..."

# Atualizar ou criar usuário no banco
echo "💾 Atualizando usuário no banco de dados..."

psql -U platifyx -d platifyx <<SQL
-- Primeiro, tentar atualizar usuário existente
UPDATE users
SET password_hash = '$PASSWORD_HASH',
    updated_at = NOW()
WHERE email = 'admin@platifyx.com';

-- Se não existir, criar novo
INSERT INTO users (id, email, name, password_hash, is_active, created_at, updated_at)
SELECT
    gen_random_uuid(),
    'admin@platifyx.com',
    'System Administrator',
    '$PASSWORD_HASH',
    true,
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@platifyx.com');

-- Garantir que o usuário tem a role de admin
INSERT INTO user_roles (user_id, role_id, created_at)
SELECT
    u.id,
    r.id,
    NOW()
FROM users u
CROSS JOIN roles r
WHERE u.email = 'admin@platifyx.com'
  AND r.name = 'admin'
  AND NOT EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = u.id AND ur.role_id = r.id
  );

-- Mostrar resultado
SELECT
    u.email,
    u.name,
    CASE WHEN u.password_hash IS NOT NULL THEN '✅ Configurado' ELSE '❌ Faltando' END as senha,
    u.is_active,
    r.name as role
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'admin@platifyx.com';
SQL

echo ""
echo "✅ Usuário admin criado/atualizado com sucesso!"
echo ""
echo "📋 Credenciais:"
echo "   Email: admin@platifyx.com"
echo "   Senha: admin123"
echo ""
echo "🔗 Acesse: http://localhost:7000/login"
echo ""

# Limpar arquivo temporário
rm -f /tmp/gen_hash.go
