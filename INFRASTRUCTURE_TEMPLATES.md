# 🚀 Infrastructure Templates - Guia Completo

**Status:** ✅ Implementado e Pronto para Uso
**Data:** 2025-11-20

---

## 📋 Visão Geral

Sistema completo de geração de templates de infraestrutura seguindo os padrões do PlatifyX. Permite criar novos serviços com toda a estrutura de CI/CD e Kubernetes pré-configurada.

### Benefícios

✅ **Padronização** - Todos os serviços seguem o mesmo padrão
✅ **Produtividade** - Cria toda estrutura em segundos
✅ **Self-Service** - Desenvolvedores criam serviços sem intervenção
✅ **Menos Erros** - Templates testados e validados
✅ **Governança** - Compliance automático com padrões

---

## 🎯 Tipos de Templates Disponíveis

### 1. **API Service** 🌐
REST API service com deployment, service e ingress opcional.

**Linguagens suportadas:**
- Go
- Node.js
- Python
- Java

**Arquivos gerados:**
- `ci/pipeline.yml` - Pipeline Azure DevOps
- `cd/prod/deployment.yaml` - Deployment produção
- `cd/prod/service.yaml` - Service produção
- `cd/prod/ingress.yaml` - Ingress produção (opcional)
- `cd/prod/secret.yaml` - External Secret (opcional)
- `cd/stage/...` - Mesmos arquivos para staging
- `Dockerfile` - Container image
- `README.md` - Documentação
- `.gitignore` - Git ignore

### 2. **Background Worker** ⚙️
Serviço de background/consumer (Kafka, RabbitMQ, etc).

**Linguagens suportadas:**
- Go
- Node.js
- Python

**Diferenças:**
- Sem Service
- Sem Ingress
- Deployment otimizado para workers

### 3. **Scheduled Job** ⏰
Kubernetes CronJob para tarefas agendadas.

**Linguagens suportadas:**
- Go
- Node.js
- Python

**Arquivos específicos:**
- `cd/prod/cronjob.yaml` - CronJob manifest
- Configuração de schedule (cron expression)

### 4. **Generic Deployment** 📦
Deployment genérico sem service/ingress.

**Linguagens suportadas:**
- Go
- Node.js
- Python
- Java
- .NET

---

## 🏗️ Estrutura dos Repositórios Gerados

```
{squad}-{aplicacao}/
├── ci/
│   └── pipeline.yml          # Azure DevOps pipeline
├── cd/
│   ├── prod/
│   │   ├── deployment.yaml   # ou cronjob.yaml
│   │   ├── service.yaml      # (apenas para API)
│   │   ├── ingress.yaml      # (se useIngress=true)
│   │   └── secret.yaml       # (se useSecret=true)
│   └── stage/
│       └── ... (mesmos arquivos)
├── Dockerfile
├── README.md
└── .gitignore
```

---

## 📐 Padrões de Nomenclatura

### Repositório
```
{squad}-{aplicacao}
Exemplo: cxm-distribution
```

### Resources Kubernetes
```
{squad}-{aplicacao}-{env}
Exemplo: cxm-distribution-prod
```

### Namespace
```
{squad}
Exemplo: cxm
```

### Secrets Manager AWS
```
Production: vaultproductionexternalsecret/{squad}-{aplicacao}-prod
Staging:    vaultstageexternalsecret/{squad}-{aplicacao}-stage
```

### SonarQube
```
{squad}-{aplicacao}
Exemplo: cxm-distribution
```

### Branches
```
main  → Production
stage → Staging
```

### Node Groups
```
prod-app  → Production
stage-app → Staging
```

---

## 🚀 Como Usar

### 1. Via Interface Web

1. Acesse o PlatifyX Portal
2. Navegue para **Infrastructure Templates**
3. Escolha o tipo de template (API, Worker, CronJob, Deployment)
4. Clique em **Criar Serviço**
5. Preencha o wizard de 5 passos:

#### Passo 1: Informações Básicas
- **Squad:** Nome da squad (ex: `cxm`)
- **App Name:** Nome da aplicação (ex: `distribution`)
- Preview: `cxm-distribution`

#### Passo 2: Tecnologia
- **Linguagem:** go, nodejs, python, java, dotnet
- **Versão:** ex: `1.23.0` (Go), `20` (Node), `3.11` (Python)
- **Testes Unitários:** Sim/Não
- **Monorepo:** Sim/Não
- **App Path:** Caminho no monorepo (se aplicável)

