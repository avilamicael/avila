# Guia Completo - Backend Django MVP Avila
## Sistema Multitenant de Gestão Empresarial

---

## 📋 Índice

1. [Estrutura do Projeto](#estrutura-do-projeto)
2. [Configuração Inicial](#configuração-inicial)
3. [Models Completos](#models-completos)
4. [Serializers](#serializers)
5. [Views e ViewSets](#views-e-viewsets)
6. [URLs e Rotas](#urls-e-rotas)
7. [Middleware e Segurança](#middleware-e-segurança)
8. [Autenticação JWT](#autenticação-jwt)
9. [Permissions e Filters](#permissions-e-filters)
10. [Admin Interface](#admin-interface)
11. [Comandos de Management](#comandos-de-management)
12. [Testes](#testes)
13. [Deploy e Produção](#deploy-e-produção)

---

## 1. Estrutura do Projeto

```
avila_backend/
├── manage.py
├── requirements.txt
├── .env.example
├── .gitignore
├── Dockerfile
├── docker-compose.yml
├── backend/
│   ├── __init__.py
│   ├── settings/
│   │   ├── __init__.py
│   │   ├── base.py
│   │   ├── development.py
│   │   ├── production.py
│   │   └── testing.py
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
├── apps/
│   ├── __init__.py
│   ├── core/
│   │   ├── __init__.py
│   │   ├── models.py
│   │   ├── managers.py
│   │   ├── middleware.py
│   │   ├── permissions.py
│   │   ├── pagination.py
│   │   ├── exceptions.py
│   │   └── utils.py
│   ├── tenants/
│   │   ├── __init__.py
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   ├── admin.py
│   │   ├── managers.py
│   │   └── migrations/
│   ├── accounts/
│   │   ├── __init__.py
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   ├── admin.py
│   │   ├── managers.py
│   │   ├── signals.py
│   │   └── migrations/
│   └── financeiro/
│       ├── __init__.py
│       ├── models.py
│       ├── serializers.py
│       ├── views.py
│       ├── urls.py
│       ├── admin.py
│       ├── filters.py
│       ├── validators.py
│       └── migrations/
├── media/
├── static/
└── tests/
```

---

## 2. Configuração Inicial

### requirements.txt
```
Django==5.0.1
djangorestframework==3.14.0
djangorestframework-simplejwt==5.3.1
django-cors-headers==4.3.1
python-decouple==3.8
dj-database-url==2.1.0
psycopg2-binary==2.9.9
Pillow==10.2.0
django-filter==23.5
gunicorn==21.2.0
redis==5.0.1
celery==5.3.4
pytest==7.4.4
pytest-django==4.7.0
factory-boy==3.3.0
faker==22.0.0
django-extensions==3.2.3
ipython==8.20.0
```

### .env.example
```env
# Django Settings
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DATABASE_URL=postgres://user:password@localhost:5432/avila_db

# JWT Settings
JWT_SECRET_KEY=your-jwt-secret-key
JWT_ACCESS_TOKEN_LIFETIME=60  # minutes
JWT_REFRESH_TOKEN_LIFETIME=7  # days

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Email Settings
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# Redis (opcional para cache/celery)
REDIS_URL=redis://localhost:6379/0

# Media Files
MEDIA_ROOT=media
MEDIA_URL=/media/

# Static Files
STATIC_ROOT=staticfiles
STATIC_URL=/static/
```

### backend/settings/base.py
```python
from pathlib import Path
from datetime import timedelta
from decouple import config, Csv
import dj_database_url

# Build paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Security
SECRET_KEY = config('SECRET_KEY')
DEBUG = config('DEBUG', default=False, cast=bool)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='', cast=Csv())

# Application definition
DJANGO_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

THIRD_PARTY_APPS = [
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'django_filters',
    'django_extensions',
]

LOCAL_APPS = [
    'apps.core',
    'apps.tenants',
    'apps.accounts',
    'apps.financeiro',
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'apps.core.middleware.TenantMiddleware',  # Custom middleware
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'backend.wsgi.application'

# Database
DATABASES = {
    'default': dj_database_url.config(
        default=config('DATABASE_URL'),
        conn_max_age=600,
        conn_health_checks=True,
    )
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# Internationalization
LANGUAGE_CODE = 'pt-br'
TIME_ZONE = 'America/Sao_Paulo'
USE_I18N = True
USE_TZ = True

# Static files
STATIC_URL = config('STATIC_URL', default='/static/')
STATIC_ROOT = BASE_DIR / config('STATIC_ROOT', default='staticfiles')

# Media files
MEDIA_URL = config('MEDIA_URL', default='/media/')
MEDIA_ROOT = BASE_DIR / config('MEDIA_ROOT', default='media')

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Custom User Model
AUTH_USER_MODEL = 'accounts.User'

# REST Framework Configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'apps.core.pagination.CustomPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.MultiPartParser',
        'rest_framework.parsers.FormParser',
    ],
    'EXCEPTION_HANDLER': 'apps.core.exceptions.custom_exception_handler',
    'DATE_FORMAT': '%d/%m/%Y',
    'DATETIME_FORMAT': '%d/%m/%Y %H:%M:%S',
}

# JWT Configuration
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=config('JWT_ACCESS_TOKEN_LIFETIME', default=60, cast=int)),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=config('JWT_REFRESH_TOKEN_LIFETIME', default=7, cast=int)),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': config('JWT_SECRET_KEY', default=SECRET_KEY),
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
}

# CORS Configuration
CORS_ALLOWED_ORIGINS = config('CORS_ALLOWED_ORIGINS', default='', cast=Csv())
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
    'x-tenant-id',
]

# Email Configuration
EMAIL_BACKEND = config('EMAIL_BACKEND', default='django.core.mail.backends.console.EmailBackend')
EMAIL_HOST = config('EMAIL_HOST', default='')
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool)
EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')
DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default='noreply@avila.com.br')

# Logging Configuration
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose'
        },
        'file': {
            'class': 'logging.FileHandler',
            'filename': BASE_DIR / 'logs' / 'django.log',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console', 'file'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}
```

---

## 3. Models Completos

### apps/core/models.py
```python
from django.db import models
from django.utils import timezone
import uuid


class BaseModel(models.Model):
    """Model base com campos comuns"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField('Criado em', auto_now_add=True)
    updated_at = models.DateTimeField('Atualizado em', auto_now=True)
    
    class Meta:
        abstract = True
        ordering = ['-created_at']


class TenantAwareModel(BaseModel):
    """Model base para modelos multi-tenant"""
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='%(app_label)s_%(class)s_related',
        verbose_name='Empresa'
    )
    
    class Meta:
        abstract = True
        indexes = [
            models.Index(fields=['tenant', '-created_at']),
        ]


class SoftDeleteModel(models.Model):
    """Model com soft delete"""
    is_active = models.BooleanField('Ativo', default=True)
    deleted_at = models.DateTimeField('Deletado em', null=True, blank=True)
    deleted_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='%(app_label)s_%(class)s_deleted'
    )
    
    def delete(self, user=None, **kwargs):
        """Soft delete ao invés de deletar fisicamente"""
        self.is_active = False
        self.deleted_at = timezone.now()
        if user:
            self.deleted_by = user
        self.save()
    
    def hard_delete(self):
        """Delete físico quando necessário"""
        super().delete()
    
    class Meta:
        abstract = True
```

### apps/core/managers.py
```python
from django.db import models
from django.contrib.auth import get_user_model


def get_current_tenant():
    """Obtém o tenant atual do contexto (será implementado via middleware)"""
    from apps.core.middleware import _thread_locals
    request = getattr(_thread_locals, 'request', None)
    if request and hasattr(request, 'tenant'):
        return request.tenant
    return None


class TenantAwareManager(models.Manager):
    """Manager que filtra automaticamente por tenant"""
    
    def get_queryset(self):
        queryset = super().get_queryset()
        tenant = get_current_tenant()
        if tenant:
            return queryset.filter(tenant=tenant)
        return queryset
    
    def create(self, **kwargs):
        if 'tenant' not in kwargs:
            tenant = get_current_tenant()
            if tenant:
                kwargs['tenant'] = tenant
        return super().create(**kwargs)


class SoftDeleteManager(models.Manager):
    """Manager que filtra registros não deletados"""
    
    def get_queryset(self):
        return super().get_queryset().filter(is_active=True)
    
    def all_with_deleted(self):
        return super().get_queryset()
    
    def deleted(self):
        return super().get_queryset().filter(is_active=False)
```

### apps/tenants/models.py
```python
from django.db import models
from django.core.validators import RegexValidator
from apps.core.models import BaseModel, SoftDeleteModel
from apps.core.managers import SoftDeleteManager


class Tenant(BaseModel, SoftDeleteModel):
    """Model para empresas/tenants"""
    
    PLAN_CHOICES = [
        ('free', 'Gratuito'),
        ('basic', 'Básico'),
        ('pro', 'Profissional'),
        ('enterprise', 'Enterprise'),
    ]
    
    name = models.CharField('Nome da Empresa', max_length=200)
    slug = models.SlugField('Identificador', unique=True, max_length=100)
    cnpj = models.CharField(
        'CNPJ',
        max_length=18,
        unique=True,
        validators=[
            RegexValidator(
                regex=r'^\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}$',
                message='CNPJ deve estar no formato: 00.000.000/0000-00'
            )
        ]
    )
    email = models.EmailField('E-mail Principal')
    phone = models.CharField(
        'Telefone',
        max_length=15,
        validators=[
            RegexValidator(
                regex=r'^\(\d{2}\) \d{4,5}-\d{4}$',
                message='Telefone deve estar no formato: (00) 00000-0000'
            )
        ]
    )
    
    # Endereço
    address = models.CharField('Endereço', max_length=255)
    number = models.CharField('Número', max_length=10)
    complement = models.CharField('Complemento', max_length=100, blank=True)
    neighborhood = models.CharField('Bairro', max_length=100)
    city = models.CharField('Cidade', max_length=100)
    state = models.CharField('Estado', max_length=2)
    zip_code = models.CharField(
        'CEP',
        max_length=9,
        validators=[
            RegexValidator(
                regex=r'^\d{5}-\d{3}$',
                message='CEP deve estar no formato: 00000-000'
            )
        ]
    )
    
    # Configurações
    plan = models.CharField('Plano', max_length=20, choices=PLAN_CHOICES, default='free')
    is_active = models.BooleanField('Ativo', default=True)
    max_users = models.PositiveIntegerField('Máximo de Usuários', default=5)
    
    # Configurações de notificação
    notify_before_due = models.PositiveIntegerField(
        'Notificar antes do vencimento (dias)',
        default=3,
        help_text='Quantos dias antes do vencimento enviar notificação'
    )
    
    # Metadados
    logo = models.ImageField('Logo', upload_to='tenants/logos/', null=True, blank=True)
    primary_color = models.CharField('Cor Primária', max_length=7, default='#1976D2')
    secondary_color = models.CharField('Cor Secundária', max_length=7, default='#424242')
    
    objects = SoftDeleteManager()
    
    class Meta:
        verbose_name = 'Empresa'
        verbose_name_plural = 'Empresas'
        ordering = ['name']
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['cnpj']),
        ]
    
    def __str__(self):
        return self.name
    
    @property
    def active_users_count(self):
        return self.users.filter(is_active=True).count()
    
    def can_add_user(self):
        return self.active_users_count < self.max_users
```

### apps/accounts/models.py
```python
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.utils import timezone
from apps.core.models import BaseModel, SoftDeleteModel
from apps.core.managers import SoftDeleteManager
from .managers import UserManager


class User(AbstractBaseUser, PermissionsMixin, BaseModel, SoftDeleteModel):
    """Model customizado de usuário"""
    
    email = models.EmailField('E-mail', unique=True)
    first_name = models.CharField('Nome', max_length=150)
    last_name = models.CharField('Sobrenome', max_length=150)
    
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='users',
        verbose_name='Empresa',
        null=True,
        blank=True
    )
    
    # Permissões
    is_staff = models.BooleanField('É Staff', default=False)
    is_tenant_admin = models.BooleanField('É Administrador da Empresa', default=False)
    is_active = models.BooleanField('Ativo', default=True)
    
    # Informações adicionais
    phone = models.CharField('Telefone', max_length=15, blank=True)
    position = models.CharField('Cargo', max_length=100, blank=True)
    avatar = models.ImageField('Avatar', upload_to='users/avatars/', null=True, blank=True)
    
    # Datas importantes
    date_joined = models.DateTimeField('Data de Cadastro', default=timezone.now)
    last_login = models.DateTimeField('Último Login', blank=True, null=True)
    
    # Configurações
    timezone = models.CharField('Fuso Horário', max_length=50, default='America/Sao_Paulo')
    language = models.CharField('Idioma', max_length=10, default='pt-BR')
    
    objects = UserManager()
    all_objects = SoftDeleteManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']
    
    class Meta:
        verbose_name = 'Usuário'
        verbose_name_plural = 'Usuários'
        ordering = ['first_name', 'last_name']
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['tenant', 'email']),
        ]
    
    def __str__(self):
        return self.get_full_name()
    
    def get_full_name(self):
        return f'{self.first_name} {self.last_name}'.strip()
    
    def get_short_name(self):
        return self.first_name
    
    @property
    def is_tenant_owner(self):
        """Verifica se é o dono da empresa (primeiro usuário)"""
        if not self.tenant:
            return False
        return self.tenant.users.order_by('created_at').first() == self


class PasswordResetToken(BaseModel):
    """Token para reset de senha"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='password_reset_tokens')
    token = models.CharField('Token', max_length=255, unique=True)
    is_used = models.BooleanField('Foi Usado', default=False)
    expires_at = models.DateTimeField('Expira em')
    
    class Meta:
        verbose_name = 'Token de Reset de Senha'
        verbose_name_plural = 'Tokens de Reset de Senha'
        ordering = ['-created_at']
    
    def is_valid(self):
        return not self.is_used and self.expires_at > timezone.now()
```

### apps/accounts/managers.py
```python
from django.contrib.auth.base_user import BaseUserManager
from django.utils import timezone


class UserManager(BaseUserManager):
    """Manager customizado para o model User"""
    
    def _create_user(self, email, password, **extra_fields):
        if not email:
            raise ValueError('E-mail é obrigatório')
        
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_user(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', False)
        extra_fields.setdefault('is_superuser', False)
        return self._create_user(email, password, **extra_fields)
    
    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_tenant_admin', True)
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser deve ter is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser deve ter is_superuser=True.')
        
        return self._create_user(email, password, **extra_fields)
```

### apps/financeiro/models.py
```python
from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal
from apps.core.models import TenantAwareModel, SoftDeleteModel
from apps.core.managers import TenantAwareManager, SoftDeleteManager


class CombinedManager(TenantAwareManager, SoftDeleteManager):
    """Manager que combina tenant-aware e soft-delete"""
    pass


class Categoria(TenantAwareModel, SoftDeleteModel):
    """Categorias para contas a pagar"""
    name = models.CharField('Nome', max_length=100)
    description = models.TextField('Descrição', blank=True)
    color = models.CharField('Cor', max_length=7, default='#666666')
    icon = models.CharField('Ícone', max_length=50, blank=True)
    
    objects = CombinedManager()
    
    class Meta:
        verbose_name = 'Categoria'
        verbose_name_plural = 'Categorias'
        ordering = ['name']
        unique_together = ['tenant', 'name']
    
    def __str__(self):
        return self.name


class Fornecedor(TenantAwareModel, SoftDeleteModel):
    """Fornecedores"""
    name = models.CharField('Nome', max_length=200)
    cnpj_cpf = models.CharField('CNPJ/CPF', max_length=18, blank=True)
    email = models.EmailField('E-mail', blank=True)
    phone = models.CharField('Telefone', max_length=15, blank=True)
    address = models.TextField('Endereço', blank=True)
    notes = models.TextField('Observações', blank=True)
    
    objects = CombinedManager()
    
    class Meta:
        verbose_name = 'Fornecedor'
        verbose_name_plural = 'Fornecedores'
        ordering = ['name']
        unique_together = ['tenant', 'cnpj_cpf']
    
    def __str__(self):
        return self.name


class ContaPagar(TenantAwareModel, SoftDeleteModel):
    """Contas a Pagar"""
    
    STATUS_CHOICES = [
        ('pending', 'Pendente'),
        ('partial', 'Parcialmente Pago'),
        ('paid', 'Pago'),
        ('overdue', 'Vencido'),
        ('cancelled', 'Cancelado'),
    ]
    
    RECURRENCE_CHOICES = [
        ('once', 'Única'),
        ('daily', 'Diária'),
        ('weekly', 'Semanal'),
        ('monthly', 'Mensal'),
        ('yearly', 'Anual'),
    ]
    
    # Informações principais
    description = models.CharField('Descrição', max_length=255)
    fornecedor = models.ForeignKey(
        Fornecedor,
        on_delete=models.PROTECT,
        related_name='contas',
        verbose_name='Fornecedor',
        null=True,
        blank=True
    )
    categoria = models.ForeignKey(
        Categoria,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='contas',
        verbose_name='Categoria'
    )
    
    # Valores
    amount = models.DecimalField(
        'Valor',
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    paid_amount = models.DecimalField(
        'Valor Pago',
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    
    # Datas
    due_date = models.DateField('Data de Vencimento')
    payment_date = models.DateField('Data de Pagamento', null=True, blank=True)
    
    # Status e Recorrência
    status = models.CharField('Status', max_length=20, choices=STATUS_CHOICES, default='pending')
    recurrence = models.CharField('Recorrência', max_length=20, choices=RECURRENCE_CHOICES, default='once')
    
    # Informações adicionais
    invoice_number = models.CharField('Número da NF', max_length=50, blank=True)
    barcode = models.CharField('Código de Barras', max_length=100, blank=True)
    notes = models.TextField('Observações', blank=True)
    
    # Anexos
    attachment = models.FileField('Anexo', upload_to='contas_pagar/anexos/', null=True, blank=True)
    
    # Controle
    created_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='contas_criadas',
        verbose_name='Criado por'
    )
    paid_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='contas_pagas',
        verbose_name='Pago por'
    )
    
    objects = CombinedManager()
    
    class Meta:
        verbose_name = 'Conta a Pagar'
        verbose_name_plural = 'Contas a Pagar'
        ordering = ['due_date', '-created_at']
        indexes = [
            models.Index(fields=['tenant', 'status', 'due_date']),
            models.Index(fields=['tenant', 'fornecedor']),
            models.Index(fields=['tenant', 'categoria']),
        ]
    
    def __str__(self):
        return f'{self.description} - R$ {self.amount}'
    
    @property
    def remaining_amount(self):
        """Valor restante a pagar"""
        return self.amount - self.paid_amount
    
    @property
    def is_overdue(self):
        """Verifica se está vencido"""
        from django.utils import timezone
        return self.due_date < timezone.now().date() and self.status != 'paid'
    
    @property
    def is_paid(self):
        """Verifica se está totalmente pago"""
        return self.paid_amount >= self.amount
    
    def update_status(self):
        """Atualiza o status baseado nos pagamentos"""
        if self.is_paid:
            self.status = 'paid'
        elif self.paid_amount > 0:
            self.status = 'partial'
        elif self.is_overdue:
            self.status = 'overdue'
        else:
            self.status = 'pending'
        self.save(update_fields=['status'])
    
    def save(self, *args, **kwargs):
        # Auto-atualiza status se não for cancelado
        if self.status != 'cancelled':
            if self.is_paid:
                self.status = 'paid'
            elif self.paid_amount > 0:
                self.status = 'partial'
            elif self.is_overdue:
                self.status = 'overdue'
        
        super().save(*args, **kwargs)


class Pagamento(TenantAwareModel):
    """Pagamentos de contas"""
    
    PAYMENT_METHOD_CHOICES = [
        ('money', 'Dinheiro'),
        ('pix', 'PIX'),
        ('credit_card', 'Cartão de Crédito'),
        ('debit_card', 'Cartão de Débito'),
        ('bank_transfer', 'Transferência Bancária'),
        ('boleto', 'Boleto'),
        ('check', 'Cheque'),
        ('other', 'Outro'),
    ]
    
    conta = models.ForeignKey(
        ContaPagar,
        on_delete=models.CASCADE,
        related_name='pagamentos',
        verbose_name='Conta'
    )
    amount = models.DecimalField(
        'Valor',
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    payment_date = models.DateTimeField('Data do Pagamento')
    payment_method = models.CharField(
        'Forma de Pagamento',
        max_length=20,
        choices=PAYMENT_METHOD_CHOICES,
        default='pix'
    )
    notes = models.TextField('Observações', blank=True)
    receipt = models.FileField('Comprovante', upload_to='pagamentos/comprovantes/', null=True, blank=True)
    
    paid_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='pagamentos_realizados',
        verbose_name='Pago por'
    )
    
    objects = TenantAwareManager()
    
    class Meta:
        verbose_name = 'Pagamento'
        verbose_name_plural = 'Pagamentos'
        ordering = ['-payment_date']
        indexes = [
            models.Index(fields=['tenant', 'conta', 'payment_date']),
        ]
    
    def __str__(self):
        return f'Pagamento de R$ {self.amount} - {self.conta.description}'
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Atualiza o valor pago na conta
        self.conta.paid_amount = self.conta.pagamentos.aggregate(
            total=models.Sum('amount')
        )['total'] or Decimal('0.00')
        self.conta.save()


---

## 4. Serializers

### apps/core/serializers.py
```python
from rest_framework import serializers
from apps.tenants.models import Tenant


class TenantSerializer(serializers.ModelSerializer):
    """Serializer básico para Tenant"""
    class Meta:
        model = Tenant
        fields = ['id', 'name', 'slug']
        read_only_fields = ['id']


class CurrentTenantDefault:
    """Default class para pegar o tenant atual"""
    requires_context = True
    
    def __call__(self, serializer_field):
        request = serializer_field.context.get('request')
        if request and hasattr(request, 'tenant'):
            return request.tenant
        return None


class TenantFilteredPrimaryKeyRelatedField(serializers.PrimaryKeyRelatedField):
    """Campo que filtra automaticamente por tenant"""
    
    def get_queryset(self):
        request = self.context.get('request')
        queryset = super().get_queryset()
        if request and hasattr(request, 'tenant'):
            return queryset.filter(tenant=request.tenant)
        return queryset
```

### apps/tenants/serializers.py
```python
from rest_framework import serializers
from .models import Tenant
from apps.accounts.models import User


class TenantSerializer(serializers.ModelSerializer):
    """Serializer completo para Tenant"""
    active_users_count = serializers.ReadOnlyField()
    can_add_user = serializers.ReadOnlyField()
    
    class Meta:
        model = Tenant
        fields = [
            'id', 'name', 'slug', 'cnpj', 'email', 'phone',
            'address', 'number', 'complement', 'neighborhood',
            'city', 'state', 'zip_code', 'plan', 'is_active',
            'max_users', 'active_users_count', 'can_add_user',
            'notify_before_due', 'logo', 'primary_color',
            'secondary_color', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'active_users_count', 'can_add_user']
    
    def validate_cnpj(self, value):
        """Validação customizada do CNPJ"""
        # Aqui você pode adicionar validação real do CNPJ
        return value


class TenantCreateSerializer(serializers.ModelSerializer):
    """Serializer para criar Tenant com usuário admin"""
    admin_email = serializers.EmailField(write_only=True)
    admin_password = serializers.CharField(write_only=True, min_length=8)
    admin_first_name = serializers.CharField(write_only=True)
    admin_last_name = serializers.CharField(write_only=True)
    
    class Meta:
        model = Tenant
        fields = [
            'name', 'slug', 'cnpj', 'email', 'phone',
            'address', 'number', 'complement', 'neighborhood',
            'city', 'state', 'zip_code', 'admin_email',
            'admin_password', 'admin_first_name', 'admin_last_name'
        ]
    
    def create(self, validated_data):
        # Extrai dados do admin
        admin_data = {
            'email': validated_data.pop('admin_email'),
            'password': validated_data.pop('admin_password'),
            'first_name': validated_data.pop('admin_first_name'),
            'last_name': validated_data.pop('admin_last_name'),
        }
        
        # Cria o tenant
        tenant = Tenant.objects.create(**validated_data)
        
        # Cria o usuário admin
        User.objects.create_user(
            tenant=tenant,
            is_tenant_admin=True,
            **admin_data
        )
        
        return tenant
```

### apps/accounts/serializers.py
```python
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from .models import User, PasswordResetToken
from apps.tenants.models import Tenant
import secrets
from datetime import timedelta
from django.utils import timezone


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Serializer customizado para JWT com informações extras"""
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # Adiciona informações customizadas ao token
        token['email'] = user.email
        token['full_name'] = user.get_full_name()
        token['is_tenant_admin'] = user.is_tenant_admin
        if user.tenant:
            token['tenant_id'] = str(user.tenant.id)
            token['tenant_name'] = user.tenant.name
        
        return token
    
    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Adiciona informações do usuário na resposta
        data['user'] = {
            'id': str(self.user.id),
            'email': self.user.email,
            'first_name': self.user.first_name,
            'last_name': self.user.last_name,
            'full_name': self.user.get_full_name(),
            'is_tenant_admin': self.user.is_tenant_admin,
            'avatar': self.user.avatar.url if self.user.avatar else None,
        }
        
        # Adiciona informações do tenant
        if self.user.tenant:
            data['tenant'] = {
                'id': str(self.user.tenant.id),
                'name': self.user.tenant.name,
                'slug': self.user.tenant.slug,
                'plan': self.user.tenant.plan,
                'logo': self.user.tenant.logo.url if self.user.tenant.logo else None,
            }
        
        return data


class UserSerializer(serializers.ModelSerializer):
    """Serializer completo para User"""
    full_name = serializers.ReadOnlyField(source='get_full_name')
    tenant_name = serializers.ReadOnlyField(source='tenant.name')
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'tenant', 'tenant_name', 'is_tenant_admin', 'is_active',
            'phone', 'position', 'avatar', 'timezone', 'language',
            'date_joined', 'last_login', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'tenant', 'tenant_name', 'full_name',
            'date_joined', 'last_login', 'created_at', 'updated_at'
        ]


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer para criar usuário"""
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = [
            'email', 'password', 'password_confirm', 'first_name',
            'last_name', 'phone', 'position', 'is_tenant_admin'
        ]
    
    def validate(self, attrs):
        if attrs['password'] != attrs.pop('password_confirm'):
            raise serializers.ValidationError({'password': 'As senhas não conferem.'})
        
        # Verifica se o tenant pode adicionar mais usuários
        request = self.context.get('request')
        if request and hasattr(request, 'tenant'):
            if not request.tenant.can_add_user():
                raise serializers.ValidationError(
                    'Limite de usuários atingido para o plano atual.'
                )
        
        return attrs
    
    def create(self, validated_data):
        request = self.context.get('request')
        tenant = getattr(request, 'tenant', None)
        
        password = validated_data.pop('password')
        user = User.objects.create_user(
            tenant=tenant,
            **validated_data
        )
        user.set_password(password)
        user.save()
        
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer para atualizar usuário"""
    
    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'phone', 'position',
            'avatar', 'timezone', 'language', 'is_tenant_admin'
        ]
    
    def validate_is_tenant_admin(self, value):
        # Apenas admin pode alterar status de admin
        request = self.context.get('request')
        if not request.user.is_tenant_admin:
            raise serializers.ValidationError(
                'Apenas administradores podem alterar permissões.'
            )
        return value


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer para trocar senha"""
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(write_only=True)
    
    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Senha atual incorreta.')
        return value
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({'new_password': 'As senhas não conferem.'})
        return attrs
    
    def save(self):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user


class PasswordResetRequestSerializer(serializers.Serializer):
    """Serializer para solicitar reset de senha"""
    email = serializers.EmailField()
    
    def validate_email(self, value):
        try:
            self.user = User.objects.get(email=value, is_active=True)
        except User.DoesNotExist:
            # Não revelamos se o email existe ou não
            pass
        return value
    
    def save(self):
        if hasattr(self, 'user'):
            # Cria token de reset
            token = PasswordResetToken.objects.create(
                user=self.user,
                token=secrets.token_urlsafe(32),
                expires_at=timezone.now() + timedelta(hours=24)
            )
            # Aqui você enviaria o email com o token
            # send_password_reset_email(self.user, token)
            return token


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Serializer para confirmar reset de senha"""
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(write_only=True)
    
    def validate_token(self, value):
        try:
            self.reset_token = PasswordResetToken.objects.get(
                token=value,
                is_used=False
            )
            if not self.reset_token.is_valid():
                raise serializers.ValidationError('Token expirado.')
        except PasswordResetToken.DoesNotExist:
            raise serializers.ValidationError('Token inválido.')
        return value
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({'new_password': 'As senhas não conferem.'})
        return attrs
    
    def save(self):
        user = self.reset_token.user
        user.set_password(self.validated_data['new_password'])
        user.save()
        
        # Marca token como usado
        self.reset_token.is_used = True
        self.reset_token.save()
        
        return user
```

### apps/financeiro/serializers.py
```python
from rest_framework import serializers
from decimal import Decimal
from django.utils import timezone
from .models import Categoria, Fornecedor, ContaPagar, Pagamento
from apps.core.serializers import CurrentTenantDefault, TenantFilteredPrimaryKeyRelatedField


class CategoriaSerializer(serializers.ModelSerializer):
    """Serializer para Categoria"""
    tenant = serializers.HiddenField(default=CurrentTenantDefault())
    contas_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Categoria
        fields = [
            'id', 'name', 'description', 'color', 'icon',
            'tenant', 'contas_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'contas_count']
    
    def get_contas_count(self, obj):
        return obj.contas.filter(is_active=True).count()


class FornecedorSerializer(serializers.ModelSerializer):
    """Serializer para Fornecedor"""
    tenant = serializers.HiddenField(default=CurrentTenantDefault())
    contas_count = serializers.SerializerMethodField()
    total_devido = serializers.SerializerMethodField()
    
    class Meta:
        model = Fornecedor
        fields = [
            'id', 'name', 'cnpj_cpf', 'email', 'phone', 'address',
            'notes', 'tenant', 'contas_count', 'total_devido',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'contas_count', 'total_devido']
    
    def get_contas_count(self, obj):
        return obj.contas.filter(is_active=True).count()
    
    def get_total_devido(self, obj):
        total = obj.contas.filter(
            is_active=True,
            status__in=['pending', 'partial', 'overdue']
        ).aggregate(
            total=models.Sum('amount') - models.Sum('paid_amount')
        )['total'] or Decimal('0.00')
        return str(total)


class PagamentoSerializer(serializers.ModelSerializer):
    """Serializer para Pagamento"""
    tenant = serializers.HiddenField(default=CurrentTenantDefault())
    paid_by_name = serializers.ReadOnlyField(source='paid_by.get_full_name')
    
    class Meta:
        model = Pagamento
        fields = [
            'id', 'conta', 'amount', 'payment_date', 'payment_method',
            'notes', 'receipt', 'tenant', 'paid_by', 'paid_by_name',
            'created_at'
        ]
        read_only_fields = ['id', 'paid_by', 'paid_by_name', 'created_at']
    
    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError('O valor deve ser maior que zero.')
        return value
    
    def validate(self, attrs):
        conta = attrs.get('conta')
        amount = attrs.get('amount')
        
        if conta and amount:
            remaining = conta.remaining_amount
            if amount > remaining:
                raise serializers.ValidationError({
                    'amount': f'Valor maior que o restante da conta (R$ {remaining})'
                })
        
        return attrs
    
    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['paid_by'] = request.user
        return super().create(validated_data)


class ContaPagarSerializer(serializers.ModelSerializer):
    """Serializer para ContaPagar"""
    tenant = serializers.HiddenField(default=CurrentTenantDefault())
    categoria = TenantFilteredPrimaryKeyRelatedField(
        queryset=Categoria.objects.all(),
        required=False,
        allow_null=True
    )
    fornecedor = TenantFilteredPrimaryKeyRelatedField(
        queryset=Fornecedor.objects.all(),
        required=False,
        allow_null=True
    )
    
    remaining_amount = serializers.ReadOnlyField()
    is_overdue = serializers.ReadOnlyField()
    is_paid = serializers.ReadOnlyField()
    created_by_name = serializers.ReadOnlyField(source='created_by.get_full_name')
    paid_by_name = serializers.ReadOnlyField(source='paid_by.get_full_name')
    categoria_detail = CategoriaSerializer(source='categoria', read_only=True)
    fornecedor_detail = FornecedorSerializer(source='fornecedor', read_only=True)
    pagamentos = PagamentoSerializer(many=True, read_only=True)
    
    class Meta:
        model = ContaPagar
        fields = [
            'id', 'description', 'fornecedor', 'fornecedor_detail',
            'categoria', 'categoria_detail', 'amount', 'paid_amount',
            'remaining_amount', 'due_date', 'payment_date', 'status',
            'recurrence', 'invoice_number', 'barcode', 'notes',
            'attachment', 'is_overdue', 'is_paid', 'tenant',
            'created_by', 'created_by_name', 'paid_by', 'paid_by_name',
            'pagamentos', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'paid_amount', 'remaining_amount', 'is_overdue',
            'is_paid', 'created_by', 'created_by_name', 'paid_by',
            'paid_by_name', 'created_at', 'updated_at'
        ]
    
    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['created_by'] = request.user
        return super().create(validated_data)


class ContaPagarListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listagem"""
    categoria_name = serializers.ReadOnlyField(source='categoria.name')
    fornecedor_name = serializers.ReadOnlyField(source='fornecedor.name')
    remaining_amount = serializers.ReadOnlyField()
    is_overdue = serializers.ReadOnlyField()
    
    class Meta:
        model = ContaPagar
        fields = [
            'id', 'description', 'categoria_name', 'fornecedor_name',
            'amount', 'paid_amount', 'remaining_amount', 'due_date',
            'status', 'is_overdue', 'created_at'
        ]


class BaixaContaSerializer(serializers.Serializer):
    """Serializer para dar baixa em conta"""
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    payment_method = serializers.ChoiceField(
        choices=Pagamento.PAYMENT_METHOD_CHOICES,
        default='pix'
    )
    payment_date = serializers.DateTimeField(required=False, default=timezone.now)
    notes = serializers.CharField(required=False, allow_blank=True)
    receipt = serializers.FileField(required=False, allow_null=True)
    
    def validate_amount(self, value):
        conta = self.context.get('conta')
        if value and value > conta.remaining_amount:
            raise serializers.ValidationError(
                f'Valor maior que o restante da conta (R$ {conta.remaining_amount})'
            )
        return value
    
    def save(self):
        conta = self.context.get('conta')
        request = self.context.get('request')
        
        # Se não especificar valor, paga total
        amount = self.validated_data.get('amount', conta.remaining_amount)
        
        # Cria o pagamento
        pagamento = Pagamento.objects.create(
            tenant=conta.tenant,
            conta=conta,
            amount=amount,
            payment_method=self.validated_data['payment_method'],
            payment_date=self.validated_data.get('payment_date', timezone.now()),
            notes=self.validated_data.get('notes', ''),
            receipt=self.validated_data.get('receipt'),
            paid_by=request.user
        )
        
        # Atualiza a conta
        if conta.is_paid:
            conta.paid_by = request.user
            conta.payment_date = pagamento.payment_date.date()
        
        conta.save()
        
        return conta


class DashboardSerializer(serializers.Serializer):
    """Serializer para dados do dashboard"""
    total_contas = serializers.IntegerField()
    total_pendente = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_pago = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_vencido = serializers.DecimalField(max_digits=10, decimal_places=2)
    contas_vencidas = serializers.IntegerField()
    contas_hoje = serializers.IntegerField()
    contas_semana = serializers.IntegerField()
    ultimas_contas = ContaPagarListSerializer(many=True)
    proximos_vencimentos = ContaPagarListSerializer(many=True)
```

---

## 5. Views e ViewSets

### apps/core/views.py
```python
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q


class TenantAwareViewSet(viewsets.ModelViewSet):
    """ViewSet base que filtra automaticamente por tenant"""
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        if hasattr(self.request, 'tenant'):
            return queryset.filter(tenant=self.request.tenant)
        return queryset.none()
    
    def perform_create(self, serializer):
        if hasattr(self.request, 'tenant'):
            serializer.save(tenant=self.request.tenant)
        else:
            serializer.save()


class BaseAPIView:
    """View base com métodos comuns"""
    
    def get_success_response(self, data=None, message="Operação realizada com sucesso", status_code=status.HTTP_200_OK):
        response_data = {
            'success': True,
            'message': message
        }
        if data:
            response_data['data'] = data
        return Response(response_data, status=status_code)
    
    def get_error_response(self, message="Erro ao processar requisição", errors=None, status_code=status.HTTP_400_BAD_REQUEST):
        response_data = {
            'success': False,
            'message': message
        }
        if errors:
            response_data['errors'] = errors
        return Response(response_data, status=status_code)
```

### apps/core/permissions.py
```python
from rest_framework import permissions


class IsTenantUser(permissions.BasePermission):
    """Permissão para verificar se usuário pertence ao tenant"""
    
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            hasattr(request, 'tenant') and
            request.tenant
        )


class IsTenantAdmin(permissions.BasePermission):
    """Permissão para verificar se é admin do tenant"""
    
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            hasattr(request, 'tenant') and
            request.tenant and
            request.user.is_tenant_admin
        )


class IsTenantOwner(permissions.BasePermission):
    """Permissão para verificar se é o dono do tenant"""
    
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            hasattr(request, 'tenant') and
            request.tenant and
            request.user.is_tenant_owner
        )
```

### apps/tenants/views.py
```python
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from .models import Tenant
from .serializers import TenantSerializer, TenantCreateSerializer
from apps.core.permissions import IsTenantAdmin, IsTenantOwner


class TenantViewSet(viewsets.ModelViewSet):
    """ViewSet para gerenciar Tenants"""
    queryset = Tenant.objects.all()
    serializer_class = TenantSerializer
    lookup_field = 'slug'
    
    def get_permissions(self):
        if self.action == 'create':
            return [AllowAny()]
        elif self.action in ['update', 'partial_update', 'destroy']:
            return [IsTenantOwner()]
        else:
            return [IsAuthenticated()]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return TenantCreateSerializer
        return TenantSerializer