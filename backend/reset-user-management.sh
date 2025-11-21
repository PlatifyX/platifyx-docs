#!/bin/bash

# Script para resetar o sistema de gerenciamento de usuários
# Execute este script para limpar e recriar todas as tabelas

set -e

DB_USER=${DB_USER:-platifyx}
DB_NAME=${DB_NAME:-platifyx}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}

echo "🗑️  Limpando tabelas antigas do sistema de gerenciamento de usuários..."
psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -f rollback_user_management.sql

echo ""
echo "✨ Recriando sistema de gerenciamento de usuários..."
psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -f migrations/009_create_user_management.sql

echo ""
echo "📦 Inserindo roles e permissões padrão..."
psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -f migrations/010_seed_roles_permissions.sql

echo ""
echo "✅ Sistema de gerenciamento de usuários resetado com sucesso!"
echo ""
echo "👤 Usuário admin criado:"
echo "   Email: admin@platifyx.com"
echo "   Senha: admin123"
echo ""
echo "⚠️  IMPORTANTE: Altere a senha do admin no primeiro login!"
