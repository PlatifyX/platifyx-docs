#!/bin/bash
# =============================================================================
# migration-status.sh
# Mostra status das migrações (aplicadas vs pendentes)
# =============================================================================

set -e

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuração do banco
DATABASE_URL=${DATABASE_URL:-"postgres://platifyx:platifyx123@localhost:5432/platifyx?sslmode=disable"}

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  📊 Status das Migrações PostgreSQL - PlatifyX"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Contar arquivos de migração
TOTAL_FILES=$(ls -1 migrations/*.sql 2>/dev/null | wc -l)
echo -e "${BLUE}📁 Arquivos de migração disponíveis:${NC} $TOTAL_FILES"
echo ""

# Verificar conexão com banco
if ! psql "$DATABASE_URL" -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${RED}❌ Erro: Não foi possível conectar ao banco de dados${NC}"
    echo "   DATABASE_URL: $DATABASE_URL"
    echo ""
    echo "   Verifique se:"
    echo "   - PostgreSQL está rodando (docker-compose up postgres)"
    echo "   - DATABASE_URL está correto"
    exit 1
fi

echo -e "${GREEN}✅ Conexão com banco OK${NC}"
echo ""

# Contar migrações aplicadas
APPLIED_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM schema_migrations" 2>/dev/null | tr -d ' ')

if [ -z "$APPLIED_COUNT" ]; then
    APPLIED_COUNT=0
fi

echo -e "${BLUE}✓ Migrações aplicadas:${NC} $APPLIED_COUNT"
echo ""

# Calcular pendentes
PENDING=$((TOTAL_FILES - APPLIED_COUNT))

if [ $PENDING -gt 0 ]; then
    echo -e "${YELLOW}⏳ Migrações pendentes:${NC} $PENDING"
else
    echo -e "${GREEN}✅ Todas migrações aplicadas!${NC}"
fi

echo ""
echo "───────────────────────────────────────────────────────────"
echo "  Migrações Aplicadas (últimas 10)"
echo "───────────────────────────────────────────────────────────"
echo ""

psql "$DATABASE_URL" -c "
SELECT
    version as \"Versão\",
    TO_CHAR(applied_at, 'YYYY-MM-DD HH24:MI:SS') as \"Aplicada em\",
    CASE
        WHEN EXTRACT(EPOCH FROM (NOW() - applied_at))/86400 < 1 THEN 'hoje'
        WHEN EXTRACT(EPOCH FROM (NOW() - applied_at))/86400 < 7 THEN CONCAT(ROUND(EXTRACT(EPOCH FROM (NOW() - applied_at))/86400), ' dias')
        WHEN EXTRACT(EPOCH FROM (NOW() - applied_at))/86400 < 30 THEN CONCAT(ROUND(EXTRACT(EPOCH FROM (NOW() - applied_at))/604800), ' semanas')
        ELSE CONCAT(ROUND(EXTRACT(EPOCH FROM (NOW() - applied_at))/2592000), ' meses')
    END as \"Há quanto tempo\"
FROM schema_migrations
ORDER BY applied_at DESC
LIMIT 10;
" 2>/dev/null || echo "Nenhuma migração aplicada ainda"

echo ""

# Listar arquivos de migração
echo "───────────────────────────────────────────────────────────"
echo "  Todos os Arquivos de Migração"
echo "───────────────────────────────────────────────────────────"
echo ""

for file in migrations/*.sql; do
    if [ -f "$file" ]; then
        BASENAME=$(basename "$file")
        # Verificar se foi aplicada
        APPLIED=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM schema_migrations WHERE version = '$BASENAME'" 2>/dev/null | tr -d ' ')

        if [ "$APPLIED" = "1" ]; then
            echo -e "  ${GREEN}✓${NC} $BASENAME"
        else
            echo -e "  ${YELLOW}○${NC} $BASENAME ${YELLOW}(pendente)${NC}"
        fi
    fi
done

echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "💡 Comandos úteis:"
echo "   Ver logs: docker-compose logs postgres"
echo "   Conectar: psql $DATABASE_URL"
echo "   Criar migração: ./scripts/new-migration.sh \"descrição\""
echo ""
