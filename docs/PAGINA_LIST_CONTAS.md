# 🚀 SISTEMA DE CONTAS A PAGAR - ESPECIFICAÇÃO COMPLETA PARA IMPLEMENTAÇÃO

## CONTEXTO
Estou desenvolvendo a interface de listagem e pagamento de contas a pagar em React + TypeScript. O backend Django já está implementado e documentado nos arquivos PAYABLES.md e PAYABLES_FILTERS.md que fornecerei separadamente.

---

## ESTRUTURA DA PÁGINA

### Layout Geral
A página consiste em uma tabela completa ocupando todo o espaço disponível, sem filtros visíveis. A navegação e ações são feitas através de:
- Abas de filtro rápido
- Seleção múltipla via checkboxes
- Ações inline por registro
- Dialogs do shadcn/ui para pagamentos

---

## COMPONENTES PRINCIPAIS

### 1. ABAS DE NAVEGAÇÃO

4 abas para filtrar automaticamente as contas:

```
┌─────────┬──────────┬─────────┬──────────┐
│ 📋 Todas│ ⏰ Vencidas│ 💰 Pagar│ ✅ Pagas │
└─────────┴──────────┴─────────┴──────────┘
```

**Comportamento de cada aba:**

1. **📋 Todas**
   - Endpoint: `GET /api/payables/accounts-payable/?ordering=-due_date`
   - Mostra todas as contas sem filtro de status
   - Ordenação: mais recentes primeiro

2. **⏰ Vencidas**
   - Endpoint: `GET /api/payables/accounts-payable/?is_overdue=true&ordering=-due_date`
   - Apenas contas com status `overdue`
   - Destaque visual em vermelho

3. **💰 A Pagar**
   - Endpoint: `GET /api/payables/accounts-payable/?status__in=pending,due&due_in_days=30&ordering=due_date`
   - Contas pendentes que vencem nos próximos 30 dias
   - Ordenação: próximas do vencimento primeiro

4. **✅ Pagas**
   - Endpoint: `GET /api/payables/accounts-payable/?status=paid&ordering=-payment_date`
   - Apenas contas já pagas
   - Ordenação: pagamentos mais recentes primeiro

**Implementação:**
- Usar React Query com chaves únicas por aba
- Cache independente para cada aba
- Trocar de aba não invalida cache das outras
- Query key: `['payables', activeTab, page, pageSize]`

---

### 2. TABELA DATATABLE

#### Estrutura de Colunas

```
┌──┬────────┬─────────────┬────────────┬────────────┬──────────┬────────┬────────┐
│☑│ Status │ Descrição   │ Fornecedor │ Vencimento │  Valor   │  Pago  │ Ações  │
└──┴────────┴─────────────┴────────────┴────────────┴──────────┴────────┴────────┘
```

**Detalhamento das Colunas:**

1. **Checkbox**
   - Largura: 40px
   - Checkbox no header para selecionar/desselecionar todos da página atual
   - Ao selecionar, linha fica com background azul claro (bg-blue-50)
   - Usar estado local para gerenciar seleções

2. **Status**
   - Largura: 120px
   - Badge colorido com texto:
     - `overdue` → Badge vermelho "Vencida"
     - `due` → Badge amarelo "A Vencer"
     - `pending` → Badge azul "Pendente"
     - `paid` → Badge verde "Paga"
     - `partially_paid` → Badge laranja "Paga Parcialmente"
     - `cancelled` → Badge cinza "Cancelada"
   - Usar componente Badge do shadcn/ui

3. **Descrição**
   - Texto principal: `description` (font-medium, text-gray-900)
   - Subtítulo: `category.name` (text-xs, text-gray-500)
   - Layout em coluna (flex-col)

4. **Fornecedor**
   - Texto: `supplier.name`
   - text-sm, text-gray-900

5. **Vencimento**
   - Linha 1: Data formatada (dd/mm/yyyy)
   - Linha 2 (condicional): Label de dias
     - Se vencida (dias < 0): "Venceu há X dias" (text-red-600, text-xs)
     - Se hoje (dias = 0): "Vence hoje" (text-orange-600, text-xs)
     - Se próxima (dias ≤ 7): "Vence em X dias" (text-yellow-600, text-xs)
     - Se > 7 dias: não mostrar label
   - Layout em coluna (flex-col)

6. **Valor**
   - Alinhamento: direita (text-right)
   - Formato: R$ X.XXX,XX
   - Campo: `original_amount`
   - Font: medium, text-gray-900

7. **Pago**
   - Alinhamento: direita (text-right)
   - Formato: R$ X.XXX,XX
   - Campo: `paid_amount`
   - Se valor > 0: texto verde (text-green-600)
   - Se valor = 0: texto cinza (text-gray-400)

8. **Ações**
   - Largura: 150px
   - Botões inline (flex gap-2):
     - **👁️ Ver** (sempre visível) → Abre dialog de detalhes (não implementar agora)
     - **💰 Pagar** (só se status ≠ paid e ≠ cancelled) → Abre dialog de pagamento
     - **✏️ Editar** (sempre visível) → Navega para rota de edição (não implementar agora)
     - **🗑️ Excluir** (sempre visível) → Dialog de confirmação (não implementar agora)

