import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/auth.service';
import type { User, LoginCredentials, AuthState } from '../types/auth';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    tokens: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Verifica se há uma sessão ativa ao carregar
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          const user = authService.getStoredUser();
          if (user) {
            setState({
              user,
              tokens: null, // Não exponha os tokens no contexto por segurança
              isAuthenticated: true,
              isLoading: false,
            });

            // Busca dados atualizados do usuário em background
            try {
              const freshUser = await authService.getCurrentUser();
              setState((prev) => ({
                ...prev,
                user: freshUser,
              }));
            } catch (error) {
              console.error('Erro ao buscar dados do usuário:', error);
            }
          } else {
            setState({
              user: null,
              tokens: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        } else {
          setState({
            user: null,
            tokens: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        setState({
          user: null,
          tokens: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await authService.login(credentials);
      setState({
        user: response.user,
        tokens: null,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
      }));
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setState({
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  };

  const refreshUser = async () => {
    try {
      const user = await authService.getCurrentUser();
      setState((prev) => ({
        ...prev,
        user,
      }));
    } catch (error) {
      console.error('Erro ao atualizar dados do usuário:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
