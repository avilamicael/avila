# Recomendações MVP - Sistema Multi-Tenant Simplificado

## ✅ O que você JÁ TEM (e está bom!)

1. **User customizado** com email como login
2. **Soft Delete** - não perde dados
3. **Tenant** simplificado - só o essencial
4. **Middleware** - isola dados entre empresas
5. **JWT Authentication** - seguro e stateless
6. **CORS configurado** - frontend separado funciona

---

## 🎯 Checklist Final para MVP Funcionar

### 1. Criar as Migrações

```bash
cd backend
../venv/Scripts/python.exe manage.py makemigrations
../venv/Scripts/python.exe manage.py migrate
```

### 2. Criar Superusuário

```bash
../venv/Scripts/python.exe manage.py createsuperuser
```

### 3. Testar o Server

```bash
../venv/Scripts/python.exe manage.py runserver
```

Acesse: http://localhost:8000/ (deve retornar JSON com endpoints)

---

## 📦 Sugestões Simples para Melhorar (Opcional)

### 1. Adicionar Permissões Básicas (15 min)

Criar: `backend/core/permissions.py`

```python
from rest_framework import permissions

class IsTenantUser(permissions.BasePermission):
    """Só permite acesso a usuários do mesmo tenant"""

    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False

        # Se obj tem tenant, deve ser o mesmo do usuário
        if hasattr(obj, 'tenant'):
            return obj.tenant == request.user.tenant

        return True
```

**Usar nas views:**
```python
from core.permissions import IsTenantUser

class ProjetoViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsTenantUser]
    ...
```

---

### 2. Customizar Token JWT com Tenant (20 min)

Editar: `backend/accounts/serializers.py`

```python
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class CustomTokenSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Adiciona tenant no token
        if user.tenant:
            token['tenant_slug'] = user.tenant.slug
            token['tenant_name'] = user.tenant.name

        return token
```

Editar: `backend/accounts/views.py`

```python
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import CustomTokenSerializer

class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenSerializer
```

**Resultado:** Frontend recebe tenant_slug no token e envia no header automaticamente!

---

### 3. Admin do Django (10 min)

Registrar models no admin para gerenciar pelo navegador.

Editar: `backend/tenants/admin.py`

```python
from django.contrib import admin
from .models import Tenant

@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'email', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'slug', 'email']
    prepopulated_fields = {'slug': ('name',)}
```

Editar: `backend/accounts/admin.py`

```python
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['email', 'first_name', 'last_name', 'tenant', 'is_active']
    list_filter = ['tenant', 'is_active', 'is_staff']
    search_fields = ['email', 'first_name', 'last_name']

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Informações', {'fields': ('first_name', 'last_name', 'phone', 'position')}),
        ('Tenant', {'fields': ('tenant', 'is_tenant_admin')}),
        ('Permissões', {'fields': ('is_active', 'is_staff', 'is_superuser')}),
    )

    add_fieldsets = (
        (None, {
            'fields': ('email', 'password1', 'password2', 'first_name', 'last_name', 'tenant')
        }),
    )

    ordering = ['email']
```

Acesse: http://localhost:8000/admin/

---

### 4. Endpoint de Registro de Tenant (30 min)

Para novos clientes se cadastrarem sozinhos.

Criar: `backend/tenants/serializers.py`

```python
from rest_framework import serializers
from .models import Tenant
from accounts.models import User

class TenantRegisterSerializer(serializers.Serializer):
    # Dados da empresa
    company_name = serializers.CharField(max_length=200)
    company_slug = serializers.SlugField(max_length=100)
    company_email = serializers.EmailField()

    # Dados do admin
    admin_email = serializers.EmailField()
    admin_password = serializers.CharField(write_only=True, min_length=8)
    admin_first_name = serializers.CharField(max_length=150)
    admin_last_name = serializers.CharField(max_length=150)

    def validate_company_slug(self, value):
        if Tenant.objects.filter(slug=value).exists():
            raise serializers.ValidationError("Este identificador já está em uso")
        return value

    def validate_admin_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Este email já está cadastrado")
        return value

    def create(self, validated_data):
        # Cria o tenant
        tenant = Tenant.objects.create(
            name=validated_data['company_name'],
            slug=validated_data['company_slug'],
            email=validated_data['company_email']
        )

        # Cria o admin do tenant
        user = User.objects.create_user(
            email=validated_data['admin_email'],
            password=validated_data['admin_password'],
            first_name=validated_data['admin_first_name'],
            last_name=validated_data['admin_last_name'],
            tenant=tenant,
            is_tenant_admin=True
        )

        return {'tenant': tenant, 'user': user}
```

