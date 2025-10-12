from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    FilialViewSet,
    SupplierViewSet,
    CategoryViewSet,
    PaymentMethodViewSet,
)

router = DefaultRouter()
router.register(r'filials', FilialViewSet, basename='filial')
router.register(r'suppliers', SupplierViewSet, basename='supplier')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'payment-methods', PaymentMethodViewSet, basename='paymentmethod')

urlpatterns = [
    path('', include(router.urls)),
]
