import { API_CONFIG } from '../config/api';
import { apiService } from './api.service';
import type {
  AccountPayable,
  AccountPayableCreate,
  AccountPayableUpdate,
  AccountPayableFilters,
  PayablePayment,
  PayablePaymentCreate,
  DashboardStats,
  MarkAsPaidResponse,
  CancelResponse,
  AddAttachmentResponse,
  PaginatedResponse,
} from '../types/payables';

/**
 * Serviço de Contas a Pagar
 */
class PayablesService {
  // ====================================
  // CONTAS A PAGAR
  // ====================================

  /**
   * Lista contas a pagar com filtros avançados
   */
  async listAccountsPayable(
    filters?: AccountPayableFilters
  ): Promise<PaginatedResponse<AccountPayable>> {
    // Converte arrays em strings separadas por vírgula
    const params = this.prepareFilters(filters);

    return apiService.get<PaginatedResponse<AccountPayable>>(
      API_CONFIG.ENDPOINTS.ACCOUNTS_PAYABLE,
      { params }
    );
  }

  /**
   * Busca estatísticas do dashboard
   */
  async getDashboard(): Promise<DashboardStats> {
    return apiService.get<DashboardStats>(
      API_CONFIG.ENDPOINTS.ACCOUNTS_PAYABLE_DASHBOARD
    );
  }

  /**
   * Lista apenas contas vencidas
   */
  async getOverdueAccounts(): Promise<AccountPayable[]> {
    return apiService.get<AccountPayable[]>(
      API_CONFIG.ENDPOINTS.ACCOUNTS_PAYABLE_OVERDUE
    );
  }

  /**
   * Busca uma conta a pagar por ID
   */
  async getAccountPayable(id: number): Promise<AccountPayable> {
    return apiService.get<AccountPayable>(
      API_CONFIG.ENDPOINTS.ACCOUNT_PAYABLE_DETAIL(id)
    );
  }

  /**
   * Cria uma nova conta a pagar (com suporte a anexos e recorrência)
   */
  async createAccountPayable(data: AccountPayableCreate): Promise<AccountPayable> {
    const formData = this.prepareFormData(data);

    return apiService.post<AccountPayable>(
      API_CONFIG.ENDPOINTS.ACCOUNTS_PAYABLE,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
  }

  /**
   * Atualiza uma conta a pagar (completo)
   */
  async updateAccountPayable(
    id: number,
    data: AccountPayableUpdate
  ): Promise<AccountPayable> {
    return apiService.put<AccountPayable>(
      API_CONFIG.ENDPOINTS.ACCOUNT_PAYABLE_DETAIL(id),
      data
    );
  }

  /**
   * Atualiza uma conta a pagar (parcial)
   */
  async patchAccountPayable(
    id: number,
    data: Partial<AccountPayableUpdate>
  ): Promise<AccountPayable> {
    return apiService.patch<AccountPayable>(
      API_CONFIG.ENDPOINTS.ACCOUNT_PAYABLE_DETAIL(id),
      data
    );
  }

  /**
   * Remove uma conta a pagar (soft delete)
   */
  async deleteAccountPayable(id: number): Promise<void> {
    return apiService.delete<void>(
      API_CONFIG.ENDPOINTS.ACCOUNT_PAYABLE_DETAIL(id)
    );
  }

  /**
   * Marca uma conta como paga
   */
  async markAsPaid(
    id: number,
    data: {
      payment_date: string;
      payment_method: number;
      notes?: string;
    }
  ): Promise<MarkAsPaidResponse> {
    return apiService.post<MarkAsPaidResponse>(
      API_CONFIG.ENDPOINTS.ACCOUNT_PAYABLE_MARK_AS_PAID(id),
      data
    );
  }

  /**
   * Cancela uma conta a pagar
   */
  async cancelAccount(id: number): Promise<CancelResponse> {
    return apiService.post<CancelResponse>(
      API_CONFIG.ENDPOINTS.ACCOUNT_PAYABLE_CANCEL(id)
    );
  }

  /**
   * Adiciona anexo a uma conta
   */
  async addAttachment(
    id: number,
    file: File
  ): Promise<AddAttachmentResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return apiService.post<AddAttachmentResponse>(
      API_CONFIG.ENDPOINTS.ACCOUNT_PAYABLE_ADD_ATTACHMENT(id),
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
  }

  // ====================================
  // PAGAMENTOS
  // ====================================

  /**
   * Lista pagamentos realizados
   */
  async listPayments(params?: {
    account_payable?: number;
    page?: number;
  }): Promise<PaginatedResponse<PayablePayment>> {
    return apiService.get<PaginatedResponse<PayablePayment>>(
      API_CONFIG.ENDPOINTS.PAYABLE_PAYMENTS,
      { params }
    );
  }

  /**
   * Busca um pagamento por ID
   */
  async getPayment(id: number): Promise<PayablePayment> {
    return apiService.get<PayablePayment>(
      API_CONFIG.ENDPOINTS.PAYABLE_PAYMENT_DETAIL(id)
    );
  }

  /**
   * Registra um novo pagamento
   */
  async createPayment(data: PayablePaymentCreate): Promise<PayablePayment> {
    return apiService.post<PayablePayment>(
      API_CONFIG.ENDPOINTS.PAYABLE_PAYMENTS,
      data
    );
  }

  /**
   * Remove um pagamento (recalcula total pago)
   */
  async deletePayment(id: number): Promise<void> {
    return apiService.delete<void>(
      API_CONFIG.ENDPOINTS.PAYABLE_PAYMENT_DETAIL(id)
    );
  }

  // ====================================
  // HELPERS PRIVADOS
  // ====================================

  /**
   * Prepara FormData para envio de conta com anexos
   */
  private prepareFormData(data: AccountPayableCreate): FormData {
    const formData = new FormData();

    // Adiciona campos normais
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'attachment_files') {
        // Adiciona arquivos
        if (value && Array.isArray(value)) {
          value.forEach((file: File) => {
            formData.append('attachment_files', file);
          });
        }
      } else if (value !== undefined && value !== null) {
        // Converte valores para string
        formData.append(key, String(value));
      }
    });

    return formData;
  }

  /**
   * Prepara filtros para query params (converte arrays em strings)
   */
  private prepareFilters(filters?: AccountPayableFilters): Record<string, string> {
    if (!filters) return {};

    const params: Record<string, string> = {};

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          // Converte arrays em string separada por vírgula
          params[key] = value.join(',');
        } else {
          params[key] = String(value);
        }
      }
    });

    return params;
  }
}

export const payablesService = new PayablesService();