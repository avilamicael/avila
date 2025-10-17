from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Sum
from datetime import date, timedelta

from .models import AccountPayable, PayablePayment
from .serializers import (
    AccountPayableListSerializer,
    AccountPayableDetailSerializer,
    AccountPayableCreateSerializer,
    PayablePaymentSerializer,
)
from .filters import AccountPayableFilter, PayablePaymentFilter
from core.models import Attachment
from core.pagination import LargeResultsSetPagination


class AccountPayableViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciar Contas a Pagar

    Endpoints:
    - GET /api/accounts-payable/ - Lista contas a pagar
    - GET /api/accounts-payable/dashboard/ - Dashboard com estatísticas
    - GET /api/accounts-payable/overdue/ - Lista contas vencidas
    - POST /api/accounts-payable/ - Cria nova conta (com suporte a recorrência)
    - GET /api/accounts-payable/{id}/ - Detalhes de uma conta
    - PUT/PATCH /api/accounts-payable/{id}/ - Atualiza conta
    - DELETE /api/accounts-payable/{id}/ - Soft delete
    - POST /api/accounts-payable/{id}/mark_as_paid/ - Marca como paga
    - POST /api/accounts-payable/{id}/cancel/ - Cancela conta
    - POST /api/accounts-payable/{id}/add_attachment/ - Adiciona anexo
    """
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    pagination_class = LargeResultsSetPagination  # Permite page_size customizado
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_class = AccountPayableFilter
    ordering_fields = ['due_date', 'created_at', 'original_amount', 'payment_date', 'paid_amount']
    ordering = ['-due_date']

    def get_queryset(self):
        """Retorna apenas contas do tenant do usuário"""
        return AccountPayable.objects.filter(
            tenant=self.request.tenant,
            is_active=True
        ).select_related('branch', 'supplier', 'category', 'payment_method')

    def get_serializer_class(self):
        """Retorna serializer adequado para cada ação"""
        if self.action == 'create':
            return AccountPayableCreateSerializer
        elif self.action in ['retrieve', 'update', 'partial_update']:
            return AccountPayableDetailSerializer
        return AccountPayableListSerializer

    def perform_destroy(self, instance):
        """Soft delete"""
        instance.delete(user=self.request.user)

    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """
        Retorna estatísticas para dashboard
        """
        queryset = self.get_queryset()
        today = date.today()

        # Estatísticas gerais
        stats = {
            'total_pending': queryset.filter(status__in=['pending', 'due', 'overdue']).count(),
            'total_overdue': queryset.filter(status='overdue').count(),
            'total_paid_this_month': queryset.filter(
                status='paid',
                payment_date__year=today.year,
                payment_date__month=today.month
            ).count(),

            # Valores
            'amount_pending': queryset.filter(
                status__in=['pending', 'due', 'overdue']
            ).aggregate(
                total=Sum('original_amount')
            )['total'] or 0,

            'amount_overdue': queryset.filter(
                status='overdue'
            ).aggregate(
                total=Sum('original_amount')
            )['total'] or 0,

            'amount_paid_this_month': queryset.filter(
                status='paid',
                payment_date__year=today.year,
                payment_date__month=today.month
            ).aggregate(
                total=Sum('paid_amount')
            )['total'] or 0,

            # Próximos vencimentos (próximos 7 dias)
            'due_next_7_days': queryset.filter(
                status__in=['pending', 'due'],
                due_date__gte=today,
                due_date__lte=today + timedelta(days=7)
            ).count(),

            'amount_due_next_7_days': queryset.filter(
                status__in=['pending', 'due'],
                due_date__gte=today,
                due_date__lte=today + timedelta(days=7)
            ).aggregate(
                total=Sum('original_amount')
            )['total'] or 0,
        }

        # Top 5 fornecedores com mais contas pendentes
        top_suppliers = queryset.filter(
            status__in=['pending', 'due', 'overdue']
        ).values(
            'supplier__id',
            'supplier__name'
        ).annotate(
            count=Sum('id'),
            total_amount=Sum('original_amount')
        ).order_by('-total_amount')[:5]

        stats['top_suppliers'] = list(top_suppliers)

        return Response(stats)

    @action(detail=False, methods=['get'])
    def overdue(self, request):
        """Retorna apenas contas vencidas"""
        queryset = self.get_queryset().filter(status='overdue')
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def mark_as_paid(self, request, pk=None):
        """Marca uma conta como paga"""
        account = self.get_object()
        payment_date = request.data.get('payment_date', None)
        payment_method_id = request.data.get('payment_method', None)

        try:
            from registrations.models import PaymentMethod
            payment_method = PaymentMethod.objects.get(pk=payment_method_id) if payment_method_id else None
            account.mark_as_paid(payment_date=payment_date, payment_method=payment_method)

            serializer = self.get_serializer(account)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancela uma conta"""
        account = self.get_object()
        account.cancel()
        serializer = self.get_serializer(account)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def add_attachment(self, request, pk=None):
        """Adiciona anexo a uma conta"""
        account = self.get_object()
        file = request.FILES.get('file')
        description = request.data.get('description', '')

        if not file:
            return Response(
                {'error': 'Arquivo é obrigatório'},
                status=status.HTTP_400_BAD_REQUEST
            )

        attachment = Attachment.objects.create(
            content_object=account,
            file=file,
            description=description,
            uploaded_by=request.user
        )

        from .serializers import AttachmentSerializer
        serializer = AttachmentSerializer(attachment, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class PayablePaymentViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciar Pagamentos de Contas a Pagar

    Endpoints:
    - GET /api/payable-payments/ - Lista pagamentos
    - POST /api/payable-payments/ - Registra novo pagamento
    - GET /api/payable-payments/{id}/ - Detalhes de um pagamento
    - DELETE /api/payable-payments/{id}/ - Remove pagamento
    """
    serializer_class = PayablePaymentSerializer
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_class = PayablePaymentFilter
    ordering_fields = ['payment_date', 'created_at', 'amount']
    ordering = ['-payment_date']

    def get_queryset(self):
        """Retorna apenas pagamentos do tenant do usuário"""
        return PayablePayment.objects.filter(
            tenant=self.request.tenant
        ).select_related('account_payable', 'payment_method', 'paid_by_branch')

    def perform_destroy(self, instance):
        """
        Ao deletar um pagamento, recalcula o valor pago da conta
        """
        account = instance.account_payable
        instance.delete()  # Delete físico mesmo

        # Recalcular total pago
        total_paid = account.payments.aggregate(
            total=Sum('amount')
        )['total'] or 0

        account.paid_amount = total_paid
        account.save()
