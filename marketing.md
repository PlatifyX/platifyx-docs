# Prompt para Geração do Site de Marketing da PlatifyX

## Contexto

Você precisa desenvolver um **site de marketing moderno e profissional** para a **PlatifyX**, uma plataforma de Platform Engineering & Developer Portal baseada em Backstage. O site deve ser desenvolvido em **Node.js** com uma stack moderna e responsiva.

---

## 📋 Requisitos Técnicos

### Stack Tecnológica
- **Backend**: Node.js 20+ com Express.js
- **Frontend**: React 18+ com TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + CSS Modules
- **Ícones**: Lucide React
- **Animações**: Framer Motion
- **Forms**: React Hook Form + Zod (validação)
- **Email**: SendGrid (@sendgrid/mail)
- **SEO**: React Helmet Async
- **Routing**: React Router v6

### Estrutura do Projeto
```
platifyx-marketing/
├── backend/
│   ├── server.js                 # Express server
│   ├── routes/
│   │   ├── contact.js           # Endpoint para formulário de contato
│   │   └── demo.js              # Endpoint para solicitação de demo
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/          # Componentes reutilizáveis
│   │   ├── sections/            # Seções da landing page
│   │   ├── pages/               # Páginas do site
│   │   ├── assets/              # Imagens, ícones, logos
│   │   ├── styles/              # CSS global e Tailwind config
│   │   └── App.tsx              # Componente principal
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── package.json
├── docker-compose.yml            # Para desenvolvimento local
├── .env.example
└── README.md
```

---

## 🎨 Identidade Visual

### Paleta de Cores
```css
/* Cores Principais */
--primary-blue: #0066FF;          /* Azul PlatifyX */
--primary-dark: #0052CC;          /* Azul escuro (hover) */
--secondary-cyan: #00C7FF;        /* Cyan (secundária) */

/* Neutras */
--gray-900: #1A1A1A;              /* Textos principais */
--gray-800: #2D2D2D;              /* Backgrounds escuros */
--gray-700: #404040;
--gray-300: #D1D5DB;
--gray-100: #F3F4F6;
--white: #FFFFFF;

/* Funcionais */
--success-green: #10B981;
--warning-yellow: #F59E0B;
--error-red: #EF4444;
--info-blue: #3B82F6;
```

### Tipografia
- **Títulos (H1-H3)**: Inter Bold (700-800)
- **Subtítulos (H4-H6)**: Inter SemiBold (600)
- **Corpo**: Inter Regular (400)
- **Código**: JetBrains Mono

### Logotipos
- **Logo Principal**: Com nome completo "PlatifyX" (landing page, header, footer)
- **Logo Símbolo**: Apenas o ícone (favicon, mobile menu)
- Usar SVG para qualidade máxima

---

## 📄 Estrutura do Site

### 1. **Homepage / Landing Page**

#### Hero Section
```
- Título impactante: "Platform Engineering Made Simple"
- Subtítulo: "O Developer Portal completo para times de engenharia modernos. Gerencie infraestrutura, observabilidade, qualidade e custos em um único lugar."
- CTAs principais:
  • "Solicitar Demo" (botão primário)
  • "Ver Documentação" (botão secundário)
- Hero image/animation: Dashboard preview animado
```


#### Seção: O que é PlatifyX?
```
Título: "Developer Portal + Platform Engineering Hub"

3 pilares principais (cards com ícones):

1. 🚀 Self-Service para Desenvolvedores
   - Crie, configure e faça deploy
   - Templates prontos para microserviços, workers, frontends
   - Catálogo centralizado de todos os serviços

2. 🔍 Observabilidade Completa
   - Logs, métricas e traces em tempo real
   - Dashboards Grafana integrados
   - Alertas inteligentes com notificações

3. 💰 FinOps Multi-Cloud
   - Visualize custos por serviço, equipe e ambiente
   - AWS, GCP e Azure em um único dashboard
   - Recomendações de otimização automáticas
```

