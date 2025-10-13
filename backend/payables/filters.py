import django_filters
from django.db.models import Q
from .models import AccountPayable


class AccountPayableFilter(django_filters.FilterSet):
    """
    Filtros avançados para Contas a Pagar

    Suporta filtros por:
    - Status (exato ou múltiplo)
    - Filial
    - Fornecedor
    - Categoria
    - Forma de Pagamento
    - Data de Vencimento (range)
    - Data de Pagamento (range)
    - Data de Emissão (range)
    - Valor (range)
    - Busca global (procura em múltiplos campos)
    - Contas vencidas
    - Contas a vencer em X dias
    """

    # Filtros por relacionamentos
    branch = django_filters.NumberFilter(field_name='branch__id')
    branch__in = django_filters.BaseInFilter(field_name='branch__id', lookup_expr='in')

    supplier = django_filters.NumberFilter(field_name='supplier__id')
    supplier__in = django_filters.BaseInFilter(field_name='supplier__id', lookup_expr='in')

    category = django_filters.NumberFilter(field_name='category__id')
    category__in = django_filters.BaseInFilter(field_name='category__id', lookup_expr='in')

    payment_method = django_filters.NumberFilter(field_name='payment_method__id')
    payment_method__in = django_filters.BaseInFilter(field_name='payment_method__id', lookup_expr='in')

    # Filtros de status
    status = django_filters.ChoiceFilter(
        choices=AccountPayable.STATUS_CHOICES
    )
    status__in = django_filters.BaseInFilter(
        field_name='status',
        lookup_expr='in'
    )

    # Filtros de data de vencimento
    due_date = django_filters.DateFilter(field_name='due_date')
    due_date__gte = django_filters.DateFilter(field_name='due_date', lookup_expr='gte')
    due_date__lte = django_filters.DateFilter(field_name='due_date', lookup_expr='lte')
    due_date__year = django_filters.NumberFilter(field_name='due_date__year')
    due_date__month = django_filters.NumberFilter(field_name='due_date__month')

    # Filtros de data de pagamento
    payment_date = django_filters.DateFilter(field_name='payment_date')
    payment_date__gte = django_filters.DateFilter(field_name='payment_date', lookup_expr='gte')
    payment_date__lte = django_filters.DateFilter(field_name='payment_date', lookup_expr='lte')
    payment_date__isnull = django_filters.BooleanFilter(field_name='payment_date', lookup_expr='isnull')

    # Filtros de data de emissão
    issue_date = django_filters.DateFilter(field_name='issue_date')
    issue_date__gte = django_filters.DateFilter(field_name='issue_date', lookup_expr='gte')
    issue_date__lte = django_filters.DateFilter(field_name='issue_date', lookup_expr='lte')

    # Filtros de valor
    original_amount = django_filters.NumberFilter(field_name='original_amount')
    original_amount__gte = django_filters.NumberFilter(field_name='original_amount', lookup_expr='gte')
    original_amount__lte = django_filters.NumberFilter(field_name='original_amount', lookup_expr='lte')

    paid_amount__gte = django_filters.NumberFilter(field_name='paid_amount', lookup_expr='gte')
    paid_amount__lte = django_filters.NumberFilter(field_name='paid_amount', lookup_expr='lte')

    # Filtro de recorrência
    is_recurring = django_filters.BooleanFilter(field_name='is_recurring')
    recurrence_frequency = django_filters.ChoiceFilter(
        field_name='recurrence_frequency',
        choices=AccountPayable.RECURRENCE_FREQUENCY_CHOICES
    )

    # Filtros especiais
    is_overdue = django_filters.BooleanFilter(
        method='filter_is_overdue',
        label='Está Vencida'
    )

    due_in_days = django_filters.NumberFilter(
        method='filter_due_in_days',
        label='Vence em X dias'
    )

    # Busca global - procura em múltiplos campos
    search = django_filters.CharFilter(
        method='filter_search',
        label='Busca Global'
    )

    class Meta:
        model = AccountPayable
        fields = {
            'description': ['exact', 'icontains'],
            'invoice_numbers': ['exact', 'icontains'],
            'bank_slip_number': ['exact', 'icontains'],
            'notes': ['icontains'],
        }

    def filter_is_overdue(self, queryset, name, value):
        """
        Filtra contas vencidas (status pendente/due/overdue e data < hoje)
        """
        from datetime import date
        if value:
            return queryset.filter(
                status__in=['pending', 'due', 'overdue'],
                due_date__lt=date.today()
            )
        return queryset

    def filter_due_in_days(self, queryset, name, value):
        """
        Filtra contas que vencem nos próximos X dias
        Exemplo: due_in_days=7 retorna contas que vencem nos próximos 7 dias
        """
        from datetime import date, timedelta
        if value:
            today = date.today()
            future_date = today + timedelta(days=value)
            return queryset.filter(
                status__in=['pending', 'due'],
                due_date__gte=today,
                due_date__lte=future_date
            )
        return queryset

    def filter_search(self, queryset, name, value):
        """
        Busca global - procura em múltiplos campos:
        - Descrição
        - Nome do fornecedor
        - Nome da categoria
        - Nome da filial
        - Números de nota fiscal
        - Número do boleto
        - Observações
        """
        if value:
            return queryset.filter(
                Q(description__icontains=value) |
                Q(supplier__name__icontains=value) |
                Q(category__name__icontains=value) |
                Q(branch__name__icontains=value) |
                Q(invoice_numbers__icontains=value) |
                Q(bank_slip_number__icontains=value) |
                Q(notes__icontains=value)
            )
        return queryset


class PayablePaymentFilter(django_filters.FilterSet):
    """
    Filtros para Pagamentos
    """
    account_payable = django_filters.NumberFilter(field_name='account_payable__id')
    payment_method = django_filters.NumberFilter(field_name='payment_method__id')
    paid_by_branch = django_filters.NumberFilter(field_name='paid_by_branch__id')
    paid_by_branch__in = django_filters.BaseInFilter(field_name='paid_by_branch__id', lookup_expr='in')

    # Filtros de data
    payment_date = django_filters.DateFilter(field_name='payment_date')
    payment_date__gte = django_filters.DateFilter(field_name='payment_date', lookup_expr='gte')
    payment_date__lte = django_filters.DateFilter(field_name='payment_date', lookup_expr='lte')
    payment_date__year = django_filters.NumberFilter(field_name='payment_date__year')
    payment_date__month = django_filters.NumberFilter(field_name='payment_date__month')

    # Filtros de valor
    amount__gte = django_filters.NumberFilter(field_name='amount', lookup_expr='gte')
    amount__lte = django_filters.NumberFilter(field_name='amount', lookup_expr='lte')

    # Busca
    search = django_filters.CharFilter(method='filter_search')

    class Meta:
        model = AccountPayable
        fields = ['account_payable', 'payment_method', 'paid_by_branch']

    def filter_search(self, queryset, name, value):
        """Busca em notas, número de transação, descrição da conta e nome da filial"""
        if value:
            return queryset.filter(
                Q(notes__icontains=value) |
                Q(transaction_number__icontains=value) |
                Q(account_payable__description__icontains=value) |
                Q(paid_by_branch__name__icontains=value)
            )
        return queryset
