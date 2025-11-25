# Engenharia Inteligente (Autonomous Platform)

Sistema de recomendações automáticas, troubleshooting assistido por IA e ações autonômicas para a plataforma PlatifyX.

## 🎯 Funcionalidades Implementadas

### 1. **Recomendações Automáticas**
Sistema que analisa continuamente a infraestrutura e gera recomendações proativas.

**Endpoint:** `GET /api/v1/autonomous/recommendations`

**Exemplo de resposta:**
```json
{
  "recommendations": [
    {
      "id": "deployment-app-1234567890",
      "type": "deployment",
      "severity": "high",
      "title": "Deployment app com 25% de falha",
      "description": "O deployment app está com apenas 3/4 réplicas prontas",
      "reason": "Taxa de falha de 25.0% detectada",
      "action": "Sugerir rollback e ajuste no readiness probe",
      "impact": "Alta - Pode causar downtime do serviço",
      "confidence": 0.85,
      "metadata": {
        "namespace": "production",
        "deployment": "app",
        "replicas": 4,
        "readyReplicas": 3,
        "failureRate": 25.0
      },
      "createdAt": "2025-11-23T10:00:00Z"
    }
  ],
  "total": 1
}
```

**Tipos de recomendações:**
- **Deployment**: Detecta falhas em deployments (ex: 20%+ de réplicas falhando)
- **Cost**: Detecta spikes de custo acima da média
- **Security**: (Futuro) Vulnerabilidades e configurações inseguras
- **Performance**: (Futuro) Problemas de performance
- **Reliability**: (Futuro) Problemas de confiabilidade

### 2. **Assistente de Troubleshooting**
IA que analisa problemas e fornece soluções baseadas em contexto.

**Endpoint:** `POST /api/v1/autonomous/troubleshoot`

**Request:**
```json
{
  "question": "Por que meu deploy falhou?",
  "serviceName": "my-app",
  "namespace": "production",
  "deployment": "my-app-deployment",
  "context": {
    "errorMessage": "ImagePullBackOff",
    "recentChanges": "Atualização de imagem"
  }
}
```

**Response:**
```json
{
  "answer": "Análise completa do problema...",
  "confidence": 0.8,
  "rootCause": "A imagem Docker não está disponível no registry",
  "solution": "Verificar se a imagem foi buildada e pushada corretamente",
  "evidence": [
    "Pod status: ImagePullBackOff",
    "Events: Failed to pull image"
  ],
  "relatedLogs": [],
  "relatedMetrics": {},
  "actions": [
    {
      "type": "check",
      "description": "Verificar logs do pod",
      "command": "kubectl logs -n production my-app-pod-xxx",
      "autoExecute": false
    }
  ]
}
```

**Como funciona:**
1. Coleta contexto automático (deployments, pods, builds recentes)
2. Envia para IA com contexto estruturado
3. IA analisa e retorna causa raiz + solução
4. Sistema sugere ações específicas

### 3. **Ações Autonômicas**
Sistema que pode executar ações automaticamente (com aprovação).

**Endpoint:** `POST /api/v1/autonomous/actions/execute`

**Request:**
```json
{
  "type": "rollback",
  "description": "Rollback do deployment app devido a alta taxa de falha",
  "parameters": {
    "deployment": "app",
    "namespace": "production",
    "revision": "previous"
  },
  "autoExecute": false
}
```

**Tipos de ações suportadas:**
- `rollback`: Reverter deployment para versão anterior
- `scale`: Escalar réplicas de um deployment
- `restart`: Reiniciar pods de um deployment

**Configuração:**
```json
{
  "enabled": true,
  "autoExecute": false,
  "requireApproval": true,
  "allowedActions": ["rollback", "scale", "restart"],
  "notificationChannels": ["slack", "teams"]
}
```

**Endpoint de Config:** `GET/PUT /api/v1/autonomous/actions/config`

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│  - Dashboard de Recomendações                           │
│  - Chat de Troubleshooting                              │
│  - Painel de Ações Autonômicas                          │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│              Autonomous Handler                          │
│  - GetRecommendations                                   │
│  - Troubleshoot                                         │
│  - ExecuteAction                                        │
└──────────────────┬──────────────────────────────────────┘
                   │
    ┌──────────────┼──────────────┐
    │              │              │