#### Passo 3: Configuração
- **Porta:** Porta do container (padrão: 80)
- **Cron Schedule:** Para CronJobs (ex: `0 2 * * *`)
- **Use Secret:** Sim/Não (AWS Secrets Manager)
- **Use Ingress:** Sim/Não (apenas para APIs)
- **Hostname:** Se ingress ativo (ex: `api.example.com`)

#### Passo 4: Recursos
- **CPU Request:** ex: `250m`
- **CPU Limit:** ex: `500m`
- **Memory Request:** ex: `256Mi`
- **Memory Limit:** ex: `512Mi`
- **Replicas:** Número de pods (padrão: 1)

#### Passo 5: Preview e Geração
- Visualize arquivos que serão gerados
- Veja instruções de setup
- **Baixar ZIP** com todos os arquivos
- Ou **Confirmar e Gerar** direto

### 2. Via API

#### Listar Templates Disponíveis
```bash
curl https://api.platifyx.com/api/v1/infrastructure-templates
```

**Response:**
```json
{
  "templates": [
    {
      "type": "api",
      "name": "API Service",
      "description": "REST API service with deployment, service, and optional ingress",
      "languages": ["go", "nodejs", "python", "java"],
      "icon": "🌐"
    },
    ...
  ]
}
```

#### Preview Template
```bash
curl -X POST https://api.platifyx.com/api/v1/infrastructure-templates/preview \
  -H "Content-Type: application/json" \
  -d '{
    "squad": "cxm",
    "appName": "distribution",
    "templateType": "api",
    "language": "go",
    "version": "1.23.0",
    "port": 80,
    "useSecret": true,
    "useIngress": true,
    "ingressHost": "api.example.com",
    "hasTests": true,
    "isMonorepo": false,
    "appPath": ".",
    "cpuLimit": "500m",
    "cpuRequest": "250m",
    "memoryLimit": "512Mi",
    "memoryRequest": "256Mi",
    "replicas": 1
  }'
```

**Response:**
```json
{
  "repositoryName": "cxm-distribution",
  "fileCount": 11,
  "files": [
    "ci/pipeline.yml",
    "cd/prod/deployment.yaml",
    "cd/prod/service.yaml",
    "cd/prod/ingress.yaml",
    "cd/prod/secret.yaml",
    "cd/stage/deployment.yaml",
    "cd/stage/service.yaml",
    "cd/stage/ingress.yaml",
    "cd/stage/secret.yaml",
    "Dockerfile",
    "README.md",
    ".gitignore"
  ],
  "instructions": [
    "1. Create repository 'cxm-distribution' in Azure DevOps",
    "2. Clone the repository locally",
    "3. Copy all generated files to the repository",
    "4. Create the pipeline in Azure DevOps using ci/pipeline.yml",
    "5. Create secrets in AWS Secrets Manager:",
    "   - Production: cxm-distribution-prod",
    "   - Staging: cxm-distribution-stage",
    "6. Create SonarQube project with key: cxm-distribution",
    "7. Push to 'stage' branch to trigger first deployment",
    "8. After validation, merge to 'main' for production deployment"
  ]
}
```

#### Generate Template (com arquivos completos)
```bash
curl -X POST https://api.platifyx.com/api/v1/infrastructure-templates/generate \
  -H "Content-Type: application/json" \
  -d '{ ... mesmo payload do preview ... }'
```

**Response:**
```json
{
  "repositoryName": "cxm-distribution",
  "files": {
    "ci/pipeline.yml": "name: $(Build.BuildId)\n\ntrigger:\n  branches:\n    include:\n      - stage\n...",
    "cd/prod/deployment.yaml": "apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: cxm-distribution-prod\n...",
    ...
  },
  "instructions": [ ... ],
  "metadata": {
    "squad": "cxm",
    "appName": "distribution",
    "language": "go",
    "type": "api"
  }
}
```

---

## 📝 Exemplos de Uso

### Exemplo 1: API Go Simples

