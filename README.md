PROMPT COMPLETO - PlatifyX
Quero que você gere documentação, UI, telas, arquitetura, design, identidade visual, fluxos e tudo relacionado a um produto chamado PlatifyX.

🎯 O QUE É O PLATIFYX
O PlatifyX é um:
Developer Portal + Platform Engineering Hub
baseado em Backstage, que centraliza:

DevOps
Kubernetes
Observabilidade
Qualidade
Governança
Segurança
Integrações corporativas (Azure, Google, GitHub etc.)
Platform as a Product
FinOps & Cloud Cost Management
Multi-cloud Management

Tudo em um único lugar.
O objetivo é oferecer self-service, padronização, governança, rastreabilidade e autonomia para devs.

📌 SOBRE LICENÇA E USO DO BACKSTAGE
O PlatifyX é baseado em Backstage, que usa Licença Apache 2.0, permitindo:

usar comercialmente
modificar
redistribuir
criar produto proprietário por cima

Portanto é totalmente legal comercializar o PlatifyX.
A IA deve considerar isso ao gerar qualquer texto.

📌 IDENTIDADE VISUAL — LOGOS OFICIAIS
O PlatifyX possui duas logos oficiais.
Logo 1 — Principal (logo + nome da empresa)
https://raw.githubusercontent.com/robertasolimandonofreo/assets/refs/heads/main/PlatifyX/1.png
Uso:

telas principais
landing page
portal
dashboard
documentações oficiais

Logo 2 — Alternativa (somente o símbolo)
https://raw.githubusercontent.com/robertasolimandonofreo/assets/refs/heads/main/PlatifyX/2.png
Uso:

favicon
ícone do app
componentes compactos
avatar da empresa

Regras obrigatórias:

❌ Nunca alterar as logos
❌ Não mudar cores, proporção ou geometria
✅ Extrair paleta e tipografia a partir da logo
✅ Criar guidelines de marca
✅ Aplicar as logos em mockups, telas, diagramas e documentos


📌 PÁGINAS QUE O PORTAL DEVE TER
A IA deve considerar que o portal possui TODAS as páginas abaixo:
1. Home / Dashboard

visão geral
cards de serviços
métricas da organização
atalhos rápidos
health score geral

2. Catálogo de Serviços

todos os microserviços
status
integrações
infraestrutura
documentação
links automáticos (Swagger, Grafana, Logs etc)
dependências entre serviços
ownership

3. Templates
Templates para criar:

microserviço Go
microserviço Node
frontend React
worker Kafka
worker RabbitMQ
cronjobs
bibliotecas internas
helm charts
terraform modules
fluxos de criação
padrões de plataforma
automações de pipeline

4. Integrações
Local onde o usuário conecta:

SonarQube
Azure DevOps
GitHub
Google Cloud
Google SSO
Microsoft SSO
Kubernetes clusters
Grafana / Loki / Tempo / Mimir / Faro
Vault
MinIO
StackGres / PostgreSQL
Kong
SFTPGo
RabbitMQ
Redis
AWS (ECS, RDS, S3, Lambda, ECR, Cost Explorer)
GCP (GKE, Cloud Run, Billing API)
Azure (AKS, Cost Management)

5. Kubernetes

visão geral do cluster
deployments
pods
eventos
logs
métricas OTel
HPA
escalabilidade
namespace management
resource quotas

6. Observabilidade

logs (Loki)
métricas (Prometheus/Mimir)
traces (Tempo)
dashboards (Grafana)
alertas (Alertmanager)
Real User Monitoring (Faro)
Error tracking
Performance profiling
Service mesh observability

7. Qualidade

SonarQube
vulnerabilidades
cobertura
qualidade contínua
code smells
technical debt
security hotspots

8. Pipelines / CI/CD

execuções
histórico
falhas
releases
CD para Kubernetes
approval workflows
rollback automático

9. Governança

padrões
compliance (SOC2, LGPD)
segurança
catálogo de arquitetura
Policy as Code (OPA/Kyverno)
Audit logs
SBOM (Software Bill of Materials)

