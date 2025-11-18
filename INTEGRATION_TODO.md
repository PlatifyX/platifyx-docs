# TODO - Sistema de Integrações

## ✅ Concluído

1. Schema SQL para tabela `integrations`
2. Repository layer (IntegrationRepository)
3. Service layer (IntegrationService)
4. Handler layer (IntegrationHandler)
5. Database package com migrations
6. Removidas variáveis de ambiente do Azure DevOps

## 🚧 Pendente - Backend

### 1. Atualizar ServiceManager (`internal/service/service_manager.go`)

```go
func NewServiceManager(cfg *config.Config, log *logger.Logger, db *sql.DB) *ServiceManager {
    // Criar IntegrationRepository e Service
    integrationRepo := repository.NewIntegrationRepository(db)
    integrationService := service.NewIntegrationService(integrationRepo, log)

    // Buscar config do Azure DevOps do banco
    azureDevOpsConfig, err := integrationService.GetAzureDevOpsConfig()

    var azureDevOpsService *AzureDevOpsService
    if err == nil && azureDevOpsConfig != nil {
        azureDevOpsService = NewAzureDevOpsService(*azureDevOpsConfig, log)
    }

    return &ServiceManager{
        // ...
        IntegrationService: integrationService,
        AzureDevOpsService: azureDevOpsService,
    }
}
```

### 2. Atualizar HandlerManager (`internal/handler/handler_manager.go`)

```go
type HandlerManager struct {
    // ... existing handlers
    IntegrationHandler *IntegrationHandler
}

func NewHandlerManager(services *service.ServiceManager, log *logger.Logger) *HandlerManager {
    return &HandlerManager{
        // ... existing handlers
        IntegrationHandler: NewIntegrationHandler(services.IntegrationService, log),
    }
}
```

### 3. Atualizar main.go (`cmd/api/main.go`)

```go
func main() {
    cfg := config.Load()
    log := logger.NewLogger(cfg.Environment)

    // Conectar ao banco
    db, err := database.NewPostgresConnection(cfg.DatabaseURL)
    if err != nil {
        log.Fatal("Failed to connect to database", "error", err)
    }
    defer db.Close()

    // Rodar migrations
    if err := database.RunMigrations(db, "migrations"); err != nil {
        log.Fatal("Failed to run migrations", "error", err)
    }

    // Criar managers (agora passando db)
    serviceManager := service.NewServiceManager(cfg, log, db)
    handlerManager := handler.NewHandlerManager(serviceManager, log)

    // ...
}

func setupRouter(...) {
    // Adicionar rotas de integrations
    integrations := v1.Group("/integrations")
    {
        integrations.GET("", handlers.IntegrationHandler.List)
        integrations.GET("/:id", handlers.IntegrationHandler.GetByID)
        integrations.PUT("/:id", handlers.IntegrationHandler.Update)
    }
}
```

## 🚧 Pendente - Frontend

### 1. Criar IntegrationsPage (`frontend/src/pages/IntegrationsPage.tsx`)

- Card para cada integração disponível
- Toggle enable/disable
- Botão "Configure" para abrir modal/form

### 2. Criar AzureDevOpsConfigForm (`frontend/src/components/Integrations/AzureDevOpsConfigForm.tsx`)

- Campos: Organization, Project, PAT
- Validação
- Save/Cancel buttons
- API call: `PUT /api/v1/integrations/:id`

### 3. Atualizar rotas (`frontend/src/App.tsx`)

```tsx
<Route path="/integrations" element={<IntegrationsPage />} />
```

### 4. Atualizar Sidebar (`frontend/src/components/Layout/Sidebar.tsx`)

```tsx
{ path: '/integrations', label: 'Integrações', icon: <Plug size={20} /> }
```

## 📋 Endpoints da API

### Integrations
- `GET /api/v1/integrations` - Lista todas integrações
- `GET /api/v1/integrations/:id` - Busca por ID
- `PUT /api/v1/integrations/:id` - Atualiza integração

### Exemplo de payload:

```json
PUT /api/v1/integrations/1
{
  "enabled": true,
  "config": {
    "organization": "contoso",
    "project": "MyProject",
    "pat": "abc123token"
  }
}
```

## 🎯 Fluxo de Uso

1. Usuário acessa /integrations
2. Vê lista de integrações (Azure DevOps, GitHub, etc)
3. Clica em "Configure" no Azure DevOps
4. Preenche: Organization, Project, PAT
5. Salva (enabled = true)
6. Backend atualiza banco
7. Na próxima requisição para /azuredevops, busca config do banco
8. Plugin funciona!

## 🔐 Segurança

- PAT deve ser armazenado encrypted no banco (TODO futuro)
- HTTPS obrigatório em produção
- Validar permissões (apenas admin pode configurar)
