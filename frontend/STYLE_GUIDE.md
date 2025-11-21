# Style Guide - PlatifyX Frontend

Este guia define as regras e padrões para **TODAS** as páginas do frontend da PlatifyX.

## 📋 Estrutura Obrigatória de Páginas

**TODAS** as páginas DEVEM seguir esta estrutura:

```tsx
import PageContainer from '../components/Layout/PageContainer'
import PageHeader from '../components/Layout/PageHeader'
import Section from '../components/Layout/Section'
import Card from '../components/UI/Card'
import { IconeApropriado } from 'lucide-react'

function MinhaPage() {
  return (
    <PageContainer maxWidth="xl">
      <PageHeader
        icon={IconeApropriado}
        title="Título da Página"
        subtitle="Descrição curta da página"
        actions={/* Botões de ação opcional */}
      />

      <Section title="Seção 1" icon="📊" spacing="lg">
        <Card padding="lg">
          {/* Conteúdo */}
        </Card>
      </Section>

      <Section title="Seção 2" icon="💡" spacing="md">
        {/* Conteúdo */}
      </Section>
    </PageContainer>
  )
}

export default MinhaPage
```

## 🎨 Paleta de Cores - Uso Obrigatório

### Cores Principais

```css
/* SEMPRE use variáveis CSS, NUNCA hardcode cores */
var(--deep-sea-ink-black)    /* Background principal */
var(--deep-sea-space-blue)   /* Cards e surfaces */
var(--deep-sea-blue-slate)   /* Elementos interativos */
var(--deep-sea-dusty-denim)  /* Texto secundário */
var(--deep-sea-eggshell)     /* Texto principal */
```

### Cores Funcionais

```css
var(--color-success)  /* #10b981 - Verde para sucesso */
var(--color-warning)  /* #f59e0b - Amarelo para avisos */
var(--color-error)    /* #ef4444 - Vermelho para erros */
```

### ❌ NÃO FAÇA

```css
/* ERRADO - cores hardcoded */
color: #ffffff;
background: #1a1a1a;
border: 1px solid #333333;
```

### ✅ FAÇA

```css
/* CORRETO - variáveis CSS */
color: var(--deep-sea-eggshell);
background: var(--deep-sea-space-blue);
border: 1px solid var(--deep-sea-blue-slate);
```

## 📏 Espaçamentos Padronizados

Use APENAS múltiplos de 4px (sistema de espaçamento 4pt):

```css
/* Espaçamentos permitidos */
0.25rem  /* 4px  */
0.5rem   /* 8px  */
0.75rem  /* 12px */
1rem     /* 16px */
1.5rem   /* 24px */
2rem     /* 32px */
2.5rem   /* 40px */
3rem     /* 48px */
4rem     /* 64px */
```

### ❌ NÃO FAÇA

```css
/* ERRADO - valores aleatórios */
margin: 13px;
padding: 19px;
gap: 7px;
```

### ✅ FAÇA

```css
/* CORRETO - múltiplos de 4px */
margin: 1rem;      /* 16px */
padding: 1.5rem;   /* 24px */
gap: 0.5rem;       /* 8px */
```

## 🔤 Tipografia

### Tamanhos de Fonte

```css
/* Use APENAS estes tamanhos */
0.75rem    /* 12px - Badges, labels pequenos */
0.8125rem  /* 13px - Textos auxiliares */
0.875rem   /* 14px - Corpo de texto */
0.9375rem  /* 15px - Texto principal */
1rem       /* 16px - Texto destaque */
1.125rem   /* 18px - Subtítulos */
1.25rem    /* 20px - Títulos de seção */
1.5rem     /* 24px - Títulos de página */
2rem       /* 32px - Headers principais */
```

### Pesos de Fonte

```css
font-weight: 400;  /* Regular - texto normal */
font-weight: 600;  /* SemiBold - destaque */
font-weight: 700;  /* Bold - títulos */
```

## 🧩 Quando Usar Cada Componente

### PageContainer

**SEMPRE** envolva o conteúdo da página com PageContainer.

```tsx
// Larguras disponíveis
<PageContainer maxWidth="sm">   {/* 640px - Formulários */}
<PageContainer maxWidth="md">   {/* 768px - Conteúdo simples */}
<PageContainer maxWidth="lg">   {/* 1024px - Padrão */}
<PageContainer maxWidth="xl">   {/* 1280px - Dashboards */}
<PageContainer maxWidth="full"> {/* 100% - Tabelas grandes */}
```

