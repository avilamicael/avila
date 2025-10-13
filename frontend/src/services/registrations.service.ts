import { API_CONFIG } from '../config/api';
import { apiService } from './api.service';
import type {
  Filial,
  FilialCreate,
  FilialDropdown,
  Supplier,
  SupplierCreate,
  SupplierDropdown,
  Category,
  CategoryCreate,
  CategoryDropdown,
  PaymentMethod,
  PaymentMethodCreate,
  PaymentMethodDropdown,
  PaginatedResponse,
} from '../types/payables';

/**
 * Serviço de Cadastros (Registrations)
 */
class RegistrationsService {
  // ====================================
  // FILIAIS
  // ====================================

  /**
   * Lista todas as filiais com paginação
   */
  async listFilials(params?: {
    search?: string;
    page?: number;
  }): Promise<PaginatedResponse<Filial>> {
    return apiService.get<PaginatedResponse<Filial>>(
      API_CONFIG.ENDPOINTS.FILIALS,
      { params }
    );
  }

  /**
   * Lista filiais para dropdown (simplificado)
   */
  async getFilialDropdown(): Promise<FilialDropdown[]> {
    return apiService.get<FilialDropdown[]>(
      API_CONFIG.ENDPOINTS.FILIALS_DROPDOWN
    );
  }

  /**
   * Busca uma filial por ID
   */
  async getFilial(id: number): Promise<Filial> {
    return apiService.get<Filial>(
      API_CONFIG.ENDPOINTS.FILIAL_DETAIL(id)
    );
  }

  /**
   * Cria uma nova filial
   */
  async createFilial(data: FilialCreate): Promise<Filial> {
    return apiService.post<Filial>(
      API_CONFIG.ENDPOINTS.FILIALS,
      data
    );
  }

  /**
   * Atualiza uma filial (completo)
   */
  async updateFilial(id: number, data: FilialCreate): Promise<Filial> {
    return apiService.put<Filial>(
      API_CONFIG.ENDPOINTS.FILIAL_DETAIL(id),
      data
    );
  }

  /**
   * Atualiza uma filial (parcial)
   */
  async patchFilial(id: number, data: Partial<FilialCreate>): Promise<Filial> {
    return apiService.patch<Filial>(
      API_CONFIG.ENDPOINTS.FILIAL_DETAIL(id),
      data
    );
  }

  /**
   * Remove uma filial (soft delete)
   */
  async deleteFilial(id: number): Promise<void> {
    return apiService.delete<void>(
      API_CONFIG.ENDPOINTS.FILIAL_DETAIL(id)
    );
  }

  // ====================================
  // FORNECEDORES
  // ====================================

  /**
   * Lista todos os fornecedores com paginação
   */
  async listSuppliers(params?: {
    search?: string;
    page?: number;
  }): Promise<PaginatedResponse<Supplier>> {
    return apiService.get<PaginatedResponse<Supplier>>(
      API_CONFIG.ENDPOINTS.SUPPLIERS,
      { params }
    );
  }

  /**
   * Lista fornecedores para dropdown (simplificado)
   */
  async getSupplierDropdown(): Promise<SupplierDropdown[]> {
    return apiService.get<SupplierDropdown[]>(
      API_CONFIG.ENDPOINTS.SUPPLIERS_DROPDOWN
    );
  }

  /**
   * Busca um fornecedor por ID
   */
  async getSupplier(id: number): Promise<Supplier> {
    return apiService.get<Supplier>(
      API_CONFIG.ENDPOINTS.SUPPLIER_DETAIL(id)
    );
  }

  /**
   * Cria um novo fornecedor
   */
  async createSupplier(data: SupplierCreate): Promise<Supplier> {
    return apiService.post<Supplier>(
      API_CONFIG.ENDPOINTS.SUPPLIERS,
      data
    );
  }

  /**
   * Atualiza um fornecedor (completo)
   */
  async updateSupplier(id: number, data: SupplierCreate): Promise<Supplier> {
    return apiService.put<Supplier>(
      API_CONFIG.ENDPOINTS.SUPPLIER_DETAIL(id),
      data
    );
  }

  /**
   * Atualiza um fornecedor (parcial)
   */
  async patchSupplier(id: number, data: Partial<SupplierCreate>): Promise<Supplier> {
    return apiService.patch<Supplier>(
      API_CONFIG.ENDPOINTS.SUPPLIER_DETAIL(id),
      data
    );
  }

  /**
   * Remove um fornecedor (soft delete)
   */
  async deleteSupplier(id: number): Promise<void> {
    return apiService.delete<void>(
      API_CONFIG.ENDPOINTS.SUPPLIER_DETAIL(id)
    );
  }

