# Explicação de Managers - Django

## O que são Managers?

Managers são a **interface entre seus models e o banco de dados**. Eles controlam como você faz queries (buscas).

---

## 1. UserManager (`accounts/managers.py`)

**Propósito:** Criar usuários com validações corretas

```python
# ❌ ERRADO - senha não será hasheada
user = User(email='test@email.com', password='123456')
user.save()

# ✅ CORRETO - usa o manager
user = User.objects.create_user(
    email='test@email.com',
    password='123456',  # Será hasheada automaticamente
    first_name='João',
    last_name='Silva'
)
```

**Uso prático:**
```python
# Na sua view de registro:
from accounts.models import User

# Criar usuário normal
user = User.objects.create_user(
    email=request.data['email'],
    password=request.data['password'],
    first_name=request.data['first_name'],
    tenant=some_tenant
)

# Criar superuser (admin)
admin = User.objects.create_superuser(
    email='admin@empresa.com',
    password='senha123',
    first_name='Admin'
)
```

---

## 2. SoftDeleteManager (`core/managers.py`)

**Propósito:** Soft Delete = não apagar fisicamente do banco

### Como funciona:

```python
# Seu model User tem 2 managers:
class User(BaseModel):
    objects = UserManager()         # ← Retorna só ATIVOS
    all_objects = SoftDeleteManager()  # ← Retorna TODOS

    def delete(self):
        """Não deleta de verdade, só marca como inativo"""
        self.is_active = False
        self.deleted_at = timezone.now()
        self.save()
```

### Uso prático:

```python
# Criar usuário
user = User.objects.create_user(email='test@email.com', password='123')

# ===== BUSCAR USUÁRIOS =====
User.objects.all()
# → Retorna: [user1, user2, user3] (só ativos)

User.all_objects.all()
# → Retorna: [user1, user2, user3, user_deletado1, user_deletado2] (todos)

User.all_objects.deleted()
# → Retorna: [user_deletado1, user_deletado2] (só deletados)

# ===== "DELETAR" USUÁRIO =====
user.delete()  # Soft delete - marca is_active=False

User.objects.all()
# → Agora não retorna mais este user (está "deletado")

User.all_objects.all()
# → Ainda retorna (está no banco)

# ===== DELETAR DE VERDADE =====
user.hard_delete()  # Apaga fisicamente do banco (raramente usado)
```

### Por que usar Soft Delete?

✅ **Auditoria**: Ver quem foi deletado e quando
✅ **Recuperar dados**: Cliente pede pra restaurar usuário
✅ **Compliance/LGPD**: Histórico de ações
✅ **Relatórios**: Contar usuários deletados no mês

---

## 3. TenantAwareManager (`core/managers.py`)

**Propósito:** Filtrar automaticamente por empresa (tenant)

```python
class TenantAwareManager(models.Manager):
    def get_queryset(self):
        tenant = get_current_tenant()  # Pega do middleware
        if tenant:
            return super().get_queryset().filter(tenant=tenant)
        return super().get_queryset()
```

### Exemplo prático:

```python
# Imagine você tem um model Projeto:
class Projeto(TenantAwareModel):
    nome = models.CharField(max_length=100)
    tenant = models.ForeignKey(Tenant, ...)

    objects = TenantAwareManager()

# Quando um usuário da Empresa A faz login:
# O middleware define: request.tenant = empresa_a

# Na view:
projetos = Projeto.objects.all()
# ← Automaticamente filtra só projetos da empresa_a!
# Equivalente a: Projeto.objects.filter(tenant=empresa_a)
```

**Vantagem:** Você nunca esquece de filtrar por tenant, evitando vazamento de dados entre empresas!

---

## Resumo Rápido

| Manager | Uso | Retorna |
|---------|-----|---------|
| `objects` (UserManager) | Criar usuários | Usuários ativos |
| `all_objects` (SoftDeleteManager) | Ver todos | Ativos + deletados |
| TenantAwareManager | Queries automáticas | Só do tenant atual |

---

## Quando NÃO precisa de custom manager?

Se você não tem soft delete ou multi-tenancy, use o manager padrão do Django:

```python
class Produto(models.Model):
    nome = models.CharField(max_length=100)
    # Não precisa definir 'objects', Django cria automaticamente
```

---

## Para o seu MVP:

Você **já tem implementado** e **precisa deles**:
- ✅ UserManager: Criar usuários com senha hasheada
- ✅ SoftDeleteManager: Não perder dados ao "deletar"
- ⚠️ TenantAwareManager: Útil mas você não está usando ainda

Mantenha os 2 primeiros, são essenciais!
