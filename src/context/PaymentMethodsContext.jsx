import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import * as paymentMethodStore from '../lib/paymentMethodStore';
import { isSupabaseConfigured } from '../lib/supabaseClient';

const PaymentMethodsContext = createContext(null);

export function PaymentMethodsProvider({ children }) {
  const { user } = useAuth();
  const [version, setVersion] = useState(0);
  const [ready, setReady] = useState(!isSupabaseConfigured());

  useEffect(() => paymentMethodStore.subscribe(() => setVersion((v) => v + 1)), []);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setReady(true);
      return undefined;
    }

    let active = true;
    setReady(false);

    paymentMethodStore.invalidatePaymentMethodsInit();
    paymentMethodStore.initPaymentMethods({ userId: user?.id || null, force: true })
      .then(() => {
        if (active) setReady(true);
      })
      .catch(() => {
        if (active) setReady(true);
      });

    return () => {
      active = false;
    };
  }, [user?.id]);

  const userId = user?.id || '';

  const getPaymentMethods = useCallback(
    (category = 'payment') => paymentMethodStore.getPaymentMethods(userId, category),
    [userId, version],
  );

  const getBankAccount = useCallback(
    () => paymentMethodStore.getBankAccount(userId),
    [userId, version],
  );

  const getDefaultPaymentMethod = useCallback(
    () => paymentMethodStore.getDefaultPaymentMethod(userId),
    [userId, version],
  );

  const addPaymentMethod = useCallback(
    (data) => paymentMethodStore.addPaymentMethod(userId, data),
    [userId],
  );

  const removePaymentMethod = useCallback(
    (methodId) => paymentMethodStore.removePaymentMethod(methodId),
    [],
  );

  const setDefaultPaymentMethod = useCallback(
    (methodId) => paymentMethodStore.setDefaultPaymentMethod(methodId),
    [],
  );

  const value = useMemo(() => ({
    ready,
    getPaymentMethods,
    getBankAccount,
    getDefaultPaymentMethod,
    addPaymentMethod,
    removePaymentMethod,
    setDefaultPaymentMethod,
    getPaymentMethodLabel: paymentMethodStore.getPaymentMethodLabel,
    detectCardBrand: paymentMethodStore.detectCardBrand,
  }), [
    ready,
    getPaymentMethods,
    getBankAccount,
    getDefaultPaymentMethod,
    addPaymentMethod,
    removePaymentMethod,
    setDefaultPaymentMethod,
  ]);

  return (
    <PaymentMethodsContext.Provider value={value}>
      {children}
    </PaymentMethodsContext.Provider>
  );
}

export function usePaymentMethods() {
  const ctx = useContext(PaymentMethodsContext);
  if (!ctx) throw new Error('usePaymentMethods must be used within PaymentMethodsProvider');
  return ctx;
}
