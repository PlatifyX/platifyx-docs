# 📚 Guia de Migrações PostgreSQL

## 🎯 Estrutura Atual e Problemas Identificados

### ❌ Problemas Atuais

1. **Numeração Não-Sequencial**: Temos 001, 007, 008, 009, 010 (faltando 002-006)
   - Impossível saber se migrações foram deletadas ou não existiram
   - Dificulta rastreamento da ordem de execução
   - Confuso para novos desenvolvedores

2. **Nomenclatura Inconsistente**:
   - `007_create_service_templates.sql` cria DUAS tabelas não relacionadas
   - `services` vs `created_services` - relação não clara
   - Alguns usam singular, outros plural

3. **Falta de Documentação**:
   - Sem guia de como criar novas migrações
   - Sem explicação das tabelas e seus relacionamentos
   - Sem instruções de rollback

4. **Limitações Técnicas**:
   - Sem estratégia de rollback
   - Sem dry-run
   - Sem ferramenta de geração automática
   - Logs apenas mostram nome do arquivo

---

## ✅ Estrutura Proposta

### Novo Padrão de Nomenclatura

```
YYYYMMDDHHMMSS_descriptive_name.sql
```

**Exemplo**:
```
20250121143000_create_integrations_table.sql
20250121143100_create_service_catalog_table.sql
20250121143200_add_integrations_indexes.sql
```

**Vantagens**:
- ✅ Timestamp garante ordem cronológica
- ✅ Evita colisões entre desenvolvedores
- ✅ Permite múltiplas migrações por dia
- ✅ Formato padrão da indústria

### Convenções de Nomenclatura

| Tipo de Mudança | Padrão | Exemplo |
|-----------------|--------|---------|
| Criar tabela | `create_<table>_table` | `create_users_table.sql` |
| Alterar tabela | `alter_<table>_<action>` | `alter_users_add_email.sql` |
| Adicionar índice | `add_<table>_indexes` | `add_users_indexes.sql` |
| Adicionar FK | `add_<table>_foreign_keys` | `add_orders_foreign_keys.sql` |
| Seed/Dados | `seed_<entity>_data` | `seed_default_roles_data.sql` |
| Remover coluna | `remove_<table>_<column>` | `remove_users_legacy_field.sql` |

---

## 📋 Estrutura de Arquivo de Migração

### Template Completo

```sql
-- =============================================================================
-- Migration: 20250121143000_create_users_table.sql
-- Description: Cria tabela de usuários para autenticação
-- Author: Nome do Dev
-- Date: 2025-01-21
-- Dependencies: None (ou lista de migrações necessárias)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- UP Migration
-- -----------------------------------------------------------------------------

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Add comments
COMMENT ON TABLE users IS 'Tabela de usuários do sistema';
COMMENT ON COLUMN users.email IS 'Email único do usuário';

-- -----------------------------------------------------------------------------
-- DOWN Migration (Rollback) - COMENTADO POR PADRÃO
-- -----------------------------------------------------------------------------
-- ATENÇÃO: Descomentar apenas para criar migration de rollback manual
--
-- DROP INDEX IF EXISTS idx_users_email;
-- DROP TABLE IF EXISTS users;
--
-- IMPORTANTE: Avaliar impacto em produção antes de rodar rollback!
-- -----------------------------------------------------------------------------
```

---

## 🔧 Como Criar Nova Migração

### 1. Usar Script Helper (Recomendado)

```bash
# No diretório backend/
./scripts/new-migration.sh "create users table"
```

Este script irá:
- Gerar timestamp automático
- Criar arquivo com template
- Normalizar nome (substituir espaços por underscores)

### 2. Criar Manualmente

```bash
cd backend/migrations/

# Gerar timestamp
TIMESTAMP=$(date +"%Y%m%d%H%M%S")

# Criar arquivo
touch "${TIMESTAMP}_create_users_table.sql"

# Editar com seu editor preferido
```

---

## 📐 Boas Práticas

### ✅ DO (Faça)

1. **Uma Responsabilidade por Migração**
   ```
   ✅ 001_create_users_table.sql
   ✅ 002_create_roles_table.sql
   ```

2. **Use `IF NOT EXISTS` e `IF EXISTS`**
   ```sql
   CREATE TABLE IF NOT EXISTS users (...);
   CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
   ```

3. **Sempre Adicione Comentários**
   ```sql
   COMMENT ON TABLE users IS 'Descrição clara da tabela';
   ```

4. **Use Transações (já feito pelo runner)**
   - Cada migração executa em uma transação
   - Falha = rollback automático daquela migração

5. **Documente Dependências**
   ```sql
   -- Dependencies: 001_create_users_table.sql
   ```

6. **Índices para Filtros e Joins**
   ```sql
   -- Colunas usadas em WHERE, JOIN, ORDER BY
   CREATE INDEX idx_users_created_at ON users(created_at);
   ```

