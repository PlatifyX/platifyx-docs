# PlatifyX Backend

Backend da plataforma PlatifyX - Platform Engineering & Developer Portal.

## 🏗️ Arquitetura

```
backend/
├── cmd/api/              # Entry point
├── internal/             # Código interno (não exportável)
│   ├── config/           # Configurações
│   ├── domain/           # Modelos de domínio
│   ├── handler/          # HTTP handlers
│   │   └── base/         # Base handler reutilizável ⭐
│   ├── middleware/       # Middlewares HTTP
│   ├── repository/       # Camada de dados
│   └── service/          # Lógica de negócio
├── pkg/                  # Código reutilizável (exportável)
│   ├── response/         # Response builders padronizados ⭐
│   ├── httperr/          # Tratamento de erros HTTP ⭐
│   ├── logger/           # Logger estruturado
│   ├── cache/            # Cache (Redis)
│   └── */                # Clients externos (AWS, GitHub, etc)
└── migrations/           # Migrações de banco
```

## 📚 Documentação Completa

**[📖 BACKEND_PATTERNS.md](./BACKEND_PATTERNS.md)** - LEIA ANTES DE CODAR!

Este documento contém TODOS os padrões obrigatórios para o backend.

## 🎯 Redução de Código Duplicado

Com os novos padrões, **eliminamos ~40% de código repetido**:

- ✅ FinOpsHandler: 254 → 158 linhas (-96 linhas, -38%)
- ✅ GitHubHandler: 401 → 249 linhas (-152 linhas, -38%)
- ✅ Cache logic: De ~20 linhas por endpoint para 3 linhas
- ✅ Error handling: Consistente em todos handlers

## ⭐ Componentes Principais

### 1. Response Builders (`pkg/response`)

```go
response.Success(c, data)
response.BadRequest(c, "message")
response.NotFound(c, "message")
```

### 2. Error Handling (`pkg/httperr`)

```go
httperr.BadRequest("message")
httperr.InternalErrorWrap("message", err)
```

### 3. Base Handler (`internal/handler/base`)

```go
type MyHandler struct {
    *base.BaseHandler  // SEMPRE embedar!
}

h.WithCache(c, key, ttl, func() (interface{}, error) {
    return h.service.GetData()
})
```

## 📝 Template de Handler

```go
package handler

import (
    "github.com/PlatifyX/platifyx-core/internal/handler/base"
    "github.com/PlatifyX/platifyx-core/internal/service"
    "github.com/PlatifyX/platifyx-core/pkg/logger"
    "github.com/gin-gonic/gin"
)

type MyHandler struct {
    *base.BaseHandler
    myService *service.MyService
}

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

func (h *MyHandler) GetStats(c *gin.Context) {
    cacheKey := service.BuildKey("my", "stats")
    h.WithCache(c, cacheKey, service.CacheDuration5Minutes, func() (interface{}, error) {
        return h.myService.GetStats()
    })
}
```

## ✅ Checklist

Antes de fazer PR:

- [ ] Handler embeda `base.BaseHandler`
- [ ] Usa `WithCache` quando apropriado
- [ ] Usa `response.*` para respostas
- [ ] Usa `httperr.*` para erros
- [ ] Service retorna erros estruturados
- [ ] Logging com contexto
- [ ] Testes adicionados

**Consulte [BACKEND_PATTERNS.md](./BACKEND_PATTERNS.md) para detalhes completos!**
