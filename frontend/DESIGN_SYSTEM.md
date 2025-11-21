# Design System - PlatifyX

## 🎨 Paleta de Cores: Deep Sea

Nossa paleta de cores é inspirada no oceano profundo, criando uma atmosfera profissional e moderna.

### Cores Principais

```css
--deep-sea-ink-black: #0d1321    /* Ultra-dark com toque de azul */
--deep-sea-space-blue: #1d2d44   /* Azul espacial profundo */
--deep-sea-blue-slate: #3e5c76   /* Ardósia azul com autoridade */
--deep-sea-dusty-denim: #748cab  /* Denim empoeirado, confiável */
--deep-sea-eggshell: #f0ebd8     /* Neutro delicado, creme natural */
```

### Aplicação das Cores

- **Background Principal**: `--deep-sea-ink-black` (#0d1321)
- **Surfaces/Cards**: `--deep-sea-space-blue` (#1d2d44)
- **Elementos Interativos**: `--deep-sea-blue-slate` (#3e5c76)
- **Texto Secundário/Hints**: `--deep-sea-dusty-denim` (#748cab)
- **Texto Principal/Headers**: `--deep-sea-eggshell` (#f0ebd8)

### Cores Funcionais

```css
--color-success: #10b981   /* Verde para sucesso */
--color-warning: #f59e0b   /* Amarelo para avisos */
--color-error: #ef4444     /* Vermelho para erros */
```

## 🔄 Componentes Reutilizáveis

### 📦 Layout Components

#### PageContainer

Wrapper principal para todas as páginas, fornecendo padding e max-width consistentes.

**Localização**: `/src/components/Layout/PageContainer.tsx`

**Uso**:
```tsx
import PageContainer from '../components/Layout/PageContainer'

<PageContainer maxWidth="lg">
  {/* Conteúdo da página */}
</PageContainer>
```

**Propriedades**:
- `children`: ReactNode (conteúdo)
- `maxWidth`: 'sm' | 'md' | 'lg' | 'xl' | 'full' (padrão: 'lg')
  - sm: 640px
  - md: 768px
  - lg: 1024px
  - xl: 1280px
  - full: 100%

---

#### PageHeader

Header padronizado para páginas com ícone, título, subtítulo e ações.

**Localização**: `/src/components/Layout/PageHeader.tsx`

**Uso**:
```tsx
import PageHeader from '../components/Layout/PageHeader'
import { Cloud } from 'lucide-react'

<PageHeader
  icon={Cloud}
  title="FinOps"
  subtitle="Otimização de custos na nuvem"
  actions={<button>Atualizar</button>}
/>
```

**Propriedades**:
- `title`: string (obrigatório)
- `icon`: LucideIcon (opcional)
- `subtitle`: string (opcional)
- `actions`: ReactNode (opcional - botões ou ações no canto direito)

---

#### Section

Container para seções de conteúdo com título opcional.

**Localização**: `/src/components/Layout/Section.tsx`

**Uso**:
```tsx
import Section from '../components/Layout/Section'

<Section title="Estatísticas" icon="📊" spacing="lg">
  {/* Conteúdo da seção */}
</Section>
```

**Propriedades**:
- `children`: ReactNode (obrigatório)
- `title`: string (opcional)
- `icon`: string (opcional - emoji ou texto)
- `spacing`: 'sm' | 'md' | 'lg' (padrão: 'md')

---

### 🎨 UI Components

#### Card

Card reutilizável com bordas, padding e hover opcional.

**Localização**: `/src/components/UI/Card.tsx`

**Uso**:
```tsx
import Card from '../components/UI/Card'

<Card title="Dados do Sistema" padding="lg" hover>
  {/* Conteúdo do card */}
</Card>
```

**Propriedades**:
- `children`: ReactNode (obrigatório)
- `title`: string (opcional - adiciona título com borda inferior)
- `padding`: 'sm' | 'md' | 'lg' (padrão: 'md')
- `hover`: boolean (padrão: false - adiciona efeito hover)

---

#### StatCard

Card de estatística com ícone, valor e trend opcional.

**Localização**: `/src/components/UI/StatCard.tsx`

**Uso**:
```tsx
import StatCard from '../components/UI/StatCard'
import { DollarSign } from 'lucide-react'

<StatCard
  icon={DollarSign}
  label="Economia Total"
  value="R$ 12.450"
  trend={{ value: 15.3, isPositive: true }}
  color="green"
/>
```

**Propriedades**:
- `icon`: LucideIcon (obrigatório)
- `label`: string (obrigatório)
- `value`: string | number (obrigatório)
- `trend`: { value: number, isPositive: boolean } (opcional)
- `color`: 'blue' | 'green' | 'yellow' | 'red' | 'purple' (padrão: 'blue')

---

#### EmptyState

Estado vazio com ícone, mensagem e ação opcional.

**Localização**: `/src/components/UI/EmptyState.tsx`

**Uso**:
```tsx
import EmptyState from '../components/UI/EmptyState'
import { Package } from 'lucide-react'

<EmptyState
  icon={Package}
  title="Nenhum recurso encontrado"
  description="Não há recursos com economia estimada no momento"
  action={{
    label: "Atualizar",
    onClick: () => refetch()
  }}
/>
```

**Propriedades**:
- `icon`: LucideIcon (obrigatório)
- `title`: string (obrigatório)
- `description`: string (opcional)
- `action`: { label: string, onClick: () => void } (opcional)

---

#### Button

Botão padronizado com múltiplas variantes e tamanhos.

**Localização**: `/src/components/UI/Button.tsx`

**Uso**:
```tsx
import Button from '../components/UI/Button'
import { Plus } from 'lucide-react'

<Button
  variant="primary"
  size="md"
  icon={Plus}
  iconPosition="left"
  onClick={() => handleClick()}
>
  Criar Novo
</Button>
```

**Propriedades**:
- `children`: ReactNode (obrigatório - texto do botão)
- `onClick`: () => void (opcional - handler de click)
- `variant`: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' (padrão: 'primary')
- `size`: 'sm' | 'md' | 'lg' (padrão: 'md')
- `icon`: LucideIcon (opcional - ícone a exibir)
- `iconPosition`: 'left' | 'right' (padrão: 'left')
- `disabled`: boolean (padrão: false)
- `fullWidth`: boolean (padrão: false)
- `type`: 'button' | 'submit' | 'reset' (padrão: 'button')

---

#### Badge

Badge para tags, status e contadores.

**Localização**: `/src/components/UI/Badge.tsx`

**Uso**:
```tsx
import Badge from '../components/UI/Badge'

<Badge variant="success" size="md">Ativo</Badge>
<Badge variant="error" size="sm">3</Badge>
```

**Propriedades**:
- `children`: ReactNode (obrigatório - conteúdo do badge)
- `variant`: 'default' | 'success' | 'warning' | 'error' | 'info' (padrão: 'default')
- `size`: 'sm' | 'md' | 'lg' (padrão: 'md')

---

#### Tabs

Componente de abas/tabs para navegação.

**Localização**: `/src/components/UI/Tabs.tsx`

**Uso**:
```tsx
import Tabs, { Tab } from '../components/UI/Tabs'
import { Server, Database } from 'lucide-react'

const tabs: Tab[] = [
  { id: 'services', label: 'Serviços', icon: <Server size={18} /> },
  { id: 'databases', label: 'Bancos', icon: <Database size={18} />, badge: 5 }
]

<Tabs
  tabs={tabs}
  activeTab={activeTab}
  onChange={setActiveTab}
/>
```

**Propriedades**:
- `tabs`: Tab[] (obrigatório - array de tabs)
- `activeTab`: string (obrigatório - ID da tab ativa)
- `onChange`: (tabId: string) => void (obrigatório - handler de mudança)

**Tab Interface**:
```tsx
interface Tab {
  id: string           // Identificador único
  label: string        // Texto da tab
  icon?: ReactNode     // Ícone opcional
  badge?: number       // Badge com contador opcional
}
```

---

### 📊 Table Components

#### DataTable

Tabela reutilizável com tipagem genérica, loading e empty states.

**Localização**: `/src/components/Table/DataTable.tsx`

**Uso**:
```tsx
import DataTable, { Column } from '../components/Table/DataTable'

interface Resource {
  id: string
  name: string
  cost: number
}

const columns: Column<Resource>[] = [
  {
    key: 'name',
    header: 'Nome',
    render: (item) => item.name,
    align: 'left'
  },
  {
    key: 'cost',
    header: 'Custo',
    render: (item) => `R$ ${item.cost}`,
    align: 'right',
    width: '120px'
  }
]

<DataTable
  columns={columns}
  data={resources}
  loading={isLoading}
  emptyMessage="Nenhum recurso disponível"
/>
```

**Propriedades**:
- `columns`: Column<T>[] (obrigatório - definições das colunas)
- `data`: T[] (obrigatório - array de dados)
- `loading`: boolean (opcional - mostra loader)
- `emptyMessage`: string (opcional - mensagem quando vazio)

**Column Interface**:
```tsx
interface Column<T> {
  key: string                    // Identificador único
  header: string                 // Texto do cabeçalho
  render: (item: T) => ReactNode // Função de renderização
  align?: 'left' | 'center' | 'right'  // Alinhamento
  width?: string                 // Largura da coluna (ex: '120px')
}
```

---

### 🔄 Loader

Componente de carregamento animado com rotação suave.

**Localização**: `/src/components/Loader/Loader.tsx`

**Uso**:
```tsx
import Loader from '../components/Loader/Loader'

// Tamanhos disponíveis: 'small', 'medium', 'large'
<Loader size="large" message="Carregando dados..." />
```

**Propriedades**:
- `size`: 'small' | 'medium' | 'large' (padrão: 'medium')
- `message`: string opcional para exibir abaixo do loader

## 🎯 Ícones

Usamos ícones da biblioteca **Lucide React** para consistência visual.

### Ícones Comuns

- **FinOps**: `DollarSign`, `TrendingUp`, `TrendingDown`, `Server`, `Activity`, `Package`
- **Filtros**: `Filter`
- **Navegação**: `ChevronRight`, `ChevronLeft`, `Menu`, `X`
- **Status**: `CheckCircle`, `AlertCircle`, `XCircle`

### Recursos de Ícones Gratuitos

- **Design.dev Free Icons**: https://design.dev/free-icons/
  - Ícones SVG otimizados para desenvolvimento
  - Foco em ferramentas e interfaces modernas

## 🛠️ Ferramentas Recomendadas do Design.dev

### Para Desenvolvimento de Componentes

1. **Box Shadow Generator**
   - URL: https://design.dev/tools/box-shadow-generator/
   - Uso: Criar sombras em cards e modais

2. **Gradient Mixer**
   - URL: https://design.dev/tools/gradient-mixer/
   - Uso: Criar gradientes para headers e backgrounds

3. **CSS Grid Area Mapper**
   - URL: https://design.dev/tools/css-grid-area-mapper/
   - Uso: Design de layouts complexos com grid

4. **Color Contrast Checker**
   - URL: https://design.dev/tools/color-contrast-checker/
   - Uso: Garantir acessibilidade WCAG nas cores

5. **Cubic-Bézier Studio**
   - URL: https://design.dev/tools/cubic-bezier-studio/
   - Uso: Criar animações suaves e naturais

### Para Otimização

1. **Image Optimizer**
   - URL: https://design.dev/tools/image-optimizer/
   - Uso: Comprimir e redimensionar imagens

2. **Feature Detection**
   - URL: https://design.dev/tools/feature-detection/
   - Uso: Verificar compatibilidade de CSS/JS

3. **CSS Specificity Calculator**
   - URL: https://design.dev/tools/css-specificity-calculator/
   - Uso: Debug de conflitos de CSS

## 📐 Convenções de Estilo

### Espaçamento

Use múltiplos de 8px para consistência:
- **Extra Small**: 0.25rem (4px)
- **Small**: 0.5rem (8px)
- **Medium**: 1rem (16px)
- **Large**: 1.5rem (24px)
- **Extra Large**: 2rem (32px)

### Tipografia

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
  'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
  sans-serif;
```

### Border Radius

- **Small**: 6px
- **Medium**: 8px
- **Large**: 12px
- **Extra Large**: 16px

### Animações

Use `transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1)` para transições suaves.

## 🎭 Estados de Hover

Sempre adicione estados hover para elementos interativos:

```css
.button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(62, 92, 118, 0.3);
}
```

## 📱 Responsividade

Use breakpoints consistentes:
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

## ✅ Checklist de Acessibilidade

- [ ] Contraste de cores WCAG AA (4.5:1)
- [ ] Foco visível em elementos interativos
- [ ] Labels descritivos em inputs
- [ ] ARIA labels quando necessário
- [ ] Navegação por teclado funcional

## 🔗 Recursos Externos

- **Ícones**: https://design.dev/free-icons/
- **Ferramentas CSS**: https://design.dev/#tools
- **Lucide Icons**: https://lucide.dev/
- **WCAG Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/
