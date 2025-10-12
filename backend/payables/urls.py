from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AccountPayableViewSet,
    PayablePaymentViewSet,
)

router = DefaultRouter()
router.register(r'accounts-payable', AccountPayableViewSet, basename='accountpayable')
router.register(r'payable-payments', PayablePaymentViewSet, basename='payablepayment')

urlpatterns = [
    path('', include(router.urls)),
]