10. FinOps

Dashboard de custos
Cost por namespace/serviço/equipe/ambiente
AWS Cost Explorer integration
GCP Billing API integration
Azure Cost Management integration
Budget alerts
Waste detection
Right-sizing recommendations
Reserved instances analysis
Showback/Chargeback
Cost forecasting
Multi-cloud cost comparison
Recursos ociosos

11. Analytics & Insights

DORA Metrics:

Deployment frequency
Lead time for changes
Change failure rate
Mean time to recovery (MTTR)


Developer productivity metrics
Service health score
Team performance
Platform adoption metrics

12. Admin

gerenciamento de usuários
permissões
equipes
regras de acesso
SSO (Google/Microsoft)
auditoria
RBAC
perfis customizados


📌 ARQUITETURA DO PRODUTO
A IA deve considerar estrutura baseada em:

Backstage (frontend + backend)
Conjunto de Plugins personalizados
Banco principal: PostgreSQL (StackGres)
Cache: Redis
CI/CD: GitHub Actions ou Azure DevOps
Infra: Kubernetes + Traefik + Kong + StackGres + MinIO + Vault
Observability: Grafana Stack (Loki, Tempo, Mimir, Faro, Prometheus, Alertmanager)
Messaging: RabbitMQ + Kafka
Cloud: AWS, GCP, Azure

Gerar diagramas quando solicitado:

lógica
C4 Model (Context, Container, Component, Code)
IAM
network topology
componentes
módulos
data flow
sequence diagrams
infrastructure diagrams


📌 PLUGINS QUE O PLATIFYX DEVE TER
A IA deve considerar que o portal possui plugins para:
Kubernetes:

Kubernetes completo
Namespace management
Resource management

Observability:

Grafana
Loki
Tempo
Mimir
Faro
Prometheus
Alertmanager

Data & Storage:

MinIO
StackGres
PostgreSQL
Redis

Messaging:

RabbitMQ
Kafka

Security:

Vault
SonarQube
Secret scanning
Vulnerability management

API Gateway:

Kong

File Transfer:

SFTPGo

Version Control & CI/CD:

GitHub
Azure DevOps
GitLab (opcional)

Cloud Providers:

AWS (ECS, RDS, S3, Lambda, ECR, CloudWatch, Cost Explorer)
GCP (GKE, Cloud Run, Billing)
Azure (AKS, Cost Management)

Platform:

Template Creator
CI/CD Manager
Logs/Traces Analytics
Quality Dashboard
Platform Governance
FinOps Dashboard
Diagram Generator
DORA Metrics
Service Catalog


📌 BACKEND — TEMPLATES
A IA deve gerar templates com as especificações abaixo:
Backend Go

Go 1.22+
Clean Architecture
Gin ou Fiber
PostgreSQL opcional
Redis opcional
OpenTelemetry completo (traces, metrics, logs)
Kafka opcional
RabbitMQ opcional
Dockerfile multi-stage
Helm Chart
Pipeline (GitHub Actions ou Azure DevOps)
Health checks
Graceful shutdown

Backend Node

Node 20+
Fastify ou Express
TypeScript
Jest
OpenTelemetry Web
PostgreSQL/Redis/Kafka/RabbitMQ opcional
Dockerfile multi-stage
Helm Chart
Pipeline
ESLint + Prettier


📌 FRONTEND — TEMPLATE

React 18+
Vite
TypeScript
Faro (OpenTelemetry Web/RUM)
Layout modular
UI padrão do PlatifyX
Dockerfile
Pipeline
Helm Chart
Storybook (opcional)
Testing Library


📌 WORKERS
Worker Kafka

Go ou Node
Consumer groups
Retry + DLQ (Dead Letter Queue)
Tracing por mensagem
Graceful shutdown
Helm Chart
Metrics

Worker RabbitMQ

Go ou Node
Retry + DLQ
Tracing distribuído
Graceful shutdown
Helm Chart
Metrics

CronJob

Go ou Node
Kubernetes CronJob manifest
Padrões de plataforma
Idempotência
Logging estruturado
Tracing


