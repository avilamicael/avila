from django.contrib import admin
from django.contrib.admin import AdminSite
from django.contrib import admin
from django.contrib import messages
from django.utils.html import format_html
from django.urls import reverse
from django import forms
from tenant.models import Tenant

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

class BaseAdmin(admin.ModelAdmin):
    """Classe base para todos os admins do sistema"""
    
    # Configurações padrão
    list_per_page = 25
    save_on_top = True
    list_max_show_all = 100
    
    def get_queryset(self, request):
        """Filtra por tenant e exclui registros deletados"""
        qs = super().get_queryset(request)
        
        # Filtra pelo tenant do usuário logado
        if hasattr(request.user, 'tenant'):
            qs = qs.filter(tenant=request.user.tenant)
            
        return qs
    
    def get_list_display(self, request):
        base_list = list(self.list_display) if self.list_display else []
        if hasattr(self.model, 'is_active'):
            base_list.append('_is_active_status')
        base_list.append('_actions')
        return base_list
    
    def get_list_filter(self, request):
        """Adiciona filtros comuns, incluindo status"""
        base_filters = list(self.list_filter) if self.list_filter else []
        if hasattr(self.model, 'is_active'):
            base_filters.append('is_active')  # adiciona filtro de status
        if hasattr(self.model, 'created_at'):
            base_filters.append('created_at')
        if hasattr(self.model, 'updated_at'):
            base_filters.append('updated_at')
        return base_filters
    
    def get_search_fields(self, request):
        """Campos de busca padrão"""
        return ['name']  # Assume que todos os modelos têm 'name'
    
    def _is_active_status(self, obj):
        """Exibe status ativo/inativo"""
        if obj.is_active:
            return format_html('<span style="color: green;">● Ativo</span>')
        else:
            return format_html('<span style="color: red;">● Inativo</span>')
    _is_active_status.short_description = 'Status'
    
    def _actions(self, obj):
        """Ações personalizadas para cada registro"""
        links = []
        url_name = f'admin:{obj._meta.app_label}_{obj._meta.model_name}_change'
        change_url = reverse(url_name, args=[obj.pk])
        links.append(f'<a href="{change_url}">Editar</a>')
        
        # Ação de deletar (soft delete)
        if hasattr(obj, 'is_active'):
            delete_url = reverse(f'admin:{obj._meta.app_label}_{obj._meta.model_name}_delete', args=[obj.pk])
            links.append(f'<a href="{delete_url}" style="color: red;" onclick="return confirm(\'Tem certeza que deseja desativar este registro?\')">Desativar</a>')
            
        return format_html(' | '.join(links))
    _actions.short_description = 'Ações'
    
    def delete_model(self, request, obj):
        """Soft delete em vez de deletar permanentemente"""
        if hasattr(obj, 'is_active'):
            obj.is_active = False
            obj.save()
            messages.success(request, f'{obj._meta.verbose_name} "{obj}" foi desativado com sucesso.')
        else:
            super().delete_model(request, obj)
    
    def save_model(self, request, obj, form, change):
        """Salva informações de tenant"""
        if not change:  # Se é um novo registro
            if hasattr(request.user, 'tenant') and hasattr(obj, 'tenant') and not obj.tenant:
                obj.tenant = request.user.tenant
            
        super().save_model(request, obj, form, change)

    def get_form(self, request, obj=None, **kwargs):
        """Adiciona campo tenant no formulário"""
        form = super().get_form(request, obj, **kwargs)
        
        if hasattr(self.model, 'tenant'):
            # Se for superuser, mostra todos os tenants
            if request.user.is_superuser:
                form.base_fields['tenant'] = forms.ModelChoiceField(
                    queryset=Tenant.objects.all(),
                    label='Tenant',
                    required=True
                )
            else:
                # Usuário normal só vê seu próprio tenant
                form.base_fields['tenant'] = forms.ModelChoiceField(
                    queryset=Tenant.objects.filter(id=request.user.tenant.id),
                    label='Tenant',
                    required=True,
                    initial=request.user.tenant
                )
        
        return form

    def get_readonly_fields(self, request, obj=None):
        """Torna tenant readonly na edição para manter consistência"""
        readonly_fields = list(super().get_readonly_fields(request, obj=obj))
        
        if obj and hasattr(obj, 'tenant'):  # Na edição, não deixa mudar o tenant
            readonly_fields.append('tenant')
        
        return readonly_fields