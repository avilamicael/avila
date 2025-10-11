from django.db import models
from django.core.validators import RegexValidator
from core.models import BaseModel, SoftDeleteModel, UppercaseMixin
from core.managers import SoftDeleteManager


class Tenant(UppercaseMixin, BaseModel, SoftDeleteModel):
    """Model para empresas/tenants - Versão MVP Simplificada"""

    # Campos que serão convertidos para UPPERCASE automaticamente
    uppercase_fields = ['name', 'address', 'city', 'state']

    # Dados básicos
    name = models.CharField('Nome da Empresa', max_length=200)
    slug = models.SlugField('Identificador', unique=True, max_length=100,
                           help_text='Identificador único usado nas URLs e headers')

    # Contato
    email = models.EmailField('E-mail Principal')
    phone = models.CharField('Telefone', max_length=15, blank=True)

    # Documento (opcional para MVP)
    cnpj = models.CharField('CNPJ', max_length=18, blank=True,
                           help_text='Formato: 00.000.000/0000-00')

    # Endereço (simplificado - campos opcionais)
    address = models.CharField('Endereço', max_length=255, blank=True)
    city = models.CharField('Cidade', max_length=100, blank=True)
    state = models.CharField('Estado', max_length=2, blank=True)
    zip_code = models.CharField('CEP', max_length=9, blank=True,
                               help_text='Formato: 00000-000')

    # Configurações
    is_active = models.BooleanField('Ativo', default=True)

    # Branding
    logo = models.ImageField('Logo', upload_to='tenant/logos/', null=True, blank=True)
    
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
        """Retorna quantidade de usuários ativos"""
        return self.users.filter(is_active=True).count()