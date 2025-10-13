from django.contrib import admin
from django.contrib import messages
from django.utils.html import format_html
from django.http import HttpResponseRedirect
from django.urls import reverse
from django.db.models import Q
from .models import Supplier, Category, PaymentMethod, Filial
from core.admin import BaseAdmin

@admin.register(Supplier)
class SupplierAdmin(BaseAdmin):
    list_display = ['name', 'cnpj', 'email', 'phone',]
    search_fields = ['name', 'cnpj', 'email', 'phone']
    
    fieldsets = (
        ('Informações Básicas', {
            'fields': ('name', 'cnpj', 'email', 'phone')
        }),
        ('Endereço e Observações', {
            'fields': ('address', 'notes'),
            'classes': ('collapse',)
        }),
    )
    

@admin.register(Category)
class CategoryAdmin(BaseAdmin):
    list_display = ['name', 'color_display', 'description_short']
    search_fields = ['name', 'description']
    
    fieldsets = (
        ('Informações da Categoria', {
            'fields': ('name', 'description', 'color')
        }),
    )
    
    
    def color_display(self, obj):
        if obj.color:
            return format_html(
                '<div style="display: flex; align-items: center; gap: 8px;">'
                '<div style="width: 20px; height: 20px; background-color: {}; border-radius: 3px; border: 1px solid #ccc;"></div>'
                '<span>{}</span>'
                '</div>',
                obj.color, obj.color
            )
        return '-'
    color_display.short_description = 'Cor'
    
    def description_short(self, obj):
        if obj.description:
            return obj.description[:50] + '...' if len(obj.description) > 50 else obj.description
        return '-'
    description_short.short_description = 'Descrição'


@admin.register(PaymentMethod)
class PaymentMethodAdmin(BaseAdmin):
    list_display = ['name', 'description_short']
    list_filter = ['created_at', 'updated_at']
    search_fields = ['name', 'description']
    
    fieldsets = (
        ('Informações do Método de Pagamento', {
            'fields': ('name', 'description')
        }),
        ('Metadados', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    
    def description_short(self, obj):
        if obj.description:
            return obj.description[:50] + '...' if len(obj.description) > 50 else obj.description
        return '-'
    description_short.short_description = 'Descrição'


@admin.register(Filial)
class FilialAdmin(BaseAdmin):
    list_display = ['name', 'cnpj', 'bank_account_name', 'notes_short']
    search_fields = ['name', 'cnpj', 'bank_account_name']

    fieldsets = (
        ('Informações da Filial', {
            'fields': ('name', 'cnpj')
        }),
        ('Dados Bancários', {
            'fields': ('bank_account_name', 'bank_account_description'),
            'classes': ('collapse',)
        }),
        ('Tenant', {
            'fields': ('tenant',)
        }),
        ('Observações', {
            'fields': ('notes',),
            'classes': ('collapse',)
        }),
    )
    

    
    def notes_short(self, obj):
        if obj.notes:
            return obj.notes[:50] + '...' if len(obj.notes) > 50 else obj.notes
        return '-'
    notes_short.short_description = 'Observações'


# Ações personalizadas para todos os admins
def activate_selected(modeladmin, request, queryset):
    """Ativa os registros selecionados"""
    updated = queryset.update(is_active=True)
    messages.success(request, f'{updated} registros ativados com sucesso.')
activate_selected.short_description = "Ativar registros selecionados"

def deactivate_selected(modeladmin, request, queryset):
    """Desativa os registros selecionados"""
    updated = queryset.update(is_active=False)
    messages.success(request, f'{updated} registros desativados com sucesso.')
deactivate_selected.short_description = "Desativar registros selecionados"

# Adiciona ações a todos os admins
for model_admin in [SupplierAdmin, CategoryAdmin, PaymentMethodAdmin, FilialAdmin]:
    model_admin.actions = [activate_selected, deactivate_selected]