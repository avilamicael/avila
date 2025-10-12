"""
URL configuration for core project.
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .views import protected_media


@api_view(['GET'])
@permission_classes([AllowAny])
def api_root(_request):
    """Endpoint raiz da API"""
    return Response({
        'message': 'API Backend - Django REST Framework',
        'version': '1.0.0',
        'endpoints': {
            'admin': '/admin/',
            'api': '/api/',
            'auth': '/api/auth/',
        }
    })


urlpatterns = [
    path('', api_root, name='api-root'),
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/registrations/', include('registrations.urls')),
    path('api/payables/', include('payables.urls')),
    # Media files protegidos por autenticação
    re_path(r'^media/(?P<path>.*)$', protected_media, name='protected-media'),
]

# Serve static files in development
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
