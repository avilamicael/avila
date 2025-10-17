# ESPECIFICAÇÃO: Página de Listagem e Baixa de Contas a Pagar

## CONTEXTO

Sistema para listar contas a pagar, filtrar por status e realizar pagamentos (baixas) individuais ou em lote. O backend Django já está implementado com todos os endpoints necessários.

---

## PADRÕES DO SISTEMA

### Componentes Reutilizáveis Disponíveis

✅ **DataComboBox** - ComboBox conectado ao backend com busca e cadastro rápido
✅ **DataDialog** - Dialog genérico para formulários com validação
✅ **AppLayout** - Layout padrão com sidebar e header
✅ **Componentes shadcn/ui** - Button, Input, Textarea, Select, Badge, Table, Tabs, etc.

### Padrões de Código

- **Componentização**: Separar por funcionalidade, evitar arquivos longos
- **Reutilização**: Usar DataComboBox e DataDialog sempre que possível
- **Máscaras**: Reutilizar funções de máscara já existentes (data, moeda)
- **Toast**: Usar `sonner` para feedback de sucesso/erro
- **Loading**: Usar `Loader2` do lucide-react com animação spin
- **Validação**: Validar no frontend e tratar erros do backend
- **Estado**: useState para estado local, refs para métodos imperativos

---

## ESTRUTURA DA PÁGINA

```
/payables (Lista)
├── Header: "Contas a Pagar"
├── Abas de Filtro (Todas, Vencidas, A Pagar, Pagas)
├── Tabela de Contas
│   ├── Checkbox (seleção múltipla)
│   ├── Status (badge colorido)
│   ├── Descrição + Categoria
│   ├── Fornecedor
│   ├── Vencimento + Label de dias
│   ├── Valor Original
│   ├── Valor Pago
│   └── Ações (Ver, Pagar, Editar, Excluir)
├── Paginação (20, 30, 50 por página)
└── Barra de Seleção (quando há itens selecionados)
    ├── "X contas selecionadas | Total: R$ X.XXX,XX"
    └── Botões: [Pagar Selecionadas] [Exportar]
```

---

## ABAS DE FILTRO

### 1. 📋 Todas
- **Endpoint**: `GET /api/payables/accounts-payable/?ordering=-due_date`
- Mostra todas as contas sem filtro

### 2. ⏰ Vencidas
- **Endpoint**: `GET /api/payables/accounts-payable/?is_overdue=true&ordering=-due_date`
- Apenas contas vencidas (status `overdue`)

### 3. 💰 A Pagar
- **Endpoint**: `GET /api/payables/accounts-payable/?status__in=pending,due&due_in_days=30&ordering=due_date`
- Contas pendentes que vencem nos próximos 30 dias

### 4. ✅ Pagas
- **Endpoint**: `GET /api/payables/accounts-payable/?status=paid&ordering=-payment_date`
- Apenas contas já pagas

### Implementação

```tsx
type ActiveTab = 'all' | 'overdue' | 'due' | 'paid'

const [activeTab, setActiveTab] = useState<ActiveTab>('all')

// Usar React Query
const { data, isLoading } = useQuery({
  queryKey: ['payables', activeTab, page, pageSize],
  queryFn: () => payablesService.listAccountsPayable({
    page,
    page_size: pageSize,
    ...getTabFilters(activeTab)
  }),
  keepPreviousData: true
})
```

---

## TABELA - COLUNAS

### Estrutura

| ☑ | Status | Descrição | Fornecedor | Vencimento | Valor | Pago | Ações |
|---|--------|-----------|------------|------------|-------|------|-------|

### Detalhamento

#### 1. Checkbox (40px)
- Checkbox no header para selecionar todos
- Linha selecionada: `bg-blue-50`
- Gerenciar com `useState<number[]>()`

#### 2. Status (120px)
```tsx
<Badge variant={getStatusVariant(status)}>
  {getStatusLabel(status)}
</Badge>

// Variantes
overdue → 'destructive' (vermelho) "Vencida"
due → 'warning' (amarelo) "A Vencer"
pending → 'default' (azul) "Pendente"
paid → 'success' (verde) "Paga"
partially_paid → 'secondary' (laranja) "Paga Parcialmente"
cancelled → 'outline' (cinza) "Cancelada"
```