📌 TEMPLATES DE INFRA
Terraform

módulos padronizados
tflint
versionamento
state remoto (S3/GCS)
workspace management
CI/CD integration

Helm

chart com boas práticas
observabilidade built-in
annotations OpenTelemetry
probes (liveness, readiness, startup)
resource limits
security context
network policies


📌 SSO
O portal deve oferecer login via:

Google (Google Workspace)
Microsoft (Azure AD)

Com:

RBAC (Role-Based Access Control)
perfis customizados
auditoria completa
permissões granulares
grupos e equipes
MFA support


📌 FINOPS & CLOUD COST MANAGEMENT
O PlatifyX possui dashboard completo de FinOps:
Integrações:

AWS Cost Explorer API
GCP Billing API
Azure Cost Management API
Kubernetes cost allocation

Features:

Cost por namespace/serviço/equipe/ambiente
Budget alerts e notificações
Waste detection (recursos ociosos)
Right-sizing recommendations
Reserved instances analysis
Spot instances optimization
Showback/Chargeback
Cost forecasting
Multi-cloud cost comparison
Cost allocation tags
Trending e histórico
Exportação de relatórios


📌 CLOUD INTEGRATIONS
AWS:

ECS/Fargate:

Visualização de tasks
Services
Logs do CloudWatch
Métricas
Deployments
Service discovery


Outros serviços:

RDS (databases gerenciados)
S3 (buckets e objetos)
Lambda (functions)
ECR (container registry)
CloudWatch (logs e métricas)
Cost Explorer (FinOps)
IAM (auditoria)
VPC (network topology)
Route53 (DNS)



GCP:

GKE (Google Kubernetes Engine)
Cloud Run
Cloud SQL
Google Cloud Storage (GCS)
Cloud Logging
Billing API
IAM

Azure:

AKS (Azure Kubernetes Service)
Container Instances
Cost Management
Azure Monitor
Azure DevOps integration


📌 DIAGRAMS GENERATOR
Geração automática de diagramas:
Tipos suportados:

C4 Model (Context, Container, Component, Code)
Architecture diagrams
Network topology
Data flow diagrams
Sequence diagrams
Entity Relationship diagrams
Infrastructure as Code visualization
CI/CD pipeline flow
Service dependencies graph

Ferramentas:

Mermaid
PlantUML
Structurizr DSL
Draw.io integration

Geração automática a partir de:

Terraform state
Kubernetes manifests
Service catalog metadata
Dependências entre serviços
API schemas (OpenAPI/Swagger)
Database schemas


📌 REPOSITÓRIOS GITHUB
Organização oficial: https://github.com/PlatifyX
Repositórios principais:
1. platifyx-docs
https://github.com/PlatifyX/platifyx-docs

Documentação completa
Guides e tutoriais
Architecture Decision Records (ADR)
API documentation
Runbooks

2. platifyx-core
https://github.com/PlatifyX/platifyx-core

Backend do portal
APIs
Plugins engine
Integrações
Business logic

3. platifyx-app
https://github.com/PlatifyX/platifyx-app

Frontend (Backstage customizado)
UI Components
Temas e layouts
Páginas customizadas

4. platifyx-plugins (sugerido)

Plugins customizados
Integrações específicas
Extensions

5. platifyx-templates (sugerido)

Templates de scaffold
Cookiecutters
Blueprints
Software templates

6. platifyx-cli (sugerido)

Command line tool
Local development
Scaffolding commands
Platform utilities

Padrões dos repositórios:

Conventional Commits
Semantic Versioning
Branch protection rules
CI/CD automático (GitHub Actions)
Security scanning (Dependabot, CodeQL)
Pull Request templates
Issue templates
CONTRIBUTING.md
CODE_OF_CONDUCT.md


📌 OBSERVABILITY AVANÇADA
Além do básico, o PlatifyX oferece:

