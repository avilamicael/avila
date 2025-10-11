from django.db import models
from django.contrib.auth import get_user_model


def get_current_tenant():
    """Obtém o tenant atual do contexto (será implementado via middleware)"""
    from core.middleware import _thread_locals
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