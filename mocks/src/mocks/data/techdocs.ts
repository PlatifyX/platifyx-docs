export interface TreeNode {
  path: string
  name: string
  isDirectory: boolean
  children?: TreeNode[]
}

export interface Document {
  path: string
  name: string
  content: string
  isDirectory: boolean
  size: number
  modifiedTime: string
}

const mockTechDocsTree: TreeNode[] = [
  {
    path: 'guides',
    name: 'guides',
    isDirectory: true,
    children: [
      {
        path: 'guides/getting-started.md',
        name: 'getting-started.md',
        isDirectory: false
      },
      {
        path: 'guides/deployment.md',
        name: 'deployment.md',
        isDirectory: false
      },
      {
        path: 'guides/api',
        name: 'api',
        isDirectory: true,
        children: [
          {
            path: 'guides/api/authentication.md',
            name: 'authentication.md',
            isDirectory: false
          },
          {
            path: 'guides/api/endpoints.md',
            name: 'endpoints.md',
            isDirectory: false
          }
        ]
      }
    ]
  },
  {
    path: 'services',
    name: 'services',
    isDirectory: true,
    children: [
      {
        path: 'services/api-gateway.md',
        name: 'api-gateway.md',
        isDirectory: false
      },
      {
        path: 'services/auth-service.md',
        name: 'auth-service.md',
        isDirectory: false
      },
      {
        path: 'services/payment-service.md',
        name: 'payment-service.md',
        isDirectory: false
      }
    ]
  },
  {
    path: 'architecture.md',
    name: 'architecture.md',
    isDirectory: false
  },
  {
    path: 'README.md',
    name: 'README.md',
    isDirectory: false
  }
]

const mockTechDocsContent: Record<string, string> = {
  'README.md': `# TechDocs

Bem-vindo à documentação técnica da plataforma PlatifyX.

## Estrutura

- \`guides/\` - Guias e tutoriais
- \`services/\` - Documentação dos serviços
- \`architecture.md\` - Arquitetura do sistema

## Contribuindo

Para adicionar ou atualizar documentação, edite os arquivos diretamente nesta interface.
`,

  'architecture.md': `# Arquitetura do Sistema

## Visão Geral

A plataforma PlatifyX é construída usando uma arquitetura de microserviços.

## Componentes Principais

### API Gateway
- Roteamento de requisições
- Autenticação e autorização
- Rate limiting

### Auth Service
- Gerenciamento de usuários
- Autenticação JWT
- OAuth2

### Payment Service
- Processamento de pagamentos
- Integração com Stripe e PayPal
- Gestão de transações
`,

  'guides/getting-started.md': `# Guia de Início Rápido

## Pré-requisitos

- Node.js 18+
- Docker e Docker Compose
- Git

## Instalação

\`\`\`bash
git clone https://github.com/empresa/platifyx.git
cd platifyx
npm install
\`\`\`

## Executando

\`\`\`bash
npm run dev
\`\`\`

## Próximos Passos

- Configure as variáveis de ambiente
- Execute as migrações do banco de dados
- Configure as integrações necessárias
`,

  'guides/deployment.md': `# Guia de Deploy

## Ambientes

### Staging
- URL: https://staging.platifyx.com
- Kubernetes namespace: staging

### Production
- URL: https://platifyx.com
- Kubernetes namespace: production

## Processo de Deploy

1. Criar branch de release
2. Executar testes
3. Build da imagem Docker
4. Deploy no Kubernetes
5. Verificar saúde do serviço
`,

  'guides/api/authentication.md': `# Autenticação da API

## Endpoints de Autenticação

### Login
\`\`\`
POST /api/v1/auth/login
\`\`\`

### Refresh Token
\`\`\`
POST /api/v1/auth/refresh
\`\`\`

## Uso do Token

Inclua o token no header:
\`\`\`
Authorization: Bearer <token>
\`\`\`
`,

  'guides/api/endpoints.md': `# Endpoints da API

## Serviços

### API Gateway
- Base URL: https://api.platifyx.com
- Versão: v1

### Auth Service
- Base URL: https://auth.platifyx.com
- Versão: v1
`,

  'services/api-gateway.md': `# API Gateway

## Descrição

Gateway principal que roteia requisições para os serviços internos.

## Tecnologias

- TypeScript
- Express.js
- Kubernetes

## Configuração

Variáveis de ambiente necessárias:
- \`PORT\`: Porta do serviço
- \`AUTH_SERVICE_URL\`: URL do serviço de autenticação
`,

  'services/auth-service.md': `# Auth Service

## Descrição

Serviço responsável por autenticação e autorização.

## Tecnologias

- Go 1.21
- PostgreSQL
- JWT

## Funcionalidades

- Login e registro
- Gerenciamento de tokens
- OAuth2
`,

  'services/payment-service.md': `# Payment Service

## Descrição

Serviço de processamento de pagamentos.

## Tecnologias

- Python 3.11
- FastAPI
- Stripe API
- PayPal API

## Integrações

- Stripe para cartões de crédito
- PayPal para pagamentos alternativos
`
}

export const getMockTechDocsTree = async (): Promise<{ tree: TreeNode[] }> => {
  await new Promise(resolve => setTimeout(resolve, 300))
  return { tree: mockTechDocsTree }
}

export const getMockTechDocsDocument = async (path: string): Promise<Document> => {
  await new Promise(resolve => setTimeout(resolve, 200))
  const content = mockTechDocsContent[path] || '# Documento\n\nConteúdo do documento...'
  const name = path.split('/').pop() || path
  
  return {
    path,
    name,
    content,
    isDirectory: false,
    size: content.length,
    modifiedTime: new Date().toISOString()
  }
}