**Estados Visuais:**
- Hover na linha: Background cinza claro (hover:bg-gray-50)
- Linha selecionada: Background azul claro (bg-blue-50)
- Linha vencida: Borda esquerda vermelha de 4px (border-l-4 border-red-500)
- Transições suaves: transition-colors duration-150

**Skeleton Loading:**
- Mostrar skeleton loader enquanto carrega dados
- 5 linhas de skeleton com animação pulse
- Manter estrutura da tabela

---

### 3. BARRA DE SELEÇÃO MÚLTIPLA

Aparece fixada no rodapé da tabela quando há checkboxes selecionados.

```
┌─────────────────────────────────────────────────────────────┐
│ ☑ X conta(s) selecionada(s) | Total: R$ XX.XXX,XX           │
│                                                               │
│                    [💰 Pagar Selecionadas] [📥 Exportar]    │
└─────────────────────────────────────────────────────────────┘
```

**Comportamento:**
- Mostra quantidade de contas selecionadas
- Calcula e mostra total somado do campo `original_amount` das contas selecionadas
- Formato do total: R$ XX.XXX,XX (formatação brasileira)
- Botão "Pagar Selecionadas": Abre dialog de pagamento em lote
- Botão "Exportar": Exporta CSV das contas selecionadas (não implementar agora)
- Background: bg-blue-50 com borda superior (border-t border-blue-200)
- Posição: Sticky bottom-0
- Padding: p-4
- Animação de entrada: slide up ou fade in

**Cálculo do Total:**
```typescript
const totalAmount = selectedAccounts.reduce((sum, account) => {
  return sum + parseFloat(account.original_amount)
}, 0)

// Formatar: 
const formattedTotal = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
}).format(totalAmount)
```

**Visual:**
- Texto à esquerda: "X conta(s) selecionada(s) | Total: R$ XX.XXX,XX" (font-medium)
- Botões à direita: Alinhados horizontalmente com gap
- Botão "Pagar": Variante default do shadcn (verde)
- Botão "Exportar": Variante outline do shadcn

---

### 4. PAGINAÇÃO

Implementação híbrida: Paginação tradicional + opção de alterar quantidade por página.

```
┌─────────────────────────────────────────────────────────────┐
│  Mostrando 1-20 de 150 resultados                           │
│                                                               │
│  Itens por página: [20 ▼]  [◄ Anterior] [1] 2 3 ... 8 [Próximo ►] │
└─────────────────────────────────────────────────────────────┘
```

**Especificações:**
- Padrão: 20 itens por página
- Opções no select: 20, 30, 50
- Máximo do backend: 50 (page_size já configurado)
- Botões de navegação: Anterior, Próximo
- Números de página: 
  - Mostrar primeiras 3 páginas
  - Página atual e adjacentes (atual-1, atual, atual+1)
  - Últimas 3 páginas
  - Usar `...` para omitir páginas intermediárias
- Texto: "Mostrando X-Y de Z resultados"
- Desabilitar botões quando não aplicável (primeira/última página)

**React Query:**
```typescript
const { data, isLoading, isFetching } = useQuery({
  queryKey: ['payables', activeTab, page, pageSize],
  queryFn: () => fetchPayables({ 
    page, 
    page_size: pageSize, 
    ...getTabFilters(activeTab) 
  }),
  keepPreviousData: true // Transição suave entre páginas
})
```

**Backend Response:**
```json
{
  "count": 150,
  "next": "http://...?page=2",
  "previous": null,
  "results": [...]
}
```

**Cálculos:**
```typescript
const totalPages = Math.ceil(data.count / pageSize)
const startItem = (page - 1) * pageSize + 1
const endItem = Math.min(page * pageSize, data.count)
```

**Componente de Paginação:**
- Usar componente Pagination do shadcn/ui
- Customizar para incluir select de page size
- Posição: Bottom da tabela, antes da barra de seleção (se visível)

---

## DIALOGS (SHADCN/UI)

### DIALOG 1: PAGAMENTO INDIVIDUAL

**Trigger:** Botão "💰 Pagar" na linha da tabela

**Tamanho:** max-w-2xl (médio/grande)

**Título:** "💰 Registrar Pagamento"

**Conteúdo:**

