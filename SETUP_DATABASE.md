# 🗄️ Setup do Banco de Dados - PlatifyX

Este guia mostra como configurar o banco de dados PostgreSQL para o PlatifyX e resolver os erros 500 nas rotas de settings.

## 🔴 Problema Atual

As rotas `/api/v1/settings/*` estão retornando erro 500 porque:
- As tabelas de user management não existem no banco de dados
- As migrations ainda não foram executadas
- O PostgreSQL pode não estar rodando

## ✅ Solução Rápida (Docker - Recomendado)

### 1. Iniciar PostgreSQL e Redis com Docker Compose

```bash
# Na raiz do projeto
docker-compose up -d

# Verificar se os serviços estão rodando
docker-compose ps
```

### 2. Reiniciar o Backend

O backend executará as migrations automaticamente ao iniciar:

```bash
cd backend
make run
```

Ou:

```bash
cd backend
go run cmd/api/main.go
```

### 3. Verificar

Acesse o frontend e vá para a página de Settings. Os erros 500 devem desaparecer!

---

## 🔧 Solução Manual (Sem Docker)

### 1. Instalar PostgreSQL

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
```

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

### 2. Criar Banco de Dados

```bash
# Criar usuário e banco
sudo -u postgres psql << 'EOF'
CREATE USER platifyx WITH PASSWORD 'platifyx123';
CREATE DATABASE platifyx OWNER platifyx;
GRANT ALL PRIVILEGES ON DATABASE platifyx TO platifyx;
EOF
```

### 3. Configurar .env

Certifique-se de que o arquivo `.env` existe na raiz do projeto:

```bash
cp .env.example .env
```

Verifique se o `DATABASE_URL` está correto:
```env
DATABASE_URL=postgres://platifyx:platifyx123@localhost:5432/platifyx?sslmode=disable
```

### 4. Iniciar o Backend

```bash
cd backend
make run
```

O backend executará as migrations automaticamente:
- ✅ 009_create_user_management.sql
- ✅ 010_seed_roles_permissions.sql

---

## 🧪 Verificar Instalação

### Verificar Tabelas Criadas

```bash
psql postgres://platifyx:platifyx123@localhost:5432/platifyx -c "\dt"
```

Você deve ver:
- users
- roles
- permissions
- teams
- user_roles
- user_teams
- role_permissions
- sso_configs
- audit_logs
- sessions

### Verificar Dados Seed

```bash
# Ver roles padrão
psql postgres://platifyx:platifyx123@localhost:5432/platifyx -c "SELECT * FROM roles;"

# Ver permissões
psql postgres://platifyx:platifyx123@localhost:5432/platifyx -c "SELECT COUNT(*) FROM permissions;"

# Ver usuário admin padrão
psql postgres://platifyx:platifyx123@localhost:5432/platifyx -c "SELECT email, name FROM users;"
```

### Testar API

```bash
# Listar usuários
curl http://localhost:8060/api/v1/settings/users

# Listar roles
curl http://localhost:8060/api/v1/settings/roles

# Listar teams
curl http://localhost:8060/api/v1/settings/teams
```

---

## 📋 Checklist de Verificação

- [ ] PostgreSQL está rodando
- [ ] Banco de dados `platifyx` foi criado
- [ ] Arquivo `.env` existe e está configurado
- [ ] Backend foi iniciado
- [ ] Migrations foram executadas (ver logs do backend)
- [ ] Tabelas foram criadas
- [ ] Dados seed foram inseridos
- [ ] Rotas de settings retornam 200 OK

---

## 🐛 Troubleshooting

### Erro: "connection refused"
```bash
# Verificar se PostgreSQL está rodando
sudo systemctl status postgresql
# ou
pg_isready

# Iniciar PostgreSQL
sudo systemctl start postgresql
```

### Erro: "database does not exist"
```bash
# Criar banco manualmente
psql -U postgres -c "CREATE DATABASE platifyx OWNER platifyx;"
```

### Erro: "authentication failed"
```bash
# Verificar senha no PostgreSQL
sudo -u postgres psql -c "\du"

# Redefinir senha se necessário
sudo -u postgres psql -c "ALTER USER platifyx WITH PASSWORD 'platifyx123';"
```

### Ver Logs do Backend
```bash
# Ver todas as migrations executadas
grep "Migrations completed" backend_logs

# Ver erros de database
grep "ERROR.*database" backend_logs
```

---

## 🎯 Credenciais Padrão

### Banco de Dados
- **Host:** localhost
- **Porta:** 5432
- **Database:** platifyx
- **Usuário:** platifyx
- **Senha:** platifyx123

### Usuário Admin Padrão
Após as migrations:
- **Email:** admin@platifyx.com
- **Senha:** admin123

⚠️ **IMPORTANTE:** Altere a senha do admin após o primeiro login!

---

## 📚 Arquivos de Migration

As migrations estão em `backend/migrations/`:

1. **009_create_user_management.sql**
   - Cria todas as tabelas de user management
   - 35+ índices de performance
   - Check constraints para validação
   - Foreign keys com cascade

2. **010_seed_roles_permissions.sql**
   - Cria roles padrão (admin, developer, viewer, platform_engineer)
   - 40+ permissões com nomes em português
   - Associa permissões aos roles
   - Cria usuário admin padrão

---

## 🚀 Próximos Passos

Após configurar o banco de dados:

1. Reinicie o backend
2. Acesse http://localhost:7000
3. Vá para Settings > Users
4. Crie novos usuários
5. Configure roles e permissões

---

## 💡 Dicas

- Use Docker Compose para desenvolvimento (mais rápido e fácil)
- Para produção, use serviços gerenciados (AWS RDS, Azure Database, etc)
- Faça backup regular do banco de dados
- Monitore o uso de índices com `pg_stat_user_indexes`
- Use connection pooling em produção (PgBouncer)

---

**Documentação gerada em:** 2025-11-21
**Versão:** 1.0.0
