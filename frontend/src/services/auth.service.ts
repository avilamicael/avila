import { API_CONFIG } from '../config/api';
import { apiService } from './api.service';
import { storageService } from './storage.service';
import type { LoginCredentials, LoginResponse, User } from '../types/auth';

/**
 * Serviço de autenticação
 */
class AuthService {
  /**
   * Realiza login do usuário
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const { remember_me, ...loginData } = credentials;

    // Configura se deve lembrar o usuário
    storageService.setRememberMe(remember_me || false);

    const response = await apiService.post<LoginResponse>(
      API_CONFIG.ENDPOINTS.LOGIN,
      loginData
    );

    // Salva os tokens e o usuário
    storageService.setTokens({
      access: response.access,
      refresh: response.refresh,
    });
    storageService.setUser(response.user);

    return response;
  }

  /**
   * Realiza logout do usuário
   */
  async logout(): Promise<void> {
    const refreshToken = storageService.getRefreshToken();

    try {
      if (refreshToken) {
        await apiService.post(API_CONFIG.ENDPOINTS.LOGOUT, {
          refresh: refreshToken,
        });
      }
    } catch (error) {
      console.error('Erro ao fazer logout no servidor:', error);
    } finally {
      // Limpa os dados locais independentemente do resultado
      storageService.clearAuth();
    }
  }

  /**
   * Obtém os dados do usuário autenticado
   */
  async getCurrentUser(): Promise<User> {
    const user = await apiService.get<User>(API_CONFIG.ENDPOINTS.USER_DETAIL);
    storageService.setUser(user);
    return user;
  }

  /**
   * Verifica se o usuário está autenticado
   */
  isAuthenticated(): boolean {
    return storageService.hasValidSession();
  }

  /**
   * Obtém o usuário armazenado localmente
   */
  getStoredUser(): User | null {
    return storageService.getUser();
  }

  /**
   * Altera a senha do usuário
   */
  async changePassword(data: {
    old_password: string;
    new_password: string;
    new_password2: string;
  }): Promise<{ message: string }> {
    return apiService.post<{ message: string }>(
      API_CONFIG.ENDPOINTS.CHANGE_PASSWORD,
      data
    );
  }
}

export const authService = new AuthService();