```
┌─────────────────────────────────────────────────────────┐
│  💰 Registrar Pagamento                         [X]     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  📋 INFORMAÇÕES DA CONTA                                │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  Descrição: Aluguel Matriz (readonly, text-gray-700)    │
│  Fornecedor: Imobiliária XYZ (readonly, text-gray-700)  │
│  Valor Original: R$ 3.000,00 (readonly, font-bold)      │
│  Desconto: R$ 0,00 (readonly)                           │
│                                                          │
│  💵 DADOS DO PAGAMENTO                                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  Data de Pagamento * (required)                         │
│  [________________] (DatePicker do shadcn)              │
│                                                          │
│  Juros (opcional)                                       │
│  [R$ ___________] (Input numérico)                      │
│                                                          │
│  Multa (opcional)                                       │
│  [R$ ___________] (Input numérico)                      │
│                                                          │
│  💰 VALOR A PAGAR                                       │
│  [R$ 3.000,00___] (Input EDITÁVEL, calculado)          │
│  ↳ Cálculo: Original + Juros + Multa - Desconto        │
│  (Texto auxiliar abaixo do campo)                       │
│                                                          │
│  🏦 INFORMAÇÕES BANCÁRIAS                               │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  Conta Bancária * (required)                            │
│  [Selecione... ▼] (Select do shadcn)                   │
│  Opções:                                                 │
│  ├─ Matriz - Banco do Brasil CC: 12345-6               │
│  ├─ Filial SP - Itaú CC: 98765-4                       │
│  └─ ... (format: {filial.name} - {bank_account_name})  │
│                                                          │
│  Forma de Pagamento * (required)                        │
│  [Selecione... ▼] (Select do shadcn)                   │
│  Opções:                                                 │
│  ├─ PIX                                                  │
│  ├─ Transferência Bancária                             │
│  ├─ Boleto                                              │
│  └─ ...                                                  │
│                                                          │
│  📎 COMPROVANTE (opcional)                              │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  [Escolher arquivo...] (File input)                     │
│  Formatos aceitos: PDF, JPG, PNG (max 5MB)             │
│  (Mostrar preview se imagem)                            │
│                                                          │
│  📝 OBSERVAÇÕES (opcional)                              │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  [_______________________________]                      │
│  [_______________________________] (Textarea)           │
│  [_______________________________]                      │
│  Máximo 500 caracteres                                  │
│                                                          │
├─────────────────────────────────────────────────────────┤
│                          [Cancelar] [✅ Confirmar]      │
│                          (outline)   (default)          │
└─────────────────────────────────────────────────────────┘
```

**Seções do Dialog:**

1. **Informações da Conta** (readonly)
   - Campos de texto simples, não editáveis
   - Background cinza claro (bg-gray-50)
   - Padding interno
   - Mostrar:
     - `description`
     - `supplier.name`
     - `original_amount` (formatado)
     - `discount` (formatado)

2. **Dados do Pagamento**
   - **Data de Pagamento**: DatePicker do shadcn
     - Obrigatório (*)
     - Formato: dd/mm/yyyy
     - Padrão: data atual
   - **Juros**: Input numérico
     - Opcional
     - Aceita decimais (0.00)
     - Placeholder: "R$ 0,00"
     - Validação: >= 0
   - **Multa**: Input numérico
     - Opcional
     - Aceita decimais (0.00)
     - Placeholder: "R$ 0,00"
     - Validação: >= 0
   - **Valor a Pagar**: Input numérico EDITÁVEL
     - Calculado automaticamente: `original_amount - discount + interest + fine`
     - Usuário pode editar manualmente
     - Atualização em tempo real quando juros/multa mudam
     - Destaque visual (border mais grossa, ou background diferente)
     - Helper text: "Calculado: Original + Juros + Multa - Desconto"

3. **Informações Bancárias**
   - **Conta Bancária**: Select
     - Obrigatório (*)
     - Carrega de: `GET /api/registrations/filials/dropdown/`
     - Formato da opção: `{name} - {bank_account_name}`
     - Exemplo: "Matriz - Banco do Brasil CC: 12345-6"
   - **Forma de Pagamento**: Select
     - Obrigatório (*)
     - Carrega de: `GET /api/registrations/payment-methods/dropdown/`
     - Mostrar apenas `name`

4. **Comprovante**
   - Input file
   - Aceitar: .pdf, .jpg, .jpeg, .png
   - Max size: 5MB
   - Validação: Tipo e tamanho
   - Mostrar preview se for imagem
   - Remover arquivo selecionado (botão X)

5. **Observações**
   - Textarea
   - Max 500 caracteres
   - Placeholder: "Observações adicionais sobre este pagamento..."
   - Contador de caracteres

**Comportamento do Valor a Pagar:**

```typescript
// useEffect para cálculo automático
useEffect(() => {
  const original = parseFloat(account.original_amount) || 0
  const discount = parseFloat(account.discount) || 0
  const interest = parseFloat(formData.interest) || 0
  const fine = parseFloat(formData.fine) || 0
  
  const calculated = original - discount + interest + fine
  
  // Só atualiza se usuário não editou manualmente
  if (!manuallyEdited) {
    setValue('amount_paid', calculated.toFixed(2))
  }
}, [formData.interest, formData.fine])

// Detectar edição manual
const handleAmountChange = (value) => {
  setManuallyEdited(true)
  setValue('amount_paid', value)
}
```

**Validações (Zod Schema):**

```typescript
const paymentSchema = z.object({
  payment_date: z.string().min(1, "Data de pagamento é obrigatória"),
  amount_paid: z.number({
    required_error: "Valor é obrigatório",
    invalid_type_error: "Valor inválido"
  }).positive("Valor deve ser maior que 0"),
  interest: z.number().min(0, "Juros não pode ser negativo").optional().or(z.literal(0)),
  fine: z.number().min(0, "Multa não pode ser negativa").optional().or(z.literal(0)),
  bank_account: z.number({
    required_error: "Selecione uma conta bancária"
  }).positive("Selecione uma conta bancária"),
  payment_method: z.number({
    required_error: "Selecione uma forma de pagamento"
  }).positive("Selecione uma forma de pagamento"),
  attachment: z.instanceof(File).optional().nullable(),
  notes: z.string().max(500, "Máximo 500 caracteres").optional()
})
```

**Envio (API):**

