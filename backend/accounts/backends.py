from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model
from django.db.models import Q

User = get_user_model()


class EmailBackend(ModelBackend):
    """
    Backend de autenticação que permite login com email
    """
    def authenticate(self, request, email=None, password=None, **kwargs):
        try:
            # Busca o usuário pelo email
            user = User.objects.get(email=email.lower())
            
            # Verifica a senha
            if user.check_password(password):
                return user
        except User.DoesNotExist:
            # Executa o hash de senha padrão para prevenir timing attacks
            User().set_password(password)
            return None
        except Exception:
            return None
    
    def get_user(self, user_id):
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None
