# 🚀 Como Iniciar o PlatifyX

Guia rápido para iniciar o ambiente de desenvolvimento local.

---

## ⚡ Início Rápido (3 comandos)

```bash
# 1. Iniciar PostgreSQL e Redis (Docker)
docker-compose up -d

# 2. Iniciar Backend (Local)
cd backend && make run

# 3. Iniciar Frontend (Outro terminal)
cd frontend && npm run dev
```

**Pronto! 🎉**
- Frontend: http://localhost:7000
- Backend: http://localhost:8060
- PostgreSQL: localhost:5432
- Redis: localhost:6379

---

## 📋 Detalhamento

### 1️⃣ Iniciar Banco de Dados (Docker)

O PostgreSQL e Redis rodam no Docker para facilitar o setup:

```bash
# Iniciar containers
docker-compose up -d

# Verificar se estão rodando
docker-compose ps

# Ver logs
docker-compose logs -f postgres
docker-compose logs -f redis
```

**O que acontece:**
- ✅ PostgreSQL inicia na porta 5432
- ✅ Redis inicia na porta 6379
- ✅ Volumes são criados para persistir dados
- ✅ Healthchecks garantem que estão prontos
- ✅ `restart: unless-stopped` garante que iniciam automaticamente

**Parar containers:**
```bash
docker-compose down

# Parar E remover dados (cuidado!)
docker-compose down -v
```

---

### 2️⃣ Iniciar Backend (Local)

O backend roda localmente conectando ao PostgreSQL do Docker:

```bash
cd backend

# Opção 1: Usando Makefile
make run

# Opção 2: Direto com Go
go run cmd/api/main.go
```

**O que acontece:**
- ✅ Conecta ao PostgreSQL (localhost:5432)
- ✅ Executa migrations automaticamente
- ✅ Cria tabelas de user management
- ✅ Insere dados seed (roles, permissões, admin)
- ✅ API disponível em http://localhost:8060

**Ver logs importantes:**
```bash
# Deve aparecer no terminal:
✅ Connected to PostgreSQL database
✅ Migrations completed successfully
✅ Server listening :8060
```

**Testar API:**
```bash
curl http://localhost:8060/api/v1/health
curl http://localhost:8060/api/v1/settings/users
curl http://localhost:8060/api/v1/settings/roles
```

---

### 3️⃣ Iniciar Frontend (Local)

```bash
cd frontend

# Instalar dependências (primeira vez)
npm install

# Iniciar dev server
npm run dev
```

**O que acontece:**
- ✅ Vite dev server inicia
- ✅ Frontend disponível em http://localhost:7000
- ✅ Hot reload habilitado
- ✅ Conecta ao backend em localhost:8060

**Acessar:**
- Home: http://localhost:7000
- Settings: http://localhost:7000/settings

---

## 🔧 Configuração do Backend

O backend usa variáveis de ambiente do arquivo `.env`:

```bash
# Se não existir, criar a partir do exemplo
cp .env.example .env
```

**Principais variáveis (.env):**
```env
# Server
ENVIRONMENT=development
PORT=8060

# Database (aponta para Docker)
DATABASE_URL=postgres://platifyx:platifyx123@localhost:5432/platifyx?sslmode=disable

# Redis (aponta para Docker)
REDIS_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379

# CORS (permite frontend)
ALLOWED_ORIGINS=http://localhost:7000,http://localhost:5173
FRONTEND_URL=http://localhost:7000
```

---

## 🔍 Verificar Setup

### Verificar PostgreSQL

```bash
# Conectar ao banco
docker exec -it platifyx-postgres psql -U platifyx -d platifyx

# Ver tabelas
\dt

# Ver roles
SELECT * FROM roles;

# Ver usuário admin
SELECT email, name, is_active FROM users;

# Sair
\q
```

### Verificar Redis

```bash
# Conectar ao Redis
docker exec -it platifyx-redis redis-cli

# Testar
PING
# Deve retornar: PONG

# Sair
exit
```

### Verificar Backend

```bash
# Health check
curl http://localhost:8060/api/v1/health

# Listar usuários
curl http://localhost:8060/api/v1/settings/users

# Listar roles
curl http://localhost:8060/api/v1/settings/roles

# Deve retornar JSON sem erros 500
```

---

## 🐛 Troubleshooting

### Erro: "connection refused" no backend

**Problema:** PostgreSQL não está rodando

