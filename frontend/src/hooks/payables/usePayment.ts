import { useMutation, useQueryClient } from '@tanstack/react-query'
import { payablesService } from '@/services'
import { toast } from 'sonner'

// Interface para os dados que vêm dos formulários (camelCase)
interface PaymentFormData {
  accountPayable: number
  paymentDate: string
  amountPaid: number
  paymentMethod: number
  paidByBranch: number
  interest?: number
  fine?: number
  notes?: string
}

/**
 * Hook para registrar pagamento individual
 */
export const usePayment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: PaymentFormData) => {
      // Mapeia de camelCase (frontend) para snake_case (backend)
      const payload = {
        account_payable: data.accountPayable,
        payment_date: data.paymentDate,
        amount: data.amountPaid, // O backend espera 'amount'
        payment_method: data.paymentMethod,
        paid_by_branch: data.paidByBranch,
        interest: data.interest,
        fine: data.fine,
        notes: data.notes
      }
      return payablesService.createPayment(payload)
    },
    onSuccess: () => {
      // Invalida cache para recarregar lista
      queryClient.invalidateQueries(['payables'])
      toast.success('Pagamento registrado com sucesso!')
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || error.response?.data?.message || 'Ocorreu um erro.'
      toast.error('Erro ao registrar pagamento', {
        description: message
      })
    }
  })
}