```typescript
// Usar React Hook Form + useMutation do React Query

const mutation = useMutation({
  mutationFn: async (data: PaymentFormData) => {
    const formData = new FormData()
    formData.append('account_payable', account.id)
    formData.append('payment_date', data.payment_date)
    formData.append('amount_paid', data.amount_paid.toString())
    formData.append('interest', (data.interest || 0).toString())
    formData.append('fine', (data.fine || 0).toString())
    formData.append('bank_account', data.bank_account.toString())
    formData.append('payment_method', data.payment_method.toString())
    
    if (data.attachment) {
      formData.append('attachment', data.attachment)
    }
    
    if (data.notes) {
      formData.append('notes', data.notes)
    }
    
    return axios.post('/api/payables/payable-payments/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  onSuccess: () => {
    // Sucesso
    queryClient.invalidateQueries(['payables'])
    toast.success('Pagamento registrado com sucesso!')
    onClose()
    form.reset()
  },
  onError: (error: any) => {
    // Erro
    const message = error.response?.data?.message || 'Erro ao registrar pagamento'
    toast.error(message)
  }
})
```

**Botões do Dialog:**
- **Cancelar**: Variante outline, fecha dialog, reseta form
- **Confirmar**: Variante default (verde)
  - Texto: "✅ Confirmar Pagamento"
  - Disabled enquanto `mutation.isLoading`
  - Mostrar spinner quando loading
  - Só habilita se form válido

**Estados do Dialog:**
- Loading inicial: Skeleton nos selects
- Submitting: Botão disabled + spinner
- Error: Toast de erro, manter dialog aberto
- Success: Fechar dialog, toast de sucesso, invalidar queries

---

### DIALOG 2: PAGAMENTO EM LOTE

**Trigger:** Botão "💰 Pagar Selecionadas" (quando há contas selecionadas)

**Tamanho:** max-w-3xl (grande)

**Título:** "💰 Pagamento em Lote (X contas)"

**Conteúdo:**

```
┌─────────────────────────────────────────────────────────┐
│  💰 Pagamento em Lote (5 contas)                [X]     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  📋 CONTAS SELECIONADAS                                 │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  [Área com scroll se necessário, max-height: 200px]    │
│  ✓ Aluguel Matriz - R$ 3.000,00                        │
│  ✓ Energia Elétrica - R$ 850,00                        │
│  ✓ Água e Esgoto - R$ 200,00                           │
│  ✓ Fornecedor ABC - R$ 5.200,00                        │
│  ✓ Internet - R$ 300,00                                │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  💰 TOTAL: R$ 9.550,00                                 │
│  (destaque visual, font-bold, text-lg, text-green-600) │
│                                                          │
│  💵 DADOS DO PAGAMENTO                                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  ⚠️ Os valores abaixo serão aplicados a CADA conta     │
│  individualmente                                        │
│                                                          │
│  Data de Pagamento * (required)                         │
│  [________________] (DatePicker)                        │
│                                                          │
│  Juros por conta (opcional)                            │
│  [R$ ___________] (Input - aplicado a todas)           │
│                                                          │
│  Multa por conta (opcional)                            │
│  [R$ ___________] (Input - aplicado a todas)           │
│                                                          │
│  🏦 INFORMAÇÕES BANCÁRIAS                               │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  Conta Bancária * (required)                            │
│  [Selecione... ▼]                                       │
│                                                          │
│  Forma de Pagamento * (required)                        │
│  [Selecione... ▼]                                       │
│                                                          │
│  📝 OBSERVAÇÕES (opcional)                              │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  [_______________________________]                      │
│  [_______________________________]                      │
│  Aplicada a todos os pagamentos                         │
│                                                          │
│  💰 VALOR TOTAL A PAGAR                                │
│  Original: R$ 9.550,00                                  │
│  + Juros (5 × R$ 50,00): R$ 250,00                     │
│  + Multa (5 × R$ 10,00): R$ 50,00                      │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  TOTAL: R$ 9.850,00 (destaque, font-bold, text-xl)    │
│                                                          │
├─────────────────────────────────────────────────────────┤
│                          [Cancelar] [✅ Confirmar Todos]│
└─────────────────────────────────────────────────────────┘
```

**Seções do Dialog:**

1. **Contas Selecionadas**
   - Lista com scroll (max-height: 200px)
   - Para cada conta:
     - ✓ {description} - {formatCurrency(original_amount)}
   - Separador visual
   - Total destacado:
     - Label: "💰 TOTAL:"
     - Valor: Soma de todos `original_amount`
     - Estilo: font-bold, text-lg, text-green-600

2. **Dados do Pagamento**
   - Aviso destacado: "⚠️ Os valores abaixo serão aplicados a CADA conta individualmente"
     - Background: bg-yellow-50
     - Border: border-yellow-200
     - Text: text-yellow-800
   - **Data de Pagamento**: DatePicker
     - Obrigatório (*)
     - Mesma data para todas as contas
   - **Juros por conta**: Input numérico
     - Opcional
     - Valor será aplicado individualmente a cada conta
     - Helper text: "Este valor será adicionado a cada conta"
   - **Multa por conta**: Input numérico
     - Opcional
     - Valor será aplicado individualmente a cada conta
     - Helper text: "Este valor será adicionado a cada conta"

3. **Informações Bancárias**
   - Mesmos campos do pagamento individual
   - Aplicados a todas as contas