#### 3. Descrição
```tsx
<div className="flex flex-col">
  <span className="font-medium text-gray-900">{description}</span>
  <span className="text-xs text-gray-500">{category_name}</span>
</div>
```

#### 4. Fornecedor
```tsx
<span className="text-sm text-gray-900">{supplier_name}</span>
```

#### 5. Vencimento
```tsx
<div className="flex flex-col">
  <span>{formatDate(due_date)}</span>
  {getDaysLabel(days) && (
    <span className={cn(
      "text-xs",
      days < 0 && "text-red-600",
      days === 0 && "text-orange-600",
      days <= 7 && days > 0 && "text-yellow-600"
    )}>
      {getDaysLabel(days)}
    </span>
  )}
</div>

// Função getDaysLabel
days < 0 → "Venceu há X dias"
days === 0 → "Vence hoje"
days <= 7 → "Vence em X dias"
days > 7 → "" (não mostra)
```

#### 6. Valor (alinhado à direita)
```tsx
<span className="font-medium text-gray-900">
  {formatCurrency(original_amount)}
</span>
```

#### 7. Pago (alinhado à direita)
```tsx
<span className={cn(
  parseFloat(paid_amount) > 0 ? "text-green-600" : "text-gray-400"
)}>
  {formatCurrency(paid_amount)}
</span>
```

#### 8. Ações (150px)
```tsx
<div className="flex gap-2">
  <Button size="sm" variant="ghost" onClick={() => handleView(id)}>
    Ver
  </Button>
  {status !== 'paid' && status !== 'cancelled' && (
    <Button size="sm" onClick={() => handlePay(id)}>
      Pagar
    </Button>
  )}
</div>
```

### Estados Visuais
- Hover: `hover:bg-gray-50`
- Selecionada: `bg-blue-50`
- Vencida: `border-l-4 border-red-500`
- Transição: `transition-colors duration-150`

---

## DIALOG DE PAGAMENTO INDIVIDUAL

### Trigger
Botão "Pagar" na linha da tabela

### Estrutura
```tsx
<Dialog>
  <DialogHeader>
    <DialogTitle>Registrar Pagamento</DialogTitle>
  </DialogHeader>
  <DialogContent>
    {/* Seção 1: Info da Conta (readonly) */}
    <div className="bg-gray-50 p-4 rounded-md space-y-2">
      <InfoRow label="Descrição" value={description} />
      <InfoRow label="Fornecedor" value={supplier_name} />
      <InfoRow label="Valor Original" value={formatCurrency(original_amount)} bold />
      <InfoRow label="Desconto" value={formatCurrency(discount)} />
    </div>

    {/* Seção 2: Dados do Pagamento */}
    <div className="space-y-4">
      <Label>Data de Pagamento *</Label>
      <Input
        type="date"
        value={paymentDate}
        onChange={(e) => setPaymentDate(e.target.value)}
      />

      <Label>Juros (opcional)</Label>
      <Input
        value={interest}
        onChange={(e) => setInterest(maskCurrency(e.target.value))}
        placeholder="R$ 0,00"
      />

      <Label>Multa (opcional)</Label>
      <Input
        value={fine}
        onChange={(e) => setFine(maskCurrency(e.target.value))}
        placeholder="R$ 0,00"
      />

      <Label>Valor a Pagar *</Label>
      <Input
        value={amountPaid}
        onChange={(e) => {
          setManuallyEdited(true)
          setAmountPaid(maskCurrency(e.target.value))
        }}
        className="font-bold"
      />
      <p className="text-xs text-gray-500">
        Calculado: Original + Juros + Multa - Desconto
      </p>
    </div>

    {/* Seção 3: Info Bancárias */}
    <div className="space-y-4">
      <Label>Conta Bancária *</Label>
      <DataComboBox
        value={selectedBankAccountId}
        onValueChange={setSelectedBankAccountId}
        fetchData={(params) => registrationsService.listFilials(params)}
        mapItem={(filial) => ({
          value: filial.id,
          label: `${filial.name} - ${filial.bank_account_name || 'S/ Conta'}`
        })}
        placeholder="Selecione a conta"
      />

      <Label>Forma de Pagamento *</Label>
      <DataComboBox
        value={selectedPaymentMethodId}
        onValueChange={setSelectedPaymentMethodId}
        fetchData={(params) => registrationsService.listPaymentMethods(params)}
        mapItem={(method) => ({
          value: method.id,
          label: method.name
        })}
        placeholder="Selecione a forma"
      />
    </div>

    {/* Seção 4: Observações */}
    <div>
      <Label>Observações (opcional)</Label>
      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Observações sobre este pagamento..."
        rows={3}
        maxLength={500}
      />
      <p className="text-xs text-gray-500 mt-1">
        {notes.length}/500 caracteres
      </p>
    </div>
  </DialogContent>
  <DialogFooter>
    <Button variant="outline" onClick={onClose}>
      Cancelar
    </Button>
    <Button onClick={handleSubmit} disabled={isLoading}>
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Confirmar Pagamento
    </Button>
  </DialogFooter>
</Dialog>
```

