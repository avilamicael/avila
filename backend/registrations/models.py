from django.db import models
from django.core.validators import MinLengthValidator
from core.models import TenantAwareModel, SoftDeleteModel, UppercaseMixin


class Supplier(UppercaseMixin, TenantAwareModel, SoftDeleteModel):
    """Modelo para Fornecedores"""

    uppercase_fields = ['name', 'address', 'notes']

    name = models.CharField('Nome', max_length=200)
    cnpj = models.CharField(
        'CNPJ',
        max_length=18,
        validators=[MinLengthValidator(14)],
        help_text="CNPJ do fornecedor"
    )
    email = models.EmailField('E-mail', blank=True)
    phone = models.CharField('Telefone', max_length=20, blank=True)
    address = models.TextField('Endereço', blank=True)
    notes = models.TextField('Observações', blank=True)

    class Meta:
        verbose_name = 'Fornecedor'
        verbose_name_plural = 'Fornecedores'
        ordering = ['name']
        unique_together = [['tenant', 'cnpj']]
        indexes = [
            models.Index(fields=['tenant', 'name']),
            models.Index(fields=['tenant', 'cnpj']),
            models.Index(fields=['tenant', 'is_active']),
        ]

    def __str__(self):
        return f"{self.name} ({self.cnpj})"


class Category(UppercaseMixin, TenantAwareModel, SoftDeleteModel):
    """Modelo para Categorias de Despesas"""

    uppercase_fields = ['name', 'description']

    name = models.CharField('Nome', max_length=100)
    description = models.TextField('Descrição', blank=True)
    color = models.CharField('Cor', max_length=7, blank=True, help_text='Código hexadecimal da cor (ex: #FF5733)')

    class Meta:
        verbose_name = 'Categoria'
        verbose_name_plural = 'Categorias'
        ordering = ['name']
        unique_together = [['tenant', 'name']]
        indexes = [
            models.Index(fields=['tenant', 'name']),
            models.Index(fields=['tenant', 'is_active']),
        ]

    def __str__(self):
        return self.name


class PaymentMethod(UppercaseMixin, TenantAwareModel, SoftDeleteModel):
    """Modelo para Métodos de Pagamento"""

    uppercase_fields = ['name', 'description']

    name = models.CharField('Nome', max_length=100)
    description = models.TextField('Descrição', blank=True)

    class Meta:
        verbose_name = 'Método de Pagamento'
        verbose_name_plural = 'Métodos de Pagamento'
        ordering = ['name']
        unique_together = [['tenant', 'name']]
        indexes = [
            models.Index(fields=['tenant', 'name']),
            models.Index(fields=['tenant', 'is_active']),
        ]

    def __str__(self):
        return self.name


class Filial(UppercaseMixin, TenantAwareModel, SoftDeleteModel):
    """Modelo para Filiais"""

    uppercase_fields = ['name', 'notes']

    name = models.CharField('Nome', max_length=100)
    cnpj = models.CharField(
        'CNPJ',
        max_length=18,
        validators=[MinLengthValidator(14)],
        help_text="CNPJ da filial"
    )
    notes = models.TextField('Observações', blank=True)

    class Meta:
        verbose_name = 'Filial'
        verbose_name_plural = 'Filiais'
        ordering = ['name']
        unique_together = [['tenant', 'cnpj']]
        indexes = [
            models.Index(fields=['tenant', 'name']),
            models.Index(fields=['tenant', 'cnpj']),
            models.Index(fields=['tenant', 'is_active']),
        ]

    def __str__(self):
        return f"{self.name} ({self.cnpj})"