4. **Observações**
   - Textarea
   - Aplicada a todos os pagamentos
   - Helper text: "Aplicada a todos os pagamentos"

5. **Valor Total a Pagar** (Calculado)
   - Box destacado com breakdown:
     ```
     Original: R$ 9.550,00
     + Juros (5 contas × R$ 50,00): R$ 250,00
     + Multa (5 contas × R$ 10,00): R$ 50,00
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     TOTAL: R$ 9.850,00
     ```
   - Atualização em tempo real
   - Destaque visual forte

**Cálculo do Total:**

```typescript
const calculateBatchTotal = () => {
  const originalTotal = selectedAccounts.reduce(
    (sum, acc) => sum + parseFloat(acc.original_amount), 
    0
  )
  
  const interestPerAccount = parseFloat(formData.interest) || 0
  const finePerAccount = parseFloat(formData.fine) || 0
  
  const totalInterest = interestPerAccount * selectedAccounts.length
  const totalFine = finePerAccount * selectedAccounts.length
  
  const grandTotal = originalTotal + totalInterest + totalFine
  
  return {
    original: originalTotal,
    interest: totalInterest,
    fine: totalFine,
    total: grandTotal,
    count: selectedAccounts.length
  }
}
```

**Validações (Zod Schema):**

```typescript
const batchPaymentSchema = z.object({
  payment_date: z.string().min(1, "Data de pagamento é obrigatória"),
  interest: z.number().min(0, "Juros não pode ser negativo").optional().or(z.literal(0)),
  fine: z.number().min(0, "Multa não pode ser negativa").optional().or(z.literal(0)),
  bank_account: z.number().positive("Selecione uma conta bancária"),
  payment_method: z.number().positive("Selecione uma forma de pagamento"),
  notes: z.string().max(500, "Máximo 500 caracteres").optional()
})
```

**Envio (API):**

```typescript
// Processar cada conta individualmente
const mutation = useMutation({
  mutationFn: async (data: BatchPaymentFormData) => {
    const results = []
    const errors = []
    
    // Processar sequencialmente para evitar sobrecarga
    for (const account of selectedAccounts) {
      try {
        const formData = new FormData()
        formData.append('account_payable', account.id.toString())
        formData.append('payment_date', data.payment_date)
        
        // Calcular valor individual
        const originalAmount = parseFloat(account.original_amount)
        const discount = parseFloat(account.discount) || 0
        const interest = data.interest || 0
        const fine = data.fine || 0
        const amountPaid = originalAmount - discount + interest + fine
        
        formData.append('amount_paid', amountPaid.toString())
        formData.append('interest', interest.toString())
        formData.append('fine', fine.toString())
        formData.append('bank_account', data.bank_account.toString())
        formData.append('payment_method', data.payment_method.toString())
        
        if (data.notes) {
          formData.append('notes', data.notes)
        }
        
        const response = await axios.post(
          '/api/payables/payable-payments/', 
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        )
        
        results.push({ account: account.id, success: true })
      } catch (error) {
        errors.push({ 
          account: account.id, 
          description: account.description,
          error: error.response?.data?.message || 'Erro desconhecido' 
        })
      }
    }
    
    return { results, errors }
  },
  onSuccess: (data) => {
    queryClient.invalidateQueries(['payables'])
    
    if (data.errors.length === 0) {
      toast.success(`${data.results.length} pagamentos registrados com sucesso!`)
    } else if (data.results.length === 0) {
      toast.error('Falha ao registrar todos os pagamentos')
    } else {
      toast.warning(
        `${data.results.length} pagamentos registrados. ${data.errors.length} falharam.`
      )
    }
    
    onClose()
    clearSelection()
    form.reset()
  },
  onError: (error: any) => {
    toast.error('Erro ao processar pagamentos em lote')
  }
})
```

**Botões do Dialog:**
- **Cancelar**: Variante outline, fecha dialog
- **Confirmar Todos**: Variante default (verde)
  - Texto: "✅ Confirmar Todos (X contas)"
  - Disabled enquanto `mutation.isLoading`
  - Mostrar progresso: "Processando X de Y..."
  - Spinner quando loading

**Estados do Dialog:**
- Loading: Mostrar progresso de processamento
- Partial Success: Mostrar quais falharam
- Complete Success: Fechar e mostrar toast
- Error: Manter aberto, mostrar detalhes

**Observações Importantes:**
- NÃO há upload de comprovante em lote (simplificação)
- Cada conta recebe o mesmo juros/multa
- Processar sequencialmente para não sobrecarregar servidor
- Mostrar feedback claro de sucesso/erro por conta

---

## TIPOS TYPESCRIPT

### Criar arquivo: `types/payables.types.ts`

