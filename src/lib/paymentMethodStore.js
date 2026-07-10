import { paymentMethods as seedPaymentMethods } from '../data/mockData';
import { isSupabaseConfigured, supabase } from './supabaseClient';
import { paymentMethodFromRow, paymentMethodToRow } from './supabaseMappers';

const STORAGE_KEY = 'parkit_payment_methods_v1';

const listeners = new Set();

function cloneSeed() {
  return JSON.parse(JSON.stringify(seedPaymentMethods));
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    /* use seed */
  }
  return cloneSeed();
}

let state = isSupabaseConfigured() ? [] : loadState();
let initPromise = null;

function notify() {
  listeners.forEach((fn) => fn());
}

function persist() {
  if (!isSupabaseConfigured()) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
  notify();
}

async function syncPaymentMethod(method) {
  if (!isSupabaseConfigured() || !method) return;
  const { error } = await supabase.from('payment_methods').upsert(paymentMethodToRow(method));
  if (error) console.error('syncPaymentMethod failed', error);
}

async function deletePaymentMethodFromDb(methodId) {
  if (!isSupabaseConfigured()) return;
  const { error } = await supabase.from('payment_methods').delete().eq('id', methodId);
  if (error) console.error('deletePaymentMethod failed', error);
}

export function invalidatePaymentMethodsInit() {
  initPromise = null;
}

export async function initPaymentMethods({ userId = null, force = false } = {}) {
  if (!isSupabaseConfigured()) return;
  if (initPromise && !force) return initPromise;

  initPromise = (async () => {
    if (!userId) {
      state = [];
      notify();
      return;
    }

    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Failed to load payment methods', error);
      throw error;
    }

    state = (data || []).map(paymentMethodFromRow);
    notify();
  })();

  return initPromise;
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getPaymentMethodsByUserId(userId) {
  return state.filter((m) => m.userId === userId);
}

export function getPaymentMethods(userId, category = 'payment') {
  return getPaymentMethodsByUserId(userId).filter((m) => m.category === category);
}

export function getBankAccount(userId) {
  return getPaymentMethodsByUserId(userId).find((m) => m.category === 'payout' && m.type === 'bank_account') || null;
}

function clearDefaultInCategory(userId, category) {
  state = state.map((m) => (
    m.userId === userId && m.category === category ? { ...m, isDefault: false } : m
  ));
}

function generateId() {
  return `pm-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function detectCardBrand(number) {
  const digits = number.replace(/\D/g, '');
  if (/^4/.test(digits)) return 'Visa';
  if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) return 'Mastercard';
  if (/^3[47]/.test(digits)) return 'American Express';
  if (/^6/.test(digits)) return 'Discover';
  return 'כרטיס אשראי';
}

export async function addPaymentMethod(userId, data) {
  const category = data.category || 'payment';
  const existing = getPaymentMethods(userId, category);
  const isFirst = category === 'payout'
    ? !getBankAccount(userId)
    : existing.length === 0;

  if (category === 'payout') {
    const current = getBankAccount(userId);
    if (current) {
      state = state.filter((m) => m.id !== current.id);
      deletePaymentMethodFromDb(current.id);
    }
  }

  if (data.isDefault || isFirst) {
    clearDefaultInCategory(userId, category);
  }

  const method = {
    id: generateId(),
    userId,
    category,
    type: data.type,
    label: data.label,
    brand: data.brand || null,
    lastFour: data.lastFour || null,
    bankName: data.bankName || null,
    bankBranch: data.bankBranch || null,
    accountHolderName: data.accountHolderName || null,
    isDefault: data.isDefault ?? isFirst,
    createdAt: new Date().toISOString(),
  };

  state = [...state, method];
  persist();
  await syncPaymentMethod(method);
  return method;
}

export async function removePaymentMethod(methodId) {
  const method = state.find((m) => m.id === methodId);
  if (!method) return;

  state = state.filter((m) => m.id !== methodId);
  persist();
  await deletePaymentMethodFromDb(methodId);

  if (method.isDefault) {
    const remaining = getPaymentMethods(method.userId, method.category);
    if (remaining.length > 0) {
      const next = { ...remaining[0], isDefault: true };
      state = state.map((m) => (m.id === next.id ? next : m));
      persist();
      await syncPaymentMethod(next);
    }
  }
}

export async function setDefaultPaymentMethod(methodId) {
  const method = state.find((m) => m.id === methodId);
  if (!method) return;

  clearDefaultInCategory(method.userId, method.category);
  const updated = { ...method, isDefault: true };
  state = state.map((m) => (m.id === methodId ? updated : m));
  persist();
  await syncPaymentMethod(updated);
}

export function getDefaultPaymentMethod(userId) {
  return getPaymentMethods(userId, 'payment').find((m) => m.isDefault)
    || getPaymentMethods(userId, 'payment')[0]
    || null;
}

export function getPaymentMethodLabel(method) {
  if (!method) return '';
  if (method.type === 'bank_account') {
    return `${method.bankName || 'בנק'} · סניף ${method.bankBranch || '—'} · ****${method.lastFour || '****'}`;
  }
  if (method.type === 'apple_pay') return 'Apple Pay';
  if (method.type === 'google_pay') return 'Google Pay';
  const brand = method.brand || 'כרטיס';
  return method.lastFour ? `${brand} · ****${method.lastFour}` : brand;
}
