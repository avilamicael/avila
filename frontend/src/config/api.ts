// Configuração da API
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000',
  ENDPOINTS: {
    // Auth endpoints
    LOGIN: '/api/auth/login/',
    LOGOUT: '/api/auth/logout/',
    REFRESH_TOKEN: '/api/auth/token/refresh/',
    USER_DETAIL: '/api/auth/me/',
    CHANGE_PASSWORD: '/api/auth/change-password/',
  },
  TIMEOUT: 10000, // 10 segundos
} as const;

// Storage keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
  REMEMBER_ME: 'remember_me',
} as const;
