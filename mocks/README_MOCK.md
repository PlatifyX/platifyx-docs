# Frontend Mockado - PlatifyX

Este é um frontend totalmente mockado do PlatifyX para demonstração ao cliente. Todos os dados são gerados localmente e nenhuma chamada real à API é realizada.

## 🎯 Propósito

Este frontend mockado permite demonstrar todas as funcionalidades da plataforma PlatifyX sem necessidade de:
- Backend ativo
- Bancoconfigurado
- Integrações com serviços externos
- Credenciais reais

## 📋 Características

### Dados Mockados Incluem:

- ✅ **Autenticação**: Login funciona com qualquer email/senha
- ✅ **Serviços**: Lista de 5 microserviços com métricas
- ✅ **Kubernetes**: Clusters, namespaces e pods
- ✅ **Repositórios**: 6 repositórios do GitHub com estatísticas
- ✅ **FinOps**: Custos, otimizações e recomendações
- ✅ **Integrações**: GitHub, Azure DevOps, Jira, Slack, etc.
- ✅ **Quality**: Métricas de código, vulnerabilidades
- ✅ **Observability**: Logs, alertas e métricas
- ✅ **AI Providers**: OpenAI, Anthropic, Google AI

## 🚀 Como Usar

### Instalação

```bash
cd mocks
npm install
```

### Desenvolvimento

```bash
npm run dev
```

O frontend estará disponível em `http://localhost:5173`

### Build para Produção

```bash
npm run build
```

Os arquivos de build estarão em `mocks/dist/`

### Preview do Build

```bash
npm run preview
```

## 🔐 Login

**Qualquer combinação de email e senha funciona!**

Exemplos:
- Email: `demo@platifyx.com` / Senha: `qualquer`
- Email: `admin@example.com` / Senha: `123456`

Após o login, você verá o usuário mockado:
- Nome: João Silva
- Email: joao.silva@example.com
- Role: admin

## 📊 Dados de Demonstração

Todos os dados são realistas e representam um ambiente de produção típico:

### Serviços
- api-gateway (healthy, 99.98% uptime)
- auth-service (healthy, 99.95% uptime)
- payment-service (warning, 99.85% uptime)
- notification-service (healthy, 99.92% uptime)
- user-service (healthy, 99.97% uptime)

### Clusters Kubernetes
- Production US East (12 nodes, 156 pods)
- Production EU West (10 nodes, 128 pods)
- Staging (5 nodes, 42 pods)

### FinOps
- Custo mensal: $45,678.90
- Economia potencial: $11,091.80
- 4 recomendações de otimização

## 🎨 Customização

Para modificar os dados mockados, edite os arquivos em:

```
mocks/src/mocks/data/
├── auth.ts              # Dados de autenticação
├── services.ts          # Microserviços
├── kubernetes.ts        # Clusters e pods
├── repositories.ts      # Repositórios GitHub
├── finops.ts           # Custos e FinOps
├── integrations.ts      # Integrações
├── quality.ts           # Qualidade de código
├── observability.ts     # Logs e métricas
└── aiProviders.ts       # Provedores de IA
```

## 🔧 Diferenças do Frontend Real

1. **Sem Backend**: Todas as chamadas de API são interceptadas e retornam dados mockados
2. **Latência Simulada**: Delays artificiais (200-800ms) simulam chamadas de rede
3. **Dados Estáticos**: Os dados não mudam entre reloads (exceto timestamps)
4. **Sem Persistência**: Alterações não são salvas

## 📦 Estrutura de Arquivos

```
mocks/
├── src/
│   ├── mocks/
│   │   └── data/          # Todos os dados mockados
│   ├── services/          # Serviços modificados para usar mocks
│   ├── contexts/          # Contextos (Auth modificado)
│   ├── pages/             # Páginas da aplicação
│   └── components/        # Componentes React
├── public/                # Arquivos estáticos
└── package.json           # Dependências
```

## 🎭 Cenários de Demonstração

### 1. Dashboard Overview
Mostre visão geral com métricas de todos os serviços

### 2. FinOps
Demonstre análise de custos e recomendações de otimização

### 3. Kubernetes
Navegue pelos clusters e visualize pods em execução

### 4. Qualidade
Veja métricas de código e vulnerabilidades

### 5. Observability
Explore logs em tempo real e alertas ativos

### 6. TechDocs
Gere documentação com IA (resposta mockada instantânea)

## ⚠️ Limitações

- Não há validação real de dados
- Operações de CRUD não persistem
- Webhooks e integrações externas não funcionam
- SSO não está implementado

## 📝 Notas

Este frontend é **apenas para demonstração**. Para um ambiente de produção, use o frontend principal em `/frontend` com o backend completo.

## 🤝 Suporte

Para dúvidas sobre este frontend mockado, consulte a equipe de desenvolvimento.
