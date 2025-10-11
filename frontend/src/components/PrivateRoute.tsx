import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface PrivateRouteProps {
  children: React.ReactNode;
}

/**
 * Componente para proteger rotas que requerem autenticação
 * Redireciona para /login se o usuário não estiver autenticado
 */
export function PrivateRoute({ children }: PrivateRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Enquanto estiver carregando, pode mostrar um loading spinner
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

  // Se não estiver autenticado, redireciona para login
  // Salva a localização atual para redirecionar depois do login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Se estiver autenticado, renderiza o conteúdo
  return <>{children}</>;
}
