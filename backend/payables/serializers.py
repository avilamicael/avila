from rest_framework import serializers
from decimal import Decimal
from datetime import timedelta
from dateutil.relativedelta import relativedelta

from .models import AccountPayable, PayablePayment
from core.models import Attachment
from registrations.serializers import (
    FilialListSerializer,
    SupplierListSerializer,
    CategoryListSerializer,
    PaymentMethodListSerializer,
)


class AttachmentSerializer(serializers.ModelSerializer):
    """Serializer para Anexos"""
    file_url = serializers.SerializerMethodField()
    size_display = serializers.SerializerMethodField()

    class Meta:
        model = Attachment
        fields = [
            'id',
            'file',
            'file_url',
            'original_filename',
            'file_size',
            'size_display',
            'file_type',
            'description',
            'order',
            'created_at',
        ]
        read_only_fields = ['id', 'file_size', 'file_type', 'original_filename', 'created_at']

    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
        return None

    def get_size_display(self, obj):
        return obj.get_file_size_display()


class AccountPayableListSerializer(serializers.ModelSerializer):
    """Serializer para listagem de contas a pagar"""
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_color = serializers.CharField(source='category.color', read_only=True)
    final_amount = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    remaining_amount = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    days_until_due = serializers.IntegerField(read_only=True)
    attachments_count = serializers.SerializerMethodField()

    class Meta:
        model = AccountPayable
        fields = [
            'id',
            'description',
            'branch',
            'branch_name',
            'supplier',
            'supplier_name',
            'category',
            'category_name',
            'category_color',
            'original_amount',
            'final_amount',
            'paid_amount',
            'remaining_amount',
            'due_date',
            'payment_date',
            'status',
            'is_recurring',
            'is_overdue',
            'days_until_due',
            'attachments_count',
            'created_at',
        ]

    def get_attachments_count(self, obj):
        return obj.get_attachments_count()


class AccountPayableDetailSerializer(serializers.ModelSerializer):
    """Serializer completo para detalhes de conta a pagar"""
    branch_detail = FilialListSerializer(source='branch', read_only=True)
    supplier_detail = SupplierListSerializer(source='supplier', read_only=True)
    category_detail = CategoryListSerializer(source='category', read_only=True)
    payment_method_detail = PaymentMethodListSerializer(source='payment_method', read_only=True)

    final_amount = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    remaining_amount = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    days_until_due = serializers.IntegerField(read_only=True)
    payment_percentage = serializers.FloatField(read_only=True)

    attachments = AttachmentSerializer(many=True, read_only=True)
    recurring_children_count = serializers.SerializerMethodField()

    class Meta:
        model = AccountPayable
        fields = [
            'id',
            'branch',
            'branch_detail',
            'supplier',
            'supplier_detail',
            'category',
            'category_detail',
            'description',
            'original_amount',
            'discount',
            'interest',
            'fine',
            'paid_amount',
            'final_amount',
            'remaining_amount',
            'issue_date',
            'due_date',
            'payment_date',
            'payment_method',
            'payment_method_detail',
            'status',
            'is_recurring',
            'recurrence_frequency',
            'recurring_parent',
            'recurring_children_count',
            'invoice_numbers',
            'bank_slip_number',
            'notes',
            'is_overdue',
            'days_until_due',
            'payment_percentage',
            'attachments',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'status', 'paid_amount', 'created_at', 'updated_at']

    def get_recurring_children_count(self, obj):
        if obj.is_recurring:
            return obj.recurring_children.count()
        return 0