### PageHeader

**SEMPRE** use PageHeader como primeiro elemento após PageContainer.

```tsx
// Escolha ícones apropriados do Lucide React
import {
  LayoutDashboard,  // Dashboard
  Box,              // Serviços
  Server,           // Kubernetes
  Shield,           // Qualidade/Segurança
  Cloud,            // FinOps
  Layers,           // Observabilidade
  Plug,             // Integrações
  Settings,         // Configurações
  FileText,         // Documentação
  Code,             // Templates de código
  Package           // Templates de infra
} from 'lucide-react'
```

### Section

Use Section para **organizar** conteúdo em blocos lógicos.

```tsx
// SEMPRE use ícone emoji para seções
<Section title="Métricas" icon="📊" spacing="lg">
<Section title="Recursos" icon="🎯" spacing="md">
<Section title="Configuração" icon="⚙️" spacing="sm">
```

### Card

Use Card para **agrupar** conteúdo relacionado.

```tsx
// Card básico
<Card padding="md">
  {/* Conteúdo */}
</Card>

// Card com título
<Card title="Estatísticas" padding="lg">
  {/* Conteúdo */}
</Card>

// Card com hover
<Card hover padding="md">
  {/* Card clicável */}
</Card>
```

### StatCard

Use StatCard para **métricas e KPIs**.

```tsx
import { DollarSign } from 'lucide-react'

<StatCard
  icon={DollarSign}
  label="Receita Mensal"
  value="R$ 45.000"
  trend={{ value: 12.5, isPositive: true }}
  color="green"
/>
```

### EmptyState

**SEMPRE** use EmptyState quando não há dados.

```tsx
import { Package } from 'lucide-react'

// EmptyState simples
<EmptyState
  icon={Package}
  title="Nenhum recurso encontrado"
  description="Não há recursos disponíveis no momento"
/>

// EmptyState com ação
<EmptyState
  icon={Package}
  title="Nenhum recurso encontrado"
  description="Configure a integração para visualizar recursos"
  action={{
    label: "Configurar",
    onClick: () => navigate('/settings')
  }}
/>
```

### Button

Use Button para **ações do usuário**.

```tsx
import { Plus, RefreshCw } from 'lucide-react'

// Botão primário - ação principal
<Button variant="primary" size="md" icon={Plus}>
  Criar Novo
</Button>

// Botão secundário - ações secundárias
<Button variant="secondary" size="md" icon={RefreshCw}>
  Atualizar
</Button>

// Botão outline - ações terciárias
<Button variant="outline" size="sm">
  Cancelar
</Button>

// Botão danger - ações destrutivas
<Button variant="danger" size="md">
  Excluir
</Button>
```

### Badge

Use Badge para **status e tags**.

```tsx
// Status
<Badge variant="success">Ativo</Badge>
<Badge variant="error">Falhou</Badge>
<Badge variant="warning">Pendente</Badge>

// Contadores
<Badge variant="info" size="sm">5</Badge>
```

### Tabs

Use Tabs para **navegação entre views**.

```tsx
import { Server, Database } from 'lucide-react'
import Tabs, { Tab } from '../components/UI/Tabs'

const tabs: Tab[] = [
  {
    id: 'services',
    label: 'Serviços',
    icon: <Server size={18} />
  },
  {
    id: 'databases',
    label: 'Bancos',
    icon: <Database size={18} />,
    badge: 5  // Contador opcional
  }
]

<Tabs
  tabs={tabs}
  activeTab={activeTab}
  onChange={setActiveTab}
/>
```

### DataTable

Use DataTable para **dados tabulares**.

```tsx
import DataTable, { Column } from '../components/Table/DataTable'

interface Resource {
  id: string
  name: string
  status: string
}

const columns: Column<Resource>[] = [
  {
    key: 'name',
    header: 'Nome',
    render: (item) => item.name,
    align: 'left'
  },
  {
    key: 'status',
    header: 'Status',
    render: (item) => <Badge variant="success">{item.status}</Badge>,
    align: 'center',
    width: '120px'
  }
]

<DataTable
  columns={columns}
  data={resources}
  loading={isLoading}
  emptyMessage="Nenhum recurso encontrado"
/>
```

## 🎭 Estados Visuais

### Loading

```tsx
import Loader from '../components/Loader/Loader'

// Loading de página completa
if (loading) {
  return (
    <PageContainer>
      <Loader size="large" message="Carregando dados..." />
    </PageContainer>
  )
}

// Loading de seção
<Card padding="lg">
  {loading ? (
    <Loader size="medium" message="Carregando..." />
  ) : (
    {/* Conteúdo */}
  )}
</Card>
```

