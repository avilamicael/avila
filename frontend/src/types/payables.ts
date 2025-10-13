// ========================================
// TYPES - REGISTRATIONS (Cadastros)
// ========================================

export interface Filial {
  id: number;
  name: string;
  cnpj: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  bank_account_name?: string;
  bank_account_description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FilialDropdown {
  id: number;
  name: string;
  cnpj: string;
  bank_account_name?: string;
  bank_account_description?: string;
}

export interface FilialCreate {
  name: string;
  cnpj: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  bank_account_name?: string;
  bank_account_description?: string;
}

export interface Supplier {
  id: number;
  name: string;
  cnpj: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupplierDropdown {
  id: number;
  name: string;
  cnpj: string;
}

export interface SupplierCreate {
  name: string;
  cnpj: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  color?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CategoryDropdown {
  id: number;
  name: string;
  color?: string;
}

export interface CategoryCreate {
  name: string;
  description?: string;
  color?: string;
}

export interface PaymentMethod {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaymentMethodDropdown {
  id: number;
  name: string;
}

export interface PaymentMethodCreate {
  name: string;
  description?: string;
}

// ========================================
// TYPES - ACCOUNTS PAYABLE (Contas a Pagar)
// ========================================

export type AccountPayableStatus = 
  | 'pending' 
  | 'due' 
  | 'overdue' 
  | 'paid' 
  | 'partially_paid' 
  | 'cancelled';

export type RecurrenceFrequency = 
  | 'weekly' 
  | 'biweekly' 
  | 'monthly' 
  | 'bimonthly' 
  | 'quarterly' 
  | 'semiannual' 
  | 'annual';

export interface AccountPayable {
  id: number;
  branch: number;
  branch_name: string;
  supplier: number;
  supplier_name: string;
  category: number;
  category_name: string;
  payment_method: number;
  payment_method_name: string;
  description: string;
  original_amount: string;
  discount: string;
  interest: string;
  fine: string;
  total_amount: string;
  paid_amount: string;
  remaining_amount: string;
  issue_date: string;
  due_date: string;
  payment_date?: string;
  status: AccountPayableStatus;
  status_display: string;
  invoice_numbers?: string;
  bank_slip_number?: string;
  notes?: string;
  is_recurring: boolean;
  recurrence_frequency?: RecurrenceFrequency;
  recurrence_count?: number;
  recurring_parent?: number;
  attachments: Attachment[];
  payments: PayablePayment[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AccountPayableCreate {
  branch: number;
  supplier: number;
  category: number;
  payment_method: number;
  description: string;
  original_amount: string | number;
  discount?: string | number;
  interest?: string | number;
  fine?: string | number;
  issue_date?: string; // Opcional - backend usa data atual se não informado
  due_date: string;
  invoice_numbers?: string;
  bank_slip_number?: string;
  notes?: string;
  is_recurring?: boolean;
  recurrence_frequency?: RecurrenceFrequency;
  recurrence_count?: number;
  attachment_files?: File[];
}

export interface AccountPayableUpdate {
  branch?: number;
  supplier?: number;
  category?: number;
  payment_method?: number;
  description?: string;
  original_amount?: string | number;
  discount?: string | number;
  interest?: string | number;
  fine?: string | number;
  issue_date?: string;
  due_date?: string;
  invoice_numbers?: string;
  bank_slip_number?: string;
  notes?: string;
}

export interface Attachment {
  id: number;
  file: string;
  file_name: string;
  file_size: number;
  uploaded_at: string;
}

export interface PayablePayment {
  id: number;
  account_payable: number;
  payment_date: string;
  amount_paid: string;
  payment_method: number;
  payment_method_name: string;
  paid_by_branch?: number;
  paid_by_branch_detail?: FilialDropdown;
  transaction_number?: string;
  notes?: string;
  created_by: number;
  created_by_name: string;
  created_at: string;
}

export interface PayablePaymentCreate {
  account_payable: number;
  payment_date: string;
  amount_paid: string | number;
  payment_method: number;
  paid_by_branch?: number;
  transaction_number?: string;
  notes?: string;
}

// ========================================
// DASHBOARD & STATISTICS
// ========================================

export interface TopSupplier {
  supplier__id: number;
  supplier__name: string;
  count: number;
  total_amount: string;
}

export interface DashboardStats {
  total_pending: number;
  total_overdue: number;
  total_paid_this_month: number;
  amount_pending: string;
  amount_overdue: string;
  amount_paid_this_month: string;
  due_next_7_days: number;
  amount_due_next_7_days: string;
  top_suppliers: TopSupplier[];
}

// ========================================
// FILTERS & PAGINATION
// ========================================

export interface AccountPayableFilters {
  search?: string;
  branch?: number;
  branch__in?: number[];
  supplier?: number;
  supplier__in?: number[];
  category?: number;
  category__in?: number[];
  payment_method?: number;
  payment_method__in?: number[];
  status?: AccountPayableStatus;
  status__in?: AccountPayableStatus[];
  due_date?: string;
  due_date__gte?: string;
  due_date__lte?: string;
  due_date__year?: number;
  due_date__month?: number;
  payment_date?: string;
  payment_date__gte?: string;
  payment_date__lte?: string;
  payment_date__isnull?: boolean;
  issue_date?: string;
  issue_date__gte?: string;
  issue_date__lte?: string;
  original_amount?: string | number;
  original_amount__gte?: string | number;
  original_amount__lte?: string | number;
  paid_amount__gte?: string | number;
  paid_amount__lte?: string | number;
  is_recurring?: boolean;
  recurrence_frequency?: RecurrenceFrequency;
  is_overdue?: boolean;
  due_in_days?: number;
  ordering?: string;
  page?: number;
  page_size?: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ========================================
// API RESPONSES
// ========================================

export interface MarkAsPaidResponse {
  message: string;
  account_payable: AccountPayable;
}

export interface CancelResponse {
  message: string;
  account_payable: AccountPayable;
}

export interface AddAttachmentResponse {
  message: string;
  attachment: Attachment;
}