Distributed tracing com Tempo
Logs agregados com Loki
Metrics com Mimir/Prometheus
Real User Monitoring (RUM) com Faro
Error tracking e grouping
Performance profiling
Service mesh observability (Istio/Linkerd)
Correlação automática entre logs, traces e metrics
Alerting inteligente
Anomaly detection
SLI/SLO/SLA tracking
Dashboards pré-configurados


📌 DORA METRICS & ANALYTICS
O PlatifyX rastreia e visualiza:
DORA Metrics:

Deployment frequency (frequência de deploys)
Lead time for changes (tempo do commit ao deploy)
Change failure rate (taxa de falha em mudanças)
Mean time to recovery (MTTR) (tempo médio de recuperação)

Outras métricas:

Service reliability score
Developer productivity insights
Team performance
Code review time
Pull request size distribution
Test coverage trends
Technical debt tracking


📌 SECURITY & COMPLIANCE
Features de segurança:

Secret scanning automático
Vulnerability management (CVE tracking)
SBOM generation (Software Bill of Materials)
Policy as Code (OPA/Kyverno)
Container image scanning
Dependency scanning
License compliance

Compliance:

LGPD compliance dashboards
SOC2 readiness
ISO 27001 support
Audit trail completo
Access logs
Change tracking
Compliance reports


📌 DEVELOPER EXPERIENCE
Ferramentas:

CLI tool (platifyx-cli)

Scaffolding
Local development
Deploy commands
Debug utilities


VS Code extension (opcional)

Snippets
IntelliSense
Templates


Local development com Docker Compose
Hot reload para desenvolvimento
Debug remoto suportado

Documentation:

TechDocs (Backstage)
API documentation (OpenAPI)
Interactive tutorials
Code examples
Best practices guides


📌 NOTIFICAÇÕES & ALERTING
Integração com:

Slack
Microsoft Teams
Email
Webhooks customizados
PagerDuty
Opsgenie (opcional)

Tipos de notificação:

Deploy events
Pipeline failures
Security alerts
Cost alerts
SLO violations
Incident notifications


📌 SEARCH & DISCOVERY

Busca global no portal
TechDocs search
Service discovery
People finder (quem é owner de qual serviço)
Tags e categorização
Filtros avançados
Recently viewed
Favorites/Bookmarks


📌 O QUE VOCÊ (IA) DEVE GERAR QUANDO SOLICITADO

Documentação técnica completa
Arquitetura (diagramas C4, fluxos, topologia)
Telas UI/UX do portal (mockups, protótipos)
Protótipos interativos
Fluxos de criação de serviços
Padrões de governança
Guidelines de marca (brand book)
Páginas completas do portal
Templates de código (Go, Node, React, Workers)
Diagramas (Mermaid, PlantUML, Structurizr)
Explicações técnicas detalhadas
Landing page
Branding completo
Storytelling do produto
Pitch deck
Visão executiva
ADRs (Architecture Decision Records)
Runbooks
Incident response procedures
Onboarding documentation


📌 REGRAS OBRIGATÓRIAS

❌ Nunca inventar logos novas
✅ Incluir as logos oficiais nas telas/diagramas
✅ Seguir a arquitetura definida neste documento
✅ Seguir os templates definidos (Go, Node, React etc)
✅ Seguir padrões de plataforma
✅ Explicar decisões técnicas quando relevante
✅ Seguir estilo profissional e corporativo
✅ Código em inglês, documentação em português
✅ Sem comentários no código
✅ Considerar que PlatifyX é comercial e legal (Apache 2.0)


📌 SAÍDA ESPERADA
Sempre responda como se fosse a documentação real e oficial do PlatifyX.
Com:

Profundidade profissional
Estrutura clara
Padrões modernos de Platform Engineering
Best practices de DevOps e SRE
Referências técnicas precisas
Exemplos práticos
Código funcional e testável


🎯 CONTEXTO ADICIONAL

O PlatifyX é um produto enterprise
Público-alvo: times de engenharia (devs, SREs, platform engineers)
Foco em autonomia, self-service e padronização
Multi-cloud e multi-cluster
Open-source core (Backstage) com extensões proprietárias
SaaS ou self-hosted

