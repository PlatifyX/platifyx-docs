# PlatifyX - Quick Start ⚡

Inicie o PlatifyX em segundos!

## 🚀 Iniciar

```bash
./start.sh
```

## 🛑 Parar

```bash
./stop.sh
```

## 📍 Acessar

Após iniciar, acesse:
- **Frontend:** http://localhost:7000
- **Backend API:** http://localhost:8060
- **Health Check:** http://localhost:8060/api/v1/health

## 📝 Logs

Os logs são salvos em:
- `logs/backend.log` - Logs do backend
- `logs/frontend.log` - Logs do frontend

Para ver os logs em tempo real:
```bash
tail -f logs/backend.log
tail -f logs/frontend.log
```

## 🔧 O que os scripts fazem?

1. ✅ Verificam e instalam dependências (Go modules e npm packages)
2. ✅ Iniciam o backend em background (porta 8060)
3. ✅ Iniciam o frontend em background (porta 7000)
4. ✅ Salvam os PIDs para gerenciamento
5. ✅ Criam logs separados para cada serviço

## 📚 Documentação Completa

Para mais informações, veja:
- [Getting Started](./GETTING_STARTED.md) - Guia completo
- [Frontend README](./frontend/README.md) - Documentação do frontend
- [Backend README](./backend/README.md) - Documentação do backend
