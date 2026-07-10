import { isSupabaseConfigured, supabase } from './supabaseClient';

const STORAGE_KEY = 'parkit_app_settings';
const DEFAULT_MESSAGE =
  'האפליקציה מושבתת זמנית לתחזוקה. ניתן להתחבר, אך לא ניתן לבצע הזמנות או לנהל חניות כרגע.';

const DEFAULT_SETTINGS = {
  bookingsDisabled: false,
  message: DEFAULT_MESSAGE,
  updatedAt: null,
  updatedBy: null,
};

const listeners = new Set();
let settings = { ...DEFAULT_SETTINGS };
let loaded = false;

function notify() {
  listeners.forEach((fn) => fn(settings));
}

function fromRow(row) {
  if (!row) return { ...DEFAULT_SETTINGS };
  return {
    bookingsDisabled: Boolean(row.bookings_disabled),
    message: row.message || DEFAULT_MESSAGE,
    updatedAt: row.updated_at || null,
    updatedBy: row.updated_by || null,
  };
}

function loadLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return {
      bookingsDisabled: Boolean(parsed.bookingsDisabled),
      message: parsed.message || DEFAULT_MESSAGE,
      updatedAt: parsed.updatedAt || null,
      updatedBy: parsed.updatedBy || null,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function saveLocal(next) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function getAppSettings() {
  return settings;
}

export function isBookingsDisabled() {
  return Boolean(settings.bookingsDisabled);
}

export function getMaintenanceMessage() {
  return settings.message || DEFAULT_MESSAGE;
}

export function subscribeAppSettings(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function initAppSettings() {
  if (!isSupabaseConfigured()) {
    settings = loadLocal();
    loaded = true;
    notify();
    return settings;
  }

  const { data, error } = await supabase
    .from('app_settings')
    .select('*')
    .eq('id', 'global')
    .maybeSingle();

  if (error) {
    console.error('Failed to load app_settings', error);
    settings = { ...DEFAULT_SETTINGS };
  } else {
    settings = fromRow(data);
  }

  loaded = true;
  notify();
  return settings;
}

export function areAppSettingsLoaded() {
  return loaded;
}

export async function setBookingsDisabled({ disabled, message, updatedBy } = {}) {
  const next = {
    bookingsDisabled: Boolean(disabled),
    message: (message && String(message).trim()) || DEFAULT_MESSAGE,
    updatedAt: new Date().toISOString(),
    updatedBy: updatedBy || null,
  };

  if (!isSupabaseConfigured()) {
    settings = next;
    saveLocal(next);
    notify();
    return { ok: true, settings };
  }

  const { data, error } = await supabase
    .from('app_settings')
    .update({
      bookings_disabled: next.bookingsDisabled,
      message: next.message,
      updated_at: next.updatedAt,
      updated_by: next.updatedBy,
    })
    .eq('id', 'global')
    .select('*')
    .single();

  if (error) {
    console.error('Failed to update app_settings', error);
    return { ok: false, error: 'עדכון הגדרות האפליקציה נכשל' };
  }

  settings = fromRow(data);
  notify();
  return { ok: true, settings };
}

export const APP_DISABLED_BOOKING_ERROR =
  'האפליקציה מושבתת זמנית. לא ניתן לבצע הזמנות כרגע.';

export const APP_DISABLED_OWNER_ERROR =
  'האפליקציה מושבתת זמנית. לא ניתן לנהל חניות כרגע.';
