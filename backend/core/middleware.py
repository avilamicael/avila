import threading
from django.http import JsonResponse
from tenant.models import Tenant

_thread_locals = threading.local()


class TenantMiddleware:
    """Middleware para identificar e validar tenant"""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Obtém tenant do cabeçalho ou do usuário autenticado
        tenant = None

        # 1. Tenta pegar do header X-Tenant-ID
        tenant_slug = request.headers.get('X-Tenant-ID')

        if tenant_slug:
            try:
                tenant = Tenant.objects.get(slug=tenant_slug, is_active=True)
            except Tenant.DoesNotExist:
                return JsonResponse({'error': 'Tenant não encontrado'}, status=404)

        # 2. Se usuário autenticado, usa o tenant dele
        elif hasattr(request, 'user') and request.user.is_authenticated:
            tenant = request.user.tenant

        if tenant:
            request.tenant = tenant
            _thread_locals.request = request

        response = self.get_response(request)

        # Limpa thread locals
        if hasattr(_thread_locals, 'request'):
            delattr(_thread_locals, 'request')

        return response

