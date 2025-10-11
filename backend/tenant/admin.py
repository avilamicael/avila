from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Count, Q
from .models import Tenant


@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    """Configuração avançada do admin para o modelo Tenant"""

    # Campos exibidos na listagem
    list_display = [
        'name',
        'slug',
        'email',
        'phone',
        'cnpj',
        'city',
        'state',
        'is_active',
        'users_count',
        'active_users_count_display',
        'created_at',
        'logo_preview'
    ]

    # Campos que são links clicáveis
    list_display_links = ['name', 'slug']

    # Filtros laterais
    list_filter = [
        'is_active',
        'state',
        'created_at',
        'updated_at',
    ]

    # Campo de busca
    search_fields = [
        'name',
        'slug',
        'email',
        'cnpj',
        'phone',
        'city',
        'state',
    ]

    # Ordenação padrão
    ordering = ['name']

    # Campos editáveis na listagem
    list_editable = ['is_active']

    # Paginação
    list_per_page = 25

    # Campos de data para navegação
    date_hierarchy = 'created_at'

    # Campos preenchidos automaticamente
    prepopulated_fields = {'slug': ('name',)}

    # Organização dos campos no formulário de edição
    fieldsets = (
        ('Informações Básicas', {
            'fields': ('name', 'slug', 'logo')
        }),
        ('Contato', {
            'fields': ('email', 'phone')
        }),
        ('Documentação', {
            'fields': ('cnpj',),
            'description': 'Informações fiscais da empresa'
        }),
        ('Endereço', {
            'fields': ('address', 'city', 'state', 'zip_code'),
            'classes': ('collapse',),
            'description': 'Campos opcionais de localização'
        }),
        ('Configurações', {
            'fields': ('is_active',),
        }),
        ('Metadados', {
            'fields': ('created_at', 'updated_at', 'deleted_at', 'users_count', 'active_users_info'),
            'classes': ('collapse',),
        }),
    )

    # Campos readonly
    readonly_fields = [
        'created_at',
        'updated_at',
        'deleted_at',
        'users_count',
        'active_users_info',
        'logo_preview'
    ]

    # Inline para mostrar usuários da empresa
    class UserInline(admin.TabularInline):
        from accounts.models import User
        model = User
        extra = 0
        fields = ['email', 'first_name', 'last_name', 'is_active', 'is_tenant_admin']
        readonly_fields = ['email', 'first_name', 'last_name']
        can_delete = False
        show_change_link = True
        verbose_name = 'Usuário'
        verbose_name_plural = 'Usuários da Empresa'

    inlines = [UserInline]

    def get_queryset(self, request):
        """Inclui empresas deletadas (soft delete) e adiciona contagens"""
        qs = self.model.objects.get_queryset()
        qs = qs.annotate(
            total_users=Count('users', distinct=True),
            active_users=Count('users', filter=Q(users__is_active=True), distinct=True)
        )
        ordering = self.get_ordering(request)
        if ordering:
            qs = qs.order_by(*ordering)
        return qs

    def logo_preview(self, obj):
        """Exibe preview da logo"""
        if obj.logo:
            return format_html(
                '<img src="{}" style="max-width: 200px; max-height: 100px; object-fit: contain;" />',
                obj.logo.url
            )
        return format_html('<span style="color: #999;">Sem logo</span>')
    logo_preview.short_description = 'Preview da Logo'

    def users_count(self, obj):
        """Total de usuários"""
        return obj.total_users if hasattr(obj, 'total_users') else obj.users.count()
    users_count.short_description = 'Total de Usuários'
    users_count.admin_order_field = 'total_users'

    def active_users_count_display(self, obj):
        """Usuários ativos com badge colorido"""
        count = obj.active_users if hasattr(obj, 'active_users') else obj.users.filter(is_active=True).count()
        color = '#28a745' if count > 0 else '#dc3545'
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px; font-weight: bold;">{}</span>',
            color,
            count
        )
    active_users_count_display.short_description = 'Usuários Ativos'
    active_users_count_display.admin_order_field = 'active_users'

    def active_users_info(self, obj):
        """Informações detalhadas sobre usuários ativos"""
        total = obj.users.count()
        active = obj.users.filter(is_active=True).count()
        admins = obj.users.filter(is_tenant_admin=True).count()

        return format_html(
            '<div style="line-height: 1.8;">'
            '<strong>Total:</strong> {} usuários<br>'
            '<strong>Ativos:</strong> {} usuários<br>'
            '<strong>Administradores:</strong> {} usuários'
            '</div>',
            total, active, admins
        )
    active_users_info.short_description = 'Estatísticas de Usuários'

    # Actions customizadas
    actions = ['activate_tenants', 'deactivate_tenants', 'export_tenant_data']

    @admin.action(description='Ativar empresas selecionadas')
    def activate_tenants(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} empresa(s) ativada(s) com sucesso.')

    @admin.action(description='Desativar empresas selecionadas')
    def deactivate_tenants(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} empresa(s) desativada(s) com sucesso.')

    @admin.action(description='Exportar dados das empresas')
    def export_tenant_data(self, request, queryset):
        """Placeholder para exportação futura"""
        self.message_user(
            request,
            f'{queryset.count()} empresa(s) selecionada(s). Funcionalidade de exportação será implementada.',
            level='info'
        )