class AccountPayableCreateSerializer(serializers.ModelSerializer):
    """Serializer para criação de conta a pagar com suporte a recorrência"""

    # Campos extras para recorrência
    recurrence_count = serializers.IntegerField(
        write_only=True,
        required=False,
        min_value=1,
        max_value=60,
        help_text="Quantidade de recorrências a serem geradas (máximo 60)"
    )

    # Campos para upload de anexos
    attachment_files = serializers.ListField(
        child=serializers.FileField(),
        write_only=True,
        required=False,
        help_text="Lista de arquivos para anexar"
    )

    class Meta:
        model = AccountPayable
        fields = [
            'branch',
            'supplier',
            'category',
            'description',
            'original_amount',
            'discount',
            'interest',
            'fine',
            'issue_date',
            'due_date',
            'payment_method',
            'is_recurring',
            'recurrence_frequency',
            'recurrence_count',
            'invoice_numbers',
            'bank_slip_number',
            'notes',
            'attachment_files',
        ]

    def validate(self, attrs):
        """Validações customizadas"""
        # Se é recorrente, deve ter frequência e contagem
        if attrs.get('is_recurring'):
            if not attrs.get('recurrence_frequency'):
                raise serializers.ValidationError({
                    'recurrence_frequency': 'Frequência é obrigatória para contas recorrentes.'
                })
            if not attrs.get('recurrence_count'):
                raise serializers.ValidationError({
                    'recurrence_count': 'Quantidade de recorrências é obrigatória.'
                })

        # Validar valores
        if attrs.get('discount', 0) > attrs.get('original_amount', 0):
            raise serializers.ValidationError({
                'discount': 'Desconto não pode ser maior que o valor original.'
            })

        return attrs

    def create(self, validated_data):
        """Cria conta a pagar e, se recorrente, cria as recorrências"""
        # Extrair dados extras
        recurrence_count = validated_data.pop('recurrence_count', None)
        attachment_files = validated_data.pop('attachment_files', [])

        # Associar tenant
        validated_data['tenant'] = self.context['request'].tenant

        # Criar conta principal
        account = AccountPayable.objects.create(**validated_data)

        # Criar anexos se houver
        if attachment_files:
            self._create_attachments(account, attachment_files)

        # Se é recorrente, criar as recorrências
        if validated_data.get('is_recurring') and recurrence_count:
            self._create_recurrences(account, recurrence_count)

        return account

    def _create_attachments(self, account, files):
        """Cria anexos para a conta"""
        user = self.context['request'].user
        for index, file in enumerate(files):
            Attachment.objects.create(
                content_object=account,
                file=file,
                uploaded_by=user,
                order=index
            )

    def _create_recurrences(self, parent_account, count):
        """Cria contas recorrentes baseadas na conta pai"""
        frequency_map = {
            'weekly': lambda d, n: d + timedelta(weeks=n),
            'biweekly': lambda d, n: d + timedelta(weeks=2*n),
            'monthly': lambda d, n: d + relativedelta(months=n),
            'bimonthly': lambda d, n: d + relativedelta(months=2*n),
            'quarterly': lambda d, n: d + relativedelta(months=3*n),
            'semiannual': lambda d, n: d + relativedelta(months=6*n),
            'annual': lambda d, n: d + relativedelta(years=n),
        }

        frequency_func = frequency_map.get(parent_account.recurrence_frequency)
        if not frequency_func:
            return

        # Criar as recorrências (a partir da 2ª, pois a 1ª é a conta original)
        for i in range(1, count):
            new_due_date = frequency_func(parent_account.due_date, i)
            new_issue_date = frequency_func(parent_account.issue_date, i)

            AccountPayable.objects.create(
                tenant=parent_account.tenant,
                branch=parent_account.branch,
                supplier=parent_account.supplier,
                category=parent_account.category,
                description=f"{parent_account.description} ({i+1}/{count})",
                original_amount=parent_account.original_amount,
                discount=parent_account.discount,
                interest=parent_account.interest,
                fine=parent_account.fine,
                issue_date=new_issue_date,
                due_date=new_due_date,
                payment_method=parent_account.payment_method,
                is_recurring=True,
                recurrence_frequency=parent_account.recurrence_frequency,
                recurring_parent=parent_account,
                invoice_numbers=parent_account.invoice_numbers,
                bank_slip_number=parent_account.bank_slip_number,
                notes=parent_account.notes,
            )


class PayablePaymentSerializer(serializers.ModelSerializer):
    """Serializer para pagamentos de conta"""
    attachments = AttachmentSerializer(many=True, read_only=True)
    attachment_files = serializers.ListField(
        child=serializers.FileField(),
        write_only=True,
        required=False
    )

    class Meta:
        model = PayablePayment
        fields = [
            'id',
            'account_payable',
            'payment_date',
            'amount',
            'payment_method',
            'notes',
            'bank_account',
            'transaction_number',
            'attachments',
            'attachment_files',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def validate_amount(self, value):
        """Valida que o valor do pagamento não excede o valor restante"""
        account = self.initial_data.get('account_payable')
        if account:
            try:
                account_obj = AccountPayable.objects.get(pk=account)
                if value > account_obj.remaining_amount:
                    raise serializers.ValidationError(
                        f"Valor do pagamento (R$ {value}) não pode ser maior que o valor restante (R$ {account_obj.remaining_amount})"
                    )
            except AccountPayable.DoesNotExist:
                pass
        return value

    def create(self, validated_data):
        """Cria pagamento e anexos"""
        attachment_files = validated_data.pop('attachment_files', [])
        validated_data['tenant'] = self.context['request'].tenant

        payment = PayablePayment.objects.create(**validated_data)

        # Criar anexos
        if attachment_files:
            user = self.context['request'].user
            for index, file in enumerate(attachment_files):
                Attachment.objects.create(
                    content_object=payment,
                    file=file,
                    uploaded_by=user,
                    order=index
                )

        return payment
