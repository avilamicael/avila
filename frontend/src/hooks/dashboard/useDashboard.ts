import { useQuery } from '@tanstack/react-query'
import { payablesService } from '@/services'

/**
 * Hook simplificado para buscar dados do dashboard
 */
export const useDashboard = () => {
  // Busca estatísticas gerais
  const statsQuery = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => payablesService.getDashboard(),
    staleTime: 5 * 60 * 1000,
  })

  // Busca TODAS as contas a pagar ativas
  const allPayablesQuery = useQuery({
    queryKey: ['all-payables-dashboard'],
    queryFn: async () => {
      console.log('Buscando contas com page_size: 1000')
      const response = await payablesService.listAccountsPayable({
        page_size: 1000,
      })
      console.log('Resposta da API:', response)
      console.log('Total de contas retornadas:', response.results?.length)
      console.log('Count total:', response.count)
      return response.results
    },
    staleTime: 10 * 60 * 1000,
  })

  return {
    stats: statsQuery.data,
    isLoadingStats: statsQuery.isLoading,
    isErrorStats: statsQuery.isError,

    contas: allPayablesQuery.data || [],
    isLoadingContas: allPayablesQuery.isLoading,
    isErrorContas: allPayablesQuery.isError,

    isLoading: statsQuery.isLoading || allPayablesQuery.isLoading,
    isError: statsQuery.isError || allPayablesQuery.isError,

    refetch: () => {
      statsQuery.refetch()
      allPayablesQuery.refetch()
    }
  }
}
