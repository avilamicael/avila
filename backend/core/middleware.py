import threading
from django.http import JsonResponse
from django.contrib.auth import get_user_model
from tenant.models import Tenant
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, AuthenticationFailed

_thread_locals = threading.local()
User = get_user_model()

class TenantMiddleware:
    """Middleware para identificar e validar tenant, suportando JWT antes do DRF processar"""

    def __init__(self, get_response):
        self.get_response = get_response
        self.jwt_auth = JWTAuthentication()  # inicializa uma instância do autenticador JWT

    def __call__(self, request):
        tenant = None

        # 1️⃣ - Tenta pegar o tenant pelo header customizado
        tenant_slug = request.headers.get('X-Tenant-ID')
        if tenant_slug:
            try:
                tenant = Tenant.objects.get(slug=tenant_slug, is_active=True)
            except Tenant.DoesNotExist:
                return JsonResponse({'error': 'Tenant não encontrado'}, status=404)

        # 2️⃣ - Se não veio via header, tenta decodificar JWT manualmente
        elif not getattr(request, 'user', None) or not request.user.is_authenticated:
            auth_header = request.headers.get('Authorization')
            if auth_header and auth_header.startswith('Bearer '):
                raw_token = auth_header.split('Bearer ')[1]
                try:
                    validated_token = self.jwt_auth.get_validated_token(raw_token)
                    user = self.jwt_auth.get_user(validated_token)
                    request.user = user  # define manualmente o usuário autenticado
                except (InvalidToken, AuthenticationFailed):
                    return JsonResponse({'error': 'Token inválido ou expirado'}, status=401)

        # 3️⃣ - Se já tem usuário autenticado (via JWT ou sessão), usa o tenant dele
        if not tenant and getattr(request, 'user', None) and request.user.is_authenticated:
            if hasattr(request.user, 'tenant') and request.user.tenant and request.user.tenant.is_active:
                tenant = request.user.tenant
            else:
                return JsonResponse({'error': 'Tenant do usuário inválido ou inativo'}, status=403)

        # 4️⃣ - Adiciona tenant ao request e registra na thread
        request.tenant = tenant
        if tenant:
            _thread_locals.request = request

        response = self.get_response(request)

        # 5️⃣ - Limpa o thread local após resposta
        if hasattr(_thread_locals, 'request'):
            delattr(_thread_locals, 'request')

        return response
