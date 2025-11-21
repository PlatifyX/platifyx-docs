#!/bin/bash

# Script para resetar o sistema de gerenciamento de usuários
# Execute este script para limpar e recriar todas as tabelas

set -e

DB_USER=${DB_USER:-platifyx}
DB_NAME=${DB_NAME:-platifyx}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}

echo "🗑️  Limpando tabelas antigas do sistema de gerenciamento de usuários..."
psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -f migrations/009_rollback.sql

echo ""
echo "✨ Recriando sistema de gerenciamento de usuários..."
psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -f migrations/009_create_user_management.sql

echo ""
echo "✅ Sistema de gerenciamento de usuários resetado com sucesso!"
