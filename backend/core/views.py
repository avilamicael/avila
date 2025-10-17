"""
Views principais do projeto
"""
import os
from django.http import FileResponse, Http404, HttpResponse
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.response import Response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def protected_media(request, path):
    """
    Serve arquivos de media apenas para usuários autenticados
    """

    # Constrói o caminho completo do arquivo
    file_path = os.path.join(settings.MEDIA_ROOT, path)

    # Verifica se o arquivo existe
    if not os.path.exists(file_path):
        raise Http404("Arquivo não encontrado")

    # Verifica se o caminho está dentro do MEDIA_ROOT (segurança)
    if not os.path.abspath(file_path).startswith(os.path.abspath(settings.MEDIA_ROOT)):
        raise Http404("Acesso negado")

    # Serve o arquivo
    try:
        return FileResponse(open(file_path, 'rb'))
    except Exception as e:
        raise Http404("Erro ao abrir arquivo")
