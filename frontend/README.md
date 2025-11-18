# PlatifyX Frontend

Frontend do PlatifyX - Developer Portal & Platform Engineering Hub

![PlatifyX](https://raw.githubusercontent.com/robertasolimandonofreo/assets/refs/heads/main/PlatifyX/1.png)

## 🚀 Tecnologias

- **React 18** - Biblioteca UI
- **TypeScript** - Type safety
- **Vite** - Build tool e dev server
- **React Router** - Navegação
- **Lucide React** - Ícones
- **CSS Modules** - Estilização

## 📦 Instalação

```bash
npm install
```

## 🛠️ Desenvolvimento

```bash
npm run dev
```

Acesse: http://localhost:7000

## 🏗️ Build

```bash
npm run build
```

## 🐳 Docker

### Build da imagem

```bash
docker build -t platifyx-app .
```

### Executar container

```bash
docker run -p 7000:80 platifyx-app
```

## 📁 Estrutura do Projeto

```
frontend/
├── src/
│   ├── components/
│   │   └── Layout/
│   │       ├── Header.tsx
│   │       ├── Sidebar.tsx
│   │       └── Layout.tsx
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── ServicesPage.tsx
│   │   └── KubernetesPage.tsx
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── Dockerfile
├── nginx.conf
└── package.json
```

## 🎨 Features

- ✅ Layout responsivo com Header e Sidebar
- ✅ Navegação com React Router
- ✅ Páginas: Home, Dashboard, Serviços, Kubernetes
- ✅ Tema dark com variáveis CSS
- ✅ Componentes modulares
- ✅ TypeScript completo
- ✅ Build otimizado com Vite
- ✅ Docker multi-stage build

## 📄 Licença

Baseado em Backstage (Apache 2.0)
