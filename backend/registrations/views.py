from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from .models import Supplier, Category, PaymentMethod, Filial
from .serializers import (
    SupplierSerializer,
    CategorySerializer,
    PaymentMethodSerializer,
    FilialSerializer,
    SupplierListSerializer,
    CategoryListSerializer,
    PaymentMethodListSerializer,
    FilialListSerializer,
)


class FilialViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciar Filiais
    Endpoints:
    - GET /api/filials/ - Lista todas as filiais
    - GET /api/filials/dropdown/ - Lista simplificada para dropdown
    - POST /api/filials/ - Cria nova filial
    - GET /api/filials/{id}/ - Detalhes de uma filial
    - PUT/PATCH /api/filials/{id}/ - Atualiza filial
    - DELETE /api/filials/{id}/ - Soft delete (inativa)
    """
    serializer_class = FilialSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['name', 'cnpj']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

    def get_queryset(self):
        """Retorna apenas filiais do tenant do usuário"""
        return Filial.objects.filter(tenant=self.request.tenant)

    def perform_create(self, serializer):
        """Associa o tenant ao criar"""
        serializer.save(tenant=self.request.tenant)

    def perform_destroy(self, instance):
        """Soft delete - apenas inativa"""
        instance.delete(user=self.request.user)

    @action(detail=False, methods=['get'])
    def dropdown(self, request):
        """Retorna lista simplificada para usar em dropdowns"""
        queryset = self.filter_queryset(self.get_queryset()).filter(is_active=True)
        serializer = FilialListSerializer(queryset, many=True)
        return Response(serializer.data)


class SupplierViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciar Fornecedores
    Endpoints:
    - GET /api/suppliers/ - Lista todos os fornecedores
    - GET /api/suppliers/dropdown/ - Lista simplificada para dropdown
    - POST /api/suppliers/ - Cria novo fornecedor
    - GET /api/suppliers/{id}/ - Detalhes de um fornecedor
    - PUT/PATCH /api/suppliers/{id}/ - Atualiza fornecedor
    - DELETE /api/suppliers/{id}/ - Soft delete (inativa)
    """
    serializer_class = SupplierSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['name', 'cnpj', 'email']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

    def get_queryset(self):
        """Retorna apenas fornecedores do tenant do usuário"""
        return Supplier.objects.filter(tenant=self.request.tenant)

    def perform_create(self, serializer):
        """Associa o tenant ao criar"""
        serializer.save(tenant=self.request.tenant)

    def perform_destroy(self, instance):
        """Soft delete - apenas inativa"""
        instance.delete(user=self.request.user)

    @action(detail=False, methods=['get'])
    def dropdown(self, request):
        """Retorna lista simplificada para usar em dropdowns"""
        queryset = self.filter_queryset(self.get_queryset()).filter(is_active=True)
        serializer = SupplierListSerializer(queryset, many=True)
        return Response(serializer.data)


class CategoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciar Categorias
    Endpoints:
    - GET /api/categories/ - Lista todas as categorias
    - GET /api/categories/dropdown/ - Lista simplificada para dropdown
    - POST /api/categories/ - Cria nova categoria
    - GET /api/categories/{id}/ - Detalhes de uma categoria
    - PUT/PATCH /api/categories/{id}/ - Atualiza categoria
    - DELETE /api/categories/{id}/ - Soft delete (inativa)
    """
    serializer_class = CategorySerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

    def get_queryset(self):
        """Retorna apenas categorias do tenant do usuário"""
        return Category.objects.filter(tenant=self.request.tenant)

    def perform_create(self, serializer):
        """Associa o tenant ao criar"""
        serializer.save(tenant=self.request.tenant)

    def perform_destroy(self, instance):
        """Soft delete - apenas inativa"""
        instance.delete(user=self.request.user)

    @action(detail=False, methods=['get'])
    def dropdown(self, request):
        """Retorna lista simplificada para usar em dropdowns"""
        queryset = self.filter_queryset(self.get_queryset()).filter(is_active=True)
        serializer = CategoryListSerializer(queryset, many=True)
        return Response(serializer.data)


class PaymentMethodViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciar Formas de Pagamento
    Endpoints:
    - GET /api/payment-methods/ - Lista todas as formas de pagamento
    - GET /api/payment-methods/dropdown/ - Lista simplificada para dropdown
    - POST /api/payment-methods/ - Cria nova forma de pagamento
    - GET /api/payment-methods/{id}/ - Detalhes de uma forma de pagamento
    - PUT/PATCH /api/payment-methods/{id}/ - Atualiza forma de pagamento
    - DELETE /api/payment-methods/{id}/ - Soft delete (inativa)
    """
    serializer_class = PaymentMethodSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active', 'requires_authorization']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

    def get_queryset(self):
        """Retorna apenas formas de pagamento do tenant do usuário"""
        return PaymentMethod.objects.filter(tenant=self.request.tenant)

    def perform_create(self, serializer):
        """Associa o tenant ao criar"""
        serializer.save(tenant=self.request.tenant)

    def perform_destroy(self, instance):
        """Soft delete - apenas inativa"""
        instance.delete(user=self.request.user)

    @action(detail=False, methods=['get'])
    def dropdown(self, request):
        """Retorna lista simplificada para usar em dropdowns"""
        queryset = self.filter_queryset(self.get_queryset()).filter(is_active=True)
        serializer = PaymentMethodListSerializer(queryset, many=True)
        return Response(serializer.data)