#### Seção: Funcionalidades Principais
```
Grid de cards (6-8 features):

✅ Service Catalog
   - Catálogo completo de microserviços
   - Dependências e ownership visíveis
   - Links automáticos (Swagger, Grafana, Logs)

✅ Templates de Scaffold
   - Gere serviços completos em segundos
   - Go, Node.js, React, Workers, CronJobs
   - Estrutura padronizada e best practices

✅ Kubernetes Management
   - Visualize clusters, pods e deployments
   - Logs e métricas em tempo real
   - Gestão de namespaces e quotas

✅ CI/CD Integrado
   - Azure DevOps, GitHub Actions, GitLab CI
   - Histórico de deploys e rollbacks
   - ArgoCD para continuous delivery

✅ Qualidade & Compliance
   - SonarQube integration
   - SBOM e dependency scanning
   - LGPD, SOC2, ISO 27001 compliance

✅ Secrets Management
   - HashiCorp Vault e AWS Secrets Manager
   - Interface visual para criar/editar secrets
   - Rotação automática e auditoria

✅ DORA Metrics
   - Deployment frequency
   - Lead time for changes
   - Change failure rate & MTTR
   - Insights de produtividade

✅ Admin & RBAC
   - Gerenciamento de usuários e equipes
   - Roles e permissões customizadas
   - SSO (Google, Microsoft)
   - Auditoria completa
```

#### Seção: Integrações (Destaque!)
```
Título: "20+ Integrações com Ferramentas Modernas"

Categorias com logos:

**CI/CD & Repositórios:**
- Azure DevOps
- GitHub
- GitLab
- ArgoCD

**Observabilidade:**
- Grafana
- Prometheus
- Loki
- Jaeger/Tempo
- Faro (RUM)

**Cloud Providers:**
- AWS (ECS, RDS, S3, Lambda, CloudWatch, Cost Explorer)
- Google Cloud (GKE, Cloud Run, Billing)
- Microsoft Azure (AKS, Cost Management)

**Qualidade:**
- SonarQube

**Secrets:**
- HashiCorp Vault
- AWS Secrets Manager

**Kubernetes:**
- Kubernetes clusters

**Comunicação:**
- Slack
- Microsoft Teams
- Jira

**IA & Assistentes:**
- OpenAI (GPT)
- Google Gemini
- Anthropic Claude

[Botão: "Ver todas as integrações"]
```

#### Seção: Como Funciona
```
Timeline/Steps (3-4 passos):

1️⃣ Configure suas Integrações
   - Conecte AWS, GCP, Azure, Kubernetes, Grafana, etc.
   - Interface visual com validação de credenciais
   - Armazenamento seguro no Vault

2️⃣ Crie Serviços com Templates
   - Escolha um template (Go, Node, React, Worker)
   - Customize configurações
   - Deploy automático no Kubernetes

3️⃣ Monitore e Otimize
   - Dashboards de observabilidade em tempo real
   - Análise de custos multi-cloud
   - DORA metrics e produtividade

4️⃣ Escale com Governança
   - Compliance automático
   - Auditoria completa
   - Self-service com guardrails
```

#### Seção: Arquitetura
```
Diagram visual ou infográfico:

Frontend (React + Vite)
    ↓
Backend API (Go + Gin)
    ↓
PostgreSQL + Redis
    ↓
Integrações (20+ tipos)
    ↓
Kubernetes, Cloud Providers, Observability Stack
```

#### Seção: FinOps em Destaque
```
Título: "Controle Total de Custos Multi-Cloud"

- Dashboard unificado para AWS, GCP e Azure
- Custos por namespace, serviço, equipe e ambiente
- Budget alerts e notificações
- Waste detection (recursos ociosos)
- Right-sizing recommendations
- Reserved instances analysis
- Cost forecasting com IA

[Screenshot do dashboard FinOps]
```

#### Seção: Segurança
```
Badges/Cards:

🔐 Autenticação Robusta
   - JWT + SSO (Google, Microsoft)
   - MFA support
   - Password reset seguro

🔑 Secrets Management
   - Vault e AWS Secrets Manager
   - Criptografia em repouso e trânsito
   - Auditoria de acessos

🛡️ Rate Limiting
   - Proteção contra brute force
   - Rate limits configuráveis
   - Redis-based throttling

📊 Auditoria Completa
   - Logs de todas as ações
   - Rastreabilidade end-to-end
   - Compliance automático
```

