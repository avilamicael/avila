from django.db import models
from django.core.validators import MinValueValidator, RegexValidator
from django.contrib.contenttypes.fields import GenericRelation
from django.utils import timezone
from decimal import Decimal
from datetime import date

from core.models import TenantAwareModel, SoftDeleteModel, UppercaseMixin
from registrations.models import Supplier, Category, PaymentMethod, Filial


class AccountPayable(UppercaseMixin, TenantAwareModel, SoftDeleteModel):
    """
    Modelo para gerenciar contas a pagar com suporte a:
    - Pagamento único
    - Recorrência
    - Múltiplos anexos (notas fiscais, boletos, comprovantes)

    Exemplo de uso de anexos:
        # Adicionar anexo
        from core.models import Attachment
        attachment = Attachment.objects.create(
            content_object=account_payable,
            file=arquivo,
            uploaded_by=user
        )

        # Listar anexos
        anexos = account_payable.attachments.all()

        # Contar anexos
        total = account_payable.get_attachments_count()

        # Filtrar por tipo
        pdfs = account_payable.get_attachments_by_type('pdf')
    """

    uppercase_fields = ['description', 'invoice_numbers', 'notes']

    STATUS_CHOICES = [
        ('pending', 'Pendente'),
        ('due', 'À Vencer'),
        ('overdue', 'Vencida'),
        ('paid', 'Paga'),
        ('partially_paid', 'Paga Parcialmente'),
        ('cancelled', 'Cancelada'),
    ]

    RECURRENCE_FREQUENCY_CHOICES = [
        ('weekly', 'Semanal'),
        ('biweekly', 'Quinzenal'),
        ('monthly', 'Mensal'),
        ('bimonthly', 'Bimestral'),
        ('quarterly', 'Trimestral'),
        ('semiannual', 'Semestral'),
        ('annual', 'Anual'),
    ]

    # FILIAL - Campo obrigatório para isolamento por filial
    branch = models.ForeignKey(
        Filial,
        on_delete=models.PROTECT,
        verbose_name='Filial',
        related_name='accounts_payable',
        help_text='Filial responsável por esta conta'
    )

    # Informações básicas
    description = models.CharField('Descrição', max_length=200)
    supplier = models.ForeignKey(
        Supplier,
        on_delete=models.PROTECT,
        verbose_name='Fornecedor',
        related_name='accounts_payable'
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        verbose_name='Categoria',
        related_name='accounts_payable'
    )

    # Valores
    original_amount = models.DecimalField(
        'Valor Original',
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    discount = models.DecimalField(
        'Desconto',
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0'))]
    )
    interest = models.DecimalField(
        'Juros',
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0'))]
    )
    fine = models.DecimalField(
        'Multa',
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0'))]
    )
    paid_amount = models.DecimalField(
        'Valor Pago',
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0'))]
    )

    # Datas
    issue_date = models.DateField(
        'Data de Emissão',
        default=timezone.now
    )
    due_date = models.DateField('Data de Vencimento')
    payment_date = models.DateField('Data de Pagamento', null=True, blank=True)

    # Pagamento
    payment_method = models.ForeignKey(
        PaymentMethod,
        on_delete=models.PROTECT,
        verbose_name='Forma de Pagamento',
        related_name='accounts_payable',
        null=True,
        blank=True
    )
    status = models.CharField(
        'Status',
        max_length=20,
        choices=STATUS_CHOICES,
        default='due'
    )

    # Recorrência
    is_recurring = models.BooleanField('É Recorrente?', default=False)
    recurrence_frequency = models.CharField(
        'Frequência de Recorrência',
        max_length=20,
        choices=RECURRENCE_FREQUENCY_CHOICES,
        null=True,
        blank=True
    )
    recurring_parent = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='recurring_children',
        verbose_name='Conta Recorrente Pai',
        help_text='Referência à conta original que gerou esta recorrência'
    )

    # Documentos
    invoice_numbers = models.CharField(
        'Notas Fiscais',
        max_length=200,
        blank=True,
        validators=[
            RegexValidator(
                regex=r'^[\d,\s]*$',
                message='Notas fiscais devem conter apenas números, vírgulas e espaços'
            )
        ],
        help_text='Ex: 123, 456, 789'
    )
    bank_slip_number = models.CharField(
        'Número do Boleto',
        max_length=100,
        blank=True,
        validators=[
            RegexValidator(
                regex=r'^\d*$',
                message='Número do boleto deve conter apenas números'
            )
        ],
        help_text='Somente números'
    )

    # Outros
    notes = models.TextField('Observações', blank=True)

    # Anexos (usa o modelo genérico Attachment do core)
    attachments = GenericRelation('core.Attachment', related_query_name='account_payable')

    class Meta:
        verbose_name = 'Conta a Pagar'
        verbose_name_plural = 'Contas a Pagar'
        ordering = ['-due_date', '-created_at']
        indexes = [
            models.Index(fields=['tenant', 'branch', 'status']),
            models.Index(fields=['tenant', 'branch', 'due_date']),
            models.Index(fields=['tenant', 'branch', 'supplier']),
            models.Index(fields=['tenant', 'status', 'due_date']),
        ]

    def __str__(self):
        branch_info = f"[{self.branch.name}]" if self.branch else ""
        return f"{branch_info} {self.description}"

    def save(self, *args, **kwargs):
        # Atualizar status baseado no valor pago
        if self.paid_amount is not None and self.paid_amount > 0:
            if self.final_amount is not None and self.paid_amount >= self.final_amount:
                self.status = 'paid'
                if not self.payment_date:
                    self.payment_date = date.today()
            else:
                self.status = 'partially_paid'
        elif self.status in ['pending', 'due'] and self.due_date and self.due_date < date.today():
            self.status = 'overdue'

        super().save(*args, **kwargs)

    @property
    def final_amount(self):
        """Calcula: Valor Original - Desconto + Juros + Multa"""
        return self.original_amount - self.discount + self.interest + self.fine

    @property
    def remaining_amount(self):
        """Retorna o valor restante a pagar"""
        final = Decimal(str(self.final_amount)) if self.final_amount else Decimal('0')
        paid = Decimal(str(self.paid_amount)) if self.paid_amount else Decimal('0')
        return max(final - paid, Decimal('0'))

    @property
    def is_overdue(self):
        """Verifica se a conta está vencida"""
        return self.status in ['pending', 'due'] and self.due_date < date.today()

    @property
    def days_until_due(self):
        """Retorna quantos dias faltam para o vencimento (negativo se vencido)"""
        if self.due_date:
            delta = self.due_date - date.today()
            return delta.days
        return None

    @property
    def payment_percentage(self):
        """Retorna o percentual pago"""
        if self.final_amount > 0:
            return (self.paid_amount / self.final_amount) * 100
        return 0

    def mark_as_paid(self, payment_date=None, payment_method=None):
        """Marca a conta como paga"""
        self.paid_amount = self.final_amount
        self.payment_date = payment_date or date.today()
        if payment_method:
            self.payment_method = payment_method
        self.status = 'paid'
        self.save()

    def cancel(self):
        """Cancela a conta"""
        self.status = 'cancelled'
        self.save()

    def get_attachments_count(self):
        """Retorna o número de anexos"""
        return self.attachments.count()

    def get_attachments_by_type(self, file_type):
        """
        Retorna anexos filtrados por tipo
        Exemplo: account.get_attachments_by_type('pdf')
        """
        return self.attachments.filter(file_type__icontains=file_type)