### Cálculo Automático do Valor
```tsx
useEffect(() => {
  if (manuallyEdited) return

  const original = parseFloat(original_amount) || 0
  const disc = parseFloat(discount) || 0
  const int = parseCurrency(interest) / 100 || 0
  const fn = parseCurrency(fine) / 100 || 0

  const calculated = original - disc + int + fn
  setAmountPaid(maskCurrency(String(calculated * 100)))
}, [interest, fine, manuallyEdited])
```

### Envio do Pagamento
```tsx
const handleSubmit = async () => {
  if (!validate()) return

  setIsLoading(true)
  try {
    const data: PayablePaymentCreate = {
      account_payable: accountId,
      payment_date: paymentDate,
      amount_paid: parseCurrency(amountPaid) / 100,
      payment_method: selectedPaymentMethodId!,
      paid_by_branch: selectedBankAccountId,
      notes: notes || undefined
    }

    await payablesService.createPayment(data)

    toast.success("Pagamento registrado com sucesso!")
    queryClient.invalidateQueries(['payables'])
    onClose()
  } catch (error: any) {
    const message = error.response?.data?.message || 'Erro ao registrar pagamento'
    toast.error(message)
  } finally {
    setIsLoading(false)
  }
}
```

---

## DIALOG DE PAGAMENTO EM LOTE

### Trigger
Botão "Pagar Selecionadas" na barra de seleção

### Estrutura
```tsx
<Dialog>
  <DialogHeader>
    <DialogTitle>Pagamento em Lote ({selectedAccounts.length} contas)</DialogTitle>
  </DialogHeader>
  <DialogContent>
    {/* Lista de Contas */}
    <div className="bg-gray-50 p-4 rounded-md max-h-[200px] overflow-y-auto space-y-2">
      {selectedAccounts.map(account => (
        <div key={account.id} className="flex justify-between text-sm">
          <span>✓ {account.description}</span>
          <span className="font-medium">{formatCurrency(account.original_amount)}</span>
        </div>
      ))}
      <div className="border-t pt-2 mt-2 flex justify-between font-bold text-green-600">
        <span>TOTAL:</span>
        <span>{formatCurrency(totalOriginal)}</span>
      </div>
    </div>

    {/* Aviso */}
    <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md">
      <p className="text-sm text-yellow-800">
        ⚠️ Os valores de juros e multa serão aplicados a CADA conta individualmente
      </p>
    </div>

    {/* Formulário (similar ao individual, mas sem anexo) */}
    <div className="space-y-4">
      {/* Data, Juros, Multa, Conta, Forma de Pagamento */}
    </div>

    {/* Resumo Calculado */}
    <div className="bg-blue-50 p-4 rounded-md space-y-1 text-sm">
      <div className="flex justify-between">
        <span>Original:</span>
        <span>{formatCurrency(totalOriginal)}</span>
      </div>
      <div className="flex justify-between">
        <span>+ Juros ({count} × {formatCurrency(interestPerAccount)}):</span>
        <span>{formatCurrency(totalInterest)}</span>
      </div>
      <div className="flex justify-between">
        <span>+ Multa ({count} × {formatCurrency(finePerAccount)}):</span>
        <span>{formatCurrency(totalFine)}</span>
      </div>
      <div className="border-t pt-2 mt-2 flex justify-between font-bold text-lg">
        <span>TOTAL:</span>
        <span>{formatCurrency(grandTotal)}</span>
      </div>
    </div>
  </DialogContent>
  <DialogFooter>
    <Button variant="outline" onClick={onClose}>
      Cancelar
    </Button>
    <Button onClick={handleBatchSubmit} disabled={isProcessing}>
      {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Confirmar Todos ({count} contas)
    </Button>
  </DialogFooter>
</Dialog>
```

