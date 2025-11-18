# PlatifyX Core API

Backend do PlatifyX - Developer Portal & Platform Engineering Hub

![PlatifyX](https://raw.githubusercontent.com/robertasolimandonofreo/assets/refs/heads/main/PlatifyX/1.png)

## 🚀 Tecnologias

- **Go 1.22+** - Linguagem de programação
- **Gin** - Framework HTTP
- **Clean Architecture** - Arquitetura de software
- **Zap** - Logger estruturado
- **OpenTelemetry** - Observabilidade (traces, metrics, logs)
- **Docker** - Containerização

## 📦 Instalação

```bash
go mod download
```

## 🛠️ Desenvolvimento

### Executar localmente

```bash
make run
```

ou

```bash
go run cmd/api/main.go
```

Acesse: http://localhost:8060

### Build

```bash
make build
```

### Executar build

```bash
./bin/api
```

## 🐳 Docker

### Build da imagem

```bash
make docker-build
```

ou

```bash
docker build -t platifyx-core:latest .
```

### Executar container

```bash
make docker-run
```

ou

```bash
docker run -p 8060:8060 platifyx-core:latest
```

## 📁 Estrutura do Projeto

```
backend/
├── cmd/
│   └── api/
│       └── main.go              # Entry point
├── internal/
│   ├── config/                  # Configurações
│   ├── domain/                  # Entidades de domínio
│   ├── handler/                 # HTTP handlers
│   ├── middleware/              # Middlewares HTTP
│   └── service/                 # Lógica de negócio
├── pkg/
│   └── logger/                  # Logger customizado
├── Dockerfile                   # Multi-stage build
├── Makefile                     # Comandos úteis
└── go.mod                       # Dependências
```

## 🔌 Endpoints da API

### Health & Readiness

- `GET /api/v1/health` - Health check
- `GET /api/v1/ready` - Readiness check

### Serviços

- `GET /api/v1/services` - Listar todos os serviços
- `GET /api/v1/services/:id` - Obter serviço por ID
- `POST /api/v1/services` - Criar novo serviço

### Métricas

- `GET /api/v1/metrics/dashboard` - Métricas do dashboard
- `GET /api/v1/metrics/dora` - DORA Metrics

### Kubernetes

- `GET /api/v1/kubernetes/clusters` - Listar clusters
- `GET /api/v1/kubernetes/pods?namespace=default` - Listar pods

## ⚙️ Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env` e configure:

```bash
ENVIRONMENT=development
PORT=8060
VERSION=0.1.0

DATABASE_URL=postgres://user:password@localhost:5432/platifyx
REDIS_URL=redis://localhost:6379

OTEL_ENDPOINT=localhost:4317
```

## 🎨 Features Implementadas

- ✅ Clean Architecture (handler → service → domain)
- ✅ Graceful shutdown
- ✅ Health checks e readiness probes
- ✅ Structured logging com Zap
- ✅ CORS configurado
- ✅ Recovery middleware
- ✅ Request logging middleware
- ✅ Endpoints REST para serviços, métricas e Kubernetes
- ✅ Dockerfile multi-stage otimizado
- ✅ Makefile com comandos úteis

## 🧪 Testes

```bash
make test
```

## 🎯 Próximas Features

- [ ] Integração com PostgreSQL
- [ ] Integração com Redis
- [ ] OpenTelemetry completo (traces distribuídos)
- [ ] Autenticação JWT
- [ ] RBAC (Role-Based Access Control)
- [ ] Integração com Kubernetes API
- [ ] Integração com Grafana Stack
- [ ] Integração com Cloud Providers (AWS, GCP, Azure)
- [ ] Workers (Kafka, RabbitMQ)

## 📄 Licença

Baseado em Backstage (Apache 2.0)
