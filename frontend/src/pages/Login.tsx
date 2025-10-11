import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '@/components/login-form';
import { useAuth } from '@/hooks/useAuth';
import LoginImage from '@/assets/login.png';

export default function Login() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  // Se já estiver autenticado, redireciona para a home
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Enquanto carrega, mostra loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="relative min-h-screen flex items-center justify-center">
          <div className="w-full max-w-xs">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold text-gray-900">Avila</h1>
              <p className="text-gray-600 mt-2">Sistema de Gestão</p>
            </div>
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <img
          src={LoginImage}
          alt="Login"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  );
}