┌───▼──────┐ ┌────▼──────┐ ┌────▼──────┐
│Recommend │ │Troubleshoot│ │  Actions  │
│ Service  │ │  Service   │ │  Service  │
└────┬─────┘ └────┬───────┘ └────┬───────┘
     │           │              │
     │           │              │
┌────▼───────────▼──────────────▼─────┐
│  Kubernetes │ Azure DevOps │ FinOps │
│  Service    │   Service    │Service │
└─────────────┴──────────────┴────────┘
```

## 🚀 Como Usar Hoje

### 1. **Recomendações Automáticas**

```bash
# Buscar recomendações
curl -X GET https://api.platifyx.com/api/v1/autonomous/recommendations \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**No Frontend:**
```typescript
const fetchRecommendations = async () => {
  const response = await fetch('/api/v1/autonomous/recommendations');
  const data = await response.json();
  // Renderizar cards de recomendações
};
```

### 2. **Troubleshooting**

```bash
curl -X POST https://api.platifyx.com/api/v1/autonomous/troubleshoot \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "question": "Por que meu deployment está falhando?",
    "serviceName": "my-app",
    "namespace": "production"
  }'
```

**No Frontend:**
```typescript
const askQuestion = async (question: string) => {
  const response = await fetch('/api/v1/autonomous/troubleshoot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question,
      serviceName: 'my-app',
      namespace: 'production'
    })
  });
  const result = await response.json();
  // Mostrar resposta da IA
};
```

### 3. **Ações Autonômicas**

```bash
# Executar ação (requer aprovação se configurado)
curl -X POST https://api.platifyx.com/api/v1/autonomous/actions/execute \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "type": "rollback",
    "description": "Rollback devido a falhas",
    "parameters": {
      "deployment": "app",
      "namespace": "production"
    }
  }'
```

## 📊 Próximos Passos

### Fase 1 (Hoje - Implementado ✅)
- [x] Sistema de recomendações básico
- [x] Assistente de troubleshooting
- [x] Estrutura de ações autonômicas

### Fase 2 (Próxima Sprint)
- [ ] Integração com Prometheus para métricas
- [ ] Integração com Loki para logs
- [ ] Dashboard frontend completo
- [ ] Notificações via Slack/Teams

### Fase 3 (Futuro)
- [ ] Aprendizado de padrões (ML)
- [ ] Auto-healing completo
- [ ] Previsão de problemas
- [ ] Otimização automática de recursos

## 🔧 Configuração

### Habilitar Ações Autonômicas

```bash
curl -X PUT https://api.platifyx.com/api/v1/autonomous/actions/config \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "enabled": true,
    "autoExecute": false,
    "requireApproval": true,
    "allowedActions": ["rollback", "scale", "restart"]
  }'
```

### Requisitos
- Kubernetes integrado
- Azure DevOps integrado (opcional)
- FinOps integrado (opcional)
- IA configurada (Claude/OpenAI/Gemini)

## 💡 Exemplos de Uso

### Exemplo 1: Detecção Automática de Problemas
```typescript
// O sistema detecta automaticamente:
// - Deployment com 20%+ de falha
// - Custo acima da média
// - Problemas de performance

// E gera recomendações proativas
```

### Exemplo 2: Troubleshooting Inteligente
```typescript
// Usuário pergunta: "Por que meu deploy falhou?"
// Sistema:
// 1. Coleta contexto (pods, logs, builds)
// 2. Analisa com IA
// 3. Retorna causa raiz + solução
// 4. Sugere comandos específicos
```

### Exemplo 3: Ação Autonômia
```typescript
// Sistema detecta problema crítico
// Gera recomendação de rollback
// Se aprovado (ou auto-execute habilitado):
// - Executa rollback automaticamente
// - Documenta ação
// - Notifica equipe
```

## 🎨 Interface Sugerida

### Dashboard de Recomendações
- Cards coloridos por severidade
- Filtros por tipo
- Ações rápidas (aprovar/executar)

### Chat de Troubleshooting
- Interface tipo chat
- Histórico de conversas
- Sugestões de perguntas

### Painel de Ações
- Lista de ações executadas
- Status e resultados
- Logs de execução

## 🔒 Segurança

- Todas as ações requerem autenticação
- Aprovação obrigatória por padrão
- Logs de auditoria de todas as ações
- Controle de permissões por ação

## 📝 Notas Técnicas

- Usa Claude como IA padrão (mais econômico)
- Cache de recomendações (evita recálculo constante)
- Rate limiting nas chamadas de IA
- Timeout em operações longas