class PayablePayment(TenantAwareModel):
    """
    Modelo para registrar pagamentos parciais de uma conta a pagar.
    Suporta múltiplos anexos (comprovantes, recibos).
    """
    account_payable = models.ForeignKey(
        AccountPayable,
        on_delete=models.CASCADE,
        related_name='payments',
        verbose_name='Conta a Pagar'
    )
    payment_date = models.DateField('Data do Pagamento', default=timezone.now)
    amount = models.DecimalField(
        'Valor Pago',
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    payment_method = models.ForeignKey(
        PaymentMethod,
        on_delete=models.PROTECT,
        verbose_name='Forma de Pagamento',
        related_name='payable_payments'
    )
    notes = models.TextField('Observações', blank=True)

    # Informações bancárias
    bank_account = models.CharField('Conta Bancária', max_length=100, blank=True)
    transaction_number = models.CharField('Número da Transação', max_length=100, blank=True)

    # Anexos (comprovantes de pagamento)
    attachments = GenericRelation('core.Attachment', related_query_name='payable_payment')

    class Meta:
        verbose_name = 'Pagamento de Conta'
        verbose_name_plural = 'Pagamentos de Contas'
        ordering = ['-payment_date', '-created_at']
        indexes = [
            models.Index(fields=['tenant', 'account_payable']),
            models.Index(fields=['tenant', 'payment_date']),
        ]

    def __str__(self):
        return f"Pagamento de R$ {self.amount} - {self.account_payable.description}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Atualizar o valor pago na conta principal
        self.update_account_paid_amount()

    def update_account_paid_amount(self):
        """Atualiza o valor total pago na conta a pagar"""
        total_paid = self.account_payable.payments.aggregate(
            total=models.Sum('amount')
        )['total'] or Decimal('0.00')

        self.account_payable.paid_amount = total_paid
        self.account_payable.save()
