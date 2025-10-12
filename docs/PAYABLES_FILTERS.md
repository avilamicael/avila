# 🔍 Filtros Avançados - Contas a Pagar

Documentação completa de todos os filtros disponíveis para a API de Contas a Pagar.

---

## 📋 **ENDPOINT BASE**
```
GET /api/payables/accounts-payable/
```

---

## 🎯 **FILTROS DISPONÍVEIS**

### **1. Filtros por Relacionamentos**

#### **Filial**
```bash
# Por ID único
?branch=1

# Por múltiplos IDs
?branch__in=1,2,3
```

#### **Fornecedor**
```bash
# Por ID único
?supplier=5

# Por múltiplos IDs
?supplier__in=5,10,15
```

#### **Categoria**
```bash
# Por ID único
?category=3

# Por múltiplos IDs
?category__in=3,7,12
```

#### **Forma de Pagamento**
```bash
# Por ID único
?payment_method=2

# Por múltiplos IDs
?payment_method__in=2,4,6
```

---

### **2. Filtros de Status**

```bash
# Status específico
?status=paid
?status=overdue
?status=pending
?status=due
?status=partially_paid
?status=cancelled

# Múltiplos status
?status__in=pending,due,overdue
```

**Valores possíveis:**
- `pending` - Pendente
- `due` - À Vencer
- `overdue` - Vencida
- `paid` - Paga
- `partially_paid` - Paga Parcialmente
- `cancelled` - Cancelada

---

### **3. Filtros de Data de Vencimento**

```bash
# Data exata
?due_date=2025-01-15

# Maior ou igual (a partir de)
?due_date__gte=2025-01-01

# Menor ou igual (até)
?due_date__lte=2025-12-31

# Período completo
?due_date__gte=2025-01-01&due_date__lte=2025-12-31

# Por ano
?due_date__year=2025

# Por mês
?due_date__month=1
?due_date__year=2025&due_date__month=1  # Janeiro de 2025
```

---

### **4. Filtros de Data de Pagamento**

```bash
# Data exata
?payment_date=2025-01-10

# Maior ou igual
?payment_date__gte=2025-01-01

# Menor ou igual
?payment_date__lte=2025-12-31

# Período
?payment_date__gte=2025-01-01&payment_date__lte=2025-01-31

# Sem data de pagamento (não pagas)
?payment_date__isnull=true

# Com data de pagamento (pagas)
?payment_date__isnull=false
```

---

### **5. Filtros de Data de Emissão**

```bash
# Data exata
?issue_date=2025-01-01

# Maior ou igual
?issue_date__gte=2025-01-01

# Menor ou igual
?issue_date__lte=2025-12-31

# Período
?issue_date__gte=2025-01-01&issue_date__lte=2025-01-31
```

---

### **6. Filtros de Valor**

```bash
# Valor original exato
?original_amount=3000.00

# Valor mínimo
?original_amount__gte=1000.00

# Valor máximo
?original_amount__lte=5000.00

# Range de valores
?original_amount__gte=1000.00&original_amount__lte=5000.00

# Valor pago mínimo
?paid_amount__gte=500.00

# Valor pago máximo
?paid_amount__lte=3000.00
```

---

### **7. Filtros de Recorrência**

```bash
# Apenas contas recorrentes
?is_recurring=true

# Apenas contas não recorrentes
?is_recurring=false

# Por frequência
?recurrence_frequency=monthly
?recurrence_frequency=weekly
```

**Frequências disponíveis:**
- `weekly` - Semanal
- `biweekly` - Quinzenal
- `monthly` - Mensal
- `bimonthly` - Bimestral
- `quarterly` - Trimestral
- `semiannual` - Semestral
- `annual` - Anual

---

### **8. Filtros por Campos de Texto**

```bash
# Descrição (exata)
?description=Aluguel mensal

# Descrição (contém)
?description__icontains=aluguel

# Notas fiscais
?invoice_numbers=123
?invoice_numbers__icontains=123

# Número do boleto
?bank_slip_number=789012345
?bank_slip_number__icontains=7890

# Observações
?notes__icontains=urgente
```

---

### **9. Filtros Especiais**

#### **Contas Vencidas**
```bash
# Retorna apenas contas vencidas
?is_overdue=true
```

#### **Contas que Vencem em X Dias**
```bash
# Contas que vencem nos próximos 7 dias
?due_in_days=7

# Contas que vencem nos próximos 30 dias
?due_in_days=30
```

---

### **10. Busca Global** 🔥

**Busca em múltiplos campos simultaneamente:**
- Descrição
- Nome do fornecedor
- Nome da categoria
- Nome da filial
- Números de nota fiscal
- Número do boleto
- Observações

```bash
# Busca por "aluguel" em todos os campos
?search=aluguel

# Busca por CNPJ do fornecedor
?search=12345678000190

# Busca por qualquer termo
?search=janeiro
```

**Exemplo prático:**
```bash
GET /api/payables/accounts-payable/?search=fornecedor%20xyz
```
Retorna todas as contas que contenham "fornecedor xyz" em qualquer um dos campos de busca.

---

## 📊 **ORDENAÇÃO**

```bash
# Por data de vencimento (decrescente)
?ordering=-due_date

# Por data de vencimento (crescente)
?ordering=due_date

# Por valor original
?ordering=-original_amount
?ordering=original_amount

# Por data de criação
?ordering=-created_at
?ordering=created_at

# Por data de pagamento
?ordering=-payment_date
?ordering=payment_date

# Por valor pago
?ordering=-paid_amount
?ordering=paid_amount

# Ordenação múltipla
?ordering=-due_date,original_amount
```

