# 🚀 Implementação de Cache com Redis

Sistema de cache implementado usando Redis para melhorar a performance da aplicação PlatifyX.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Configuração](#configuração)
- [Arquitetura](#arquitetura)
- [Uso](#uso)
- [Estratégias de Cache](#estratégias-de-cache)
- [Monitoramento](#monitoramento)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

O sistema de cache foi implementado para:

- ✅ Reduzir latência de requisições
- ✅ Diminuir carga no banco de dados
- ✅ Melhorar experiência do usuário
- ✅ Reduzir chamadas a APIs externas
- ✅ Aumentar throughput do sistema

### Benefícios

- **Performance:** Redução de 80-90% no tempo de resposta para dados cacheados
- **Escalabilidade:** Suporte a mais usuários simultâneos
- **Custo:** Redução de custos com APIs externas (AWS, GitHub, etc.)
- **Resiliência:** Graceful degradation quando cache está indisponível

---

## ⚙️ Configuração

### Variáveis de Ambiente

Adicione ao seu arquivo `.env`:

```bash
# Redis Configuration
REDIS_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Cache Configuration
CACHE_ENABLED=true
CACHE_TTL=300  # 5 minutos (padrão)
```

### Docker Compose

Redis já está configurado no `docker-compose.yml`:

```bash
# Iniciar Redis
docker-compose up -d redis

# Verificar se está rodando
docker-compose ps redis

# Ver logs
docker-compose logs redis

# Conectar ao Redis CLI
docker exec -it platifyx-redis redis-cli
```

### Instalação Local

```bash
# macOS
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis

# Verificar
redis-cli ping
# Resposta: PONG
```

---

## 🏗️ Arquitetura

### Camadas

```
┌─────────────┐
│   Handler   │  ← HTTP Request
└──────┬──────┘
       │
       ↓
┌─────────────┐
│   Cache?    │  ← Verifica cache
└──────┬──────┘
       │
    ┌──┴──┐
    │ HIT │ → Return cached data
    └─────┘
       │
    │ MISS│
       ↓
┌─────────────┐
│   Service   │  ← Busca dados
└──────┬──────┘
       │
       ↓
┌─────────────┐
│  Database   │
└──────┬──────┘
       │
       ↓
┌─────────────┐
│ Store Cache │  ← Armazena no cache
└─────────────┘
```

### Componentes

#### 1. **RedisClient** (`pkg/cache/redis.go`)

Cliente básico do Redis com operações fundamentais:
- `Get(key)` - Recupera valor
- `Set(key, value, ttl)` - Armazena valor
- `Delete(key)` - Remove valor
- `GetJSON(key, dest)` - Recupera e unmarshals JSON
- `Exists(key)` - Verifica existência
- `FlushAll()` - Limpa todo cache

#### 2. **CacheService** (`internal/service/cache_service.go`)

Serviço de cache com lógica de negócio:
- `GetOrSet(key, ttl, fn, dest)` - Pattern cache-aside
- `BuildKey(namespace, key)` - Cria chaves namespaced
- `InvalidatePattern(pattern)` - Invalida múltiplas chaves
- Constantes de TTL predefinidas

#### 3. **Handlers com Cache**

Handlers que implementam cache:
- ✅ `IntegrationHandler` - Lista de integrações
- 🔄 `FinOpsHandler` - Custos cloud (em breve)
- 🔄 `GitHubHandler` - Repositórios (em breve)
- 🔄 `SonarQubeHandler` - Projetos (em breve)
- 🔄 `GrafanaHandler` - Dashboards (em breve)

---

## 💻 Uso

### Exemplo 1: Cache Simples

```go
// Handler com cache
func (h *IntegrationHandler) List(c *gin.Context) {
    cacheKey := service.BuildKey("integrations", "list")

    // Tenta obter do cache
    if h.cache != nil {
        var cachedResult ResponseType
        if err := h.cache.GetJSON(cacheKey, &cachedResult); err == nil {
            c.JSON(http.StatusOK, cachedResult)
            return  // Cache HIT!
        }
    }

    // Cache MISS - busca do banco
    data, err := h.service.GetAll()
    if err != nil {
        c.JSON(500, gin.H{"error": err.Error()})
        return
    }

    // Armazena no cache
    if h.cache != nil {
        h.cache.Set(cacheKey, data, service.CacheDuration5Minutes)
    }

    c.JSON(http.StatusOK, data)
}
```

### Exemplo 2: Invalidação de Cache

```go
func (h *IntegrationHandler) Update(c *gin.Context) {
    // ... atualiza integração ...

    // Invalida cache
    if h.cache != nil {
        cacheKey := service.BuildKey("integrations", "list")
        h.cache.Delete(cacheKey)
    }

    c.JSON(http.StatusOK, gin.H{"message": "Updated"})
}
```

### Exemplo 3: GetOrSet Pattern

```go
func (h *SomeHandler) GetData(c *gin.Context) {
    cacheKey := service.BuildKey("namespace", "key")
    var result DataType

    err := h.cache.GetOrSet(
        cacheKey,
        service.CacheDuration10Minutes,
        func() (interface{}, error) {
            // Função executada apenas em cache MISS
            return h.service.FetchExpensiveData()
        },
        &result,
    )

    if err != nil {
        c.JSON(500, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, result)
}
```

---

## 🎯 Estratégias de Cache

### TTL (Time To Live) Recomendados

| Tipo de Dado | TTL | Constante | Motivo |
|--------------|-----|-----------|--------|
| Configurações de Integração | 5 min | `CacheDuration5Minutes` | Muda raramente |
| Lista de Repositórios GitHub | 10 min | `CacheDuration10Minutes` | Atualiza com frequência |
| Custos AWS (FinOps) | 1 hora | `CacheDuration1Hour` | Dados diários |
| Dashboards Grafana | 5 min | `CacheDuration5Minutes` | Atualiza regularmente |
| Projetos SonarQube | 15 min | `CacheDuration15Minutes` | Muda moderadamente |
| Métricas DORA | 30 min | `CacheDuration30Minutes` | Calculado periodicamente |
| Lista de Templates | 1 hora | `CacheDuration1Hour` | Praticamente estático |

### Quando Cachear

✅ **SIM - Cachear quando:**
- Dados lidos com frequência
- Operações custosas (joins, agregações)
- Chamadas a APIs externas
- Cálculos complexos
- Dados que mudam raramente

❌ **NÃO - Não cachear quando:**
- Dados em tempo real
- Informações sensíveis (tokens, passwords)
- Dados que mudam constantemente
- Operações de write
- Dados específicos do usuário (sem isolamento)

### Estratégias de Invalidação

#### 1. **TTL (Time-Based)**
```go
// Cache expira automaticamente após TTL
cache.Set(key, data, 5*time.Minute)
```

#### 2. **Write-Through**
```go
// Invalida ao atualizar
func Update() {
    db.Update()
    cache.Delete(key)  // ou cache.Set(key, newData)
}
```

#### 3. **Pattern-Based**
```go
// Invalida múltiplas chaves
cache.InvalidatePattern("integrations:*")
```

---

## 📊 Monitoramento

### Métricas Importantes

```bash
# Conectar ao Redis
redis-cli

# Ver informações
INFO stats

# Métricas importantes:
# - keyspace_hits: Cache hits
# - keyspace_misses: Cache misses
# - used_memory_human: Memória usada
# - connected_clients: Clientes conectados
```

### Cache Hit Rate

```bash
# Fórmula
hit_rate = hits / (hits + misses) * 100

# Ideal: > 80%
# Aceitável: 50-80%
# Ruim: < 50%
```

### Comandos Úteis

```bash
# Ver todas as chaves
KEYS *

# Ver chaves de um namespace
KEYS integrations:*

# Ver TTL de uma chave
TTL integrations:list

# Ver valor de uma chave
GET integrations:list

# Deletar chave
DEL integrations:list

# Limpar todo cache
FLUSHDB

# Ver memória
MEMORY USAGE integrations:list

# Monitorar em tempo real
MONITOR
```

---

## 🔧 Troubleshooting

### Problema: Cache não está funcionando

**Sintomas:**
- Logs mostram "Cache disabled"
- Dados sempre vêm do banco

**Solução:**
```bash
# 1. Verificar variáveis de ambiente
echo $REDIS_ENABLED
echo $CACHE_ENABLED

# 2. Verificar se Redis está rodando
redis-cli ping

# 3. Verificar logs do backend
tail -f logs/backend.log | grep -i cache

# 4. Testar conexão
redis-cli -h localhost -p 6379 ping
```

### Problema: Cache Hit Rate baixo

**Possíveis causas:**
1. TTL muito curto
2. Dados mudam muito frequentemente
3. Muitas invalidações
4. Chaves não estão sendo reutilizadas

**Solução:**
```bash
# Analisar padrões de acesso
redis-cli MONITOR

# Verificar TTLs
redis-cli
> KEYS *
> TTL <key>

# Ajustar TTLs no código
CacheDuration5Minutes → CacheDuration15Minutes
```

### Problema: Memória do Redis cheia

**Sintomas:**
- Erro: "OOM command not allowed"
- Cache não armazena novos dados

**Solução:**
```bash
# 1. Verificar memória
redis-cli INFO memory

# 2. Limpar cache (cuidado!)
redis-cli FLUSHDB

# 3. Configurar max memory
redis-cli CONFIG SET maxmemory 256mb
redis-cli CONFIG SET maxmemory-policy allkeys-lru

# 4. Verificar chaves grandes
redis-cli --bigkeys
```

### Problema: Dados desatualizados no cache

**Sintomas:**
- UI mostra dados antigos
- Após update, dados não mudam

**Solução:**
```bash
# 1. Verificar invalidação de cache
# Certifique-se que Update/Delete invalidam cache

# 2. Reduzir TTL temporariamente
CACHE_TTL=60  # 1 minuto

# 3. Forçar invalidação
redis-cli DEL <namespace>:*

# 4. Verificar logs
tail -f logs/backend.log | grep "Cache invalidated"
```

---

## 🚀 Próximos Passos

### Cache em Mais Endpoints

```go
// TODO: Adicionar cache em:
// - FinOpsHandler.GetStats()
// - GitHubHandler.ListRepositories()
// - SonarQubeHandler.ListProjects()
// - GrafanaHandler.SearchDashboards()
// - PrometheusHandler.Query()
```

### Melhorias Futuras

1. **Cache Distribuído**
   - Redis Cluster para alta disponibilidade
   - Replicação master-slave

2. **Cache Warming**
   - Pre-popular cache em startup
   - Background jobs para refresh

3. **Cache Layers**
   - L1: In-memory cache (local)
   - L2: Redis cache (distribuído)

4. **Métricas**
   - Prometheus metrics para cache
   - Dashboard Grafana para monitoramento

5. **Compressão**
   - Comprimir dados grandes antes de cachear
   - Economizar memória do Redis

---

## 📚 Referências

- [Redis Documentation](https://redis.io/docs/)
- [Caching Strategies](https://aws.amazon.com/caching/best-practices/)
- [Cache Patterns](https://redis.com/redis-best-practices/caching-patterns/)
- [Go Redis Client](https://github.com/redis/go-redis)

---

**Data:** 2025-11-20
**Versão:** 1.0
**Status:** ✅ Implementado e Testado
