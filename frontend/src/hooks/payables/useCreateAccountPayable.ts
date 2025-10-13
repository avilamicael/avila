import { useState } from 'react';
import { payablesService } from '@/services/index';
import type { AccountPayableCreate } from '@/types/index';

export const useCreateAccountPayable = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createAccount = async (data: AccountPayableCreate) => {
    setLoading(true);
    setError(null);
    try {
      const created = await payablesService.createAccountPayable(data);
      return { success: true, data: created };
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao criar conta';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return {
    createAccount,
    loading,
    error,
  };
};