#### Seção: Open Source & Licenciamento
```
Título: "Baseado em Backstage (Apache 2.0)"

- Fork proprietário do Backstage com funcionalidades especializadas
- Código limpo e extensível (Clean Architecture)
- Plugins customizáveis
- Comunidade ativa no GitHub
- Comercialmente licenciável
```



#### Seção: Pricing
```
3 planos:

**Team ($99/mês)**
- Serviços ilimitados
- 10 integrações
- Suporte email
- SSO

**Enterprise (Custom)**
- Tudo do Team +
- 20+ integrações
- Suporte dedicado (Slack/Teams)
- SLA 99.9%
- Treinamento on-site
- Custom features

[Botão: "Falar com vendas"]
```

#### CTA Final
```
Título: "Pronto para transformar sua Platform Engineering?"

Subtítulo: "Junte-se a centenas de empresas que já usam PlatifyX para acelerar seus times de engenharia."

Botões:
- "Solicitar Demo Gratuita" (primário)

Background: Gradient azul com pattern sutil
```

#### Footer
```
Colunas:

**Produto**
- Features
- Integrações
- Pricing
- Roadmap
- Changelog

**Recursos**
- Documentação
- Tutoriais
- Blog
- Case Studies
- API Reference

**Empresa**
- Sobre Nós
- Carreiras
- Contato
- Termos de Uso
- Política de Privacidade

**Comunidade**
- GitHub
- Slack Community
- Twitter/X
- LinkedIn

**Newsletter**
- "Receba atualizações e novidades"
- Campo de email + botão "Inscrever"

**Copyright**
© 2025 PlatifyX. Todos os direitos reservados.
```

---

### 2. **Página: Integrações** (`/integrations`)

```
Hero:
- Título: "20+ Integrações com as Melhores Ferramentas"
- Subtítulo: "Conecte PlatifyX com sua stack existente"

Grid de todas as integrações (cards com logos):

Para cada integração:
- Logo oficial
- Nome
- Categoria
- Descrição curta (2-3 linhas)
- Badge: "Disponível" / "Em breve"

Filtros:
- Todas
- CI/CD
- Cloud
- Observabilidade
- Qualidade
- Secrets
- Comunicação
- IA

Call to action:
- "Não encontrou sua ferramenta? Solicite uma integração"
```

---

### 3. **Página: Documentação** (`/docs`)

```
Layout com sidebar:

Sidebar (navegação):
- Getting Started
- Installation
- Configuration
- Integrations
  - Azure DevOps
  - GitHub
  - AWS
  - GCP
  - Vault
  - ...
- Features
  - Service Catalog
  - Templates
  - Kubernetes
  - FinOps
  - Observability
- API Reference
- Deployment
- Troubleshooting

Content area:
- Markdown rendering
- Code syntax highlighting (Prism.js ou Shiki)
- Copy buttons em code blocks
- Table of contents (TOC) flutuante
- Search bar (Algolia ou MiniSearch)
```

---

### 4. **Página: Solicitar Demo** (`/demo`)

```
Formulário com 2 colunas:

Coluna 1 (Formulário):
- Nome completo *
- Email corporativo *
- Empresa *
- Cargo/Função *
- Tamanho da empresa (dropdown)
  • 1-10
  • 11-50
  • 51-200
  • 201-1000
  • 1000+
- Telefone (opcional)
- Stack atual (checkboxes):
  • AWS
  • GCP
  • Azure
  • Kubernetes
  • Grafana/Prometheus
  • ArgoCD
  • Outros
- Mensagem/Necessidades (textarea)
- Checkbox: "Aceito receber emails da PlatifyX"

Botão: "Solicitar Demo"

Coluna 2 (Benefícios):
- "O que você verá na demo:"
  ✓ Tour completo da plataforma (30min)
  ✓ Configuração de integrações ao vivo
  ✓ Demonstração do Service Catalog
  ✓ Dashboard FinOps multi-cloud
  ✓ Templates e self-service
  ✓ Q&A com nossos especialistas

- "Resposta em até 24h úteis"
```

---

### 5. **Página: Contato** (`/contact`)

```
Formulário simples:
- Nome *
- Email *
- Assunto *
- Mensagem *

Informações de contato:
- Email: hello@platifyx.com
- LinkedIn: linkedin.com/company/platifyx

---

### 6. **Página: Sobre** (`/about`)

```
Seções:

**Nossa Missão**
"Democratizar Platform Engineering para times de todos os tamanhos. Acreditamos que desenvolvedores devem ter autonomia para criar, deployar e monitorar seus serviços sem fricção."

**O Problema que Resolvemos**
- Silos entre times (Dev, Ops, Plataforma, FinOps)
- Falta de self-service para desenvolvedores
- Custos cloud sem visibilidade
- Observabilidade fragmentada
- Compliance manual e propenso a erros

**A Solução: PlatifyX**
[Descrição da plataforma]

**Time** (Opcional)
Cards com fotos e perfis do time

**Valores**
- Developer Experience First
- Open Source & Transparência
- Segurança by Design
- Inovação Contínua
```

---

### 7. **Página: Blog** (`/blog`) (Opcional)

```
Grid de posts:
- Thumbnail
- Título
- Excerpt (primeiras 2 linhas)
- Data de publicação
- Autor
- Tags
- Tempo de leitura

Categorias:
- Platform Engineering
- FinOps
- DevOps
- Kubernetes
- Observability
- Tutorials

Post individual:
- Título
- Autor + data
- Conteúdo (Markdown)
- Related posts
- Share buttons (Twitter, LinkedIn)
```

---

## 🎯 Funcionalidades Especiais

### 1. **Search Bar Global**
- Atalho: Cmd/Ctrl + K
- Busca em documentação, integrações, features
- Navegação rápida

### 2. **Dark Mode Toggle**
- Switch no header
- Persistir preferência (localStorage)
- Suporte a prefers-color-scheme

### 3. **Animações**
- Scroll animations (Framer Motion)
- Fade in, slide up para seções
- Hover effects nos cards
- Loading states

### 4. **SEO Otimizado**
- Meta tags completas
- Open Graph (Facebook, LinkedIn)
- Twitter Cards
- Schema.org structured data
- Sitemap.xml
- robots.txt

### 5. **Performance**
- Lazy loading de imagens
- Code splitting
- Minificação de assets
- Compressão gzip/brotli
- CDN para assets estáticos

### 6. **Analytics**
- Google Analytics 4 (opcional)
- Plausible Analytics (privacidade-friendly)
- Tracking de conversões (demo requests, signups)

### 7. **Formulários**
- Validação client-side (Zod)
- Feedback visual (erros, sucesso)
- Proteção anti-spam (honeypot)
- reCAPTCHA v3 (opcional)
- Envio para backend Express

---

## 🔧 Implementação Backend (Express)

### Package.json do Backend

```json
{
  "name": "platifyx-marketing-backend",
  "version": "1.0.0",
  "description": "Backend do site de marketing da PlatifyX",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "@sendgrid/mail": "^8.1.0",
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.1.5",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```

### Variáveis de Ambiente (.env)

```bash
# Server
NODE_ENV=development
PORT=3000

# Frontend URL (para CORS)
FRONTEND_URL=https://app.platifyx.com

# SendGrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutos
RATE_LIMIT_MAX_REQUESTS=100   # 100 requests por IP
```

### Estrutura de Rotas

```javascript
// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// Middlewares
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://app.platifyx.com'
}));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Muitas requisições deste IP, tente novamente mais tarde.'
});
app.use('/api/', limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rotas
app.post('/api/demo', require('./routes/demo'));
app.post('/api/contact', require('./routes/contact'));
app.post('/api/newsletter', require('./routes/newsletter'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint não encontrado' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Erro:', err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📧 SendGrid configured: ${!!process.env.SENDGRID_API_KEY}`);
});
```

### Endpoint: Solicitar Demo

```javascript
// backend/routes/demo.js
const express = require('express');
const router = express.Router();
const sgMail = require('@sendgrid/mail');

// Configurar SendGrid API Key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

