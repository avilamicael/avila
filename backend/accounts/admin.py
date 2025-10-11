from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Configuração avançada do admin para o modelo User"""

    # Campos exibidos na listagem
    list_display = [
        'email',
        'first_name',
        'last_name',
        'tenant',
        'position',
        'is_active',
        'is_staff',
        'is_tenant_admin',
        'date_joined',
        'avatar_preview'
    ]

    # Campos que são links clicáveis
    list_display_links = ['email', 'first_name', 'last_name']

    # Filtros laterais
    list_filter = [
        'is_active',
        'is_staff',
        'is_tenant_admin',
        'tenant',
        'date_joined',
        'last_login',
    ]

    # Campo de busca
    search_fields = [
        'email',
        'first_name',
        'last_name',
        'phone',
        'position',
        'tenant__name',
    ]

    # Ordenação padrão
    ordering = ['-date_joined']

    # Campos editáveis na listagem
    list_editable = ['is_active']

    # Paginação
    list_per_page = 25

    # Campos de data para navegação
    date_hierarchy = 'date_joined'

    # Organização dos campos no formulário de edição
    fieldsets = (
        ('Informações de Autenticação', {
            'fields': ('email', 'password')
        }),
        ('Informações Pessoais', {
            'fields': ('first_name', 'last_name', 'phone', 'position', 'avatar')
        }),
        ('Empresa', {
            'fields': ('tenant',),
            'description': 'Empresa à qual o usuário pertence'
        }),
        ('Permissões', {
            'fields': (
                'is_active',
                'is_staff',
                'is_tenant_admin',
                'is_superuser',
                'groups',
                'user_permissions'
            ),
            'classes': ('collapse',),
        }),
        ('Datas Importantes', {
            'fields': ('date_joined', 'last_login'),
            'classes': ('collapse',),
        }),
        ('Metadados', {
            'fields': ('created_at', 'updated_at', 'deleted_at'),
            'classes': ('collapse',),
        }),
    )

    # Campos para o formulário de criação de novo usuário
    add_fieldsets = (
        ('Informações de Autenticação', {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2'),
        }),
        ('Informações Pessoais', {
            'classes': ('wide',),
            'fields': ('first_name', 'last_name', 'phone', 'position'),
        }),
        ('Empresa', {
            'classes': ('wide',),
            'fields': ('tenant',),
        }),
        ('Permissões', {
            'classes': ('wide',),
            'fields': ('is_active', 'is_staff', 'is_tenant_admin', 'is_superuser'),
        }),
    )

    # Campos readonly
    readonly_fields = ['date_joined', 'last_login', 'created_at', 'updated_at', 'deleted_at', 'avatar_preview']

    # Filtros customizados
    def get_queryset(self, request):
        """Inclui usuários deletados (soft delete) com all_objects"""
        qs = self.model.all_objects.get_queryset()
        ordering = self.get_ordering(request)
        if ordering:
            qs = qs.order_by(*ordering)
        return qs

    def avatar_preview(self, obj):
        """Exibe preview do avatar"""
        if obj.avatar:
            return format_html(
                '<img src="{}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover;" />',
                obj.avatar.url
            )
        return format_html('<span style="color: #999;">Sem avatar</span>')
    avatar_preview.short_description = 'Avatar'

    # Actions customizadas
    actions = ['activate_users', 'deactivate_users', 'make_tenant_admin', 'remove_tenant_admin']

    @admin.action(description='Ativar usuários selecionados')
    def activate_users(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} usuário(s) ativado(s) com sucesso.')

    @admin.action(description='Desativar usuários selecionados')
    def deactivate_users(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} usuário(s) desativado(s) com sucesso.')

    @admin.action(description='Tornar Admin da Empresa')
    def make_tenant_admin(self, request, queryset):
        updated = queryset.update(is_tenant_admin=True)
        self.message_user(request, f'{updated} usuário(s) promovido(s) a Admin da Empresa.')

    @admin.action(description='Remover Admin da Empresa')
    def remove_tenant_admin(self, request, queryset):
        updated = queryset.update(is_tenant_admin=False)
        self.message_user(request, f'{updated} usuário(s) removido(s) como Admin da Empresa.')
