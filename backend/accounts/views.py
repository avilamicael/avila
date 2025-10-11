from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from datetime import timedelta

from .serializers import (
    UserSerializer,
    LoginSerializer,
    ChangePasswordSerializer
)


class LoginView(APIView):
    """View para login de usuários"""

    permission_classes = (AllowAny,)
    serializer_class = LoginSerializer

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        password = serializer.validated_data['password']
        remember_me = serializer.validated_data.get('remember_me', False)

        # Autentica usando email
        user = authenticate(request, email=email, password=password)

        if user is not None:
            refresh = RefreshToken.for_user(user)

            # Se "lembrar-me" estiver ativo, aumenta a validade dos tokens
            if remember_me:
                # Aumenta a validade do refresh token para 30 dias
                refresh.set_exp(lifetime=timedelta(days=30))
                # Aumenta a validade do access token para 24 horas
                refresh.access_token.set_exp(lifetime=timedelta(hours=24))

            return Response({
                'user': UserSerializer(user).data,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'message': 'Login realizado com sucesso!'
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': 'Credenciais inválidas.'
            }, status=status.HTTP_401_UNAUTHORIZED)


class LogoutView(APIView):
    """View para logout de usuários"""

    permission_classes = (IsAuthenticated,)

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
                return Response({
                    'message': 'Logout realizado com sucesso!'
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'error': 'Refresh token é obrigatório.'
                }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class UserDetailView(generics.RetrieveUpdateAPIView):
    """View para detalhes e atualização do usuário autenticado"""

    permission_classes = (IsAuthenticated,)
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class ChangePasswordView(APIView):
    """View para mudança de senha"""

    permission_classes = (IsAuthenticated,)

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user

        # Verifica a senha antiga
        if not user.check_password(serializer.validated_data['old_password']):
            return Response({
                'error': 'Senha antiga incorreta.'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Define a nova senha
        user.set_password(serializer.validated_data['new_password'])
        user.save()

        return Response({
            'message': 'Senha alterada com sucesso!'
        }, status=status.HTTP_200_OK)
