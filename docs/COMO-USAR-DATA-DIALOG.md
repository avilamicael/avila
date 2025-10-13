# Como Usar o DataDialog

O **DataDialog** é um componente genérico e reutilizável para criar formulários de cadastro em modais (dialogs). Ele funciona de forma declarativa - você passa as configurações dos campos e ele cuida de toda a lógica de formulário, validação, máscaras e envio.

## 📋 Índice

- [Características](#características)
- [Uso Básico](#uso-básico)
- [Exemplos Práticos](#exemplos-práticos)
- [Configuração de Campos](#configuração-de-campos)
- [Máscaras Disponíveis](#máscaras-disponíveis)
- [Validações](#validações)
- [Props do Componente](#props-do-componente)
- [Integração com DataComboBox](#integração-com-datacombobox)

---

## ✨ Características

- ✅ **Genérico e Reutilizável**: Configure apenas os campos, o resto é automático
- ✅ **Máscaras Automáticas**: CNPJ, CPF, telefone, CEP, moeda
- ✅ **Validações Built-in**: Campos obrigatórios, validação de máscaras, validações customizadas
- ✅ **Tratamento de Erros**: Exibe erros do backend automaticamente
- ✅ **Toast Notifications**: Feedback visual de sucesso/erro
- ✅ **Loading States**: Desabilita botões durante o envio
- ✅ **Reset Automático**: Limpa o formulário ao fechar
- ✅ **TypeScript**: Totalmente tipado

---

## 🚀 Uso Básico

### 1. Importe o componente

```tsx
import { DataDialog } from "@/components/utils/data-dialog"
import { useState } from "react"
```

### 2. Crie o estado para controlar o dialog

```tsx
const [openDialog, setOpenDialog] = useState(false)
```

### 3. Use o componente

```tsx
<DataDialog
  open={openDialog}
  onOpenChange={setOpenDialog}
  title="Cadastrar Nova Categoria"
  fields={[
    {
      name: "name",
      label: "Nome",
      type: "text",
      required: true,
      placeholder: "Ex: Despesas Operacionais"
    }
  ]}
  onSubmit={(data) => registrationsService.createCategory(data)}
  onSuccess={(id) => {
    console.log("Cadastrado com ID:", id)
  }}
/>
```

---

## 📚 Exemplos Práticos

### Exemplo 1: Categoria (Simples)

```tsx
<DataDialog
  open={openCategoriaDialog}
  onOpenChange={setOpenCategoriaDialog}
  title="Cadastrar Nova Categoria"
  description="Preencha os dados da categoria. Campos com * são obrigatórios."
  fields={[
    {
      name: "name",
      label: "Nome",
      type: "text",
      required: true,
      placeholder: "Ex: Despesas Operacionais"
    },
    {
      name: "description",
      label: "Descrição",
      type: "textarea",
      placeholder: "Descreva o uso desta categoria",
      rows: 3
    }
  ]}
  onSubmit={(data) => registrationsService.createCategory(data)}
  onSuccess={(id) => {
    console.log("Categoria criada com ID:", id)
  }}
/>
```

### Exemplo 2: Filial (Com CNPJ e Máscara)

```tsx
<DataDialog
  open={openFilialDialog}
  onOpenChange={setOpenFilialDialog}
  title="Cadastrar Nova Filial"
  fields={[
    {
      name: "name",
      label: "Nome",
      type: "text",
      required: true,
      placeholder: "Ex: Matriz São Paulo"
    },
    {
      name: "cnpj",
      label: "CNPJ",
      type: "text",
      required: true,
      mask: "cnpj",
      placeholder: "00.000.000/0000-00",
      maxLength: 18
    },
    {
      name: "notes",
      label: "Observações",
      type: "textarea",
      placeholder: "Informações adicionais",
      rows: 3
    }
  ]}
  onSubmit={(data) => registrationsService.createFilial(data)}
  onSuccess={(id) => {
    console.log("Filial criada com ID:", id)
  }}
/>
```

### Exemplo 3: Fornecedor (Múltiplos Campos)

```tsx
<DataDialog
  open={openFornecedorDialog}
  onOpenChange={setOpenFornecedorDialog}
  title="Cadastrar Novo Fornecedor"
  fields={[
    {
      name: "name",
      label: "Razão Social",
      type: "text",
      required: true,
      placeholder: "Ex: Empresa Fornecedora LTDA"
    },
    {
      name: "fantasy_name",
      label: "Nome Fantasia",
      type: "text",
      placeholder: "Ex: Fornecedor XYZ"
    },
    {
      name: "cnpj",
      label: "CNPJ",
      type: "text",
      required: true,
      mask: "cnpj",
      placeholder: "00.000.000/0000-00",
      maxLength: 18
    },
    {
      name: "email",
      label: "E-mail",
      type: "email",
      placeholder: "contato@empresa.com"
    },
    {
      name: "phone",
      label: "Telefone",
      type: "tel",
      mask: "phone",
      placeholder: "(00) 00000-0000"
    },
    {
      name: "notes",
      label: "Observações",
      type: "textarea",
      placeholder: "Informações adicionais",
      rows: 3
    }
  ]}
  onSubmit={(data) => registrationsService.createSupplier(data)}
  onSuccess={(id) => {
    fornecedorComboRef.current?.refresh()
    setSelectedFornecedorId(id)
  }}
/>
```

### Exemplo 4: Com Validação Customizada

```tsx
<DataDialog
  open={openDialog}
  onOpenChange={setOpenDialog}
  title="Cadastrar Usuário"
  fields={[
    {
      name: "email",
      label: "E-mail",
      type: "email",
      required: true,
      placeholder: "usuario@email.com"
    },
    {
      name: "password",
      label: "Senha",
      type: "text",
      required: true,
      placeholder: "Mínimo 8 caracteres",
      validation: (value) => {
        if (value.length < 8) {
          return "A senha deve ter no mínimo 8 caracteres"
        }
        return undefined
      }
    }
  ]}
  onSubmit={(data) => userService.create(data)}
  onSuccess={(id) => {
    console.log("Usuário criado!")
  }}
/>
```

---

## ⚙️ Configuração de Campos

Cada campo é configurado através de um objeto `FieldConfig`:

```typescript
interface FieldConfig {
  name: string                    // Nome do campo (obrigatório)
  label: string                   // Label exibido (obrigatório)
  type?: FieldType                // Tipo do campo (padrão: "text")
  placeholder?: string            // Placeholder do input
  required?: boolean              // Campo obrigatório (padrão: false)
  mask?: MaskType                 // Máscara a ser aplicada
  maxLength?: number              // Tamanho máximo
  rows?: number                   // Número de linhas (para textarea)
  validation?: (value: string) => string | undefined  // Validação customizada
}
```

### Tipos de Campo Disponíveis

```typescript
type FieldType = "text" | "textarea" | "number" | "email" | "tel"
```

| Tipo | Descrição | Uso |
|------|-----------|-----|
| `text` | Input de texto padrão | Nomes, títulos, textos gerais |
| `textarea` | Área de texto com múltiplas linhas | Descrições, observações, notas |
| `number` | Input numérico | Quantidades, valores numéricos |
| `email` | Input de e-mail (com validação) | Endereços de e-mail |
| `tel` | Input de telefone | Telefones (combine com mask: "phone") |

---

## 🎭 Máscaras Disponíveis

```typescript
type MaskType = "cnpj" | "cpf" | "phone" | "cep" | "currency"
```

### 1. CNPJ

```tsx
{
  name: "cnpj",
  label: "CNPJ",
  mask: "cnpj",
  maxLength: 18
}
// Formato: 00.000.000/0000-00
```

### 2. CPF

```tsx
{
  name: "cpf",
  label: "CPF",
  mask: "cpf",
  maxLength: 14
}
// Formato: 000.000.000-00
```

### 3. Telefone

```tsx
{
  name: "phone",
  label: "Telefone",
  mask: "phone",
  maxLength: 15
}
// Formato: (00) 00000-0000 ou (00) 0000-0000
```

### 4. CEP

```tsx
{
  name: "cep",
  label: "CEP",
  mask: "cep",
  maxLength: 9
}
// Formato: 00000-000
```

### 5. Moeda

```tsx
{
  name: "valor",
  label: "Valor",
  mask: "currency"
}
// Formato: 1.234,56
```

**Importante**: Máscaras são aplicadas apenas na interface. Ao enviar os dados, os caracteres especiais são removidos automaticamente.

---

## ✅ Validações

### Validações Automáticas

O DataDialog possui validações automáticas para:

1. **Campos Obrigatórios**: Verifica se o campo está preenchido
2. **Máscaras**: Valida se o formato está correto (CNPJ com 14 dígitos, etc.)
3. **E-mail**: Valida formato de e-mail
4. **Tipos**: Valida de acordo com o tipo do campo

### Validações Customizadas

Você pode adicionar validações customizadas através da prop `validation`:

```tsx
{
  name: "idade",
  label: "Idade",
  type: "number",
  required: true,
  validation: (value) => {
    const idade = parseInt(value)
    if (idade < 18) {
      return "Idade mínima: 18 anos"
    }
    if (idade > 100) {
      return "Idade inválida"
    }
    return undefined  // undefined = válido
  }
}
```

### Erros do Backend

Erros vindos do backend são automaticamente exibidos nos campos correspondentes:

```typescript
// Backend retorna:
{
  "cnpj": ["Já existe uma filial com este CNPJ."],
  "email": ["Digite um endereço de e-mail válido."]
}

// DataDialog exibe os erros nos campos automaticamente
```

---

## 🔧 Props do Componente

### Props Obrigatórias

| Prop | Tipo | Descrição |
|------|------|-----------|
| `open` | `boolean` | Controla se o dialog está aberto |
| `onOpenChange` | `(open: boolean) => void` | Callback quando o estado muda |
| `title` | `string` | Título do dialog |
| `fields` | `FieldConfig[]` | Array com configuração dos campos |
| `onSubmit` | `(data) => Promise<{id: number}>` | Função para enviar dados ao backend |

### Props Opcionais

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `description` | `string` | "Preencha os dados..." | Descrição abaixo do título |
| `initialData` | `Partial<T>` | `{}` | Dados iniciais do formulário |
| `onSuccess` | `(id: number) => void` | - | Callback após sucesso |
| `onError` | `(error: any) => void` | - | Callback após erro |
| `submitLabel` | `string` | "Cadastrar" | Texto do botão de envio |
| `cancelLabel` | `string` | "Cancelar" | Texto do botão de cancelar |
| `loadingLabel` | `string` | "Cadastrando..." | Texto durante o loading |

---

## 🔗 Integração com DataComboBox

O DataDialog funciona perfeitamente com o DataComboBox para criar workflows de cadastro rápido:

### Exemplo Completo

```tsx
export default function PayablesCreate() {
  // Refs para controlar os comboboxes
  const filialComboRef = useRef<DataComboBoxRef>(null)

  // Estados para valores selecionados
  const [selectedFilialId, setSelectedFilialId] = useState<number | undefined>()

  // Estados para controlar dialogs
  const [openFilialDialog, setOpenFilialDialog] = useState(false)

  return (
    <div>
      {/* COMBOBOX */}
      <DataComboBox
        ref={filialComboRef}
        value={selectedFilialId}
        onValueChange={setSelectedFilialId}
        fetchData={(params) => registrationsService.listFilials(params)}
        mapItem={(filial) => ({
          value: filial.id,
          label: filial.name,
        })}
        placeholder="Selecione uma filial"
        allowCreate
        onCreateNew={() => setOpenFilialDialog(true)}
      />

      {/* DIALOG */}
      <DataDialog
        open={openFilialDialog}
        onOpenChange={setOpenFilialDialog}
        title="Cadastrar Nova Filial"
        fields={[
          {
            name: "name",
            label: "Nome",
            type: "text",
            required: true
          },
          {
            name: "cnpj",
            label: "CNPJ",
            type: "text",
            required: true,
            mask: "cnpj",
            maxLength: 18
          }
        ]}
        onSubmit={(data) => registrationsService.createFilial(data)}
        onSuccess={(id) => {
          // 1. Atualiza o combobox
          filialComboRef.current?.refresh()

          // 2. Seleciona o item recém-criado
          setSelectedFilialId(id)
        }}
      />
    </div>
  )
}
```

### Fluxo de Integração

1. **Usuário clica em "Cadastrar novo"** no DataComboBox
2. **Dialog abre** (`setOpenFilialDialog(true)`)
3. **Usuário preenche** os campos
4. **Dados são enviados** para o backend via `onSubmit`
5. **Se sucesso**:
   - Toast de sucesso aparece
   - `onSuccess` é chamado com o ID do item criado
   - ComboBox é atualizado (`refresh()`)
   - Item recém-criado é automaticamente selecionado
   - Dialog fecha
6. **Se erro**:
   - Erros são exibidos nos campos correspondentes
   - Dialog permanece aberto para correção

---

## 🎯 Boas Práticas

### 1. Sempre use refs para controlar o DataComboBox

```tsx
const filialComboRef = useRef<DataComboBoxRef>(null)

// Depois, no onSuccess:
filialComboRef.current?.refresh()
```

### 2. Use TypeScript para tipar os dados

```tsx
interface FilialCreate {
  name: string
  cnpj: string
  notes?: string
}

onSubmit={(data: FilialCreate) => registrationsService.createFilial(data)}
```

### 3. Mantenha os campos organizados

```tsx
// ✅ BOM: Campos organizados logicamente
fields={[
  { name: "name", label: "Nome", required: true },
  { name: "cnpj", label: "CNPJ", required: true, mask: "cnpj" },
  { name: "email", label: "E-mail", type: "email" },
  { name: "notes", label: "Observações", type: "textarea" }
]}

// ❌ RUIM: Campos desordenados
fields={[
  { name: "notes", type: "textarea" },
  { name: "cnpj", mask: "cnpj" },
  { name: "name" }
]}
```

### 4. Use placeholders descritivos

```tsx
// ✅ BOM
placeholder: "Ex: Matriz São Paulo"

// ❌ RUIM
placeholder: "Digite aqui"
```

### 5. Centralize erros com onError

```tsx
onError={(error) => {
  console.error("Erro ao cadastrar:", error)
  // Log para sistema de monitoramento
}}
```

---

## 🐛 Troubleshooting

### Dialog não abre

**Problema**: Clico no botão mas o dialog não aparece.

**Solução**: Verifique se o estado está sendo atualizado corretamente:

```tsx
// ✅ CORRETO
<button onClick={() => setOpenDialog(true)}>
  Abrir
</button>

<DataDialog
  open={openDialog}
  onOpenChange={setOpenDialog}
  // ...
/>
```

### Campos não resetam ao fechar

**Problema**: Ao reabrir o dialog, os campos ainda têm os valores antigos.

**Solução**: O componente já faz isso automaticamente. Se persistir, verifique se está passando `initialData` corretamente.

### Erros do backend não aparecem

**Problema**: Backend retorna erro mas não aparece no formulário.

**Solução**: Verifique se o backend está retornando no formato correto:

```json
{
  "campo_nome": ["Mensagem de erro"],
  "outro_campo": ["Outra mensagem"]
}
```

### Máscara não funciona

**Problema**: Digito mas a máscara não é aplicada.

**Solução**: Verifique se está usando o nome correto da máscara e se o campo é do tipo `text`:

```tsx
// ✅ CORRETO
{
  name: "cnpj",
  type: "text",  // Deve ser text
  mask: "cnpj"   // Nome correto
}
```

---

## 📝 Resumo

O DataDialog simplifica drasticamente a criação de formulários de cadastro:

- ✅ **Declarativo**: Configure apenas os campos
- ✅ **Zero boilerplate**: Sem `useState` para cada campo
- ✅ **Validações automáticas**: CNPJ, CPF, e-mail, etc.
- ✅ **Máscaras automáticas**: Formatação em tempo real
- ✅ **Integração perfeita**: Funciona perfeitamente com DataComboBox
- ✅ **Tratamento de erros**: Backend e frontend

**Antes (sem DataDialog)**:
- ~100 linhas de código por formulário
- Gerenciar estado de cada campo
- Implementar validações manualmente
- Tratar erros do backend
- Aplicar máscaras

**Depois (com DataDialog)**:
- ~20 linhas de configuração
- Tudo automático

---

## 🔗 Links Relacionados

- [Como Usar DataComboBox](./COMO-USAR-DATACOMBOBOX.md)
- [Documentação ComboBox](./COMBOBOX.md)

---

**Desenvolvido com ❤️ para o projeto Avila**