router.post('/', async (req, res) => {
  try {
    const {
      name,
      email,
      company,
      role,
      companySize,
      phone,
      stack,
      message
    } = req.body;

    // Validação
    if (!name || !email || !company || !role) {
      return res.status(400).json({
        error: 'Campos obrigatórios faltando'
      });
    }

    // Email para equipe de vendas
    const salesEmail = {
      to: 'hello@platifyx.com',
      from: {
        email: 'hello@platifyx.com',
        name: 'PlatifyX Marketing'
      },
      subject: `Nova solicitação de demo - ${company}`,
      html: `
        <h2>Nova solicitação de demo</h2>
        <p><strong>Nome:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Empresa:</strong> ${company}</p>
        <p><strong>Cargo:</strong> ${role}</p>
        <p><strong>Tamanho:</strong> ${companySize}</p>
        <p><strong>Telefone:</strong> ${phone || 'Não informado'}</p>
        <p><strong>Stack:</strong> ${stack?.join(', ') || 'Não informado'}</p>
        <p><strong>Mensagem:</strong><br>${message || 'Nenhuma mensagem'}</p>
      `
    };

    // Email de confirmação para o usuário
    const confirmationEmail = {
      to: email,
      from: {
        email: 'hello@platifyx.com',
        name: 'PlatifyX'
      },
      subject: 'Recebemos sua solicitação de demo - PlatifyX',
      html: `
        <h2>Olá ${name}!</h2>
        <p>Recebemos sua solicitação de demo da PlatifyX.</p>
        <p>Nossa equipe entrará em contato em até 24 horas úteis.</p>
        <p>Enquanto isso, confira nossa <a href="https://docs.platifyx.com">documentação</a>.</p>
        <br>
        <p>Equipe PlatifyX</p>
      `
    };

    // Enviar ambos os emails
    await Promise.all([
      sgMail.send(salesEmail),
      sgMail.send(confirmationEmail)
    ]);

    res.json({
      success: true,
      message: 'Solicitação enviada com sucesso!'
    });
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    res.status(500).json({
      error: 'Erro ao processar solicitação. Tente novamente.'
    });
  }
});

module.exports = router;
```

### Endpoint: Contato

```javascript
// backend/routes/contact.js
const express = require('express');
const router = express.Router();
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

router.post('/', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Validação
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        error: 'Todos os campos são obrigatórios'
      });
    }

    // Email para equipe de suporte
    const contactEmail = {
      to: 'hello@platifyx.com',
      from: {
        email: 'hello@platifyx.com',
        name: 'PlatifyX Marketing'
      },
      replyTo: email,
      subject: `[Contato] ${subject}`,
      html: `
        <h2>Nova mensagem de contato</h2>
        <p><strong>Nome:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Assunto:</strong> ${subject}</p>
        <p><strong>Mensagem:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `
    };

    // Email de confirmação
    const confirmationEmail = {
      to: email,
      from: {
        email: 'hello@platifyx.com',
        name: 'PlatifyX'
      },
      subject: 'Recebemos sua mensagem - PlatifyX',
      html: `
        <h2>Olá ${name}!</h2>
        <p>Recebemos sua mensagem e responderemos em breve.</p>
        <p><strong>Sua mensagem:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
        <br>
        <p>Equipe PlatifyX</p>
      `
    };

    await Promise.all([
      sgMail.send(contactEmail),
      sgMail.send(confirmationEmail)
    ]);

    res.json({
      success: true,
      message: 'Mensagem enviada com sucesso!'
    });
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    res.status(500).json({
      error: 'Erro ao processar mensagem. Tente novamente.'
    });
  }
});

module.exports = router;
```

### Endpoint: Newsletter

```javascript
// backend/routes/newsletter.js
const express = require('express');
const router = express.Router();
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

router.post('/', async (req, res) => {
  try {
    const { email } = req.body;

    // Validação
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        error: 'Email inválido'
      });
    }

    // Notificar equipe de marketing
    const notificationEmail = {
      to: 'hello@platifyx.com',
      from: {
        email: 'hello@platifyx.com',
        name: 'PlatifyX Marketing'
      },
      subject: 'Nova inscrição na newsletter',
      html: `
        <h2>Nova inscrição na newsletter</h2>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Data:</strong> ${new Date().toLocaleString('pt-BR')}</p>
      `
    };

    // Email de boas-vindas
    const welcomeEmail = {
      to: email,
      from: {
        email: 'hello@platifyx.com',
        name: 'PlatifyX'
      },
      subject: 'Bem-vindo à Newsletter da PlatifyX! 🚀',
      html: `
        <h2>Obrigado por se inscrever!</h2>
        <p>Você agora receberá as últimas novidades sobre Platform Engineering, FinOps, DevOps e muito mais.</p>
        <p>Fique de olho na sua caixa de entrada para conteúdos exclusivos!</p>
        <br>
        <p>Equipe PlatifyX</p>
        <hr>
        <p style="font-size: 12px; color: #666;">
          Não quer mais receber nossos emails?
          <a href="https://platifyx.com/unsubscribe?email=${encodeURIComponent(email)}">Cancelar inscrição</a>
        </p>
      `
    };

    await Promise.all([
      sgMail.send(notificationEmail),
      sgMail.send(welcomeEmail)
    ]);

    res.json({
      success: true,
      message: 'Inscrição realizada com sucesso!'
    });
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    res.status(500).json({
      error: 'Erro ao processar inscrição. Tente novamente.'
    });
  }
});

