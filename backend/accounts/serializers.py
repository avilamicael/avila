from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User


class UserSerializer(serializers.ModelSerializer):
    """Serializer para representação do usuário"""
    tenant_id = serializers.IntegerField(source='tenant.id', read_only=True, allow_null=True)
    tenant_name = serializers.CharField(source='tenant.name', read_only=True, allow_null=True)
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'phone', 'position', 'avatar', 'is_tenant_admin',
            'tenant_id', 'tenant_name', 'date_joined', 'last_login'
        )
        read_only_fields = ('id', 'date_joined', 'last_login')

    def get_full_name(self, obj):
        return obj.get_full_name()


class LoginSerializer(serializers.Serializer):
    """Serializer para login de usuários"""

    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True)
    remember_me = serializers.BooleanField(required=False, default=False)


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer para mudança de senha"""

    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(
        required=True,
        write_only=True,
        validators=[validate_password]
    )
    new_password2 = serializers.CharField(required=True, write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password2']:
            raise serializers.ValidationError({
                "new_password": "Os campos de senha não coincidem."
            })
        return attrs
