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

### Loader

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
