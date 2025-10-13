from django.contrib import admin, messages
from django.utils.html import format_html
from django.db.models import Sum
from django.utils import timezone

from core.admin import BaseAdmin
from .models import AccountPayable, PayablePayment


@admin.register(AccountPayable)
class AccountPayableAdmin(BaseAdmin):
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

