#!/bin/bash

# Script para inicializar o banco de dados PostgreSQL para o PlatifyX

set -e

echo "🚀 Inicializando banco de dados PlatifyX..."

# Carregar variáveis de ambiente
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Valores padrão se não existirem
DB_USER=${DB_USER:-platifyx}
DB_PASSWORD=${DB_PASSWORD:-platifyx123}
DB_NAME=${DB_NAME:-platifyx}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}

echo "📊 Configuração:"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo ""

# Verificar se PostgreSQL está instalado
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL não está instalado!"
    echo "   Instale com: sudo apt-get install postgresql postgresql-contrib"
    exit 1
fi

# Verificar se PostgreSQL está rodando
if ! pg_isready -h $DB_HOST -p $DB_PORT &> /dev/null; then
    echo "⚠️  PostgreSQL não está rodando!"
    echo "   Inicie com: sudo systemctl start postgresql"
    echo "   Ou: sudo service postgresql start"
    echo ""
    echo "💡 Alternativa: Use Docker"
    echo "   docker run --name platifyx-postgres -e POSTGRES_USER=$DB_USER -e POSTGRES_PASSWORD=$DB_PASSWORD -e POSTGRES_DB=$DB_NAME -p $DB_PORT:5432 -d postgres:15-alpine"
    exit 1
fi

echo "✅ PostgreSQL está rodando!"

# Criar banco de dados se não existir
echo "📦 Criando banco de dados '$DB_NAME' (se não existir)..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c "CREATE DATABASE $DB_NAME"

echo "✅ Banco de dados pronto!"

# Executar migrations
echo "🔄 Executando migrations..."
DATABASE_URL="postgres://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME?sslmode=disable"

# Verificar se há arquivos de migration
if [ ! -d "migrations" ]; then
    echo "❌ Pasta 'migrations' não encontrada!"
    exit 1
fi

MIGRATION_COUNT=$(ls -1 migrations/*.sql 2>/dev/null | wc -l)
echo "   Encontradas $MIGRATION_COUNT migrations"

# As migrations serão executadas pelo servidor Go na inicialização
echo "   (As migrations serão executadas automaticamente pelo servidor)"

echo ""
echo "✅ Banco de dados inicializado com sucesso!"
echo ""
echo "🚀 Para iniciar o servidor:"
echo "   cd /home/user/platifyx-docs/backend"
echo "   make run"
echo ""
echo "   Ou:"
echo "   go run cmd/api/main.go"
echo ""
