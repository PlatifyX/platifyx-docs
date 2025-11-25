# Guia de Configuração de SSO - PlatifyX

Este guia explica como configurar Single Sign-On (SSO) com Google e Microsoft no PlatifyX.

## Visão Geral

O PlatifyX suporta autenticação SSO via OAuth2 com os seguintes provedores:
- **Google** (Google Workspace / Gmail)
- **Microsoft** (Azure AD / Microsoft 365)

## Pré-requisitos

- Acesso administrativo ao PlatifyX
- Conta de desenvolvedor no provedor desejado (Google Cloud Platform ou Azure AD)

---

## Configurando Google SSO

### 1. Criar Projeto no Google Cloud Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Vá para "APIs & Services" > "Credentials"

### 2. Configurar OAuth Consent Screen

1. Clique em "OAuth consent screen"
2. Selecione "Internal" (para Google Workspace) ou "External"
3. Preencha os dados obrigatórios:
   - **App name**: PlatifyX
   - **User support email**: seu email
   - **Developer contact**: seu email
4. Adicione os scopes necessários:
   - `userinfo.email`
   - `userinfo.profile`
5. Salve e continue

### 3. Criar Credenciais OAuth2

1. Volte para "Credentials"
2. Clique em "Create Credentials" > "OAuth client ID"
3. Selecione "Web application"
4. Configure:
   - **Name**: PlatifyX SSO
   - **Authorized JavaScript origins**:
     - `https://app.platifyx.com` (desenvolvimento)
     - `https://seu-dominio.com` (produção)
   - **Authorized redirect URIs**:
     - `https://api.platifyx.com/api/v1/auth/callback/google` (desenvolvimento)
     - `https://api.seu-dominio.com/api/v1/auth/callback/google` (produção)
5. Clique em "Create"
6. **Copie o Client ID e Client Secret**

### 4. Configurar no PlatifyX

Opção 1 - Via UI (Settings):
1. Acesse PlatifyX como administrador
2. Vá para "Settings" > "SSO"
3. Clique em "Configure Google SSO"
4. Preencha:
   - **Client ID**: cole o valor copiado
   - **Client Secret**: cole o valor copiado
   - **Redirect URI**: `https://api.platifyx.com/api/v1/auth/callback/google`
   - **Allowed Domains** (opcional): `exemplo.com` (restringe login apenas a emails deste domínio)
5. Marque "Enabled"
6. Salve

Opção 2 - Via SQL (desenvolvimento):
```sql
INSERT INTO sso_configs (provider, enabled, client_id, client_secret, redirect_uri, allowed_domains, created_at, updated_at)
VALUES (
    'google',
    true,
    'SEU_CLIENT_ID.apps.googleusercontent.com',
    'SEU_CLIENT_SECRET',
    'https://api.platifyx.com/api/v1/auth/callback/google',
    '["exemplo.com"]',  -- opcional, deixe '[]' para permitir todos
    NOW(),
    NOW()
);
```

---

## Configurando Microsoft SSO

### 1. Registrar Aplicação no Azure AD