### ❌ DON'T (Não Faça)

1. **Múltiplas Tabelas Não Relacionadas na Mesma Migração**
   ```
   ❌ 007_create_service_templates.sql
      (cria service_templates E created_services)
   ```

2. **Modificar Migrações Já Aplicadas**
   - Se já rodou em produção, NUNCA modifique
   - Crie nova migração para ajustes

3. **Dados Sensíveis em Migrações**
   - ❌ Passwords, tokens, chaves API
   - ✅ Use variáveis de ambiente ou seeds separados

4. **Nomes Genéricos**
   ```
   ❌ migration1.sql
   ❌ update.sql
   ✅ 20250121143000_add_user_roles_relationship.sql
   ```

---

## 🗂️ Organização de Tabelas

### Relacionamento Entre Tabelas (Esclarecimento)

```
┌─────────────────────────────────────────────────────────────┐
│                     PLATFORM TABLES                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  integrations             sso_settings                       │
│  ├─ id                    ├─ id                              │
│  ├─ name                  ├─ provider (google, microsoft)    │
│  ├─ type                  ├─ enabled                         │
│  ├─ enabled               └─ config (JSONB)                  │
│  └─ config (JSONB)                                           │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                     SERVICE CATALOG                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  services                              (Discovered from K8s) │
│  ├─ id                                                       │
│  ├─ name                                                     │
│  ├─ squad                                                    │
│  ├─ application                                              │
│  ├─ language                                                 │
│  └─ ...                                                      │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                  TEMPLATE SYSTEM                             │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  service_templates                     (Available Templates) │
│  ├─ id                                                       │
│  ├─ name                                                     │
│  ├─ category                                                 │
│  ├─ language                                                 │
│  └─ ...                                                      │
│                                                               │
│  created_services                    (User Generated)        │
│  ├─ id                                                       │
│  ├─ name                                                     │
│  ├─ template (FK → service_templates)                        │
│  ├─ repository_url                                           │
│  └─ ...                                                      │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                      RBAC SYSTEM                             │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  users                    user_roles                         │
│  ├─ id              ┌───→ ├─ user_id (FK)                   │
│  ├─ email           │     ├─ role_id (FK)                   │
│  └─ ...             │     └─ assigned_at                     │
│                     │                                         │
│  roles              │     role_permissions                   │
│  ├─ id ─────────────┘───→ ├─ role_id (FK)                   │
│  ├─ name                  ├─ permission_id (FK)              │
│  └─ ...                   └─ ...                             │
│                                                               │
│  permissions                                                 │
│  ├─ id ───────────────────┘                                 │
│  ├─ resource                                                 │
│  ├─ action                                                   │
│  └─ ...                                                      │
│                                                               │
│  audit_logs                                                  │
│  ├─ id                                                       │
│  ├─ user_id (FK → users)                                    │
│  ├─ action                                                   │
│  └─ ...                                                      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Explicação das Tabelas

| Tabela | Propósito | Origem |
|--------|-----------|--------|
| `services` | Catálogo de serviços descobertos via Kubernetes | K8s sync |
| `service_templates` | Templates disponíveis (Go, Python, Node, etc) | Backend |
| `created_services` | Serviços gerados por usuários via templates | User action |
| `integrations` | Configurações de integrações externas | User config |
| `sso_settings` | Configurações de SSO (Google, Microsoft) | User config |
| `users`, `roles`, `permissions` | Sistema RBAC completo | User management |
| `audit_logs` | Auditoria de ações no sistema | System logs |

---

## 🚀 Executar Migrações

### Automático (Recomendado)

Migrações rodam automaticamente ao iniciar a aplicação:

```bash
# Via Go
go run cmd/api/main.go

# Via Docker
docker-compose up
```

**Logs**:
```
INFO Connected to PostgreSQL database
INFO Applying migration: 001_create_integrations.sql
INFO Applying migration: 007_create_service_templates.sql
INFO Migrations completed successfully
```

### Manual (Desenvolvimento)

```bash
# Conectar ao banco
psql -h localhost -U platifyx -d platifyx

# Executar migration específica
\i migrations/001_create_integrations.sql

# Ver migrações aplicadas
SELECT * FROM schema_migrations ORDER BY applied_at DESC;
```

---

## 🔄 Rollback (Reverter Migração)

⚠️ **ATENÇÃO**: Rollback manual é perigoso em produção!

### Estratégia de Rollback

1. **Backup SEMPRE**:
   ```bash
   pg_dump platifyx > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Criar Migração de Rollback**:
   ```sql
   -- 20250121150000_rollback_users_table.sql
   DROP TABLE IF EXISTS users CASCADE;
   DELETE FROM schema_migrations WHERE version = '20250121143000_create_users_table.sql';
   ```

3. **Testar em Ambiente de Dev PRIMEIRO**

