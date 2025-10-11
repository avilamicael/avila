from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.utils import timezone
from core.models import BaseModel, SoftDeleteModel, UppercaseMixin
from core.managers import SoftDeleteManager
from .managers import UserManager


class User(UppercaseMixin, AbstractBaseUser, PermissionsMixin, BaseModel, SoftDeleteModel):
    """Model customizado de usuário"""

    # Campos que serão convertidos para UPPERCASE automaticamente
    # Email NÃO entra aqui pois precisa estar em lowercase
    uppercase_fields = ['first_name', 'last_name', 'position']
    
    email = models.EmailField('E-mail', unique=True)
    first_name = models.CharField('Nome', max_length=150)
    last_name = models.CharField('Sobrenome', max_length=150)
    
    tenant = models.ForeignKey(
        'tenant.Tenant',
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
    
    def save(self, *args, **kwargs):
        """Override save para garantir email em lowercase"""
        if self.email:
            self.email = self.email.lower()
        super().save(*args, **kwargs)

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