```json
{
  "squad": "backend",
  "appName": "users-api",
  "templateType": "api",
  "language": "go",
  "version": "1.23.0",
  "port": 8080,
  "useSecret": true,
  "useIngress": true,
  "ingressHost": "users-api.mycompany.com",
  "hasTests": true,
  "isMonorepo": false,
  "appPath": ".",
  "cpuLimit": "1000m",
  "cpuRequest": "500m",
  "memoryLimit": "1Gi",
  "memoryRequest": "512Mi",
  "replicas": 3
}
```

**Resultado:**
- Repositório: `backend-users-api`
- Deployment: `backend-users-api-prod` / `backend-users-api-stage`
- Namespace: `backend`
- Ingress: `users-api.mycompany.com` (prod) / `stage-users-api.mycompany.com` (stage)

### Exemplo 2: Worker Kafka Node.js

```json
{
  "squad": "payments",
  "appName": "transaction-processor",
  "templateType": "worker",
  "language": "nodejs",
  "version": "20",
  "port": 3000,
  "useSecret": true,
  "useIngress": false,
  "hasTests": true,
  "isMonorepo": false,
  "appPath": ".",
  "cpuLimit": "500m",
  "cpuRequest": "250m",
  "memoryLimit": "512Mi",
  "memoryRequest": "256Mi",
  "replicas": 2
}
```

**Resultado:**
- Repositório: `payments-transaction-processor`
- Sem service (não é API)
- Sem ingress
- 2 replicas para processamento paralelo

### Exemplo 3: CronJob Python

```json
{
  "squad": "reports",
  "appName": "daily-report-generator",
  "templateType": "cronjob",
  "language": "python",
  "version": "3.11",
  "useSecret": true,
  "cronSchedule": "0 2 * * *",
  "cpuLimit": "1000m",
  "cpuRequest": "500m",
  "memoryLimit": "2Gi",
  "memoryRequest": "1Gi"
}
```

**Resultado:**
- Repositório: `reports-daily-report-generator`
- CronJob rodando todo dia às 2h da manhã
- Recursos maiores (processamento de relatórios)

### Exemplo 4: Monorepo

```json
{
  "squad": "platform",
  "appName": "admin-api",
  "templateType": "api",
  "language": "go",
  "version": "1.23.0",
  "isMonorepo": true,
  "appPath": "services/admin",
  "port": 8080,
  "useSecret": true,
  "useIngress": true,
  "ingressHost": "admin.platform.com",
  "hasTests": true,
  "cpuLimit": "500m",
  "cpuRequest": "250m",
  "memoryLimit": "512Mi",
  "memoryRequest": "256Mi",
  "replicas": 2
}
```

**Resultado:**
- App Path: `services/admin` (usado na pipeline)
- Dockerfile e código em `services/admin/`

---

## 🔧 Arquivos Gerados em Detalhes

### ci/pipeline.yml

Variáveis geradas automaticamente:
```yaml
variables:
  - group: variables
  - name: appname
    value: '{squad}-{app}'
  - name: apppath
    value: '.' ou caminho do monorepo
  - name: language
    value: go/nodejs/python/java/dotnet
  - name: version
    value: versão especificada
  - name: testun
    value: yes/no
  - name: monorepo
    value: yes/no
  - name: image
    value: imagens docker base
  - name: squad
    value: nome da squad
```

### cd/{env}/deployment.yaml

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {squad}-{app}-{env}
  namespace: {squad}
  annotations:
    reloader.stakater.com/auto: "true"
spec:
  replicas: {replicas}
  template:
    spec:
      containers:
        - name: {squad}-{app}-{env}
          image: 850995575072.dkr.ecr.us-east-1.amazonaws.com/{squad}-{app}:latest
          ports:
            - containerPort: {port}
          resources:
            limits:
              cpu: {cpuLimit}
              memory: {memoryLimit}
            requests:
              cpu: {cpuRequest}
              memory: {memoryRequest}
      affinity:
        nodeAffinity:
          values:
            - {env}-app
      tolerations:
        - key: "{env}-app"
          value: "yes"
```

### cd/{env}/secret.yaml (se useSecret=true)

```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: {squad}-{app}-{env}
  namespace: {squad}
spec:
  secretStoreRef:
    name: vault{env}externalsecret
  target:
    name: {squad}-{app}-{env}
  dataFrom:
    - extract:
        key: {squad}-{app}-{env}
```

### Dockerfile (Go)

```dockerfile
FROM golang:{version}-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o main .

