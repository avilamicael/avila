# Atualização do Sistema de Importação de Contas a Pagar

## 📋 Resumo das Alterações

O sistema de importação de contas a pagar via Excel foi atualizado para:

1. **Suportar multi-tenancy** - Agora requer e utiliza o `tenant_id` do usuário logado
2. **Separar dados em colunas distintas** - Nome e CNPJ agora são campos separados
3. **Validação de CNPJ** - CNPJs são validados e utilizados como identificadores únicos
4. **Criação automática inteligente** - Cadastros são criados automaticamente quando necessário

---

## 🔄 Mudanças na Estrutura da Planilha

### Antes (formato antigo):
```
| Filial (Nome ou CNPJ) | Fornecedor (Nome ou CNPJ) | ... |
```

### Agora (novo formato):
```
| Nome da Filial | CNPJ da Filial | Nome do Fornecedor | CNPJ do Fornecedor | ... |
```

---

## 📊 Estrutura Completa da Nova Planilha

| Coluna | Nome | Tipo | Obrigatório | Formato |
|--------|------|------|-------------|---------|
| A | Nome da Filial | Texto | ✅ Sim | Texto livre |
| B | CNPJ da Filial | Número | ✅ Sim | 14 dígitos numéricos |
| C | Nome do Fornecedor | Texto | ✅ Sim | Texto livre |
| D | CNPJ do Fornecedor | Número | ✅ Sim | 14 dígitos numéricos |
| E | Categoria | Texto | ✅ Sim | Nome da categoria |
| F | Método Pagamento | Texto | ✅ Sim | Nome do método |
| G | Descrição | Texto | ✅ Sim | Texto livre |
| H | Valor Original | Decimal | ✅ Sim | 1234.56 |
| I | Desconto | Decimal | ❌ Não | 0 ou vazio |
| J | Juros | Decimal | ❌ Não | 0 ou vazio |
| K | Multa | Decimal | ❌ Não | 0 ou vazio |
| L | Data Emissão | Data | ❌ Não | DD/MM/AAAA |
| M | Data Vencimento | Data | ✅ Sim | DD/MM/AAAA |
| N | Nº Nota Fiscal | Texto | ❌ Não | Texto livre |
| O | Nº Boleto | Texto | ❌ Não | Texto livre |
| P | Observações | Texto | ❌ Não | Texto livre |
| Q | É Recorrente? | Texto | ❌ Não | SIM/NAO |
| R | Frequência Recorrência | Texto | ❌ Não | weekly, monthly, etc. |

---

## 🔍 Lógica de Importação

### 1. Validação de CNPJ
- CNPJs devem ter **exatamente 14 dígitos numéricos**
- Caracteres especiais são removidos automaticamente (pontos, traços, barras)
- Validação é feita antes de processar cada linha

### 2. Busca e Criação de Filiais

```python
# CNPJ é o identificador único por tenant
1. Busca por: tenant + CNPJ
2. Se encontrar:
   - Se nome diferente: mantém o nome cadastrado e avisa
   - Retorna a filial existente
3. Se não encontrar:
   - Cria nova filial com nome + CNPJ informados
   - Adiciona ao resumo de criações
```

### 3. Busca e Criação de Fornecedores

```python
# CNPJ é o identificador único por tenant
1. Busca por: tenant + CNPJ
2. Se encontrar:
   - Se nome diferente: mantém o nome cadastrado e avisa
   - Retorna o fornecedor existente
3. Se não encontrar:
   - Cria novo fornecedor com nome + CNPJ informados
   - Adiciona ao resumo de criações
```

### 4. Busca e Criação de Categorias/Métodos

```python
# Nome é usado para busca (case-insensitive)
1. Busca por: tenant + nome (case-insensitive)
2. Se não encontrar:
   - Cria novo registro automaticamente
```

---

## 🎯 Exemplos de Uso

### Exemplo 1: Importando com CNPJs existentes

**Planilha:**
```
| Matriz | 12345678000190 | Fornecedor XYZ | 98765432000100 | Serviços | ... |
```

**Resultado:**
- ✅ Busca Filial com CNPJ 12345678000190
- ✅ Busca Fornecedor com CNPJ 98765432000100
- ✅ Se encontrar ambos, usa os cadastros existentes
- ✅ Cria a conta a pagar vinculada

### Exemplo 2: CNPJ existe mas nome diferente

**Cadastro no sistema:**
```
Filial: "EMPRESA ABC LTDA" - CNPJ: 12345678000190
```

**Planilha:**
```
| EMPRESA ABC | 12345678000190 | ... |
```

**Resultado:**
- ⚠️ Aviso: "Filial com CNPJ 12345678000190 já existe como 'EMPRESA ABC LTDA'. Nome informado 'EMPRESA ABC' foi ignorado."
- ✅ Usa a filial existente "EMPRESA ABC LTDA"

