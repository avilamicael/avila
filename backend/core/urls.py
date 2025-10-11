"""
URL configuration for core project.
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


@api_view(['GET'])
@permission_classes([AllowAny])
def api_root(request):
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
]
