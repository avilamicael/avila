import axios from 'axios';
import type { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_CONFIG } from '../config/api';
import { storageService } from './storage.service';

/**
 * Serviço principal de API com interceptors para autenticação automática
 */
class ApiService {
  private api: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: unknown) => void;
    reject: (reason?: unknown) => void;
  }> = [];

  constructor() {
    this.api = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor - adiciona token automaticamente
    this.api.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = storageService.getAccessToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - lida com refresh token
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
          _retry?: boolean;
        };

        // Se o erro for 401 e não for a rota de login
        if (
          error.response?.status === 401 &&
          originalRequest &&
          !originalRequest._retry &&
          !originalRequest.url?.includes('/login/')
        ) {
          if (this.isRefreshing) {
            // Se já está refreshing, adiciona à fila
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then(() => {
                return this.api(originalRequest);
              })
              .catch((err) => {
                return Promise.reject(err);
              });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          const refreshToken = storageService.getRefreshToken();

          if (!refreshToken) {
            this.isRefreshing = false;
            storageService.clearAuth();
            window.location.href = '/login';
            return Promise.reject(error);
          }

          try {
            const response = await axios.post(
              `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.REFRESH_TOKEN}`,
              { refresh: refreshToken }
            );

            const { access } = response.data;
            storageService.setTokens({
              access,
              refresh: refreshToken,
            });

            this.isRefreshing = false;
            this.processQueue(null);

            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${access}`;
            }

            return this.api(originalRequest);
          } catch (refreshError) {
            this.isRefreshing = false;
            this.processQueue(refreshError);
            storageService.clearAuth();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private processQueue(error: unknown): void {
    this.failedQueue.forEach((promise) => {
      if (error) {
        promise.reject(error);
      } else {
        promise.resolve();
      }
    });

    this.failedQueue = [];
  }

  // Métodos públicos
  get instance(): AxiosInstance {
    return this.api;
  }

  async get<T>(url: string, config?: Parameters<AxiosInstance['get']>[1]) {
    const response = await this.api.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: unknown, config?: Parameters<AxiosInstance['post']>[2]) {
    const response = await this.api.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: unknown, config?: Parameters<AxiosInstance['put']>[2]) {
    const response = await this.api.put<T>(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: unknown, config?: Parameters<AxiosInstance['patch']>[2]) {
    const response = await this.api.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: Parameters<AxiosInstance['delete']>[1]) {
    const response = await this.api.delete<T>(url, config);
    return response.data;
  }
}

export const apiService = new ApiService();
