import { useQuery } from '@tanstack/react-query'
import { payablesService } from '@/services'
import type { AccountPayableFilters } from '@/types/payables'

import type { AccountPayableStatus } from '@/types/payables'

interface UsePayablesParams {
  page: number
  pageSize: number
  searchTerm?: string
  statuses?: AccountPayableStatus[]
  supplierId?: number
  categoryId?: number
  branchId?: number
  paymentMethodId?: number
  dueDateStart?: string
  dueDateEnd?: string
  paymentDateStart?: string
  paymentDateEnd?: string
  ordering?: string
}

/**
 * Hook para buscar contas a pagar com filtros customizados
 */
export const usePayables = ({
  page,
  pageSize,
  searchTerm,
  statuses,
  supplierId,
  categoryId,
  branchId,
  paymentMethodId,
  dueDateStart,
  dueDateEnd,
  paymentDateStart,
  paymentDateEnd,
  ordering
}: UsePayablesParams) => {
  return useQuery({
    queryKey: ['payables', page, pageSize, searchTerm, statuses, supplierId, categoryId, branchId, paymentMethodId, dueDateStart, dueDateEnd, paymentDateStart, paymentDateEnd, ordering],
    queryFn: () => {
      // Adiciona filtros customizados
      const customFilters: Partial<AccountPayableFilters> = {}

      if (searchTerm) {
        customFilters.search = searchTerm
      }
      if (statuses && statuses.length > 0) {
        customFilters.status__in = statuses
      }
      if (supplierId) {
        customFilters.supplier = supplierId
      }
      if (categoryId) {
        customFilters.category = categoryId
      }
      if (branchId) {
        customFilters.branch = branchId
      }
      if (paymentMethodId) {
        customFilters.payment_method = paymentMethodId
      }
      if (dueDateStart) {
        customFilters.due_date__gte = dueDateStart
      }
      if (dueDateEnd) {
        customFilters.due_date__lte = dueDateEnd
      }
      if (paymentDateStart) {
        customFilters.payment_date__gte = paymentDateStart
      }
      if (paymentDateEnd) {
        customFilters.payment_date__lte = paymentDateEnd
      }

      return payablesService.listAccountsPayable({
        page,
        page_size: pageSize,
        ordering: ordering || '-due_date',
        ...customFilters
      })
    },
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000 // 10 minutos
  })
}
