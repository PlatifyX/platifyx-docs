# Sistema de Autenticação - PlatifyX

## Visão Geral

O PlatifyX agora possui um sistema completo de autenticação com JWT (JSON Web Tokens), proteção de rotas e gerenciamento de sessões.

## Funcionalidades Implementadas

### Frontend

1. **Página de Login** (`/login`)
   - Interface moderna e responsiva
   - Validação de formulário
   - Feedback de erros em tempo real
   - Loading state durante autenticação
   - Credenciais padrão visíveis em desenvolvimento

2. **Contexto de Autenticação** (`AuthContext`)
   - Gerenciamento global do estado de autenticação
   - Verificação automática de sessão ao carregar a aplicação
   - Métodos `login()` e `logout()`
   - Hook `useAuth()` para acesso fácil em qualquer componente

3. **Proteção de Rotas** (`PrivateRoute`)
   - Todas as rotas principais estão protegidas
   - Redirecionamento automático para `/login` se não autenticado
   - Loading state durante verificação de autenticação

4. **Header Atualizado**
   - Exibe nome do usuário logado
   - Menu dropdown com opções de perfil
   - Botão de logout
   - Navegação para configurações

### Backend

O backend já possui toda a infraestrutura necessária:

1. **Endpoints de Autenticação** (`/api/v1/auth`)
   - `POST /login` - Autenticação com email/senha
   - `POST /logout` - Encerramento de sessão
   - `POST /refresh` - Renovação de token
   - `GET /me` - Obter dados do usuário autenticado
   - `POST /change-password` - Alteração de senha

2. **Sistema RBAC (Role-Based Access Control)**
   - 4 roles padrão: Admin, Platform Engineer, Developer, Viewer
   - Permissões granulares por recurso e ação
   - Middleware de autorização

3. **Banco de Dados**
   - Tabela `users` com suporte a SSO
   - Tabela `sessions` para gerenciamento de tokens
   - Tabela `roles` e `permissions` para RBAC

## Fluxo de Autenticação

```
1. Usuário acessa http://localhost:7000/
   ↓
2. Sistema verifica se há token no localStorage
   ↓
3a. Se NÃO autenticado → Redireciona para /login
3b. Se autenticado → Redireciona para /home
   ↓
4. Usuário faz login com credenciais
   ↓
5. Backend valida e retorna token JWT
   ↓
6. Frontend armazena token e redireciona para /home
   ↓
7. Todas as requisições subsequentes incluem o token no header
```

## Credenciais Padrão

Para desenvolvimento, use as seguintes credenciais:

- **Email**: `admin@platifyx.com`
- **Senha**: `admin123`
- **Role**: Administrator (acesso completo)

> ⚠️ **IMPORTANTE**: Altere a senha padrão em ambientes de produção!

## Estrutura de Rotas

### Rotas Públicas
- `/` - Redireciona para `/login` ou `/home` dependendo da autenticação
- `/login` - Página de autenticação

### Rotas Protegidas (requerem autenticação)
- `/home` - Página inicial
- `/dashboard` - Dashboard principal
- `/services` - Catálogo de serviços
- `/kubernetes` - Gerenciamento de clusters
- `/repos` - Repositórios e código
- `/ci` - Azure DevOps e pipelines
- `/observability` - Grafana, Prometheus, Loki
- `/quality` - SonarQube e qualidade
- `/finops` - Análise de custos
- `/integrations` - Gerenciamento de integrações
- `/techdocs` - Documentação técnica
- `/infrastructure-templates` - Templates de infraestrutura
- `/settings` - Configurações e user management

## Componentes Criados

### 1. AuthContext (`frontend/src/contexts/AuthContext.tsx`)

```typescript
interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}
```

**Uso:**
```typescript
import { useAuth } from '../contexts/AuthContext'

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth()
  // ...
}
```

### 2. PrivateRoute (`frontend/src/components/PrivateRoute.tsx`)

Protege rotas que requerem autenticação.

**Uso:**
```typescript
<Route path="/protected" element={
  <PrivateRoute>
    <MyProtectedPage />
  </PrivateRoute>
} />
```

### 3. LoginPage (`frontend/src/pages/LoginPage.tsx`)

Página de login com design moderno usando TailwindCSS.

## Como Testar

### 1. Iniciar o Backend

```bash
cd backend
go run cmd/api/main.go
```

O backend estará disponível em `http://localhost:8060`

### 2. Iniciar o Frontend

```bash
cd frontend
npm install  # se ainda não instalou
npm run dev
```

O frontend estará disponível em `http://localhost:7000`

### 3. Testar o Fluxo

1. Acesse `http://localhost:7000/`
2. Você será redirecionado para `/login`
3. Use as credenciais padrão:
   - Email: `admin@platifyx.com`
   - Senha: `admin123`
4. Após login, você será redirecionado para `/home`
5. Teste o logout clicando no menu do usuário no canto superior direito

### 4. Verificar Proteção de Rotas

1. Estando autenticado, copie a URL de qualquer página
2. Faça logout
3. Tente acessar a URL copiada
4. Você deve ser redirecionado para `/login`

## Troubleshooting

### Problema: "Login falhou" ou erro 401

**Possíveis causas:**
1. Backend não está rodando
2. Migrações do banco não foram executadas
3. Credenciais incorretas

**Solução:**
```bash
# Verificar se o backend está rodando
curl http://localhost:8060/health

# Verificar logs do backend
# Se necessário, executar migrações manualmente
```

### Problema: Redirecionamento infinito

**Possível causa:** Token corrompido no localStorage

**Solução:**
```javascript
// No console do navegador:
localStorage.removeItem('token')
location.reload()
```

### Problema: CORS errors

**Possível causa:** Frontend e backend em domínios diferentes

**Solução:** Verificar configuração de CORS no backend (`backend/cmd/api/main.go`)

## Próximos Passos

- [ ] Implementar "Esqueci minha senha"
- [ ] Adicionar autenticação de dois fatores (2FA)
- [ ] Implementar SSO com Google/Microsoft
- [ ] Adicionar rate limiting no endpoint de login
- [ ] Implementar refresh automático de token
- [ ] Adicionar logs de auditoria para logins
- [ ] Implementar expiração de sessão por inatividade

## Segurança

### Implementado
- ✅ Senhas armazenadas com bcrypt hash
- ✅ Tokens JWT com expiração
- ✅ HTTPS recomendado para produção
- ✅ Tokens armazenados apenas no localStorage (não em cookies)
- ✅ Validação de token em todas as requisições

### Recomendações para Produção
1. Alterar senha padrão do admin
2. Configurar HTTPS
3. Implementar rate limiting
4. Adicionar logs de auditoria
5. Configurar políticas de senha forte
6. Implementar refresh token rotation
7. Adicionar blacklist de tokens revogados

## Suporte

Para dúvidas ou problemas, consulte:
- Backend API: `/api/v1/auth` endpoints
- Logs do backend: `backend/logs/`
- Console do navegador para erros de frontend
