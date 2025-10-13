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

    // ====================================
    // REGISTRATIONS (Cadastros)
    // ====================================
    
    // Filiais
    FILIALS: '/api/registrations/filials/',
    FILIALS_DROPDOWN: '/api/registrations/filials/dropdown/',
    FILIAL_DETAIL: (id: number) => `/api/registrations/filials/${id}/`,

    // Fornecedores
    SUPPLIERS: '/api/registrations/suppliers/',
    SUPPLIERS_DROPDOWN: '/api/registrations/suppliers/dropdown/',
    SUPPLIER_DETAIL: (id: number) => `/api/registrations/suppliers/${id}/`,

    // Categorias
    CATEGORIES: '/api/registrations/categories/',
    CATEGORIES_DROPDOWN: '/api/registrations/categories/dropdown/',
    CATEGORY_DETAIL: (id: number) => `/api/registrations/categories/${id}/`,

    // Formas de Pagamento
    PAYMENT_METHODS: '/api/registrations/payment-methods/',
    PAYMENT_METHODS_DROPDOWN: '/api/registrations/payment-methods/dropdown/',
    PAYMENT_METHOD_DETAIL: (id: number) => `/api/registrations/payment-methods/${id}/`,

    // ====================================
    // ACCOUNTS PAYABLE (Contas a Pagar)
    // ====================================
    
    // Contas a Pagar
    ACCOUNTS_PAYABLE: '/api/payables/accounts-payable/',
    ACCOUNTS_PAYABLE_DASHBOARD: '/api/payables/accounts-payable/dashboard/',
    ACCOUNTS_PAYABLE_OVERDUE: '/api/payables/accounts-payable/overdue/',
    ACCOUNT_PAYABLE_DETAIL: (id: number) => `/api/payables/accounts-payable/${id}/`,
    ACCOUNT_PAYABLE_MARK_AS_PAID: (id: number) => `/api/payables/accounts-payable/${id}/mark_as_paid/`,
    ACCOUNT_PAYABLE_CANCEL: (id: number) => `/api/payables/accounts-payable/${id}/cancel/`,
    ACCOUNT_PAYABLE_ADD_ATTACHMENT: (id: number) => `/api/payables/accounts-payable/${id}/add_attachment/`,

    // Pagamentos
    PAYABLE_PAYMENTS: '/api/payables/payable-payments/',
    PAYABLE_PAYMENT_DETAIL: (id: number) => `/api/payables/payable-payments/${id}/`,
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