---

## 🎨 **EXEMPLOS PRÁTICOS**

### **Exemplo 1: Contas Vencidas de um Fornecedor**
```bash
GET /api/payables/accounts-payable/?supplier=5&is_overdue=true
```

### **Exemplo 2: Contas a Vencer nos Próximos 7 Dias**
```bash
GET /api/payables/accounts-payable/?due_in_days=7&status__in=pending,due
```

### **Exemplo 3: Contas Pagas em Janeiro de 2025**
```bash
GET /api/payables/accounts-payable/?status=paid&payment_date__gte=2025-01-01&payment_date__lte=2025-01-31
```

### **Exemplo 4: Contas de uma Categoria com Valor Acima de R$ 1000**
```bash
GET /api/payables/accounts-payable/?category=3&original_amount__gte=1000.00
```

### **Exemplo 5: Buscar por "Aluguel" em Qualquer Campo**
```bash
GET /api/payables/accounts-payable/?search=aluguel
```

### **Exemplo 6: Dashboard - Contas Pendentes por Filial**
```bash
GET /api/payables/accounts-payable/?branch=1&status__in=pending,due,overdue&ordering=-due_date
```

### **Exemplo 7: Relatório Mensal**
```bash
GET /api/payables/accounts-payable/?due_date__year=2025&due_date__month=1&ordering=due_date
```

### **Exemplo 8: Contas Recorrentes Mensais**
```bash
GET /api/payables/accounts-payable/?is_recurring=true&recurrence_frequency=monthly
```

### **Exemplo 9: Contas não Pagas de Múltiplos Fornecedores**
```bash
GET /api/payables/accounts-payable/?supplier__in=1,3,5&payment_date__isnull=true
```

### **Exemplo 10: Filtro Complexo Combinado**
```bash
GET /api/payables/accounts-payable/
  ?branch=1
  &category__in=2,5,8
  &due_date__gte=2025-01-01
  &due_date__lte=2025-12-31
  &original_amount__gte=500.00
  &status__in=pending,due
  &ordering=-due_date
```

---

## 🔄 **PAGINAÇÃO**

A API suporta paginação automática:

```bash
# Página 1 (padrão: 20 itens)
GET /api/payables/accounts-payable/

# Página específica
GET /api/payables/accounts-payable/?page=2

# Tamanho da página customizado (se configurado)
GET /api/payables/accounts-payable/?page_size=50
```

**Resposta paginada:**
```json
{
  "count": 150,
  "next": "http://api.example.com/api/payables/accounts-payable/?page=2",
  "previous": null,
  "results": [...]
}
```

---

## 📱 **EXEMPLO DE USO NO FRONTEND**

### **React/TypeScript**
```typescript
// Exemplo de função de busca com filtros
const fetchAccountsPayable = async (filters: {
  search?: string;
  branch?: number;
  supplier?: number;
  status?: string[];
  due_date_gte?: string;
  due_date_lte?: string;
  ordering?: string;
}) => {
  const params = new URLSearchParams();

  if (filters.search) params.append('search', filters.search);
  if (filters.branch) params.append('branch', filters.branch.toString());
  if (filters.supplier) params.append('supplier', filters.supplier.toString());
  if (filters.status?.length) params.append('status__in', filters.status.join(','));
  if (filters.due_date_gte) params.append('due_date__gte', filters.due_date_gte);
  if (filters.due_date_lte) params.append('due_date__lte', filters.due_date_lte);
  if (filters.ordering) params.append('ordering', filters.ordering);

  const response = await fetch(
    `/api/payables/accounts-payable/?${params.toString()}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  return response.json();
};

// Uso
const data = await fetchAccountsPayable({
  search: 'aluguel',
  branch: 1,
  status: ['pending', 'due'],
  due_date_gte: '2025-01-01',
  due_date_lte: '2025-12-31',
  ordering: '-due_date'
});
```

---

## 🎯 **ENDPOINTS ADICIONAIS**

### **Dashboard com Estatísticas**
```bash
GET /api/payables/accounts-payable/dashboard/
```

Retorna:
- Total de contas pendentes
- Total de contas vencidas
- Valores em aberto
- Contas que vencem nos próximos 7 dias
- Top 5 fornecedores com mais contas pendentes

### **Apenas Contas Vencidas**
```bash
GET /api/payables/accounts-payable/overdue/
```

---

## ✅ **BOAS PRÁTICAS**

1. **Use filtros específicos** ao invés de busca global quando possível (melhor performance)
2. **Combine filtros** para resultados mais precisos
3. **Use paginação** para grandes volumes de dados
4. **Ordene os resultados** de forma consistente
5. **Cache** resultados quando apropriado no frontend

---

## 🚀 **Performance**

Os seguintes campos possuem **índices** no banco de dados para busca rápida:
- `tenant` + `branch` + `status`
- `tenant` + `branch` + `due_date`
- `tenant` + `branch` + `supplier`
- `tenant` + `status` + `due_date`

**Filtros mais rápidos:**
- Filtros por ID (branch, supplier, category, payment_method)
- Filtros por status
- Filtros por data com operadores gte/lte

---

Essa estrutura de filtros permite que você construa qualquer interface de listagem e busca no frontend de forma flexível e performática! 🎉
