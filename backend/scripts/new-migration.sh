#!/bin/bash
# =============================================================================
# new-migration.sh
# Cria nova migração PostgreSQL com timestamp e template
# =============================================================================

set -e

DESCRIPTION=$1

# Validação
if [ -z "$DESCRIPTION" ]; then
    echo "❌ Erro: Descrição da migração não fornecida"
    echo ""
    echo "Uso:"
    echo "  ./scripts/new-migration.sh \"descrição da migração\""
    echo ""
    echo "Exemplos:"
    echo "  ./scripts/new-migration.sh \"create users table\""
    echo "  ./scripts/new-migration.sh \"add user email index\""
    echo "  ./scripts/new-migration.sh \"alter orders add status column\""
    exit 1
fi

# Gerar timestamp (YYYYMMDDHHMMSS)
TIMESTAMP=$(date +"%Y%m%d%H%M%S")

# Normalizar nome: lowercase, substituir espaços por underscore
NORMALIZED=$(echo "$DESCRIPTION" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/_/g' | sed 's/__*/_/g' | sed 's/^_//;s/_$//')

FILENAME="${TIMESTAMP}_${NORMALIZED}.sql"
FILEPATH="migrations/$FILENAME"

# Criar arquivo com template
cat > "$FILEPATH" << EOF
-- =============================================================================
-- Migration: $FILENAME
-- Description: $DESCRIPTION
-- Author: \$USER
-- Date: $(date +%Y-%m-%d)
-- Dependencies: None (ou lista de migrações necessárias)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- UP Migration
-- -----------------------------------------------------------------------------

-- Adicione seus comandos SQL aqui
-- Exemplo:
-- CREATE TABLE IF NOT EXISTS example (
--     id SERIAL PRIMARY KEY,
--     name VARCHAR(255) NOT NULL,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- CREATE INDEX IF NOT EXISTS idx_example_name ON example(name);

-- COMMENT ON TABLE example IS 'Descrição da tabela';


-- -----------------------------------------------------------------------------
-- DOWN Migration (Rollback) - COMENTADO POR PADRÃO
-- -----------------------------------------------------------------------------
-- ATENÇÃO: Descomentar apenas para criar migration de rollback manual
--
-- DROP TABLE IF EXISTS example CASCADE;
--
-- IMPORTANTE: Avaliar impacto em produção antes de rodar rollback!
-- -----------------------------------------------------------------------------
EOF

echo "✅ Migração criada com sucesso!"
echo ""
echo "📄 Arquivo: $FILEPATH"
echo "🕐 Timestamp: $TIMESTAMP"
echo ""
echo "📝 Próximos passos:"
echo "   1. Edite o arquivo: $FILEPATH"
echo "   2. Adicione seus comandos SQL na seção UP Migration"
echo "   3. (Opcional) Adicione comandos de rollback na seção DOWN"
echo "   4. Teste localmente antes de fazer commit"
echo ""
echo "💡 Dica: Consulte migrations/MIGRATIONS.md para boas práticas"