module.exports = router;
```

---

## 📱 Responsividade

### Breakpoints
```css
/* Mobile First */
sm: 640px   /* Tablets portrait */
md: 768px   /* Tablets landscape */
lg: 1024px  /* Laptops */
xl: 1280px  /* Desktops */
2xl: 1536px /* Large desktops */
```

### Ajustes por Dispositivo
- **Mobile**: Menu hamburger, cards 1 coluna, CTA stacked
- **Tablet**: Menu completo, cards 2 colunas, hero ajustado
- **Desktop**: Layout completo, cards 3-4 colunas, hero com imagem

---

## 🚀 Deploy e Infraestrutura

### Opções de Deploy

**Vercel (Recomendado)**
```bash
npm install -g vercel
vercel --prod
```

**Netlify**
```bash
npm install -g netlify-cli
netlify deploy --prod
```

**Docker**
```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app

# Backend
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --production

# Frontend
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci
COPY frontend ./frontend
RUN cd frontend && npm run build

# Copy backend files
COPY backend ./backend

EXPOSE 3000

CMD ["node", "backend/server.js"]
```

**Docker Compose**
```yaml
version: '3.8'

services:
  marketing:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - FRONTEND_URL=https://platifyx.com
      - SENDGRID_API_KEY=${SENDGRID_API_KEY}
    restart: unless-stopped
```

---

## 📊 Métricas de Sucesso

**Acompanhar:**
- Taxa de conversão (visitantes → demo requests)
- Tempo médio na página
- Bounce rate
- Páginas mais visitadas
- Origem do tráfego
- Formulários completados vs abandonados

---

## ✅ Checklist de Desenvolvimento

**Configuração Inicial**
- [ ] Criar estrutura de pastas
- [ ] Configurar package.json (frontend + backend)
- [ ] Instalar dependências
- [ ] Configurar Vite + React + TypeScript
- [ ] Configurar Tailwind CSS
- [ ] Configurar Express.js

**Design System**
- [ ] Definir paleta de cores (CSS variables)
- [ ] Configurar tipografia
- [ ] Criar componentes base (Button, Card, Input, etc.)
- [ ] Criar componentes de layout (Header, Footer, Container)
- [ ] Implementar dark mode

**Páginas**
- [ ] Homepage/Landing page completa
- [ ] Página de Integrações
- [ ] Página de Documentação
- [ ] Página de Solicitar Demo
- [ ] Página de Contato
- [ ] Página Sobre
- [ ] Página de Blog (opcional)

**Funcionalidades**
- [ ] Navegação responsiva
- [ ] Formulários com validação
- [ ] Search bar global
- [ ] Dark mode toggle
- [ ] Animações (scroll, hover)
- [ ] SEO (meta tags, sitemap, robots.txt)
- [ ] Analytics integration

**Backend**
- [ ] Endpoint /api/demo
- [ ] Endpoint /api/contact
- [ ] Endpoint /api/newsletter
- [ ] Rate limiting
- [ ] Email sending (SendGrid)
- [ ] Error handling
- [ ] Configurar SendGrid API Key

**Performance**
- [ ] Lazy loading de imagens
- [ ] Code splitting
- [ ] Minificação
- [ ] Lighthouse score 90+

**Deploy**
- [ ] Configurar variáveis de ambiente
- [ ] Configurar domínio customizado
- [ ] Configurar SSL/HTTPS
- [ ] Configurar CDN
- [ ] Testar em produção

---

## 🎨 Assets Necessários

**Logos**
- Logo principal (SVG) - com nome "PlatifyX"
- Logo símbolo (SVG) - apenas ícone
- Favicon (PNG 32x32, 128x128, SVG)

**Imagens**
- Hero image (dashboard preview)
- Screenshot: Service Catalog
- Screenshot: FinOps Dashboard
- Screenshot: Kubernetes Management
- Screenshot: Observability (Grafana)
- Screenshot: Templates de Scaffold
- Icons para integrações (20+ logos oficiais)

**Animações (opcional)**
- Lottie animation para hero
- Loading states

---

## 📝 Exemplo de Copy

### Hero Section
```
Headline: "Platform Engineering Made Simple"