Criar: `backend/tenants/views.py`

```python
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .serializers import TenantRegisterSerializer

class TenantRegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = TenantRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        result = serializer.save()

        return Response({
            'message': 'Empresa cadastrada com sucesso!',
            'tenant': {
                'name': result['tenant'].name,
                'slug': result['tenant'].slug
            },
            'user': {
                'email': result['user'].email,
                'full_name': result['user'].get_full_name()
            }
        }, status=status.HTTP_201_CREATED)
```

Criar: `backend/tenants/urls.py`

```python
from django.urls import path
from .views import TenantRegisterView

urlpatterns = [
    path('register/', TenantRegisterView.as_view(), name='tenant-register'),
]
```

Atualizar: `backend/core/urls.py`

```python
urlpatterns = [
    path('', api_root, name='api-root'),
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/tenants/', include('tenants.urls')),  # ← Adicionar
]
```

---

### 5. Variáveis de Ambiente (.env) - IMPORTANTE!

Criar: `backend/.env`

```env
SECRET_KEY=sua-secret-key-super-secreta-aqui
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

DATABASE_URL=sqlite:///db.sqlite3

CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

Instalar: `pip install python-decouple`

Atualizar: `backend/core/settings.py`

```python
from decouple import config

SECRET_KEY = config('SECRET_KEY', default='django-insecure-...')
DEBUG = config('DEBUG', default=False, cast=bool)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost').split(',')
```

**Adicionar ao .gitignore:**
```
.env
*.sqlite3
media/
```

---

## 🚀 Fluxo Completo - Como Usar

### 1. Cliente se cadastra (Frontend)

```javascript
POST http://localhost:8000/api/tenants/register/
{
  "company_name": "Empresa ABC",
  "company_slug": "empresa-abc",
  "company_email": "contato@empresaabc.com",
  "admin_email": "admin@empresaabc.com",
  "admin_password": "senha123",
  "admin_first_name": "João",
  "admin_last_name": "Silva"
}

Resposta:
{
  "message": "Empresa cadastrada com sucesso!",
  "tenant": { "name": "Empresa ABC", "slug": "empresa-abc" },
  "user": { "email": "admin@empresaabc.com", "full_name": "João Silva" }
}
```

### 2. Admin faz login

```javascript
POST http://localhost:8000/api/auth/login/
{
  "email": "admin@empresaabc.com",
  "password": "senha123"
}

Resposta:
{
  "access": "eyJ0eXAiOiJKV1...",
  "refresh": "eyJ0eXAiOiJKV1...",
  "user": { ... },
  "tenant": { "slug": "empresa-abc", "name": "Empresa ABC" }
}
```

### 3. Frontend guarda tenant_slug e usa nas requisições

```javascript
const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'X-Tenant-ID': 'empresa-abc'  // Middleware usa isso
  }
});

// Todas as requests agora são filtradas por tenant automaticamente!
api.get('/projetos/');
api.post('/clientes/', { nome: 'Cliente XYZ' });
```

---

## 📊 Estrutura Final

```
backend/
├── accounts/          # Autenticação
│   ├── models.py      # User customizado
│   ├── serializers.py # JWT, Login
│   ├── views.py       # Login, Logout
│   └── urls.py
├── tenants/           # Multi-tenancy
│   ├── models.py      # Tenant
│   ├── serializers.py # Registro
│   ├── views.py       # Registro
│   └── urls.py
├── core/              # Compartilhado
│   ├── models.py      # BaseModel, SoftDelete
│   ├── managers.py    # Managers
│   ├── middleware.py  # TenantMiddleware
│   ├── permissions.py # Permissões (criar)
│   └── settings.py
└── manage.py
```

---

## ⚠️ O que NÃO fazer no MVP

❌ Sistema de billing/pagamentos
❌ Planos de assinatura
❌ Rate limiting
❌ Webhooks
❌ Multi-idioma
❌ Notificações por email (por enquanto)
❌ Cache com Redis
❌ Celery/tasks assíncronas

**Foque em:** Cadastro → Login → CRUD básico → Deploy

Adicione features depois que o MVP estiver rodando e com usuários reais testando!

---

## 🎯 Próximos Passos

1. ✅ Rodar migrações
2. ✅ Criar superuser
3. ✅ Testar endpoints no Postman/Insomnia
4. 🔄 Implementar CRUD do seu domínio (Projetos, Clientes, etc)
5. 🔄 Conectar com frontend React
6. 🔄 Deploy (Heroku/Railway/Render)

Boa sorte com o MVP! 🚀