```typescript
// Status possíveis
export type PayableStatus = 
  | 'pending' 
  | 'due' 
  | 'overdue' 
  | 'paid' 
  | 'partially_paid' 
  | 'cancelled'

// Frequência de recorrência
export type RecurrenceFrequency = 
  | 'weekly' 
  | 'biweekly' 
  | 'monthly' 
  | 'bimonthly' 
  | 'quarterly' 
  | 'semiannual' 
  | 'annual'

// Estrutura da conta a pagar
export interface AccountPayable {
  id: number
  branch: {
    id: number
    name: string
  }
  supplier: {
    id: number
    name: string
  }
  category: {
    id: number
    name: string
    color: string
  }
  payment_method: {
    id: number
    name: string
  }
  description: string
  original_amount: string
  discount: string
  interest: string
  fine: string
  paid_amount: string
  issue_date: string
  due_date: string
  payment_date: string | null
  status: PayableStatus
  is_recurring: boolean
  recurrence_frequency: RecurrenceFrequency | null
  invoice_numbers: string
  bank_slip_number: string
  notes: string
  created_at: string
  updated_at: string
}

// Resposta paginada da API
export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

// Dropdown option
export interface DropdownOption {
  id: number
  name: string
  bank_account_name?: string // Para filiais
}

// Form data para pagamento individual
export interface PaymentFormData {
  payment_date: string
  amount_paid: number
  interest?: number
  fine?: number
  bank_account: number
  payment_method: number
  attachment?: File | null
  notes?: string
}

// Form data para pagamento em lote
export interface BatchPaymentFormData {
  payment_date: string
  interest?: number
  fine?: number
  bank_account: number
  payment_method: number
  notes?: string
}

// Aba ativa
export type ActiveTab = 'all' | 'overdue' | 'due' | 'paid'
```

---

## UTILITÁRIOS

### Criar arquivo: `utils/formatters.ts`

```typescript
/**
 * Formata valor para moeda brasileira
 */
export const formatCurrency = (value: string | number): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  
  if (isNaN(numValue)) return 'R$ 0,00'
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(numValue)
}

/**
 * Formata data para padrão brasileiro
 */
export const formatDate = (dateString: string): string => {
  if (!dateString) return '-'
  
  const date = new Date(dateString)
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

/**
 * Calcula dias até o vencimento
 */
export const getDaysUntilDue = (dueDate: string): number => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  
  const diffTime = due.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return diffDays
}

/**
 * Retorna label de dias até vencimento
 */
export const getDaysLabel = (days: number): string => {
  if (days < 0) {
    return `Venceu há ${Math.abs(days)} dia${Math.abs(days) !== 1 ? 's' : ''}`
  }
  
  if (days === 0) {
    return 'Vence hoje'
  }
  
  if (days <= 7) {
    return `Vence em ${days} dia${days !== 1 ? 's' : ''}`
  }
  
  return ''
}

/**
 * Retorna cor do status
 */
export const getStatusColor = (status: PayableStatus): string => {
  const colors = {
    overdue: 'destructive',
    due: 'warning',
    pending: 'default',
    paid: 'success',
    partially_paid: 'secondary',
    cancelled: 'outline'
  }
  
  return colors[status] || 'default'
}

/**
 * Retorna label do status
 */
export const getStatusLabel = (status: PayableStatus): string => {
  const labels = {
    overdue: 'Vencida',
    due: 'A Vencer',
    pending: 'Pendente',
    paid: 'Paga',
    partially_paid: 'Paga Parcialmente',
    cancelled: 'Cancelada'
  }
  
  return labels[status] || status
}

/**
 * Calcula valor a pagar
 */
export const calculatePaymentAmount = (
  originalAmount: number,
  discount: number = 0,
  interest: number = 0,
  fine: number = 0
): number => {
  return originalAmount - discount + interest + fine
}

/**
 * Parse string para número seguro
 */
export const parseAmount = (value: string | number): number => {
  if (typeof value === 'number') return value
  const parsed = parseFloat(value)
  return isNaN(parsed) ? 0 : parsed
}
```

---

## HOOKS CUSTOMIZADOS

### Hook: `usePayables.ts`

```typescript
import { useQuery } from '@tanstack/react-query'
import type { ActiveTab, PaginatedResponse, AccountPayable } from '../types/payables.types'

interface UsePayablesParams {
  tab: ActiveTab
  page: number
  pageSize: number
}

export const usePayables = ({ tab, page, pageSize }: UsePayablesParams) => {
  return useQuery({
    queryKey: ['payables', tab, page, pageSize],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString()
      })
      
      // Adicionar filtros por aba
      switch (tab) {
        case 'overdue':
          params.append('is_overdue', 'true')
          params.append('ordering', '-due_date')
          break
        case 'due':
          params.append('status__in', 'pending,due')
          params.append('due_in_days', '30')
          params.append('ordering', 'due_date')
          break
        case 'paid':
          params.append('status', 'paid')
          params.append('ordering', '-payment_date')
          break
        default:
          params.append('ordering', '-due_date')
      }
      
      const response = await fetch(
        `/api/payables/accounts-payable/?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      )
      
      if (!response.ok) {
        throw new Error('Erro ao carregar contas a pagar')
      }
      
      return response.json() as Promise<PaginatedResponse<AccountPayable>>
    },
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000 // 10 minutos
  })
}
```

### Hook: `usePayment.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner' // ou seu sistema de toast
import type { PaymentFormData } from '../types/payables.types'

