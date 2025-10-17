from django.contrib import admin, messages
from django.utils.html import format_html
from django.db.models import Sum
from django.utils import timezone
from django.urls import path
from django.shortcuts import render, redirect
from django.http import HttpResponseRedirect

from core.admin import BaseAdmin
from .models import AccountPayable, PayablePayment
from .excel_import import export_template_excel, import_excel


@admin.register(AccountPayable)
class AccountPayableAdmin(BaseAdmin):
    change_list_template = "admin/payables/accountpayable_changelist.html"

    list_display = [
        'description', 'supplier', 'category', 'branch',
        'status_colored', 'due_date', 'final_amount_display',
        'paid_amount_display', 'remaining_amount_display',
    ]
    list_filter = [
        'status', 'is_recurring', 'branch', 'category',
        ('due_date', admin.DateFieldListFilter),
        ('payment_date', admin.DateFieldListFilter),
    ]
    search_fields = [
        'description', 'supplier__name', 'invoice_numbers',
        'bank_slip_number', 'notes'
    ]
    readonly_fields = [
        'final_amount_display', 'remaining_amount_display',
        'payment_percentage_display', 'created_at', 'updated_at'
    ]
    list_per_page = 25

    fieldsets = (
        ('Informações Básicas', {
            'fields': (
                'branch', 'description', 'supplier', 'category',
                'status', 'is_recurring', 'recurrence_frequency', 'recurring_parent'
            )
        }),
        ('Valores', {
            'fields': (
                'original_amount', 'discount', 'interest', 'fine',
                'paid_amount', 'final_amount_display', 'remaining_amount_display',
                'payment_percentage_display'
            )
        }),
        ('Datas', {
            'fields': ('issue_date', 'due_date', 'payment_date')
        }),
        ('Pagamento', {
            'fields': ('payment_method', 'invoice_numbers', 'bank_slip_number')
        }),
        ('Observações e Metadados', {
            'fields': ('notes', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    # === CAMPOS CALCULADOS NO ADMIN ===
    def final_amount_display(self, obj):
        return f"R$ {obj.final_amount:,.2f}"
    final_amount_display.short_description = "Valor Final"

    def paid_amount_display(self, obj):
        return f"R$ {obj.paid_amount:,.2f}"
    paid_amount_display.short_description = "Pago"

    def remaining_amount_display(self, obj):
        return f"R$ {obj.remaining_amount:,.2f}"
    remaining_amount_display.short_description = "Restante"

    def payment_percentage_display(self, obj):
        return f"{obj.payment_percentage:.1f}%"
    payment_percentage_display.short_description = "Percentual Pago"

    def status_colored(self, obj):
        color_map = {
            'pending': '#ffb300',
            'due': '#29b6f6',
            'overdue': '#e53935',
            'paid': '#43a047',
            'partially_paid': '#fb8c00',
            'cancelled': '#9e9e9e',
        }
        color = color_map.get(obj.status, '#000')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, obj.get_status_display()
        )
    status_colored.short_description = 'Status'

    # === AÇÕES PERSONALIZADAS ===
    actions = ['mark_as_paid_action', 'cancel_accounts']

    def mark_as_paid_action(self, request, queryset):
        """Marca contas selecionadas como pagas"""
        updated = 0
        for account in queryset:
            if account.status != 'paid':
                account.mark_as_paid()
                updated += 1
        messages.success(request, f'{updated} contas marcadas como pagas com sucesso.')
    mark_as_paid_action.short_description = 'Marcar como Paga'

    def cancel_accounts(self, request, queryset):
        """Cancela contas selecionadas"""
        updated = queryset.update(status='cancelled')
        messages.warning(request, f'{updated} contas canceladas.')
    cancel_accounts.short_description = 'Cancelar Contas Selecionadas'

    # === URLS PERSONALIZADAS PARA IMPORTAÇÃO/EXPORTAÇÃO ===
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('exportar-modelo/', self.admin_site.admin_view(self.exportar_modelo), name='payables_exportar_modelo'),
            path('importar-excel/', self.admin_site.admin_view(self.importar_excel_view), name='payables_importar_excel'),
        ]
        return custom_urls + urls

    def exportar_modelo(self, request):
        """View para download da planilha modelo"""
        return export_template_excel(request)

    def importar_excel_view(self, request):
        """View para importação do Excel"""
        if request.method == 'POST' and request.FILES.get('excel_file'):
            excel_file = request.FILES['excel_file']

            # Valida extensão
            if not excel_file.name.endswith(('.xlsx', '.xls')):
                messages.error(request, 'Por favor, envie um arquivo Excel (.xlsx ou .xls)')
                return redirect('..')

            # Obtém o tenant do usuário logado
            if not hasattr(request.user, 'tenant'):
                messages.error(request, 'Usuário sem tenant associado. Entre em contato com o administrador.')
                return redirect('..')

            tenant = request.user.tenant

            # Processa importação
            resultado = import_excel(request, excel_file, tenant)

            # Exibe mensagens
            if resultado['sucesso'] > 0:
                messages.success(request, f"{resultado['sucesso']} contas importadas com sucesso!")

            for aviso in resultado['avisos']:
                messages.warning(request, aviso)

            for erro in resultado['erros']:
                messages.error(request, erro)

            # Mostra resumo de criações
            if resultado['criados']['filiais']:
                messages.info(request, f"Filiais criadas: {', '.join(resultado['criados']['filiais'])}")
            if resultado['criados']['fornecedores']:
                messages.info(request, f"Fornecedores criados: {', '.join(resultado['criados']['fornecedores'])}")
            if resultado['criados']['categorias']:
                messages.info(request, f"Categorias criadas: {', '.join(resultado['criados']['categorias'])}")
            if resultado['criados']['metodos_pagamento']:
                messages.info(request, f"Métodos de pagamento criados: {', '.join(resultado['criados']['metodos_pagamento'])}")

            return redirect('..')

        # Se não for POST, redireciona
        return redirect('..')


@admin.register(PayablePayment)
class PayablePaymentAdmin(BaseAdmin):
    list_display = [
        'account_payable', 'payment_date', 'amount_display',
        'payment_method', 'paid_by_branch', 'transaction_number'
    ]
    list_filter = [
        'payment_method',
        'paid_by_branch',
        ('payment_date', admin.DateFieldListFilter)
    ]
    search_fields = [
        'account_payable__description', 'transaction_number',
        'paid_by_branch__name', 'notes'
    ]
    readonly_fields = ['created_at', 'updated_at']

    fieldsets = (
        ('Informações do Pagamento', {
            'fields': (
                'account_payable', 'payment_date', 'amount',
                'payment_method', 'paid_by_branch', 'transaction_number'
            )
        }),
        ('Observações e Metadados', {
            'fields': ('notes', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def amount_display(self, obj):
        return f"R$ {obj.amount:,.2f}"
    amount_display.short_description = "Valor Pago"