FROM alpine:3.12.1
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/main .
EXPOSE {port}
CMD ["./main"]
```

---

## ✅ Checklist de Deploy

Após gerar o template:

- [ ] Criar repositório no Azure DevOps: `{squad}-{app}`
- [ ] Clonar repositório localmente
- [ ] Copiar arquivos gerados para o repositório
- [ ] Criar pipeline no Azure DevOps usando `ci/pipeline.yml`
- [ ] Criar secrets no AWS Secrets Manager (se useSecret=true):
  - [ ] Production: `{squad}-{app}-prod`
  - [ ] Staging: `{squad}-{app}-stage`
- [ ] Criar projeto no SonarQube: `{squad}-{app}`
- [ ] Push para branch `stage` (primeira validação)
- [ ] Verificar deployment em staging
- [ ] Merge para branch `main` (produção)
- [ ] Verificar deployment em produção
- [ ] Configurar alertas e monitoring
- [ ] Atualizar documentação do serviço

---

## 🎨 Customização

### Adicionar Novos Tipos de Template

1. Adicionar constante em `internal/domain/template.go`:
```go
const (
    InfraTemplateTypeStatefulSet InfraTemplateType = "statefulset"
)
```

2. Adicionar no `ListTemplates()` em `template_service.go`:
```go
{
    Type:        domain.InfraTemplateTypeStatefulSet,
    Name:        "StatefulSet",
    Description: "StatefulSet for stateful applications",
    Languages:   []string{"go", "nodejs", "python"},
    Icon:        "💾",
}
```

3. Adicionar lógica de geração no service

### Customizar Recursos Padrão

Edite as constantes de validação em `domain/template.go`:
```go
if r.CPULimit == "" {
    r.CPULimit = "1000m"  // aumentar padrão
}
```

---

## 🐛 Troubleshooting

### Erro: "Squad is required"
**Causa:** Campo squad não preenchido
**Solução:** Preencher squad no formulário

### Erro: "cronSchedule is required for cronjob type"
**Causa:** CronJob sem schedule definido
**Solução:** Adicionar expressão cron (ex: `0 2 * * *`)

### Erro: "ingressHost is required when useIngress is true"
**Causa:** Ingress ativo mas sem hostname
**Solução:** Adicionar hostname do ingress

### Pipeline não executa
**Causa:** Variáveis ou template não encontrados
**Solução:**
1. Verificar se variável group `variables` existe no Azure DevOps
2. Verificar se repositório `Joker/pipeline` existe
3. Verificar branch configurada (`stage`)

---

## 📊 Métricas e Monitoramento

O sistema de templates gera automaticamente:

✅ **SonarQube:** Projeto criado com key `{squad}-{app}`
✅ **Logs:** CloudWatch ou solução de logging
✅ **Métricas:** Prometheus/Grafana
✅ **Traces:** Se OpenTelemetry configurado
✅ **Alerts:** Se Alertmanager configurado

---

## 🔒 Segurança

### Secrets Management
- Todos secrets no AWS Secrets Manager
- Integração via External Secrets Operator
- Rotação automática configurável
- Nunca commitar secrets no código

### Container Security
- Images multi-stage para menor superfície de ataque
- Non-root user quando possível
- Security context configurado
- Image scanning automático

### Network Security
- Network policies configuradas
- Ingress com TLS (Let's Encrypt)
- Service mesh opcional (Istio/Linkerd)

---

## 🚀 Próximos Passos

- [ ] Adicionar templates para StatefulSets
- [ ] Templates para bancos de dados (PostgreSQL, Redis)
- [ ] Templates para messaging (Kafka, RabbitMQ)
- [ ] Integração com GitHub (além de Azure DevOps)
- [ ] Templates para Terraform modules
- [ ] Templates para Helm charts customizados
- [ ] Versionamento de templates
- [ ] Template marketplace

---

## 📚 Referências

- [Kubernetes Deployment](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)
- [Kubernetes CronJob](https://kubernetes.io/docs/concepts/workloads/controllers/cron-jobs/)
- [External Secrets Operator](https://external-secrets.io/)
- [Azure DevOps Pipelines](https://learn.microsoft.com/en-us/azure/devops/pipelines/)
- [Backstage Software Templates](https://backstage.io/docs/features/software-templates/)

---

**Documentação criada:** 2025-11-20
**Versão:** 1.0
**Status:** ✅ Production Ready
