import { useState, useEffect, useCallback } from 'react';
import { payablesService } from '@/services/index';
import type { DashboardStats } from '@/types/index';

export const useDashboard = (autoLoad = true) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await payablesService.getDashboard();
      setStats(data);
    } catch (err) {
      setError('Erro ao carregar estatísticas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoLoad) {
      loadStats();
    }
  }, [autoLoad, loadStats]);

  return {
    stats,
    loading,
    error,
    reload: loadStats,
  };
};