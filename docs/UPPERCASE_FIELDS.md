# Sistema de Uppercase Automático

## 📋 Como Funciona

O sistema usa um **UppercaseMixin** que converte automaticamente campos especificados para UPPERCASE ao salvar no banco de dados.

---

## 🎯 Campos que são Uppercase

### **Tenant (Empresa)**
- ✅ `name` - Nome da Empresa
- ✅ `address` - Endereço
- ✅ `city` - Cidade
- ✅ `state` - Estado
- ❌ `email` - mantém formato original
- ❌ `slug` - mantém lowercase
- ❌ `phone` - mantém formato original
- ❌ `cnpj` - mantém formato original
- ❌ `zip_code` - mantém formato original

### **User (Usuário)**
- ✅ `first_name` - Nome
- ✅ `last_name` - Sobrenome
- ✅ `position` - Cargo
- ❌ `email` - **sempre lowercase** (email@example.com)
- ❌ `phone` - mantém formato original

---

## 💻 Exemplos de Uso

### Salvando um Tenant

```python
# Você envia:
tenant = Tenant.objects.create(
    name='empresa abc',          # lowercase
    slug='empresa-abc',
    email='contato@empresa.com',
    city='são paulo',            # lowercase
    state='sp'                   # lowercase
)

# É salvo no banco:
tenant.name    # → 'EMPRESA ABC'
tenant.city    # → 'SÃO PAULO'
tenant.state   # → 'SP'
tenant.email   # → 'contato@empresa.com' (mantém original)
tenant.slug    # → 'empresa-abc' (mantém original)
```

### Salvando um User

```python
# Você envia:
user = User.objects.create_user(
    email='JoAo@ExEmPlO.CoM',    # mixed case
    password='senha123',
    first_name='joão silva',     # lowercase
    last_name='santos',          # lowercase
    position='gerente de ti'     # lowercase
)

# É salvo no banco:
user.email        # → 'joao@exemplo.com' (forçado lowercase)
user.first_name   # → 'JOÃO SILVA'
user.last_name    # → 'SANTOS'
user.position     # → 'GERENTE DE TI'
```

### Na API (JSON)

```json
// Request (POST /api/tenants/register/)
{
  "company_name": "minha empresa ltda",
  "company_slug": "minha-empresa",
  "city": "rio de janeiro",
  "state": "rj"
}

// Salvo no banco como:
{
  "name": "MINHA EMPRESA LTDA",
  "slug": "minha-empresa",
  "city": "RIO DE JANEIRO",
  "state": "RJ"
}

// Response (retorna como está no banco)
{
  "name": "MINHA EMPRESA LTDA",
  "city": "RIO DE JANEIRO",
  "state": "RJ"
}
```

---

## 🔧 Como Adicionar Uppercase em Novos Models

### 1. Importar o UppercaseMixin

```python
from core.models import BaseModel, UppercaseMixin

class Produto(UppercaseMixin, BaseModel):  # ← Adicionar UppercaseMixin
    """Seu model"""

    # Definir quais campos serão uppercase
    uppercase_fields = ['nome', 'descricao', 'categoria']

    nome = models.CharField(max_length=100)
    descricao = models.TextField()
    categoria = models.CharField(max_length=50)
    preco = models.DecimalField(max_digits=10, decimal_places=2)
```

### 2. Resultado

```python
produto = Produto.objects.create(
    nome='notebook dell',
    descricao='notebook gamer',
    categoria='informatica',
    preco=3500.00
)

# Salvo como:
produto.nome       # → 'NOTEBOOK DELL'
produto.descricao  # → 'NOTEBOOK GAMER'
produto.categoria  # → 'INFORMATICA'
produto.preco      # → 3500.00 (número não é afetado)
```

---

## ⚠️ Campos que NÃO devem ser Uppercase

### ❌ Nunca use uppercase em:

1. **Emails** - sempre lowercase
   ```python
   # ❌ ERRADO
   uppercase_fields = ['email']  # Email quebra se for uppercase

   # ✅ CORRETO - email tem tratamento especial no User model
   ```

2. **Slugs** - sempre lowercase
   ```python
   # ❌ ERRADO
   uppercase_fields = ['slug']  # URLs não funcionam bem com uppercase

   # ✅ CORRETO - não incluir slug na lista
   ```

3. **URLs** - sempre lowercase
   ```python
   # ❌ ERRADO
   uppercase_fields = ['website']

   # ✅ CORRETO - não incluir URLs
   ```

4. **Senhas** - nunca modificar
   ```python
   # ❌ NUNCA FAÇA ISSO
   uppercase_fields = ['password']  # Quebra autenticação!
   ```

5. **Campos numéricos/datas** - ignorados automaticamente
   ```python
   # Não precisa se preocupar, o mixin só processa strings
   uppercase_fields = ['preco', 'created_at']  # Ignorados automaticamente
   ```

---

## 🔍 Como o Mixin Funciona Internamente

```python
class UppercaseMixin:
    uppercase_fields = []

    def save(self, *args, **kwargs):
        # Para cada campo na lista
        for field_name in self.uppercase_fields:
            # Pega o valor atual
            value = getattr(self, field_name, None)

            # Só processa se for string
            if value and isinstance(value, str):
                # Converte para uppercase
                setattr(self, field_name, value.upper())

        # Chama o save original
        super().save(*args, **kwargs)
```

---

## 📊 Vantagens

✅ **Padronização**: Todos os nomes ficam consistentes
✅ **Busca**: Facilita queries (não precisa `icontains`)
✅ **Visual**: Interface mais profissional
✅ **Automático**: Não precisa lembrar de fazer `.upper()` toda vez

---

## 🎨 Exibição no Frontend

Se você quiser exibir em Title Case no frontend (mas manter UPPERCASE no banco):

```javascript
// No React/Vue/Angular
function toTitleCase(str) {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Backend retorna:
user.first_name  // "JOÃO SILVA"

// Frontend exibe:
toTitleCase(user.first_name)  // "João Silva"
```

Mas **recomendo manter UPPERCASE** no frontend também por consistência!

---

## 🔄 Migrações

Como só mudamos o método `save()` e não a estrutura do banco, **não precisa de migração**.

Os dados antigos continuam como estão. Novos dados serão salvos em uppercase.

Se quiser converter dados existentes:

```python
# Script para converter dados antigos
from tenants.models import Tenant

for tenant in Tenant.objects.all():
    tenant.save()  # Vai aplicar o uppercase e salvar
```

---

## 🚀 Pronto para Usar!

Agora todo dado será salvo automaticamente em uppercase nos campos especificados.

**Nada muda na sua API** - você pode continuar enviando lowercase, o sistema converte automaticamente!
