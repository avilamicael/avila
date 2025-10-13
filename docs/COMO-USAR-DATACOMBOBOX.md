# Como Usar o DataComboBox

## 📋 Resumo

**Use APENAS um componente:** `DataComboBox`

**NÃO crie componentes separados** como `FilialComboBox`, `FornecedorComboBox`, etc.

---

## ✅ Solução Implementada

### 1. Componente Base (já existe)
- **Arquivo:** `frontend/src/components/ui/combobox.tsx`
- **Propósito:** Componente UI genérico sem lógica de negócio
- **Status:** ✅ Mantido

### 2. Componente Conectado ao Backend (NOVO)
- **Arquivo:** `frontend/src/components/utils/data-combobox.tsx`
- **Propósito:** Wrapper que conecta ao backend e gerencia dados
- **Status:** ✅ Criado

### 3. Componentes Específicos (REMOVER)
- **Arquivo:** `frontend/src/components/utils/filial-combobox.tsx`
- **Status:** ❌ Deve ser removido (obsoleto)

---

## 🚀 Como Usar

### Exemplo 1: Filiais (com renderização customizada)

```tsx
import { DataComboBox, type DataComboBoxRef } from "@/components/utils/data-combobox"
import { registrationsService } from "@/services"

const filialComboRef = useRef<DataComboBoxRef>(null)
const [selectedFilialId, setSelectedFilialId] = useState<number>()

<DataComboBox
  ref={filialComboRef}
  value={selectedFilialId}
  onValueChange={(value) => setSelectedFilialId(value)}
  fetchData={(params) => registrationsService.listFilials(params)}
  mapItem={(filial) => ({
    value: filial.id,
    label: filial.name,
    cnpj: filial.cnpj, // Dados extras
  })}
  placeholder="Selecione uma filial"
  searchPlaceholder="Buscar filial..."
  emptyMessage="Nenhuma filial encontrada"
  createLabel="Cadastrar nova filial"
  allowCreate
  onCreateNew={() => setOpenFilialDialog(true)}
  renderItem={(item) => (
    <div className="flex flex-col">
      <span className="font-medium">{item.label}</span>
      <span className="text-xs text-muted-foreground">{item.cnpj}</span>
    </div>
  )}
/>

// Para recarregar a lista após criar uma nova filial:
filialComboRef.current?.refresh()
```

### Exemplo 2: Fornecedores (simples)

```tsx
<DataComboBox
  value={selectedFornecedorId}
  onValueChange={(value) => setSelectedFornecedorId(value)}
  fetchData={(params) => registrationsService.listSuppliers(params)}
  mapItem={(fornecedor) => ({
    value: fornecedor.id,
    label: fornecedor.fantasy_name || fornecedor.name,
  })}
  placeholder="Selecione um fornecedor"
  searchPlaceholder="Buscar fornecedor..."
  emptyMessage="Nenhum fornecedor encontrado"
  allowCreate
  onCreateNew={() => setOpenFornecedorDialog(true)}
/>
```

### Exemplo 3: Categorias (mínimo)

```tsx
<DataComboBox
  value={selectedCategoriaId}
  onValueChange={(value) => setSelectedCategoriaId(value)}
  fetchData={(params) => registrationsService.listCategories(params)}
  mapItem={(categoria) => ({
    value: categoria.id,
    label: categoria.name,
  })}
  placeholder="Selecione uma categoria"
/>
```

### Exemplo 4: Formas de Pagamento

```tsx
<DataComboBox
  value={selectedFormaPagamentoId}
  onValueChange={(value) => setSelectedFormaPagamentoId(value)}
  fetchData={(params) => registrationsService.listPaymentMethods(params)}
  mapItem={(formaPagamento) => ({
    value: formaPagamento.id,
    label: formaPagamento.name,
  })}
  placeholder="Selecione a forma de pagamento"
  searchPlaceholder="Buscar forma de pagamento..."
  allowCreate
  onCreateNew={() => setOpenFormaPagamentoDialog(true)}
/>
```

---

## 📦 Props do DataComboBox

### Obrigatórias

| Prop | Tipo | Descrição |
|------|------|-----------|
| `value` | `number \| undefined` | ID do item selecionado |
| `onValueChange` | `(value, item?) => void` | Callback quando seleção muda |
| `fetchData` | `(params?) => Promise<{results: any[]}>` | Função para buscar dados do backend |
| `mapItem` | `(item: any) => DataComboBoxItem` | Função para mapear item do backend |

### Opcionais (com defaults)

| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| `placeholder` | `string` | "Selecione..." | Texto quando nada selecionado |
| `searchPlaceholder` | `string` | "Buscar..." | Placeholder do campo de busca |
| `emptyMessage` | `string` | "Nenhum item encontrado." | Mensagem quando lista vazia |
| `loadingMessage` | `string` | "Carregando..." | Mensagem durante carregamento |
| `createLabel` | `string` | "Cadastrar novo" | Label do botão criar |
| `allowCreate` | `boolean` | `false` | Mostra opção de criar novo |
| `onCreateNew` | `() => void` | - | Callback ao clicar em criar |
| `disabled` | `boolean` | `false` | Desabilita o combobox |
| `className` | `string` | - | Classes CSS customizadas |
| `renderItem` | `(item) => ReactNode` | - | Renderização customizada do item |

### Ref Methods

```tsx
const comboRef = useRef<DataComboBoxRef>(null)

// Recarregar dados
await comboRef.current?.refresh()
```

---

## 🎯 Vantagens desta Abordagem

### ✅ Um único componente para TUDO
- Filiais
- Fornecedores
- Categorias
- Formas de Pagamento
- Clientes
- Produtos
- Qualquer outro dado!

### ✅ Reutilização máxima
- Código não duplicado
- Fácil manutenção
- Bug fix em um lugar afeta todos

### ✅ Flexibilidade total
- Customize apenas o que precisa
- Renderização específica opcional
- Comportamento padrão inteligente

### ✅ Type-safe
- TypeScript completo
- IntelliSense funciona
- Autocomplete das props

---

## 🗑️ Limpeza Necessária

### Arquivos para REMOVER:

```bash
# Remova este arquivo (obsoleto):
frontend/src/components/utils/filial-combobox.tsx
```

### Arquivos para MANTER:

```bash
# Base UI (mantém):
frontend/src/components/ui/combobox.tsx

# Wrapper com backend (mantém):
frontend/src/components/utils/data-combobox.tsx
```

---

## 🔄 Migrando Código Antigo

### Antes (ERRADO):
```tsx
import { FilialComboBox } from "@/components/utils/filial-combobox"

<FilialComboBox
  value={filialId}
  onValueChange={setFilialId}
  onCreateNew={() => openDialog()}
/>
```

### Depois (CORRETO):
```tsx
import { DataComboBox } from "@/components/utils/data-combobox"
import { registrationsService } from "@/services"

<DataComboBox
  value={filialId}
  onValueChange={setFilialId}
  fetchData={(params) => registrationsService.listFilials(params)}
  mapItem={(filial) => ({ value: filial.id, label: filial.name })}
  placeholder="Selecione uma filial"
  onCreateNew={() => openDialog()}
  allowCreate
/>
```

---

## 💡 Dicas

### 1. Use ref quando precisar recarregar
```tsx
const comboRef = useRef<DataComboBoxRef>(null)

// Após salvar novo item:
await comboRef.current?.refresh()
```

### 2. Customize a renderização quando necessário
```tsx
renderItem={(item) => (
  <div>
    <div className="font-bold">{item.label}</div>
    <div className="text-xs">{item.extraInfo}</div>
  </div>
)}
```

### 3. Adicione dados extras no mapItem
```tsx
mapItem={(filial) => ({
  value: filial.id,
  label: filial.name,
  cnpj: filial.cnpj,        // ✅ Pode adicionar
  address: filial.address,   // ✅ Pode adicionar
  // Qualquer coisa!
})}
```

---

## ❓ FAQ

### P: Posso usar para dados locais (sem backend)?
**R:** Sim! Use o `ComboBox` base direto (`ui/combobox.tsx`) sem o `DataComboBox`.

### P: Preciso criar `FornecedorComboBox`?
**R:** **NÃO!** Use o `DataComboBox` com diferentes props.

### P: Como faço busca customizada?
**R:** O `DataComboBox` já faz busca automática com debounce de 500ms.

### P: Posso ter múltiplos na mesma página?
**R:** Sim! Cada um é independente.

---

## 📝 Checklist de Implementação

- [ ] Criar novo combobox? → Use `DataComboBox`
- [ ] Precisa buscar do backend? → Use `DataComboBox`
- [ ] Dados estáticos simples? → Use `ComboBox` base
- [ ] Tem `FilialComboBox` no código? → Migre para `DataComboBox`
- [ ] Criar `XxxComboBox`? → **NÃO!** Use `DataComboBox`

---

**Última atualização:** 2025-10-12