Subheadline: "O Developer Portal completo para times de engenharia modernos. Gerencie infraestrutura, observabilidade, segurança e custos em um único lugar."

CTA Primary: "Solicitar Demo Gratuita"
CTA Secondary: "Ver Documentação"
```

### Value Propositions
```
🚀 Self-Service Real
Desenvolvedores criam, configuram e fazem deploy sem fricção. Templates prontos, catálogo centralizado e governança automática.

🔍 Observabilidade 360°
Logs, métricas, traces e alertas em tempo real. Stack Grafana completa integrada desde o primeiro dia.

💰 FinOps Multi-Cloud
Custos AWS, GCP e Azure em um dashboard único. Otimize gastos com recomendações automáticas baseadas em IA.

🔐 Segurança by Design
Vault integrado, RBAC granular, auditoria completa e compliance automático (LGPD, SOC2, ISO 27001).
```

---

## 🔗 Links Úteis

- Documentação oficial: https://docs.platifyx.com
- GitHub: https://github.com/PlatifyX
- Backstage (referência): https://backstage.io

---

## 🎯 Objetivo Final

Criar um site de marketing **profissional, moderno e de alta conversão** que:
1. Explique claramente o que é PlatifyX
2. Destaque as 20+ integrações disponíveis
3. Demonstre o valor para diferentes personas (Dev, SRE, CTO, FinOps)
4. Converta visitantes em leads qualificados (demo requests)
5. Tenha performance excelente (Lighthouse 90+)
6. Seja responsivo e acessível (WCAG 2.1)
7. Rankeie bem no Google (SEO otimizado)

---

## 📞 Próximos Passos

Após implementar o site:
1. **Criar conta no SendGrid** (https://sendgrid.com)
   - Criar API Key em Settings > API Keys
   - Verificar domínio (hello@platifyx.com)
   - Configurar variável de ambiente: `SENDGRID_API_KEY`
2. Conectar domínio customizado (platifyx.com)
3. Configurar Google Analytics ou Plausible
4. Criar conteúdo para o blog
5. Fazer campanhas de marketing (SEO, Google Ads, LinkedIn)
6. Monitorar conversões e otimizar

### 📧 Configuração do SendGrid

**1. Criar conta e obter API Key:**
```bash
# Acessar: https://app.sendgrid.com/settings/api_keys
# Criar uma nova API Key com permissão "Full Access"
# Copiar a chave (será exibida apenas uma vez!)
```

**2. Verificar domínio e emails:**
```bash
# Acessar: https://app.sendgrid.com/settings/sender_auth
# Verificar domínio platifyx.com (recomendado)
# OU verificar emails individualmente:
#   - hello@platifyx.com
```

**3. Adicionar variável de ambiente:**
```bash
# .env
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**4. Instalar dependência:**
```bash
cd backend
npm install @sendgrid/mail
```

**5. Testar envio:**
```bash
# Fazer um POST para /api/demo ou /api/contact
# Verificar se o email chegou
# Checar logs do SendGrid: https://app.sendgrid.com/email_activity
```

**6. Configurações recomendadas no SendGrid:**
- Ativar **Click Tracking** (rastrear cliques nos links)
- Ativar **Open Tracking** (rastrear abertura de emails)
- Configurar **Unsubscribe Group** para newsletter
- Adicionar **Custom Unsubscribe URL** (https://platifyx.com/unsubscribe)
- Configurar **Templates** para emails (opcional, mas recomendado)

---

**Boa sorte com o desenvolvimento! 🚀**