### Processamento em Lote
```tsx
const handleBatchSubmit = async () => {
  if (!validate()) return

  setIsProcessing(true)
  const results: number[] = []
  const errors: Array<{id: number, message: string}> = []

  for (const account of selectedAccounts) {
    try {
      const data: PayablePaymentCreate = {
        account_payable: account.id,
        payment_date: paymentDate,
        amount_paid: calculateIndividualAmount(account),
        payment_method: selectedPaymentMethodId!,
        paid_by_branch: selectedBankAccountId,
        notes: notes || undefined
      }

      await payablesService.createPayment(data)
      results.push(account.id)
    } catch (error: any) {
      errors.push({
        id: account.id,
        message: error.response?.data?.message || 'Erro desconhecido'
      })
    }
  }

  setIsProcessing(false)

  if (errors.length === 0) {
    toast.success(`${results.length} pagamentos registrados com sucesso!`)
  } else if (results.length === 0) {
    toast.error('Falha ao registrar todos os pagamentos')
  } else {
    toast.warning(`${results.length} registrados. ${errors.length} falharam.`)
  }

  queryClient.invalidateQueries(['payables'])
  onClose()
  clearSelection()
}

const calculateIndividualAmount = (account: AccountPayable): number => {
  const original = parseFloat(account.original_amount)
  const discount = parseFloat(account.discount) || 0
  const interest = parseCurrency(interestPerAccount) / 100 || 0
  const fine = parseCurrency(finePerAccount) / 100 || 0

  return original - discount + interest + fine
}
```

---

## BARRA DE SELEÇÃO MÚLTIPLA

```tsx
{selectedIds.length > 0 && (
  <div className="sticky bottom-0 bg-blue-50 border-t border-blue-200 p-4 flex justify-between items-center">
    <div className="text-sm font-medium">
      <span>{selectedIds.length} conta(s) selecionada(s)</span>
      <span className="mx-2">|</span>
      <span>Total: {formatCurrency(calculateSelectedTotal())}</span>
    </div>
    <div className="flex gap-2">
      <Button
        variant="outline"
        onClick={handleExport}
      >
        Exportar
      </Button>
      <Button onClick={() => setOpenBatchPaymentDialog(true)}>
        Pagar Selecionadas
      </Button>
    </div>
  </div>
)}
```

---

## ESTRUTURA DE ARQUIVOS

```
frontend/src/
└── pages/
    └── payables/
        ├── PayablesList.tsx          # Página principal
        ├── components/
        │   ├── PayablesTable.tsx     # Tabela completa
        │   ├── PayablesTableRow.tsx  # Linha da tabela
        │   ├── PayablesTabs.tsx      # Abas de filtro
        │   ├── PaymentDialog.tsx     # Dialog pagamento individual
        │   ├── BatchPaymentDialog.tsx # Dialog pagamento lote
        │   ├── SelectionBar.tsx      # Barra de seleção
        │   └── Pagination.tsx        # Paginação customizada
        └── hooks/
            ├── usePayables.ts        # Hook para buscar contas
            ├── usePayment.ts         # Hook para pagamento individual
            └── useBatchPayment.ts    # Hook para pagamento em lote
```

---

## UTILIDADES (Reutilizar do PayablesCreate)

