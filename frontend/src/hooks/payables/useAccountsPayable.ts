import { useState, useEffect, useCallback } from 'react';
import { payablesService } from '@/services/index';
import type { AccountPayable, AccountPayableFilters, PaginatedResponse } from '@/types/index';

export const useAccountsPayable = (initialFilters?: AccountPayableFilters) => {
  const [accounts, setAccounts] = useState<AccountPayable[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    count: 0,
    next: null as string | null,
    previous: null as string | null,
  });
  const [filters, setFilters] = useState<AccountPayableFilters>(
    initialFilters || { page: 1, ordering: '-due_date' }
  );

  // Carregar contas
  const loadAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await payablesService.listAccountsPayable(filters);
      setAccounts(response.results);
      setPagination({
        count: response.count,
        next: response.next,
        previous: response.previous,
      });
    } catch (err) {
      setError('Erro ao carregar contas a pagar');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Recarregar quando filtros mudarem
  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  // Atualizar filtros
  const updateFilters = useCallback((newFilters: Partial<AccountPayableFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  }, []);

  // Resetar filtros
  const resetFilters = useCallback(() => {
    setFilters({ page: 1, ordering: '-due_date' });
  }, []);

  // Ir para próxima página
  const nextPage = useCallback(() => {
    if (pagination.next) {
      setFilters(prev => ({ ...prev, page: (prev.page || 1) + 1 }));
    }
  }, [pagination.next]);

  // Ir para página anterior
  const previousPage = useCallback(() => {
    if (pagination.previous && (filters.page || 1) > 1) {
      setFilters(prev => ({ ...prev, page: (prev.page || 1) - 1 }));
    }
  }, [pagination.previous, filters.page]);

  // Marcar como paga
  const markAsPaid = useCallback(async (
    id: number,
    data: { payment_date: string; payment_method: number; notes?: string }
  ) => {
    try {
      await payablesService.markAsPaid(id, data);
      await loadAccounts(); // Recarregar
      return true;
    } catch (err) {
      console.error('Erro ao marcar como paga:', err);
      return false;
    }
  }, [loadAccounts]);

  // Cancelar conta
  const cancelAccount = useCallback(async (id: number) => {
    try {
      await payablesService.cancelAccount(id);
      await loadAccounts(); // Recarregar
      return true;
    } catch (err) {
      console.error('Erro ao cancelar conta:', err);
      return false;
    }
  }, [loadAccounts]);

  // Deletar conta
  const deleteAccount = useCallback(async (id: number) => {
    try {
      await payablesService.deleteAccountPayable(id);
      await loadAccounts(); // Recarregar
      return true;
    } catch (err) {
      console.error('Erro ao deletar conta:', err);
      return false;
    }
  }, [loadAccounts]);

  return {
    accounts,
    loading,
    error,
    pagination,
    filters,
    updateFilters,
    resetFilters,
    nextPage,
    previousPage,
    reload: loadAccounts,
    markAsPaid,
    cancelAccount,
    deleteAccount,
  };
};