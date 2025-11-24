export const mockAIProviders = [
  {
    provider: 'openai',
    name: 'OpenAI',
    available: true,
    models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo']
  },
  {
    provider: 'anthropic',
    name: 'Anthropic',
    available: true,
    models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku']
  },
  {
    provider: 'google',
    name: 'Google AI',
    available: true,
    models: ['gemini-pro', 'gemini-pro-vision']
  },
  {
    provider: 'azure',
    name: 'Azure OpenAI',
    available: false,
    models: []
  }
]

export const getMockAIProviders = async () => {
  await new Promise(resolve => setTimeout(resolve, 300))
  return mockAIProviders
}

export const mockGenerateDocumentation = async (request: any) => {
  await new Promise(resolve => setTimeout(resolve, 2000))

  const progressId = 'progress-' + Math.random().toString(36).substr(2, 9)

  return {
    id: progressId,
    status: 'completed' as const,
    percent: 100,
    chunk: 10,
    totalChunks: 10,
    message: 'Documentação gerada com sucesso',
    provider: request.provider,
    model: request.model,
    docType: request.docType,
    source: request.source,
    resultContent: `# Documentação do Projeto

## Visão Geral
Este é um documento de exemplo gerado automaticamente para demonstração.

## Arquitetura
A arquitetura do sistema segue os princípios de microserviços com os seguintes componentes principais:

### API Gateway
- Responsável pelo roteamento de requisições
- Implementa autenticação e autorização
- Rate limiting e cache

### Serviços
- **Auth Service**: Gerenciamento de autenticação
- **Payment Service**: Processamento de pagamentos
- **Notification Service**: Envio de notificações
- **User Service**: Gerenciamento de usuários

## Tecnologias Utilizadas
- Node.js / TypeScript
- React
- PostgreSQL
- Redis
- Kubernetes
- AWS

## Como Executar

\`\`\`bash
# Instalar dependências
npm install

# Iniciar em modo de desenvolvimento
npm run dev

# Build para produção
npm run build
\`\`\`

## Testes

\`\`\`bash
# Executar testes
npm test

# Executar com coverage
npm run test:coverage
\`\`\`

## Deploy
O deploy é automatizado via CI/CD usando Azure DevOps.

## Contribuindo
1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request
`,
    startedAt: new Date(Date.now() - 2000).toISOString(),
    updatedAt: new Date().toISOString()
  }
}

export const mockImproveDocumentation = async (request: any) => {
  await new Promise(resolve => setTimeout(resolve, 1500))

  return {
    provider: request.provider,
    model: request.model || 'gpt-4',
    content: `${request.content}\n\n## Melhorias Aplicadas\n- Estrutura reorganizada para melhor legibilidade\n- Adicionados exemplos práticos\n- Incluídas melhores práticas\n- Corrigidos erros de formatação\n- Adicionados diagramas quando apropriado`,
    usage: {
      inputTokens: 850,
      outputTokens: 1200,
      totalTokens: 2050
    }
  }
}

export const mockChat = async (request: any) => {
  await new Promise(resolve => setTimeout(resolve, 1000))

  const responses = [
    'Com base na análise do código, recomendo implementar validação de entrada mais robusta no endpoint de pagamentos.',
    'O serviço de autenticação está bem estruturado. Considere adicionar suporte a refresh tokens para melhor experiência do usuário.',
    'Para melhorar a performance, sugiro implementar cache em Redis para as consultas mais frequentes.',
    'A arquitetura de microserviços está bem desenhada. Recomendo adicionar circuit breakers para melhor resiliência.',
    'Identifiquei algumas oportunidades de refatoração para reduzir duplicação de código e melhorar manutenibilidade.'
  ]

  const randomResponse = responses[Math.floor(Math.random() * responses.length)]

  return {
    provider: request.provider,
    model: request.model || 'gpt-4',
    content: randomResponse,
    usage: {
      inputTokens: 420,
      outputTokens: 280,
      totalTokens: 700
    }
  }
}
