# PlatifyX - Getting Started

Guia rápido para começar a desenvolver com o PlatifyX.

![PlatifyX](https://raw.githubusercontent.com/robertasolimandonofreo/assets/refs/heads/main/PlatifyX/1.png)

## 🎯 O que é o PlatifyX?

PlatifyX é um Developer Portal & Platform Engineering Hub baseado em Backstage que centraliza:

- DevOps
- Kubernetes
- Observabilidade
- Qualidade
- Governança
- Segurança
- FinOps & Cloud Cost Management
- Multi-cloud Management

## 📦 Estrutura do Projeto

```
platifyx-docs/
├── frontend/           # React 18 + TypeScript + Vite
├── backend/            # Go 1.22 + Gin + Clean Architecture
├── docker-compose.yml  # Orquestração dos serviços
└── README.md          # Especificações completas
```

## 🚀 Executar o Projeto Completo

### Opção 1: Scripts de Inicialização (Mais Rápido) ⚡

**Linux/Mac:**
```bash
./start.sh
```

**Windows:**
```cmd
start.bat
```

Para parar:
```bash
./stop.sh        # Linux/Mac
stop.bat         # Windows
```

Acesse:
- Frontend: http://localhost:7000
- Backend API: http://localhost:8060

Os logs ficam salvos em `logs/backend.log` e `logs/frontend.log`

### Opção 2: Docker Compose

```bash
docker-compose up --build
```

Acesse:
- Frontend: http://localhost:7000
- Backend API: http://localhost:8060

### Opção 3: Executar Separadamente

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

Acesse: http://localhost:7000

#### Backend

```bash
cd backend
go mod download
make run
```

Acesse: http://localhost:8060

## 🔌 API Endpoints

### Health & Readiness

```bash
curl http://localhost:8060/api/v1/health
curl http://localhost:8060/api/v1/ready
```

### Serviços

```bash
# Listar todos os serviços
curl http://localhost:8060/api/v1/services

# Obter serviço por ID
curl http://localhost:8060/api/v1/services/svc-1

# Criar novo serviço
curl -X POST http://localhost:8060/api/v1/services \
  -H "Content-Type: application/json" \
  -d '{"name":"my-service","description":"My Service","type":"microservice"}'
```

### Métricas

```bash
# Dashboard metrics
curl http://localhost:8060/api/v1/metrics/dashboard

# DORA Metrics
curl http://localhost:8060/api/v1/metrics/dora
```

### Kubernetes

```bash
# Listar clusters
curl http://localhost:8060/api/v1/kubernetes/clusters

# Listar pods
curl http://localhost:8060/api/v1/kubernetes/pods?namespace=default
```

## 🛠️ Desenvolvimento

### Frontend

Tecnologias:
- React 18
- TypeScript
- Vite
- React Router
- Lucide React (ícones)
- CSS Modules

Comandos úteis:
```bash
cd frontend
npm run dev      # Desenvolvimento
npm run build    # Build de produção
npm run preview  # Preview do build
npm run lint     # Executar linter
```

### Backend

Tecnologias:
- Go 1.22+
- Gin framework
- Clean Architecture
- Zap logger
- OpenTelemetry ready

Comandos úteis:
```bash
cd backend
make run         # Executar
make build       # Build
make test        # Testes
make docker-build # Build Docker
make clean       # Limpar
```

## 📋 Próximos Passos

### Frontend
- [ ] Integração com APIs do backend
- [ ] Autenticação (Google/Microsoft SSO)
- [ ] Páginas de Observabilidade
- [ ] Páginas de FinOps
- [ ] Formulários de criação de serviços
- [ ] Gráficos e visualizações

### Backend
- [ ] Integração com PostgreSQL
- [ ] Integração com Redis
- [ ] OpenTelemetry completo
- [ ] Autenticação JWT
- [ ] RBAC
- [ ] Integração com Kubernetes API
- [ ] Integração com Cloud Providers

## 📚 Documentação

- [Frontend README](./frontend/README.md)
- [Backend README](./backend/README.md)
- [Especificações Completas](./README.md)

## 🐳 Docker

### Build individual

```bash
# Frontend
docker build -t platifyx-app ./frontend

# Backend
docker build -t platifyx-core ./backend
```

### Executar individual

```bash
# Backend
docker run -p 8060:8060 platifyx-core

# Frontend
docker run -p 7000:80 platifyx-app
```

## 🎯 Stack Tecnológico Completo

### Frontend
- React 18.2
- TypeScript 5.2
- Vite 5.0
- React Router 6.20
- Lucide React
- CSS Modules
- Nginx (produção)

### Backend
- Go 1.22+
- Gin web framework
- Zap structured logger
- godotenv
- Clean Architecture

### DevOps
- Docker
- Docker Compose
- Makefile
- Multi-stage builds

## 📄 Licença

Baseado em Backstage (Apache 2.0)
