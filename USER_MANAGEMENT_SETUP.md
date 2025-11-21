# Sistema de Gerenciamento de Usuários - PlatifyX

## Visão Geral

Sistema completo de gerenciamento de usuários com autenticação, autorização baseada em roles (RBAC), gerenciamento de equipes, SSO e auditoria.

## Funcionalidades

### ✅ Implementadas

- **Autenticação**
  - Login com email/senha
  - JWT tokens com refresh
  - Sessões gerenciadas
  - Suporte a SSO (Google, Microsoft)

- **RBAC (Role-Based Access Control)**
  - Roles padrão: Admin, Developer, Viewer, Platform Engineer
  - Permissões granulares por recurso e ação
  - Roles customizados
  - Controle de acesso baseado em permissões

- **Gerenciamento de Usuários**
  - CRUD completo
  - Usuários locais e SSO
  - Status ativo/inativo
  - Múltiplos roles por usuário
  - Associação a equipes

- **Gerenciamento de Equipes**
  - CRUD de equipes
  - Membros com roles (owner, admin, member)
  - Associação de usuários

- **SSO (Single Sign-On)**
  - Google OAuth2
  - Microsoft Azure AD
  - Domínios permitidos configuráveis

- **Auditoria**
  - Log de todas as ações
  - Rastreamento de IP e user-agent
  - Filtros avançados
  - Estatísticas

## Configuração

### 1. Variáveis de Ambiente

#### Backend (`backend/.env`)

```bash
# Authentication & Security
JWT_SECRET=your-secret-key-change-in-production-use-strong-random-string
SESSION_TIMEOUT=86400  # 24 horas em segundos

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:7000,http://localhost:5173

# Frontend URL (usado para callbacks SSO)
FRONTEND_URL=http://localhost:7000
```

#### Frontend (`frontend/.env`)

```bash
# API Base URL
VITE_API_BASE_URL=http://localhost:8060

# Application Base URL (usado para callbacks SSO)
VITE_APP_BASE_URL=http://localhost:7000

# API Version
VITE_API_VERSION=v1
```

### 2. Banco de Dados

Execute a migration:

```bash
cd backend
# A migration será executada automaticamente no start
# Ou execute manualmente:
psql -U platifyx -d platifyx -f migrations/009_create_user_management.sql
```

A migration cria:
- Tabelas: users, roles, permissions, teams, sessions, sso_configs, audit_logs
- Roles padrão com permissões
- Índices otimizados

### 3. Configuração de SSO

#### Google OAuth2

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um projeto ou selecione um existente
3. Ative a API "Google+ API"
4. Vá em "Credentials" → "Create Credentials" → "OAuth client ID"
5. Tipo: "Web application"
6. Authorized redirect URIs: `http://localhost:7000/auth/callback/google`
7. Copie o Client ID e Client Secret

#### Microsoft Azure AD

