from rest_framework import serializers
from .models import Supplier, Category, PaymentMethod, Filial


class FilialSerializer(serializers.ModelSerializer):
    """Serializer para Filial"""

    class Meta:
        model = Filial
        fields = [
            'id',
            'name',
            'cnpj',
            'notes',
            'bank_account_name',
            'bank_account_description',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'tenant']

    def validate_cnpj(self, value):
        """Valida CNPJ único por tenant"""
        tenant = self.context['request'].tenant
        instance = self.instance

        # Remove caracteres não numéricos
        cnpj_clean = ''.join(filter(str.isdigit, value))

        # Verifica duplicidade
        queryset = Filial.objects.filter(tenant=tenant, cnpj=cnpj_clean)
        if instance:
            queryset = queryset.exclude(pk=instance.pk)

        if queryset.exists():
            raise serializers.ValidationError("Já existe uma filial com este CNPJ.")

        return cnpj_clean


class SupplierSerializer(serializers.ModelSerializer):
    """Serializer para Fornecedor"""

    class Meta:
        model = Supplier
        fields = [
            'id',
            'name',
            'cnpj',
            'email',
            'phone',
            'address',
            'notes',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'tenant']

    def validate_cnpj(self, value):
        """Valida CNPJ único por tenant"""
        tenant = self.context['request'].tenant
        instance = self.instance

        # Remove caracteres não numéricos
        cnpj_clean = ''.join(filter(str.isdigit, value))

        # Verifica duplicidade
        queryset = Supplier.objects.filter(tenant=tenant, cnpj=cnpj_clean)
        if instance:
            queryset = queryset.exclude(pk=instance.pk)

        if queryset.exists():
            raise serializers.ValidationError("Já existe um fornecedor com este CNPJ.")

        return cnpj_clean


class CategorySerializer(serializers.ModelSerializer):
    """Serializer para Categoria"""

    class Meta:
        model = Category
        fields = [
            'id',
            'name',
            'description',
            'color',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'tenant']

    def validate_name(self, value):
        """Valida nome único por tenant"""
        tenant = self.context['request'].tenant
        instance = self.instance

        queryset = Category.objects.filter(tenant=tenant, name__iexact=value)
        if instance:
            queryset = queryset.exclude(pk=instance.pk)

        if queryset.exists():
            raise serializers.ValidationError("Já existe uma categoria com este nome.")

        return value


class PaymentMethodSerializer(serializers.ModelSerializer):
    """Serializer para Forma de Pagamento"""

    class Meta:
        model = PaymentMethod
        fields = [
            'id',
            'name',
            'description',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'tenant']

    def validate_name(self, value):
        """Valida nome único por tenant"""
        tenant = self.context['request'].tenant
        instance = self.instance

        queryset = PaymentMethod.objects.filter(tenant=tenant, name__iexact=value)
        if instance:
            queryset = queryset.exclude(pk=instance.pk)

        if queryset.exists():
            raise serializers.ValidationError("Já existe uma forma de pagamento com este nome.")

        return value


# Serializers simplificados para listagens em dropdowns
class FilialListSerializer(serializers.ModelSerializer):
    """Serializer simples para listagem em dropdowns"""
    class Meta:
        model = Filial
        fields = ['id', 'name', 'cnpj', 'bank_account_name', 'bank_account_description']


class SupplierListSerializer(serializers.ModelSerializer):
    """Serializer simples para listagem em dropdowns"""
    class Meta:
        model = Supplier
        fields = ['id', 'name', 'cnpj']


class CategoryListSerializer(serializers.ModelSerializer):
    """Serializer simples para listagem em dropdowns"""
    class Meta:
        model = Category
        fields = ['id', 'name', 'color']


class PaymentMethodListSerializer(serializers.ModelSerializer):
    """Serializer simples para listagem em dropdowns"""
    class Meta:
        model = PaymentMethod
        fields = ['id', 'name']