```tsx
// frontend/src/utils/formatters.ts
export const formatCurrency = (value: string | number): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(numValue)) return 'R$ 0,00'

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(numValue)
}

export const formatDate = (dateString: string): string => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  // Adicionado timeZone: 'UTC' para evitar problemas de fuso horário
  return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' })
}

export const getDaysUntilDue = (dueDate: string): number => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)

  return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export const getDaysLabel = (days: number): string => {
  if (days < 0) return `Venceu há ${Math.abs(days)} dia${Math.abs(days) !== 1 ? 's' : ''}`
  if (days === 0) return 'Vence hoje'
  if (days <= 7) return `Vence em ${days} dia${days !== 1 ? 's' : ''}`
  return ''
}

export const maskCurrency = (value: string): string => {
  const numbers = value.replace(/\D/g, "")
  const amount = Number(numbers) / 100
  return amount.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export const parseCurrency = (value: string): number => {
  return parseInt(value.replace(/\D/g, "")) || 0
}
```

---

## HOOKS CUSTOMIZADOS

### usePayables.ts
```tsx
import { useQuery } from '@tanstack/react-query'
import { payablesService } from '@/services'
import type { ActiveTab } from '../types'

export const usePayables = (params: {
  tab: ActiveTab
  page: number
  pageSize: number
  searchTerm?: string
  supplierId?: number
  categoryId?: number
  branchId?: number
  paymentMethodId?: number
  dueDateStart?: string
  dueDateEnd?: string
  paymentDateStart?: string
  paymentDateEnd?: string
}) => {
  const { tab, page, pageSize, ...rest } = params
  return useQuery({
    queryKey: ['payables', tab, page, pageSize, rest],
    queryFn: () => {
      const filters = getTabFilters(tab)
      return payablesService.listAccountsPayable({
        page,
        page_size: pageSize,
        ...filters,
        search: rest.searchTerm,
        supplier: rest.supplierId,
        category: rest.categoryId,
        branch: rest.branchId,
        payment_method: rest.paymentMethodId,
        due_date__gte: rest.dueDateStart,
        due_date__lte: rest.dueDateEnd,
        payment_date__gte: rest.paymentDateStart,
        payment_date__lte: rest.paymentDateEnd,
      })
    },
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000
  })
}

const getTabFilters = (tab: ActiveTab) => {
  switch (tab) {
    case 'overdue':
      return { is_overdue: true, ordering: '-due_date' }
    case 'due':
      return { status__in: ['pending', 'due'], due_in_days: 30, ordering: 'due_date' }
    case 'paid':
      return { status: 'paid', ordering: '-payment_date' }
    default:
      return { ordering: '-due_date' }
  }
}
```

### usePayment.ts
```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { payablesService } from '@/services'
import { toast } from 'sonner'

export const usePayment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: payablesService.createPayment,
    onSuccess: () => {
      queryClient.invalidateQueries(['payables'])
      toast.success('Pagamento registrado com sucesso!')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erro ao registrar pagamento'
      toast.error(message)
    }
  })
}
```

---

## CHECKLIST DE IMPLEMENTAÇÃO

### Fase 1: Setup
- [ ] Criar arquivos de tipos TypeScript
- [ ] Criar funções utilitárias (formatters.ts)
- [ ] Criar hooks customizados

### Fase 2: Listagem
- [ ] Criar componente PayablesList.tsx (página principal)
- [ ] Criar componente PayablesTabs.tsx (abas)
- [ ] Criar componente PayablesTable.tsx (tabela)
- [ ] Criar componente PayablesTableRow.tsx (linha)
- [ ] Implementar skeleton loading
- [ ] Implementar paginação

### Fase 3: Seleção
- [ ] Implementar lógica de seleção múltipla
- [ ] Criar componente SelectionBar.tsx
- [ ] Calcular total selecionado

### Fase 4: Pagamento Individual
- [ ] Criar componente PaymentDialog.tsx
- [ ] Implementar formulário com validação
- [ ] Implementar cálculo automático de valor
- [ ] Integrar com API

### Fase 5: Pagamento em Lote
- [ ] Criar componente BatchPaymentDialog.tsx
- [ ] Implementar processamento sequencial
- [ ] Implementar feedback de progresso
- [ ] Integrar com API