1. Acesse [Azure Portal](https://portal.azure.com/)
2. Vá para "Azure Active Directory"
3. Clique em "App registrations" > "New registration"

### 2. Configurar App Registration

1. Preencha os dados:
   - **Name**: PlatifyX
   - **Supported account types**:
     - **Single tenant**: apenas sua organização
     - **Multi-tenant**: qualquer organização Azure AD
   - **Redirect URI**:
     - Platform: Web
     - URI: `https://api.platifyx.com/api/v1/auth/callback/microsoft`
2. Clique em "Register"
3. **Copie o Application (client) ID**
4. **Copie o Directory (tenant) ID**

### 3. Criar Client Secret

1. No menu lateral, clique em "Certificates & secrets"
2. Clique em "New client secret"
3. Adicione uma descrição e escolha a validade
4. Clique em "Add"
5. **Copie o Value (client secret)** - não será mostrado novamente!

### 4. Configurar Permissões API

1. No menu lateral, clique em "API permissions"
2. Clique em "Add a permission"
3. Selecione "Microsoft Graph"
4. Selecione "Delegated permissions"
5. Adicione as permissões:
   - `User.Read`
   - `email`
   - `profile`
   - `openid`
6. Clique em "Add permissions"
7. (Opcional) Clique em "Grant admin consent" para sua organização

### 5. Configurar no PlatifyX

Opção 1 - Via UI (Settings):
1. Acesse PlatifyX como administrador
2. Vá para "Settings" > "SSO"
3. Clique em "Configure Microsoft SSO"
4. Preencha:
   - **Client ID**: Application (client) ID
   - **Client Secret**: client secret value
   - **Tenant ID**: Directory (tenant) ID
   - **Redirect URI**: `https://api.platifyx.com/api/v1/auth/callback/microsoft`
   - **Allowed Domains** (opcional): `exemplo.com`
5. Marque "Enabled"
6. Salve

Opção 2 - Via SQL (desenvolvimento):
```sql
INSERT INTO sso_configs (provider, enabled, client_id, client_secret, tenant_id, redirect_uri, allowed_domains, created_at, updated_at)
VALUES (
    'microsoft',
    true,
    'SEU_APPLICATION_CLIENT_ID',
    'SEU_CLIENT_SECRET',
    'SEU_TENANT_ID',  -- ou 'common' para multi-tenant
    'https://api.platifyx.com/api/v1/auth/callback/microsoft',
    '["exemplo.com"]',  -- opcional, deixe '[]' para permitir todos
    NOW(),
    NOW()
);
```

---

## Testando a Configuração

### 1. Teste Via Navegador

1. Acesse a página de login: `https://app.platifyx.com/login`
2. Clique no botão "Google" ou "Microsoft"
3. Você será redirecionado para a página de autenticação do provedor
4. Faça login com suas credenciais
5. Autorize a aplicação
6. Você será redirecionado de volta ao PlatifyX e autenticado automaticamente

### 2. Verificar Logs

Backend:
```bash
# Ver logs de autenticação SSO
tail -f backend/logs/platifyx.log | grep sso
```

Banco de Dados:
```sql
-- Ver sessões criadas via SSO
SELECT u.email, u.name, u.sso_provider, s.created_at
FROM users u
JOIN sessions s ON u.id = s.user_id
WHERE u.is_sso = true
ORDER BY s.created_at DESC;

-- Ver logs de auditoria de SSO
SELECT user_email, action, status, created_at
FROM audit_logs
WHERE action LIKE '%sso%'
ORDER BY created_at DESC;
```

---

## Troubleshooting

### Erro: "SSO provider not configured or disabled"

**Causa**: Configuração SSO não existe ou está desabilitada

**Solução**:
```sql
-- Verificar configuração
SELECT * FROM sso_configs WHERE provider = 'google';

-- Habilitar se existir
UPDATE sso_configs SET enabled = true WHERE provider = 'google';
```

### Erro: "redirect_uri_mismatch"

**Causa**: A URL de callback no provedor não corresponde à configurada

**Solução**:
1. Verifique o Redirect URI no provedor (Google Console / Azure Portal)
2. Deve ser EXATAMENTE: `https://api.platifyx.com/api/v1/auth/callback/{provider}`
3. Não pode ter trailing slash ou diferenças de protocolo (http vs https)

### Erro: "Email domain not allowed"

**Causa**: O domínio do email não está na lista de domínios permitidos

**Solução**:
```sql
-- Ver domínios permitidos
SELECT provider, allowed_domains FROM sso_configs;

-- Adicionar domínio ou permitir todos
UPDATE sso_configs
SET allowed_domains = '["exemplo.com", "outro-dominio.com"]'
WHERE provider = 'google';

-- Ou permitir todos os domínios
UPDATE sso_configs
SET allowed_domains = '[]'
WHERE provider = 'google';
```

### Erro: "invalid_client" (Microsoft)

**Causa**: Client ID ou Client Secret incorretos, ou secret expirado

**Solução**:
1. Verifique o Client ID no Azure Portal
2. Crie um novo Client Secret se o anterior expirou
3. Atualize no PlatifyX com o novo secret

### Usuário criado mas sem permissões

**Causa**: Usuários SSO são criados sem roles por padrão

**Solução**:
```sql
-- Atribuir role ao usuário
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
CROSS JOIN roles r
WHERE u.email = 'usuario@exemplo.com'
  AND r.name = 'developer';  -- ou 'admin', 'platform_engineer', 'viewer'
```

---

## Segurança

### Recomendações

1. **Use HTTPS em produção**
   - SSO requer HTTPS para segurança
   - Configure certificado SSL/TLS no servidor

2. **Restrinja domínios permitidos**
   - Configure `allowed_domains` para permitir apenas emails da sua organização
   - Exemplo: `["minhaempresa.com"]`

3. **Rotacione Client Secrets periodicamente**
   - Google: recomenda-se rotação anual
   - Microsoft: configure expiração e rotacione antes

4. **Monitore logs de auditoria**
   - Revise regularmente os logs de SSO
   - Detecte tentativas de acesso não autorizadas

5. **Configure MFA no provedor**
   - Exija autenticação multifator no Google Workspace / Azure AD
   - Adiciona camada extra de segurança

### State Token Validation

✅ **IMPLEMENTADO**: O sistema agora valida state tokens para prevenir ataques CSRF:
1. ✅ State tokens criptográficos de 32 bytes são gerados ao iniciar o fluxo SSO
2. ✅ Tokens armazenados no Redis com TTL de 5 minutos
3. ✅ Validação no callback verifica se o state recebido corresponde ao armazenado
4. ✅ Tokens são deletados após uso (proteção contra reuso)
5. ✅ Tokens expirados são automaticamente removidos

**Como funciona:**
- Ao clicar em "Login com Google/Microsoft", um state token único é gerado
- O token é armazenado no Redis com a chave `sso:state:{token}`
- O usuário é redirecionado para o provedor OAuth2 com o state
- No callback, o backend valida se o state recebido existe no cache e corresponde ao provedor
- Se inválido ou expirado, o usuário é redirecionado para `/login` com erro
- Se válido, o token é deletado e a autenticação prossegue

---

## Produção

### Checklist de Deploy

- [ ] Configurar HTTPS
- [ ] Atualizar Redirect URIs para domínio de produção
- [ ] Configurar `allowed_domains` adequadamente
- [x] Implementar validação de state token ✅
- [x] Configurar rate limiting nos endpoints SSO ✅
- [ ] Configurar Redis persistente para produção
- [ ] Configurar monitoramento e alertas
- [ ] Testar fluxo completo em staging
- [ ] Documentar para usuários finais
- [ ] Configurar backup das configurações SSO

### URLs de Produção

Backend API: `https://api.seu-dominio.com`
Frontend: `https://seu-dominio.com`

Redirect URIs:
- Google: `https://api.seu-dominio.com/api/v1/auth/callback/google`
- Microsoft: `https://api.seu-dominio.com/api/v1/auth/callback/microsoft`

---

## Suporte

Para dúvidas ou problemas:
1. Consulte os logs de auditoria
2. Verifique a documentação do provedor:
   - [Google OAuth2](https://developers.google.com/identity/protocols/oauth2)
   - [Microsoft Identity Platform](https://docs.microsoft.com/en-us/azure/active-directory/develop/)
3. Abra uma issue no repositório do projeto
