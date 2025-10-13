import { useState, useEffect } from 'react';
import { registrationsService } from '@/services/index';
import type {
  FilialDropdown,
  SupplierDropdown,
  CategoryDropdown,
  PaymentMethodDropdown,
} from '@/types/index';

export const useRegistrations = () => {
  const [filiais, setFiliais] = useState<FilialDropdown[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierDropdown[]>([]);
  const [categories, setCategories] = useState<CategoryDropdown[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodDropdown[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [filiaisData, suppliersData, categoriesData, paymentMethodsData] = 
        await Promise.all([
          registrationsService.getFilialDropdown(),
          registrationsService.getSupplierDropdown(),
          registrationsService.getCategoryDropdown(),
          registrationsService.getPaymentMethodDropdown(),
        ]);

      setFiliais(filiaisData);
      setSuppliers(suppliersData);
      setCategories(categoriesData);
      setPaymentMethods(paymentMethodsData);
    } catch (err) {
      setError('Erro ao carregar cadastros');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return {
    filiais,
    suppliers,
    categories,
    paymentMethods,
    loading,
    error,
    reload: loadAll,
  };
};