1. Acesse [Azure Portal](https://portal.azure.com/)
2. Vá em "Azure Active Directory" → "App registrations"
3. Clique em "New registration"
4. Nome: "PlatifyX"
5. Redirect URI: `http://localhost:7000/auth/callback/microsoft`
6. Em "Certificates & secrets", crie um novo client secret
7. Copie o Application (client) ID, Client Secret e Tenant ID

#### Configurar no Sistema

1. Acesse http://localhost:7000/settings
2. Vá na aba "SSO"
3. Configure as credenciais do provedor
4. Defina os domínios permitidos
5. Ative o provedor

### 4. Criar Primeiro Usuário Admin

```sql
-- Conectar ao banco
psql -U platifyx -d platifyx

-- Criar usuário admin (senha: admin123)
INSERT INTO users (email, name, password_hash, is_active, is_sso)
VALUES (
  'admin@platifyx.com',
  'Administrator',
  '$2a$10$YourHashedPasswordHere',  -- Use bcrypt para gerar
  true,
  false
);

-- Associar role admin
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.email = 'admin@platifyx.com'
  AND r.name = 'admin';
```

## Uso

### Acessar a Página de Configurações

```
http://localhost:7000/settings
```

### Abas Disponíveis

1. **Usuários** - Gerenciar usuários do sistema
2. **Roles & Permissões** - Gerenciar roles e permissões RBAC
3. **Equipes** - Gerenciar equipes e membros
4. **SSO** - Configurar provedores de SSO
5. **Auditoria** - Visualizar logs de auditoria

### API Endpoints

Todos os endpoints requerem autenticação via Bearer token JWT.

#### Autenticação

```bash
# Login
POST /api/v1/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

# Refresh Token
POST /api/v1/auth/refresh
{
  "refresh_token": "..."
}

# Logout
POST /api/v1/auth/logout

# Get Current User
GET /api/v1/auth/me

# Get User Permissions
GET /api/v1/auth/permissions
```

#### Usuários

```bash
# Listar usuários
GET /api/v1/settings/users?search=&page=1&size=20

# Buscar usuário
GET /api/v1/settings/users/:id

# Criar usuário
POST /api/v1/settings/users
{
  "email": "user@example.com",
  "name": "User Name",
  "password": "password123",
  "role_ids": ["role-uuid"],
  "team_ids": ["team-uuid"]
}

# Atualizar usuário
PUT /api/v1/settings/users/:id
{
  "name": "New Name",
  "is_active": true
}

# Deletar usuário
DELETE /api/v1/settings/users/:id

# Estatísticas
GET /api/v1/settings/users/stats
```

#### Roles

```bash
# Listar roles
GET /api/v1/settings/roles

# Buscar role
GET /api/v1/settings/roles/:id

# Criar role
POST /api/v1/settings/roles
{
  "name": "custom-role",
  "display_name": "Custom Role",
  "description": "Description",
  "permission_ids": ["perm-uuid"]
}

# Atualizar role
PUT /api/v1/settings/roles/:id

# Deletar role
DELETE /api/v1/settings/roles/:id
```

#### Equipes

```bash
# Listar equipes
GET /api/v1/settings/teams

# Criar equipe
POST /api/v1/settings/teams
{
  "name": "team-name",
  "display_name": "Team Name",
  "description": "Description",
  "member_ids": ["user-uuid"]
}

# Adicionar membro
POST /api/v1/settings/teams/:id/members
{
  "user_ids": ["user-uuid"],
  "role": "member"
}

# Remover membro
DELETE /api/v1/settings/teams/:id/members/:userId
```

#### SSO

```bash
# Listar configurações SSO
GET /api/v1/settings/sso

# Criar/Atualizar configuração SSO
POST /api/v1/settings/sso
{
  "provider": "google",
  "enabled": true,
  "client_id": "...",
  "client_secret": "...",
  "redirect_uri": "http://localhost:7000/auth/callback/google",
  "allowed_domains": ["example.com"]
}
```

#### Auditoria

```bash
# Listar logs
GET /api/v1/settings/audit?action=&resource=&status=&page=1&size=50

# Estatísticas
GET /api/v1/settings/audit/stats?start_date=&end_date=
```

## Segurança

### Boas Práticas

1. **JWT Secret**
   - Use uma string aleatória forte (mínimo 32 caracteres)
   - Nunca commite o secret no código
   - Gere com: `openssl rand -base64 32`

2. **Senhas**
   - Mínimo 8 caracteres
   - Use bcrypt para hash
   - Implemente política de senha forte

3. **HTTPS**
   - Use HTTPS em produção
   - Configure certificados SSL/TLS
   - Force redirect HTTP → HTTPS

4. **CORS**
   - Configure apenas origens confiáveis
   - Em produção, remova localhost

5. **Rate Limiting**
   - Implemente rate limiting nos endpoints de auth
   - Use Redis para controle distribuído

6. **Auditoria**
   - Monitore logs de falhas de login
   - Configure alertas para atividades suspeitas
   - Revise logs regularmente

## Permissões Padrão

### Recursos e Ações

| Recurso | Ações |
|---------|-------|
| users | read, write, delete, manage |
| teams | read, write, delete, manage |
| roles | read, write, delete, manage |
| sso | read, write, manage |
| audit | read, export |
| services | read, write, delete |
| kubernetes | read, write, delete |
| integrations | read, write, delete, manage |
| observability | read, write |
| cicd | read, write |
| finops | read, write |

### Roles Padrão

| Role | Descrição | Permissões |
|------|-----------|------------|
| **admin** | Administrador | Todas as permissões |
| **developer** | Desenvolvedor | Read/Write em services, kubernetes, integrations, observability, cicd, finops, teams |
| **viewer** | Visualizador | Apenas leitura em todos os recursos |
| **platform-engineer** | Engenheiro de Plataforma | Full access em infrastructure, read em audit e finops |

## Próximos Passos

### Para Integração Completa

1. **Atualizar `main.go`** para incluir as novas rotas:
   ```go
   // Adicionar no setupRouter()
   settings := v1.Group("/settings")
   settings.Use(middleware.AuthMiddleware(authService))
   {
       settings.GET("/users", handlers.SettingsHandler.ListUsers)
       // ... outros endpoints
   }
   ```

2. **Atualizar `service_manager.go`** para inicializar os services:
   ```go
   // Adicionar repositories
   userRepo := repository.NewUserRepository(db)
   roleRepo := repository.NewRoleRepository(db)
   // ...

   // Adicionar services
   authService := service.NewAuthService(userRepo, sessionRepo, auditRepo, cfg.JWTSecret)
   userService := service.NewUserService(userRepo, auditRepo)
   ```

3. **Conectar Frontend com API**
   - Remover mock data dos componentes
   - Usar `settingsApi.ts` para chamadas reais
   - Implementar tratamento de erros
   - Adicionar loading states

4. **Implementar Formulários Completos**
   - Modal de criação de usuário
   - Modal de edição de usuário
   - Formulários de roles e teams
   - Validação de campos

## Troubleshooting

### Erro: "Invalid JWT"
- Verifique se JWT_SECRET está configurado
- Verifique se o token não expirou
- Verifique formato do header Authorization: "Bearer <token>"

### Erro: "Permission denied"
- Verifique as permissões do usuário
- Verifique se o role tem as permissões necessárias
- Verifique se o usuário está ativo

### Erro: "SSO config not found"
- Configure o SSO na aba SSO
- Verifique se o provedor está habilitado
- Verifique as credenciais OAuth

## Suporte

Para mais informações, consulte:
- [Documentação do Backend](./backend/README.md)
- [Documentação do Frontend](./frontend/README.md)
- [Issues no GitHub](https://github.com/PlatifyX/platifyx-docs/issues)