### Empty States

```tsx
// SEMPRE use EmptyState, NUNCA crie empty states manuais
{data.length === 0 ? (
  <EmptyState
    icon={Package}
    title="Nenhum dado disponível"
    description="Configure as integrações para visualizar dados"
  />
) : (
  {/* Conteúdo */}
)}
```

### Erros

```tsx
// Use Badge ou Card para erros
<Badge variant="error">Erro ao carregar</Badge>

// Ou Card para erros mais detalhados
<Card padding="lg">
  <div style={{ textAlign: 'center', color: 'var(--color-error)' }}>
    <AlertCircle size={48} />
    <p>Erro ao carregar dados</p>
  </div>
</Card>
```

## 🎨 Efeitos e Animações

### Transitions

**SEMPRE** use cubic-bezier para animações suaves:

```css
transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
```

### Hover Effects

```css
/* Padrão para cards e botões */
.element:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(62, 92, 118, 0.3);
}

/* Padrão para ícones */
.icon:hover {
  transform: scale(1.1);
}
```

## 📱 Responsividade

### Breakpoints Obrigatórios

```css
/* Mobile First - SEMPRE */
/* Base styles para mobile */

/* Tablet */
@media (max-width: 768px) {
  /* Ajustes para tablet */
}

/* Desktop */
@media (min-width: 1024px) {
  /* Ajustes para desktop */
}
```

### Grid Responsivo

```css
/* Use auto-fit para grids responsivos */
display: grid;
grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
gap: 1.5rem;
```

## ✅ Checklist de Código

Antes de fazer commit, verifique:

- [ ] Página usa `PageContainer` como wrapper principal
- [ ] Página tem `PageHeader` com ícone apropriado
- [ ] Seções usam componente `Section` com ícone emoji
- [ ] Cards usam componente `Card` ao invés de divs
- [ ] Empty states usam componente `EmptyState`
- [ ] Botões usam componente `Button` com variant apropriado
- [ ] Status/tags usam componente `Badge`
- [ ] Tabs usam componente `Tabs`
- [ ] Tabelas usam componente `DataTable`
- [ ] TODAS as cores usam variáveis CSS (--deep-sea-*)
- [ ] Espaçamentos são múltiplos de 4px
- [ ] Tamanhos de fonte seguem a escala definida
- [ ] Hover effects tem cubic-bezier transition
- [ ] Código é responsivo (mobile-first)

## 🚫 Anti-Padrões - NÃO FAÇA

### ❌ Divs soltas sem componentes

```tsx
// ERRADO
<div className={styles.container}>
  <div className={styles.header}>
    <h1>Título</h1>
  </div>
  <div className={styles.content}>
    {/* conteúdo */}
  </div>
</div>
```

```tsx
// CORRETO
<PageContainer>
  <PageHeader title="Título" />
  <Section>
    {/* conteúdo */}
  </Section>
</PageContainer>
```

### ❌ Empty states manuais

```tsx
// ERRADO
{data.length === 0 && (
  <div style={{ textAlign: 'center' }}>
    <p>Nenhum dado</p>
  </div>
)}
```

```tsx
// CORRETO
{data.length === 0 && (
  <EmptyState
    icon={Package}
    title="Nenhum dado"
    description="Descrição do estado vazio"
  />
)}
```

### ❌ Cores hardcoded

```css
/* ERRADO */
.card {
  background: #1a1a1a;
  color: #ffffff;
}
```

```css
/* CORRETO */
.card {
  background: var(--deep-sea-space-blue);
  color: var(--deep-sea-eggshell);
}
```

### ❌ Botões sem componente

```tsx
// ERRADO
<button className={styles.customButton} onClick={handleClick}>
  Clique Aqui
</button>
```

```tsx
// CORRETO
<Button variant="primary" onClick={handleClick}>
  Clique Aqui
</Button>
```

## 📚 Recursos Adicionais

- **Design System**: `frontend/DESIGN_SYSTEM.md`
- **Componentes**: `frontend/src/components/`
- **Exemplo Completo**: `frontend/src/pages/FinOpsPageEnhanced.tsx`
- **Lucide Icons**: https://lucide.dev/

---

**Lembre-se**: Consistência é fundamental. Seguir este guia garante uma experiência de usuário profissional e coesa em toda a plataforma.
