from django.db import models
from django.utils import timezone


class UppercaseMixin:
    """Mixin para converter campos especificados para uppercase automaticamente"""

    # Defina esta lista em cada model que usar o mixin
    uppercase_fields = []

    def save(self, *args, **kwargs):
        """Converte campos especificados para uppercase antes de salvar"""
        for field_name in self.uppercase_fields:
            value = getattr(self, field_name, None)
            if value and isinstance(value, str):
                setattr(self, field_name, value.upper())
        super().save(*args, **kwargs)


class BaseModel(models.Model):
    """Model base com campos comuns"""
    id = models.AutoField(primary_key=True)
    created_at = models.DateTimeField('Criado em', auto_now_add=True)
    updated_at = models.DateTimeField('Atualizado em', auto_now=True)

    class Meta:
        abstract = True
        ordering = ['-created_at']


class TenantAwareModel(BaseModel):
    """Model base para modelos multi-tenant"""
    tenant = models.ForeignKey(
        'tenant.Tenant',
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