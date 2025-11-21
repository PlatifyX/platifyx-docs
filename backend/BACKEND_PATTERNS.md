# Backend Patterns - PlatifyX

Este documento define os padrões obrigatórios para **TODO** o código backend da PlatifyX.

## 📋 Índice

1. [Estrutura de Projeto](#estrutura-de-projeto)
2. [Handlers](#handlers)
3. [Services](#services)
4. [Repositories](#repositories)
5. [Respostas HTTP](#respostas-http)
6. [Tratamento de Erros](#tratamento-de-erros)
7. [Cache](#cache)
8. [Logging](#logging)
9. [Testes](#testes)

---

## 📁 Estrutura de Projeto

```
backend/
├── cmd/
│   └── api/              # Entry point da aplicação
│       └── main.go
├── internal/
│   ├── config/           # Configurações
│   ├── domain/           # Modelos de domínio
│   ├── handler/          # HTTP handlers
│   │   ├── base/         # Base handler reutilizável
│   │   ├── *_handler.go  # Handlers específicos
│   ├── middleware/       # Middlewares HTTP
│   ├── repository/       # Repositórios de dados
│   └── service/          # Lógica de negócio
├── pkg/                  # Pacotes reutilizáveis
│   ├── response/         # Builders de resposta HTTP
│   ├── httperr/          # Erros HTTP estruturados
│   ├── logger/           # Logger
│   ├── cache/            # Cache
│   └── */                # Clients externos (github, aws, etc)
└── migrations/           # Migrações de banco
```

---

## 🎯 Handlers

### Estrutura Padrão

**TODOS** os handlers DEVEM seguir este padrão:

```go
package handler

import (
	"github.com/PlatifyX/platifyx-core/internal/handler/base"
	"github.com/PlatifyX/platifyx-core/internal/service"
	"github.com/PlatifyX/platifyx-core/pkg/httperr"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"github.com/gin-gonic/gin"
)

// MyHandler gerencia endpoints de My
type MyHandler struct {
	*base.BaseHandler  // SEMPRE embedar BaseHandler
	myService *service.MyService
}

// NewMyHandler cria uma nova instância
func NewMyHandler(
	myService *service.MyService,
	cache *service.CacheService,
	log *logger.Logger,
) *MyHandler {
	return &MyHandler{
		BaseHandler: base.NewBaseHandler(cache, log),
		myService:   myService,
	}
}
```

### Métodos de Handler

#### ✅ COM Cache

Use `WithCache` para endpoints que podem ser cacheados:

```go
func (h *MyHandler) GetStats(c *gin.Context) {
	cacheKey := service.BuildKey("my", "stats")

	h.WithCache(c, cacheKey, service.CacheDuration5Minutes, func() (interface{}, error) {
		stats, err := h.myService.GetStats()
		if err != nil {
			return nil, httperr.InternalErrorWrap("Failed to get stats", err)
		}
		return stats, nil
	})
}
```

#### ✅ SEM Cache

Para endpoints que não devem ser cacheados:

```go
func (h *MyHandler) CreateResource(c *gin.Context) {
	var req CreateResourceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.BadRequest(c, "Invalid request body")
		return
	}

	resource, err := h.myService.CreateResource(req)
	if err != nil {
		h.HandleError(c, err)
		return
	}

	h.Created(c, resource)
}
```

#### ✅ Com Paginação

```go
func (h *MyHandler) ListResources(c *gin.Context) {
	page := 1
	perPage := 20

	// Parse query params
	if p := c.Query("page"); p != "" {
		if parsed, err := strconv.Atoi(p); err == nil {
			page = parsed
		}
	}

	resources, total, err := h.myService.ListResources(page, perPage)
	if err != nil {
		h.HandleError(c, err)
		return
	}

	meta := &response.Meta{
		Page:       page,
		PerPage:    perPage,
		Total:      total,
		TotalPages: (total + perPage - 1) / perPage,
	}

	h.SuccessWithMeta(c, resources, meta)
}
```

### ❌ NÃO FAÇA

```go
// ERRADO - lógica de cache duplicada
func (h *MyHandler) GetStats(c *gin.Context) {
	cacheKey := "my:stats"

	// Try cache first
	if h.cache != nil {
		var cachedData interface{}
		if err := h.cache.GetJSON(cacheKey, &cachedData); err == nil {
			c.JSON(http.StatusOK, cachedData)
			return
		}
	}

	// ... resto do código
}

// ERRADO - tratamento de erro inconsistente
func (h *MyHandler) GetData(c *gin.Context) {
	data, err := h.service.GetData()
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})  // ❌
		return
	}
	c.JSON(200, data)  // ❌
}
```

---

## 🔧 Services

### Estrutura Padrão

```go
package service

import (
	"github.com/PlatifyX/platifyx-core/internal/domain"
	"github.com/PlatifyX/platifyx-core/internal/repository"
	"github.com/PlatifyX/platifyx-core/pkg/httperr"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
)

// MyService gerencia a lógica de negócio de My
type MyService struct {
	repo *repository.MyRepository
	log  *logger.Logger
}

// NewMyService cria uma nova instância
func NewMyService(repo *repository.MyRepository, log *logger.Logger) *MyService {
	return &MyService{
		repo: repo,
		log:  log,
	}
}
```

### Regras de Services

1. **Services DEVEM retornar erros estruturados** usando `httperr`
2. **Services NÃO DEVEM ter conhecimento de HTTP** (gin.Context)
3. **Services DEVEM fazer logging** de operações importantes
4. **Services DEVEM validar dados de entrada**

### Exemplo Completo

```go
func (s *MyService) GetResourceByID(id string) (*domain.Resource, error) {
	if id == "" {
		return nil, httperr.BadRequest("Resource ID is required")
	}

	s.log.Debugw("Fetching resource", "id", id)

	resource, err := s.repo.FindByID(id)
	if err != nil {
		s.log.Errorw("Failed to fetch resource", "id", id, "error", err)
		return nil, httperr.InternalErrorWrap("Failed to fetch resource", err)
	}

	if resource == nil {
		return nil, httperr.NotFound("Resource not found")
	}

	return resource, nil
}

func (s *MyService) CreateResource(req CreateResourceRequest) (*domain.Resource, error) {
	// Validação
	if err := req.Validate(); err != nil {
		return nil, httperr.BadRequestWrap("Invalid resource data", err)
	}

	// Verificar duplicatas
	existing, err := s.repo.FindByName(req.Name)
	if err != nil {
		return nil, httperr.InternalErrorWrap("Failed to check for duplicates", err)
	}
	if existing != nil {
		return nil, httperr.Conflict("Resource with this name already exists")
	}

	// Criar resource
	resource := &domain.Resource{
		Name:        req.Name,
		Description: req.Description,
	}

	if err := s.repo.Create(resource); err != nil {
		s.log.Errorw("Failed to create resource", "error", err)
		return nil, httperr.InternalErrorWrap("Failed to create resource", err)
	}

	s.log.Infow("Resource created", "id", resource.ID, "name", resource.Name)
	return resource, nil
}
```

---

## 🗄️ Repositories

### Estrutura Padrão

```go
package repository

import (
	"github.com/PlatifyX/platifyx-core/internal/domain"
	"gorm.io/gorm"
)

// MyRepository gerencia acesso a dados de My
type MyRepository struct {
	db *gorm.DB
}

// NewMyRepository cria uma nova instância
func NewMyRepository(db *gorm.DB) *MyRepository {
	return &MyRepository{db: db}
}
```

### Regras de Repositories

1. **Repositories DEVEM retornar erros do GORM** (não wrapped)
2. **Repositories NÃO DEVEM ter lógica de negócio**
3. **Repositories DEVEM ser simples** (CRUD + queries específicas)

### Exemplo

```go
func (r *MyRepository) FindByID(id string) (*domain.Resource, error) {
	var resource domain.Resource
	if err := r.db.Where("id = ?", id).First(&resource).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil  // Não encontrado = nil, nil
		}
		return nil, err
	}
	return &resource, nil
}

func (r *MyRepository) Create(resource *domain.Resource) error {
	return r.db.Create(resource).Error
}

func (r *MyRepository) Update(resource *domain.Resource) error {
	return r.db.Save(resource).Error
}

func (r *MyRepository) Delete(id string) error {
	return r.db.Delete(&domain.Resource{}, "id = ?", id).Error
}

func (r *MyRepository) List(page, perPage int) ([]*domain.Resource, int, error) {
	var resources []*domain.Resource
	var total int64

	// Count total
	if err := r.db.Model(&domain.Resource{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Fetch page
	offset := (page - 1) * perPage
	if err := r.db.Offset(offset).Limit(perPage).Find(&resources).Error; err != nil {
		return nil, 0, err
	}

	return resources, int(total), nil
}
```

---

## 📤 Respostas HTTP

### Use `pkg/response`

**SEMPRE** use o pacote `response` para respostas HTTP:

```go
import "github.com/PlatifyX/platifyx-core/pkg/response"

// ✅ Sucesso
response.Success(c, data)

// ✅ Sucesso com paginação
response.SuccessWithMeta(c, data, &response.Meta{
	Page:    1,
	PerPage: 20,
	Total:   100,
})

// ✅ Criado (201)
response.Created(c, data)

// ✅ Sem conteúdo (204)
response.NoContent(c)

// ✅ Erro
response.BadRequest(c, "Invalid input")
response.NotFound(c, "Resource not found")
response.InternalError(c, "Something went wrong")
```

### ❌ NÃO FAÇA

```go
// ERRADO - não usar c.JSON diretamente
c.JSON(200, data)
c.JSON(500, gin.H{"error": "something"})

// ERRADO - estrutura inconsistente
c.JSON(200, gin.H{"data": data})
c.JSON(200, gin.H{"result": data, "success": true})
```

---

## ⚠️ Tratamento de Erros

### Use `pkg/httperr`

**SEMPRE** use o pacote `httperr` para criar erros:

```go
import "github.com/PlatifyX/platifyx-core/pkg/httperr"

// ✅ Erro simples
return httperr.BadRequest("Invalid input")
return httperr.NotFound("Resource not found")
return httperr.Conflict("Resource already exists")

// ✅ Erro wrapeando outro erro
return httperr.InternalErrorWrap("Failed to fetch data", err)
return httperr.BadRequestWrap("Invalid data", validationErr)

// ✅ Erro com detalhes
return httperr.BadRequest("Invalid input").WithDetails("Email must be valid")

// ✅ Tratamento no handler
if err != nil {
	h.HandleError(c, err)  // BaseHandler cuida do resto
	return
}
```

### Tipos de Erro

| Função | HTTP Status | Quando Usar |
|--------|-------------|-------------|
| `BadRequest` | 400 | Dados de entrada inválidos |
| `Unauthorized` | 401 | Autenticação necessária |
| `Forbidden` | 403 | Sem permissão |
| `NotFound` | 404 | Recurso não encontrado |
| `Conflict` | 409 | Conflito (ex: duplicata) |
| `InternalError` | 500 | Erro interno do servidor |
| `ServiceUnavailable` | 503 | Serviço externo indisponível |

---

## 💾 Cache

### TTL Padrões

Use as constantes do `service.CacheDuration`:

```go
service.CacheDuration1Minute    // 1 minuto - dados muito voláteis
service.CacheDuration5Minutes   // 5 minutos - padrão para stats
service.CacheDuration15Minutes  // 15 minutos - dados semi-estáticos
service.CacheDuration1Hour      // 1 hora - dados estáticos
service.CacheDuration24Hours    // 24 horas - dados muito estáticos
```

### Como Usar

```go
// ✅ Com BaseHandler.WithCache (RECOMENDADO)
h.WithCache(c, cacheKey, service.CacheDuration5Minutes, func() (interface{}, error) {
	return h.service.GetData()
})

// ✅ Manual (quando necessário)
cacheKey := service.BuildKey("my", "resource", id)

// Try cache
if h.cache != nil {
	var cached MyData
	if err := h.cache.GetJSON(cacheKey, &cached); err == nil {
		return cached, nil
	}
}

// Fetch data
data, err := fetchData()
if err != nil {
	return nil, err
}

// Set cache
if h.cache != nil {
	h.cache.Set(cacheKey, data, service.CacheDuration5Minutes)
}
```

### Cache Keys

Use `service.BuildKey` para criar chaves consistentes:

```go
// ✅ Boas chaves
service.BuildKey("github", "stats")                    // "github:stats"
service.BuildKey("finops", "aws", "monthly")           // "finops:aws:monthly"
service.BuildKey("k8s", "pod", namespace, name)        // "k8s:pod:default:app"
```

---

## 📝 Logging

### Níveis de Log

```go
// Debug - informações de debug (desabilitado em produção)
h.log.Debugw("Processing request", "user_id", userID)

// Info - informações importantes
h.log.Infow("Resource created", "id", resource.ID)

// Warn - avisos (não são erros)
h.log.Warnw("Cache miss", "key", cacheKey)

// Error - erros
h.log.Errorw("Failed to fetch data", "error", err)
```

### Boas Práticas

1. **Use structured logging** (`*w` methods)
2. **Log context relevante** (IDs, nomes, etc)
3. **NÃO logue dados sensíveis** (senhas, tokens)
4. **Log ações importantes** (create, update, delete)

```go
// ✅ BOM
h.log.Infow("User created",
	"user_id", user.ID,
	"email", user.Email,
	"role", user.Role,
)

// ❌ RUIM
h.log.Info("User created")  // Sem contexto
h.log.Infow("User created", "password", user.Password)  // Dado sensível
```

---

## 🧪 Testes

### Estrutura de Testes

```go
package service_test

import (
	"testing"

	"github.com/PlatifyX/platifyx-core/internal/service"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func TestMyService_GetResourceByID(t *testing.T) {
	// Arrange
	mockRepo := new(MockRepository)
	mockLogger := logger.NewNoop()
	svc := service.NewMyService(mockRepo, mockLogger)

	expectedResource := &domain.Resource{ID: "123", Name: "Test"}
	mockRepo.On("FindByID", "123").Return(expectedResource, nil)

	// Act
	resource, err := svc.GetResourceByID("123")

	// Assert
	assert.NoError(t, err)
	assert.Equal(t, expectedResource, resource)
	mockRepo.AssertExpectations(t)
}
```

---

## ✅ Checklist de Código

Antes de fazer commit, verifique:

- [ ] Handler embeda `base.BaseHandler`
- [ ] Usa `WithCache` para endpoints cacheáveis
- [ ] Usa `h.HandleError` para tratamento de erros
- [ ] Service retorna `httperr` errors
- [ ] Usa `response.Success/Error` para respostas
- [ ] Repository é simples (apenas data access)
- [ ] Logging estruturado com contexto
- [ ] Cache keys usam `service.BuildKey`
- [ ] TTL de cache apropriado
- [ ] Testes para lógica crítica

---

## 📚 Exemplos Completos

### Handler Completo

```go
package handler

import (
	"github.com/PlatifyX/platifyx-core/internal/handler/base"
	"github.com/PlatifyX/platifyx-core/internal/service"
	"github.com/PlatifyX/platifyx-core/pkg/httperr"
	"github.com/PlatifyX/platifyx-core/pkg/logger"
	"github.com/PlatifyX/platifyx-core/pkg/response"
	"github.com/gin-gonic/gin"
)

type ResourceHandler struct {
	*base.BaseHandler
	resourceService *service.ResourceService
}

func NewResourceHandler(
	resourceService *service.ResourceService,
	cache *service.CacheService,
	log *logger.Logger,
) *ResourceHandler {
	return &ResourceHandler{
		BaseHandler:     base.NewBaseHandler(cache, log),
		resourceService: resourceService,
	}
}

// GET /api/v1/resources/:id
func (h *ResourceHandler) GetByID(c *gin.Context) {
	id := c.Param("id")

	cacheKey := service.BuildKey("resource", id)
	h.WithCache(c, cacheKey, service.CacheDuration5Minutes, func() (interface{}, error) {
		return h.resourceService.GetByID(id)
	})
}

// GET /api/v1/resources
func (h *ResourceHandler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))

	resources, total, err := h.resourceService.List(page, perPage)
	if err != nil {
		h.HandleError(c, err)
		return
	}

	meta := &response.Meta{
		Page:       page,
		PerPage:    perPage,
		Total:      total,
		TotalPages: (total + perPage - 1) / perPage,
	}

	h.SuccessWithMeta(c, resources, meta)
}

// POST /api/v1/resources
func (h *ResourceHandler) Create(c *gin.Context) {
	var req CreateResourceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.BadRequest(c, "Invalid request body")
		return
	}

	resource, err := h.resourceService.Create(req)
	if err != nil {
		h.HandleError(c, err)
		return
	}

	h.Created(c, resource)
}

// DELETE /api/v1/resources/:id
func (h *ResourceHandler) Delete(c *gin.Context) {
	id := c.Param("id")

	if err := h.resourceService.Delete(id); err != nil {
		h.HandleError(c, err)
		return
	}

	h.NoContent(c)
}
```

---

**Lembre-se**: Consistência e padronização são fundamentais. Seguir estes padrões garante um backend limpo, testável e manutenível.