export const usePayment = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: PaymentFormData & { accountId: number }) => {
      const formData = new FormData()
      
      formData.append('account_payable', data.accountId.toString())
      formData.append('payment_date', data.payment_date)
      formData.append('amount_paid', data.amount_paid.toString())
      formData.append('interest', (data.interest || 0).toString())
      formData.append('fine', (data.fine || 0).toString())
      formData.append('bank_account', data.bank_account.toString())
      formData.append('payment_method', data.payment_method.toString())
      
      if (data.attachment) {
        formData.append('attachment', data.attachment)
      }
      
      if (data.notes) {
        formData.append('notes', data.notes)
      }
      
      const response = await fetch('/api/payables/payable-payments/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erro ao registrar pagamento')
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['payables'])
      toast.success('Pagamento registrado com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao registrar pagamento')
    }
  })
}
```

### Hook: `useDropdowns.ts`

```typescript
import { useQuery } from '@tanstack/react-query'
import type { DropdownOption } from '../types/payables.types'

const fetchDropdown = async (endpoint: string): Promise<DropdownOption[]> => {
  const response = await fetch(`/api/registrations/${endpoint}/dropdown/`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  })
  
  if (!response.ok) {
    throw new Error('Erro ao carregar opções')
  }
  
  return response.json()
}

export const useBranches = () => {
  return useQuery({
    queryKey: ['branches-dropdown'],
    queryFn: () => fetchDropdown('filials'),
    staleTime: Infinity // Raramente muda
  })
}

export const useSuppliers = () => {
  return useQuery({
    queryKey: ['suppliers-dropdown'],
    queryFn: () => fetchDropdown('suppliers'),
    staleTime: Infinity
  })
}

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories-dropdown'],
    queryFn: () => fetchDropdown('categories'),
    staleTime: Infinity
  })
}

export const usePaymentMethods = () => {
  return useQuery({
    queryKey: ['payment-methods-dropdown'],
    queryFn: () => fetchDropdown('payment-methods'),
    staleTime: Infinity
  })
}
```

---

## COMPONENTES SHADCN/UI NECESSÁRIOS

Instalar/gerar os seguintes componentes do shadcn/ui:

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add table
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add select
npx shadcn-ui@latest add input
npx shadcn-ui@latest add textarea
npx shadcn-ui@latest add calendar
npx shadcn-ui@latest add popover
npx shadcn-ui@latest add separator
npx shadcn-ui@latest add skeleton
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add label
```

**Componente DatePicker** (criar custom baseado no Calendar):

```typescript
// components/ui/date-picker.tsx
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export function DatePicker({ date, onDateChange, ...props }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
          {...props}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? (
            format(date, "dd/MM/yyyy", { locale: ptBR })
          ) : (
            <span>Selecione a data</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onDateChange}
          locale={ptBR}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
```

---

## ESTRUTURA DE ARQUIVOS SUGERIDA

```
src/
└── features/
    └── payables/
        ├── components/
        │   ├── PayablesPage.tsx           # Componente principal
        │   ├── PayablesTabs.tsx            # Navegação de abas
        │   ├── PayablesTable.tsx           # Tabela com dados
        │   ├── PayablesTableRow.tsx        # Linha da tabela
        │   ├── PaymentDialog.tsx           # Modal pagamento individual
        │   ├── BatchPaymentDialog.tsx      # Modal pagamento lote
        │   ├── SelectionBar.tsx            # Barra de seleção múltipla
        │   └── Pagination.tsx              # Componente de paginação
        ├── hooks/
        │   ├── usePayables.ts
        │   ├── usePayment.ts
        │   ├── useBatchPayment.ts
        │   └── useDropdowns.ts
        ├── types/
        │   └── payables.types.ts
        └── utils/
            └── formatters.ts
```

---

## FLUXO DE IMPLEMENTAÇÃO RECOMENDADO

### FASE 1: Setup Base
1. Criar tipos TypeScript
2. Criar utilitários de formatação
3. Configurar React Query (se ainda não configurado)
4. Instalar componentes shadcn/ui necessários

### FASE 2: Listagem
1. Criar hook `usePayables`
2. Criar componente `PayablesTabs`
3. Criar componente `PayablesTable`
4. Implementar skeleton loading
5. Implementar paginação

### FASE 3: Seleção Múltipla
1. Adicionar lógica de seleção (useState)
2. Criar componente `SelectionBar`
3. Implementar cálculo de total
4. Integrar com tabela

### FASE 4: Pagamento Individual
1. Criar hooks de dropdowns
2. Criar hook `usePayment`
3. Criar componente `PaymentDialog`
4. Implementar formulário com validação
5. Implementar cálculo automático
6. Integrar com API

### FASE 5: Pagamento em Lote
1. Criar hook `useBatchPayment`
2. Criar componente `BatchPaymentDialog`
3. Implementar processamento sequencial
4. Implementar feedback de progresso
5. Integrar com API

### FASE 6: Refinamentos
1. Ajustar estilos e responsividade
2. Adicionar loading states
3. Implementar tratamento de erros
4. Testes de integração
5. Otimizações de performance

---

## CONSIDERAÇÕES IMPORTANTES

### Performance
- Usar `keepPreviousData: true` no React Query para transições suaves
- Skeleton loader durante carregamento inicial
- Debounce em campos de busca (se adicionar futuramente)
- Memoizar cálculos pesados com useMemo
- Virtualização da tabela se houver muitos registros (react-window)

### UX/UI
- Feedback visual imediato em todas as ações
- Loading states claros (spinners, skeletons)
- Mensagens de erro descritivas
- Confirmação antes de ações destrutivas
- Toast notifications para feedback
- Disable de botões durante processamento

