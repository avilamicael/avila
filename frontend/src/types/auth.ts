// Tipos relacionados à autenticação

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone?: string;
  position?: string;
  avatar?: string;
  is_tenant_admin: boolean;
  tenant_id?: number;
  tenant_name?: string;
  date_joined: string;
  last_login?: string;
}

export interface LoginCredentials {
  email: string;  // MUDOU: era username, agora é email
  password: string;
  remember_me?: boolean;
}

export interface LoginResponse {
  user: User;
  access: string;
  refresh: string;
  message: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