### Exemplo 3: Criando novos cadastros

**Planilha:**
```
| Nova Filial | 11111111000100 | Novo Fornecedor | 22222222000100 | ... |
```

**Resultado:**
- ✅ Cria Filial: "Nova Filial" (CNPJ: 11111111000100)
- ✅ Cria Fornecedor: "Novo Fornecedor" (CNPJ: 22222222000100)
- ✅ Cria a conta a pagar
- ℹ️ Info: "Filial 'Nova Filial (11111111000100)' criada automaticamente"

---

## 🛡️ Segurança Multi-Tenant

### Isolamento por Tenant
- Todos os registros são criados/buscados **apenas no tenant do usuário logado**
- Impossível acessar ou criar registros de outros tenants
- Validação automática: se usuário não tiver tenant, importação é rejeitada

### Fluxo de Segurança
```python
1. Usuário faz login → tenant atribuído
2. Upload do Excel → valida tenant do usuário
3. Importação → todos os registros vinculados ao tenant
4. Busca/Criação → sempre filtrada por tenant
```

---

## ⚠️ Tratamento de Erros

### Erros que impedem a importação da linha:
- ❌ CNPJ com quantidade diferente de 14 dígitos
- ❌ Campos obrigatórios vazios
- ❌ Datas em formato inválido
- ❌ Valores decimais inválidos

### Avisos (não impedem importação):
- ⚠️ Nome diferente do cadastrado (mantém o existente)
- ⚠️ Novos cadastros criados automaticamente

### Mensagens ao Usuário:
```python
# Sucesso
"5 contas importadas com sucesso!"

# Avisos
"Filial 'Matriz (12345678000190)' criada automaticamente"
"Fornecedor com CNPJ 98765432000100 já existe como 'XYZ LTDA'..."

# Erros
"Linha 5: CNPJ inválido: 123456. Deve conter exatamente 14 dígitos numéricos."
"Linha 10: Campos obrigatórios faltando"

# Resumo
"Filiais criadas: Matriz (12345678000190), Filial Centro (11223344000155)"
```

---

## 📝 Código Atualizado

### Arquivos Modificados:

1. **`backend/payables/excel_import.py`**
   - ✅ Cabeçalhos atualizados (4 colunas novas)
   - ✅ Função `import_excel()` recebe `tenant`
   - ✅ Funções `get_or_create_*()` recebem `tenant` e validam CNPJs
   - ✅ Validação de CNPJ com 14 dígitos
   - ✅ Lógica de busca por CNPJ único

2. **`backend/payables/admin.py`**
   - ✅ View `importar_excel_view()` obtém tenant do usuário
   - ✅ Validação: usuário deve ter tenant associado
   - ✅ Passa tenant para função de importação

---

## 🚀 Como Usar

### 1. Baixar Modelo
1. Acesse o Admin Django
2. Vá em "Contas a Pagar"
3. Clique em "Exportar Modelo Excel"
4. Salve o arquivo `.xlsx`

### 2. Preencher Planilha
1. Abra o arquivo baixado
2. Leia as instruções na aba "Instruções"
3. Remova as linhas de exemplo
4. Preencha com seus dados
5. **Atenção:** CNPJs devem ter 14 dígitos numéricos

### 3. Importar
1. Volte ao Admin Django
2. Clique em "Importar Excel"
3. Selecione o arquivo preenchido
4. Clique em "Enviar"
5. Aguarde o processamento
6. Confira as mensagens de sucesso/erro/aviso

---

## 🔧 Manutenção

### Para adicionar novos campos:
1. Atualize `headers` em `export_template_excel()`
2. Atualize `column_widths` (adicione a largura da coluna)
3. Atualize `exemplos` (adicione valores de exemplo)
4. Atualize `instrucoes` (documente o novo campo)
5. Atualize extração em `import_excel()` (row[X])
6. Atualize criação do `AccountPayable.objects.create()`

### Para modificar validações:
- Edite as funções `get_or_create_*()` conforme necessário
- Adicione novas validações antes do bloco `try` principal

---

## ✅ Checklist de Teste

- [ ] Baixar modelo Excel
- [ ] Importar com CNPJs existentes
- [ ] Importar com CNPJs novos (criação automática)
- [ ] Importar com CNPJ existente mas nome diferente
- [ ] Testar CNPJ inválido (< 14 dígitos)
- [ ] Testar CNPJ inválido (> 14 dígitos)
- [ ] Testar campos obrigatórios vazios
- [ ] Verificar isolamento por tenant
- [ ] Verificar mensagens de erro/aviso
- [ ] Verificar resumo de criações

---

## 📞 Suporte

Em caso de dúvidas ou problemas:
1. Verifique a aba "Instruções" na planilha modelo
2. Confira os logs de erro no Admin
3. Revise este documento
4. Entre em contato com o desenvolvedor