**Solução:**
```bash
# Verificar containers
docker-compose ps

# Se não estiver rodando, iniciar
docker-compose up -d

# Ver logs
docker-compose logs postgres
```

---

### Erro: "database does not exist"

**Problema:** Banco não foi criado

**Solução:**
```bash
# Recriar banco
docker-compose down -v
docker-compose up -d

# Aguardar 10 segundos
sleep 10

# Reiniciar backend
cd backend && make run
```

---

### Erro 500 nas rotas /settings/*

**Problema:** Migrations não foram executadas

**Solução:**
```bash
# Parar backend (Ctrl+C)

# Verificar se migrations existem
ls backend/migrations/*.sql

# Reiniciar backend (ele executa migrations automaticamente)
cd backend && make run

# Verificar logs - deve aparecer:
# ✅ Migrations completed successfully
```

---

### Frontend não conecta ao backend

**Problema:** CORS ou backend não está rodando

**Solução:**
```bash
# 1. Verificar se backend está rodando
curl http://localhost:8060/api/v1/health

# 2. Verificar CORS no .env
cat .env | grep ALLOWED_ORIGINS
# Deve conter: http://localhost:7000

# 3. Reiniciar backend
cd backend && make run

# 4. Verificar no navegador (F12 > Console)
# Não deve ter erros de CORS
```

---

## 📊 Estrutura do Projeto

```
platifyx-docs/
├── docker-compose.yml          # PostgreSQL + Redis
├── .env.example                # Template de configuração
├── backend/
│   ├── cmd/api/main.go        # Entry point
│   ├── migrations/            # SQL migrations
│   │   ├── 009_create_user_management.sql
│   │   └── 010_seed_roles_permissions.sql
│   ├── Makefile               # Comandos úteis
│   └── scripts/
│       └── init-db.sh         # Script de setup
└── frontend/
    ├── src/
    │   ├── pages/SettingsPage.tsx
    │   ├── components/Settings/
    │   └── services/settingsApi.ts
    └── package.json
```

---

## 🎯 Workflows Comuns

### Desenvolvimento Diário

```bash
# 1. Iniciar ambiente
docker-compose up -d

# 2. Iniciar backend (terminal 1)
cd backend && make run

# 3. Iniciar frontend (terminal 2)
cd frontend && npm run dev

# 4. Desenvolver! 🚀
```

### Resetar Banco de Dados

```bash
# Parar tudo
docker-compose down -v

# Iniciar novamente
docker-compose up -d

# Aguardar
sleep 10

# Reiniciar backend (executa migrations)
cd backend && make run
```

### Ver Logs

```bash
# PostgreSQL
docker-compose logs -f postgres

# Redis
docker-compose logs -f redis

# Backend (no terminal onde está rodando)
# Os logs aparecem automaticamente

# Frontend (no terminal onde está rodando)
# Os logs aparecem automaticamente
```

---

## 🎓 Dicas

- **Sempre inicie o Docker primeiro** (PostgreSQL e Redis)
- **Aguarde os healthchecks** antes de iniciar o backend
- **O backend executa migrations automaticamente** ao iniciar
- **Use `make run`** ao invés de `go run` (mais conveniente)
- **Ctrl+C** para parar backend ou frontend
- **`docker-compose down`** para parar os containers
- **Mantenha 2-3 terminais abertos:** Docker logs, Backend, Frontend

---

## 📚 Documentação Adicional

- **Setup completo:** [SETUP_DATABASE.md](./SETUP_DATABASE.md)
- **Melhorias implementadas:** Ver commits no Git
- **API docs:** http://localhost:8060/api/v1/health (quando rodando)

---

## ✅ Checklist de Verificação

Após iniciar tudo, verifique:

- [ ] `docker-compose ps` mostra postgres e redis como UP
- [ ] Backend mostra "Migrations completed successfully"
- [ ] Backend mostra "Server listening :8060"
- [ ] `curl http://localhost:8060/api/v1/health` retorna OK
- [ ] Frontend abre em http://localhost:7000
- [ ] Settings page carrega sem erros 500
- [ ] Console do navegador (F12) sem erros

---

**Criado em:** 2025-11-21
**Última atualização:** 2025-11-21

**Precisa de ajuda?** Veja o arquivo [SETUP_DATABASE.md](./SETUP_DATABASE.md) para troubleshooting detalhado.
