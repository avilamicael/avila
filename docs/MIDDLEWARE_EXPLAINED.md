# Explicação do Middleware e TenantAwareModel

## O que é Middleware?

**Middleware é um "filtro" que processa TODA requisição antes de chegar na sua view.**

```
Cliente → Request → Middleware → View → Response → Middleware → Cliente
```

---

## Como funciona o TenantMiddleware?

Localização: `backend/core/middleware.py`

### Fluxo:

```python
# 1. Usuário faz request
GET /api/projetos/
Headers: { "X-Tenant-ID": "empresa-a" }

# 2. Middleware intercepta ANTES da view
def __call__(self, request):
    # Pega o slug do tenant do header
    tenant_slug = request.headers.get('X-Tenant-ID')

    # Busca a empresa no banco
    tenant = Tenant.objects.get(slug=tenant_slug)

    # INJETA no request
    request.tenant = tenant  # ← Agora toda view tem acesso!

# 3. View recebe o request já com tenant
def list_projetos(request):
    print(request.tenant)  # ← Objeto Tenant disponível!
    projetos = Projeto.objects.filter(tenant=request.tenant)
    return projetos
```

---

## Exemplo Real - Fluxo Completo

### Cenário: Sistema com 2 empresas

```
Empresa A (slug: "empresa-a")
- user1@empresaa.com
- Projeto: "Site novo"

Empresa B (slug: "empresa-b")
- user2@empresab.com
- Projeto: "App mobile"
```

### Requisição 1: Usuário da Empresa A

```http
POST /api/auth/login/
{
  "email": "user1@empresaa.com",
  "password": "senha123"
}

↓ Middleware verifica usuário autenticado
↓ request.tenant = Tenant(slug="empresa-a")

Resposta:
{
  "access": "token...",
  "user": { "tenant_slug": "empresa-a" }
}
```

### Requisição 2: Buscar projetos

```http
GET /api/projetos/
Headers: {
  "Authorization": "Bearer token...",
  "X-Tenant-ID": "empresa-a"  ← Middleware lê isso
}

↓ Middleware:
   - Pega "empresa-a" do header
   - Busca no banco: Tenant.objects.get(slug="empresa-a")
   - Injeta: request.tenant = <Tenant: Empresa A>

↓ View (sua API):
   projetos = Projeto.objects.filter(tenant=request.tenant)
   # ← Retorna só "Site novo", não retorna "App mobile"

Resposta:
[
  { "nome": "Site novo" }
]
```

**Resultado:** Usuário da Empresa A **NUNCA** vê dados da Empresa B!

---

## Por que usar Middleware?

### ❌ Sem Middleware (ruim):

```python
# Em TODA view você precisa lembrar de filtrar:
def list_projetos(request):
    tenant = request.user.tenant  # Repetitivo
    projetos = Projeto.objects.filter(tenant=tenant)  # Repetitivo
    ...

def list_clientes(request):
    tenant = request.user.tenant  # Repetitivo de novo!
    clientes = Cliente.objects.filter(tenant=tenant)  # Repetitivo
    ...

# Se você esquecer UMA VEZ = vazamento de dados entre empresas!
```

### ✅ Com Middleware (bom):

```python
# Middleware faz automaticamente pra TODAS as views:
def list_projetos(request):
    # request.tenant já está disponível!
    projetos = Projeto.objects.filter(tenant=request.tenant)
    ...

def list_clientes(request):
    # request.tenant já está disponível!
    clientes = Cliente.objects.filter(tenant=request.tenant)
    ...
```

---

## Como o Frontend usa?

### Opção 1: Header X-Tenant-ID

```javascript
// React/Vue/Angular
const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Authorization': `Bearer ${token}`,
    'X-Tenant-ID': 'empresa-a'  // ← Middleware lê isso
  }
});

api.get('/projetos/');  // Retorna só projetos da empresa-a
```

### Opção 2: Do próprio usuário (atual)

```python
# Middleware já faz isso:
elif hasattr(request, 'user') and request.user.is_authenticated:
    tenant = request.user.tenant  # Pega do JWT
```

```javascript
// Frontend só precisa enviar o token
const api = axios.create({
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Middleware automaticamente pega tenant do user.tenant
```

---

## TenantAwareModel - O que é?

Localização: `backend/core/models.py`

```python
class TenantAwareModel(BaseModel):
    """Model base para modelos multi-tenant"""
    tenant = models.ForeignKey('tenants.Tenant', ...)

    class Meta:
        abstract = True
```

### Para que serve?

**É uma classe base para models que pertencem a um tenant.**

### Exemplo:

```python
# ❌ Sem TenantAwareModel (repetitivo):
class Projeto(models.Model):
    nome = models.CharField(max_length=100)
    tenant = models.ForeignKey(Tenant, ...)  # Repetir em todo model
    created_at = models.DateTimeField(auto_now_add=True)  # Repetir
    updated_at = models.DateTimeField(auto_now=True)  # Repetir

class Cliente(models.Model):
    nome = models.CharField(max_length=100)
    tenant = models.ForeignKey(Tenant, ...)  # Repetir de novo!
    created_at = models.DateTimeField(auto_now_add=True)  # Repetir
    updated_at = models.DateTimeField(auto_now=True)  # Repetir


# ✅ Com TenantAwareModel (DRY - Don't Repeat Yourself):
class Projeto(TenantAwareModel):
    nome = models.CharField(max_length=100)
    # tenant, created_at, updated_at já estão incluídos!

class Cliente(TenantAwareModel):
    nome = models.CharField(max_length=100)
    # tenant, created_at, updated_at já estão incluídos!
```

---

## Resumo Visual

```
┌─────────────┐
│  Frontend   │
│  (React)    │
└──────┬──────┘
       │ GET /api/projetos/
       │ Header: X-Tenant-ID: empresa-a
       ▼
┌─────────────────┐
│  Middleware     │
│  1. Lê header   │
│  2. Busca tenant│
│  3. Injeta no   │
│     request     │
└──────┬──────────┘
       │ request.tenant = <Empresa A>
       ▼
┌─────────────────┐
│  View (API)     │
│  Filtra por     │
│  request.tenant │
└──────┬──────────┘
       │ JSON response
       ▼
┌─────────────┐
│  Frontend   │
│  Recebe só  │
│  dados da   │
│  Empresa A  │
└─────────────┘
```

---

## Para o seu MVP:

**Você PRECISA do Middleware!** Sem ele:
- ❌ Dados de uma empresa vazam pra outra
- ❌ Você precisa repetir filtros em toda view
- ❌ Risco de segurança ALTO

**Você pode NÃO usar TenantAwareModel:**
- Se você tem poucos models
- Se você não se importa em repetir `tenant = ForeignKey(...)`

Mas é recomendado usar para manter código limpo (DRY).