### Segurança
- Validação client-side E server-side
- Sanitização de inputs
- Verificação de permissões no backend
- Token JWT nas requisições
- CSRF protection (se necessário)

### Acessibilidade
- Labels adequados em todos os inputs
- Aria-labels em botões de ação
- Navegação por teclado funcional
- Contraste adequado de cores
- Focus visible nos elementos interativos

### Tratamento de Erros
- Try-catch em todas as operações async
- Mensagens de erro user-friendly
- Logging de erros para debug
- Fallback UI para estados de erro
- Retry logic para falhas de rede

---

## VALIDAÇÕES ESPECÍFICAS

### Pagamento Individual
- ✅ Data de pagamento obrigatória
- ✅ Valor pago > 0
- ✅ Juros >= 0
- ✅ Multa >= 0
- ✅ Conta bancária selecionada
- ✅ Forma de pagamento selecionada
- ✅ Arquivo < 5MB (se enviado)
- ✅ Formatos aceitos: PDF, JPG, PNG
- ✅ Observações <= 500 caracteres

### Pagamento em Lote
- ✅ Data de pagamento obrigatória
- ✅ Pelo menos 1 conta selecionada
- ✅ Juros por conta >= 0
- ✅ Multa por conta >= 0
- ✅ Conta bancária selecionada
- ✅ Forma de pagamento selecionada
- ✅ Observações <= 500 caracteres

---

## MENSAGENS DE FEEDBACK

### Sucesso
- Pagamento individual: "Pagamento registrado com sucesso!"
- Pagamento em lote: "X pagamentos registrados com sucesso!"
- Pagamento em lote parcial: "X pagamentos registrados. Y falharam."

### Erro
- Erro genérico: "Erro ao registrar pagamento. Tente novamente."
- Erro de validação: Mostrar campo específico com erro
- Erro de rede: "Erro de conexão. Verifique sua internet."
- Erro de permissão: "Você não tem permissão para esta ação."

### Avisos
- Sem contas selecionadas: "Selecione pelo menos uma conta para pagar"
- Arquivo muito grande: "Arquivo deve ter no máximo 5MB"
- Formato inválido: "Formato de arquivo não suportado"

---

## CONFIGURAÇÃO DO REACT QUERY

```typescript
// config/queryClient.ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      cacheTime: 10 * 60 * 1000, // 10 minutos
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
    },
    mutations: {
      retry: 0
    }
  }
})
```

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
GET /api/registrations/suppliers/dropdown/
GET /api/registrations/categories/dropdown/
GET /api/registrations/payment-methods/dropdown/
```

### Mutações (POST)
```
POST /api/payables/payable-payments/
Content-Type: multipart/form-data

FormData {
  account_payable: number
  payment_date: string (YYYY-MM-DD)
  amount_paid: number
  interest: number
  fine: number
  bank_account: number
  payment_method: number
  attachment: File | null
  notes: string
}
```

---

## CHECKLIST DE IMPLEMENTAÇÃO

### Setup
- [ ] Criar tipos TypeScript
- [ ] Criar utilitários de formatação
- [ ] Instalar componentes shadcn/ui
- [ ] Configurar React Query

### Listagem
- [ ] Implementar hook usePayables
- [ ] Criar componente de abas
- [ ] Criar tabela com colunas
- [ ] Implementar skeleton loader
- [ ] Implementar paginação
- [ ] Adicionar estados de erro/vazio

### Seleção
- [ ] Implementar seleção múltipla
- [ ] Criar barra de seleção
- [ ] Calcular total selecionado
- [ ] Adicionar visual de seleção

### Pagamento Individual
- [ ] Criar hooks de dropdowns
- [ ] Criar hook usePayment
- [ ] Criar dialog de pagamento
- [ ] Implementar formulário
- [ ] Adicionar validações
- [ ] Implementar cálculo automático
- [ ] Integrar upload de arquivo
- [ ] Testar fluxo completo

### Pagamento em Lote
- [ ] Criar hook useBatchPayment
- [ ] Criar dialog de lote
- [ ] Implementar lista de contas
- [ ] Calcular total com juros/multa
- [ ] Implementar processamento
- [ ] Adicionar feedback de progresso
- [ ] Testar fluxo completo

### Refinamentos
- [ ] Ajustar estilos
- [ ] Adicionar loading states
- [ ] Implementar error handling
- [ ] Otimizar performance
- [ ] Testes de integração

---

## OBSERVAÇÕES FINAIS

1. **Não há pagamento parcial** - sempre marca conta como totalmente paga
2. **Comprovante é opcional** - não bloquear pagamento por falta dele
3. **Usuário pode editar valor final** - não forçar cálculo automático
4. **Conta bancária não precisa ser da mesma filial** - sem validação cruzada
5. **Foco apenas web desktop** - não precisa ser responsivo para mobile
6. **Sincronização via invalidação de cache** - não usar polling ou websocket
7. **Processamento sequencial em lote** - evitar sobrecarga no servidor
8. **Feedback claro de erros** - especialmente em operações em lote

---

**PRONTO PARA IMPLEMENTAÇÃO! 🚀**

Este documento contém todas as especificações necessárias para implementar o sistema completo de contas a pagar. Siga a ordem recomendada de implementação e valide cada fase antes de avançar para a próxima.