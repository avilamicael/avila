import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { payablesService } from '@/services'
import { toast } from 'sonner'
import type { AccountPayable, PayablePaymentCreate } from '@/types/payables'

interface IndividualPaymentData {
  account: AccountPayable
  paymentDate: string
  amountPaid: number
  paymentMethod: number
  paidByBranch: number
  interest?: number
  fine?: number
  notes?: string
}

interface BatchPaymentResult {
  success: number[]
  errors: Array<{ id: number; description: string; message: string }>
}

/**
 * Hook para processar pagamentos em lote com dados individuais por conta
 */
export const useBatchPayment = () => {
  const queryClient = useQueryClient()
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })

  const processBatch = async (
    paymentsData: IndividualPaymentData[]
  ): Promise<BatchPaymentResult> => {
    setIsProcessing(true)
    setProgress({ current: 0, total: paymentsData.length })

    const results: number[] = []
    const errors: Array<{ id: number; description: string; message: string }> = []

    // Processa cada conta sequencialmente
    for (let i = 0; i < paymentsData.length; i++) {
      const data = paymentsData[i]

      try {
        const paymentData: PayablePaymentCreate = {
          account_payable: data.account.id,
          payment_date: data.paymentDate,
          amount: data.amountPaid,
          payment_method: data.paymentMethod,
          paid_by_branch: data.paidByBranch,
          interest: data.interest,
          fine: data.fine,
          notes: data.notes
        }

        await payablesService.createPayment(paymentData)
        results.push(data.account.id)
      } catch (error: any) {
        errors.push({
          id: data.account.id,
          description: data.account.description,
          message: error.response?.data?.message || 'Erro desconhecido'
        })
      }

      // Atualiza progresso
      setProgress({ current: i + 1, total: paymentsData.length })
    }

    setIsProcessing(false)

    // Invalida queries
    queryClient.invalidateQueries({ queryKey: ['payables'] })

    // Exibe feedback
    showBatchFeedback(results.length, errors)

    return { success: results, errors }
  }

  return {
    processBatch,
    isProcessing,
    progress
  }
}

/**
 * Exibe feedback apropriado baseado nos resultados
 */
const showBatchFeedback = (successCount: number, errors: any[]) => {
  if (errors.length === 0) {
    // Todos com sucesso
    toast.success(`${successCount} pagamentos registrados com sucesso!`)
  } else if (successCount === 0) {
    // Todos falharam
    toast.error('Falha ao registrar todos os pagamentos', {
      description: `${errors.length} pagamento(s) falharam`
    })
  } else {
    // Sucesso parcial
    toast.warning('Pagamento em lote concluído com erros', {
      description: `${successCount} registrados, ${errors.length} falharam`
    })
  }
}