### Rollback Automático em Caso de Erro

✅ Já implementado! Cada migração roda em transação:

```go
// Se migration falhar, rollback automático
tx.Rollback()
```

---

## 📊 Status das Migrações

### Ver Migrações Aplicadas

```sql
SELECT
    version,
    applied_at,
    EXTRACT(EPOCH FROM (NOW() - applied_at))/86400 as days_ago
FROM schema_migrations
ORDER BY applied_at DESC;
```

### Ver Próximas Migrações Pendentes

```bash
# Listar arquivos .sql
ls -1 backend/migrations/*.sql

# Comparar com schema_migrations no banco
```

---

## 🛠️ Ferramentas Auxiliares

### Script: new-migration.sh

```bash
#!/bin/bash
# Cria nova migração com timestamp

DESCRIPTION=$1

if [ -z "$DESCRIPTION" ]; then
    echo "Uso: ./scripts/new-migration.sh \"descrição da migração\""
    exit 1
fi

TIMESTAMP=$(date +"%Y%m%d%H%M%S")
FILENAME="${TIMESTAMP}_$(echo $DESCRIPTION | tr '[:upper:]' '[:lower:]' | tr ' ' '_').sql"

cat > "migrations/$FILENAME" << 'EOF'
-- =============================================================================
-- Migration: FILENAME
-- Description: DESCRIPTION
-- Author: TODO
-- Date: DATE
-- Dependencies: None
-- =============================================================================

-- -----------------------------------------------------------------------------
-- UP Migration
-- -----------------------------------------------------------------------------



-- -----------------------------------------------------------------------------
-- DOWN Migration (Rollback) - COMENTADO
-- -----------------------------------------------------------------------------
--
--
--
EOF

sed -i "s/FILENAME/$FILENAME/g" "migrations/$FILENAME"
sed -i "s/DESCRIPTION/$DESCRIPTION/g" "migrations/$FILENAME"
sed -i "s/DATE/$(date +%Y-%m-%d)/g" "migrations/$FILENAME"

echo "✅ Migração criada: migrations/$FILENAME"
```

### Script: migration-status.sh

```bash
#!/bin/bash
# Mostra status das migrações

echo "📊 Status das Migrações"
echo "======================="
echo ""
echo "Arquivos disponíveis:"
ls -1 migrations/*.sql | wc -l

echo ""
echo "Migrações aplicadas (últimas 5):"
psql $DATABASE_URL -c "SELECT version, applied_at FROM schema_migrations ORDER BY applied_at DESC LIMIT 5;"
```

---

## 📝 Plano de Refatoração das Migrações Atuais

### Fase 1: Renomear Migrações Existentes

```bash
# Manter ordem atual mas melhorar nomes
001_create_integrations.sql           → 20250101000001_create_integrations_table.sql
007_create_service_templates.sql      → Dividir em 2 (ver abaixo)
008_create_services.sql               → 20250101000008_create_service_catalog_table.sql
009_create_sso_settings.sql           → 20250101000009_create_sso_settings_table.sql
010_create_rbac_tables.sql            → 20250101000010_create_rbac_system_tables.sql
```

### Fase 2: Dividir Migration 007

```
007_create_service_templates.sql (117 linhas)
  ↓
20250101000007_create_service_templates_table.sql (Apenas service_templates)
20250101000008_create_created_services_table.sql  (Apenas created_services)
```

### Fase 3: Adicionar Foreign Keys

```sql
-- 20250101000011_add_created_services_foreign_keys.sql
ALTER TABLE created_services
ADD CONSTRAINT fk_created_services_template
FOREIGN KEY (template) REFERENCES service_templates(id);
```

---

## ❓ FAQ

### Por que não usar ferramenta como golang-migrate ou goose?

**Resposta**: Implementação atual é simples e funcional. Podemos migrar para ferramenta externa se:
- Precisarmos de rollback automático
- Precisarmos de migrations em Go (não apenas SQL)
- Time crescer e precisar de features avançadas

### Posso modificar uma migração já aplicada?

**❌ NÃO!** Se já rodou em produção, crie nova migração com a alteração.

### E se duas pessoas criarem migração ao mesmo tempo?

Com timestamps de segundo, risco é baixíssimo. Se ocorrer, renomeie uma adicionando 1 segundo.

### Preciso adicionar DOWN migration?

Não obrigatório, mas recomendado para migrações reversíveis. Mantenha comentado no arquivo.

---

## 📚 Referências

- [PostgreSQL Best Practices for Migrations](https://www.postgresql.org/docs/current/ddl.html)
- [Schema Migration Patterns](https://martinfowler.com/articles/evodb.html)
- [golang-migrate](https://github.com/golang-migrate/migrate) (alternativa futura)
- [Goose](https://github.com/pressly/goose) (alternativa futura)

---

**Última atualização**: 2025-01-21
**Mantido por**: Platform Team
