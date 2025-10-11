import { STORAGE_KEYS } from '../config/api';
import type { User, AuthTokens } from '../types/auth';

/**
 * Serviço para gerenciar armazenamento local/sessão
 * Usa localStorage quando "lembrar-me" está ativo, senão usa sessionStorage
 */
class StorageService {
  private getStorage(): Storage {
    const rememberMe = localStorage.getItem(STORAGE_KEYS.REMEMBER_ME) === 'true';
    return rememberMe ? localStorage : sessionStorage;
  }

  setRememberMe(remember: boolean): void {
    if (remember) {
      localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, 'true');
    } else {
      localStorage.removeItem(STORAGE_KEYS.REMEMBER_ME);
    }
  }

  getRememberMe(): boolean {
    return localStorage.getItem(STORAGE_KEYS.REMEMBER_ME) === 'true';
  }

  setTokens(tokens: AuthTokens): void {
    const storage = this.getStorage();
    storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.access);
    storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refresh);
  }

  getAccessToken(): string | null {
    // Tenta primeiro no localStorage, depois no sessionStorage
    return (
      localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) ||
      sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
    );
  }

  getRefreshToken(): string | null {
    // Tenta primeiro no localStorage, depois no sessionStorage
    return (
      localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN) ||
      sessionStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
    );
  }

  setUser(user: User): void {
    const storage = this.getStorage();
    storage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  }

  getUser(): User | null {
    // Tenta primeiro no localStorage, depois no sessionStorage
    const userStr =
      localStorage.getItem(STORAGE_KEYS.USER) ||
      sessionStorage.getItem(STORAGE_KEYS.USER);

    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  clearAuth(): void {
    // Limpa de ambos os storages
    [localStorage, sessionStorage].forEach((storage) => {
      storage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      storage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      storage.removeItem(STORAGE_KEYS.USER);
    });
    localStorage.removeItem(STORAGE_KEYS.REMEMBER_ME);
  }

  hasValidSession(): boolean {
    return !!(this.getAccessToken() && this.getRefreshToken() && this.getUser());
  }
}

export const storageService = new StorageService();
