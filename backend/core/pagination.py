"""
Configurações customizadas de paginação
"""
from rest_framework.pagination import PageNumberPagination


class LargeResultsSetPagination(PageNumberPagination):
    """
    Paginação que permite ao cliente controlar o tamanho da página
    Útil para dashboards e relatórios que precisam de muitos dados
    """
    page_size = 50  # Padrão
    page_size_query_param = 'page_size'  # Permite ?page_size=X
    max_page_size = 2000  # Máximo permitido
