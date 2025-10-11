from django.contrib import admin
from django.contrib.admin import AdminSite


class CustomAdminSite(AdminSite):
    """Personalização do site admin do Django"""

    site_header = 'Avila - Administração'
    site_title = 'Avila Admin'
    index_title = 'Painel de Administração'

    def each_context(self, request):
        context = super().each_context(request)
        # Adiciona informações extras ao contexto
        context['custom_css'] = True
        return context


# Instância customizada do admin (opcional - use se quiser substituir o admin padrão)
# admin_site = CustomAdminSite(name='custom_admin')