  // ====================================
  // CATEGORIAS
  // ====================================

  /**
   * Lista todas as categorias com paginação
   */
  async listCategories(params?: {
    search?: string;
    page?: number;
  }): Promise<PaginatedResponse<Category>> {
    return apiService.get<PaginatedResponse<Category>>(
      API_CONFIG.ENDPOINTS.CATEGORIES,
      { params }
    );
  }

  /**
   * Lista categorias para dropdown (simplificado)
   */
  async getCategoryDropdown(): Promise<CategoryDropdown[]> {
    return apiService.get<CategoryDropdown[]>(
      API_CONFIG.ENDPOINTS.CATEGORIES_DROPDOWN
    );
  }

  /**
   * Busca uma categoria por ID
   */
  async getCategory(id: number): Promise<Category> {
    return apiService.get<Category>(
      API_CONFIG.ENDPOINTS.CATEGORY_DETAIL(id)
    );
  }

  /**
   * Cria uma nova categoria
   */
  async createCategory(data: CategoryCreate): Promise<Category> {
    return apiService.post<Category>(
      API_CONFIG.ENDPOINTS.CATEGORIES,
      data
    );
  }

  /**
   * Atualiza uma categoria (completo)
   */
  async updateCategory(id: number, data: CategoryCreate): Promise<Category> {
    return apiService.put<Category>(
      API_CONFIG.ENDPOINTS.CATEGORY_DETAIL(id),
      data
    );
  }

  /**
   * Atualiza uma categoria (parcial)
   */
  async patchCategory(id: number, data: Partial<CategoryCreate>): Promise<Category> {
    return apiService.patch<Category>(
      API_CONFIG.ENDPOINTS.CATEGORY_DETAIL(id),
      data
    );
  }

  /**
   * Remove uma categoria (soft delete)
   */
  async deleteCategory(id: number): Promise<void> {
    return apiService.delete<void>(
      API_CONFIG.ENDPOINTS.CATEGORY_DETAIL(id)
    );
  }

  // ====================================
  // FORMAS DE PAGAMENTO
  // ====================================

  /**
   * Lista todas as formas de pagamento com paginação
   */
  async listPaymentMethods(params?: {
    search?: string;
    page?: number;
  }): Promise<PaginatedResponse<PaymentMethod>> {
    return apiService.get<PaginatedResponse<PaymentMethod>>(
      API_CONFIG.ENDPOINTS.PAYMENT_METHODS,
      { params }
    );
  }

  /**
   * Lista formas de pagamento para dropdown (simplificado)
   */
  async getPaymentMethodDropdown(): Promise<PaymentMethodDropdown[]> {
    return apiService.get<PaymentMethodDropdown[]>(
      API_CONFIG.ENDPOINTS.PAYMENT_METHODS_DROPDOWN
    );
  }

  /**
   * Busca uma forma de pagamento por ID
   */
  async getPaymentMethod(id: number): Promise<PaymentMethod> {
    return apiService.get<PaymentMethod>(
      API_CONFIG.ENDPOINTS.PAYMENT_METHOD_DETAIL(id)
    );
  }

  /**
   * Cria uma nova forma de pagamento
   */
  async createPaymentMethod(data: PaymentMethodCreate): Promise<PaymentMethod> {
    return apiService.post<PaymentMethod>(
      API_CONFIG.ENDPOINTS.PAYMENT_METHODS,
      data
    );
  }

  /**
   * Atualiza uma forma de pagamento (completo)
   */
  async updatePaymentMethod(id: number, data: PaymentMethodCreate): Promise<PaymentMethod> {
    return apiService.put<PaymentMethod>(
      API_CONFIG.ENDPOINTS.PAYMENT_METHOD_DETAIL(id),
      data
    );
  }

  /**
   * Atualiza uma forma de pagamento (parcial)
   */
  async patchPaymentMethod(id: number, data: Partial<PaymentMethodCreate>): Promise<PaymentMethod> {
    return apiService.patch<PaymentMethod>(
      API_CONFIG.ENDPOINTS.PAYMENT_METHOD_DETAIL(id),
      data
    );
  }

  /**
   * Remove uma forma de pagamento (soft delete)
   */
  async deletePaymentMethod(id: number): Promise<void> {
    return apiService.delete<void>(
      API_CONFIG.ENDPOINTS.PAYMENT_METHOD_DETAIL(id)
    );
  }
}

export const registrationsService = new RegistrationsService();