### Fase 6: Refinamentos
- [ ] Ajustar estilos e responsividade
- [ ] Adicionar loading states
- [ ] Implementar tratamento de erros
- [ ] Testes de integração

---

## ENDPOINTS UTILIZADOS

### Consultas (GET)
```
GET /api/payables/accounts-payable/
  ?page={page}
  &page_size={pageSize}
  &ordering={ordering}
  &is_overdue={true|false}
  &status__in={status1,status2}
  &due_in_days={days}

GET /api/registrations/filials/dropdown/
GET /api/registrations/payment-methods/dropdown/
```

### Mutações (POST)
```
POST /api/payables/payable-payments/
Content-Type: application/json

{
  "account_payable": number,
  "payment_date": "YYYY-MM-DD",
  "amount_paid": number,
  "payment_method": number,
  "paid_by_branch": number,
  "notes": string
}
```

---

## OBSERVAÇÕES IMPORTANTES

1. **Reutilizar máscaras e formatações** do PayablesCreate.tsx
2. **Usar DataComboBox** para todos os selects de dados do backend
3. **Não usar DataDialog** para pagamentos (são formulários complexos)
4. **Componentizar** - separar em arquivos menores e focados
5. **Toast** para todo feedback de sucesso/erro
6. **Skeleton** durante carregamento inicial
7. **Keep previous data** no React Query para transições suaves
8. **Processamento sequencial** em lote para evitar sobrecarga
9. **Feedback claro** de erros em operações em lote

---

**ESPECIFICAÇÃO PRONTA PARA IMPLEMENTAÇÃO** 🚀

**ABAIXO ESTA as diferenças entre a implementação atual e a especificação completa**

📊 ANÁLISE COMPARATIVA
✅ O que já está implementado:
Abas de filtro (Todas, Vencidas, A Pagar, Pagas)
Tabela básica com colunas principais
Seleção múltipla via checkboxes
Dialog de pagamento individual
Dialog de pagamento em lote
Barra de seleção com total
Paginação básica
React Query configurado
Hooks customizados (usePayables, usePayment, useBatchPayment)
❌ O que está faltando:
Tabela mais robusta - Falta ordenação, melhor visual, estados vazios
Skeleton loading - Não tem loading state visual
Paginação avançada - Falta seletor de itens por página
Feedback visual - Falta animações, transições
Exportação - Botão existe mas não funciona
Ações adicionais - Ver detalhes, Editar, Excluir
Upload de comprovante - Dialog de pagamento não tem
Estados visuais - Linha vencida com borda vermelha, hover, etc
Validação robusta - Falta validação com Zod no frontend
🔄 O que precisa ser ajustado:
Melhorar visual da tabela
Adicionar mais feedback visual
Implementar componentes faltantes
Refinar UX/UI
📋 PLANO DE REFATORAÇÃO
Vou dividir em etapas pequenas para você aprovar:
FASE 1: Melhorar Tabela e Loading States ⏳
Adicionar skeleton loading na tabela
Melhorar estados visuais (hover, seleção, vencida)
Adicionar estado vazio quando não há dados
Adicionar indicador de loading durante refetch
FASE 2: Melhorar Paginação
Adicionar seletor de itens por página (20, 30, 50)
Melhorar visual da paginação
Adicionar texto "Mostrando X-Y de Z resultados"
FASE 3: Adicionar Upload de Comprovante
Adicionar campo de anexo no PaymentDialog
Preview de imagem
Validação de tamanho e tipo
FASE 4: Adicionar Ações Faltantes
Botão "Ver" detalhes (modal simples)
Botão "Editar" (navegação)
Botão "Excluir" (confirmação)
FASE 5: Implementar Exportação
Exportar CSV das contas selecionadas
Exportar todas da aba atual
FASE 6: Validação com Zod
Adicionar validação robusta nos dialogs
Mensagens de erro claras
Quer que eu comece pela FASE 1 (Melhorar Tabela e Loading States)? Isso vai deixar a interface muito mais profissional e com melhor UX, adicionando:
✨ Skeleton loading elegante
🎨 Estados visuais aprimorados
📭 Tela de estado vazio
🔄 Indicador de atualização