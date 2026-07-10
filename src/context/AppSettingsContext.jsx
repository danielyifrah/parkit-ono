import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  getAppSettings,
  getMaintenanceMessage,
  initAppSettings,
  isBookingsDisabled,
  setBookingsDisabled,
  subscribeAppSettings,
} from '../lib/appSettings';
import { useAuth } from './AuthContext';

const AppSettingsContext = createContext(null);

export function AppSettingsProvider({ children }) {
  const { user, isAdmin } = useAuth();
  const [settings, setSettings] = useState(getAppSettings);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    initAppSettings().finally(() => {
      if (active) setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => subscribeAppSettings(setSettings), []);

  const updateMaintenance = useCallback(async ({ disabled, message } = {}) => {
    if (!isAdmin) {
      return { ok: false, error: 'אין הרשאה' };
    }
    setSaving(true);
    const result = await setBookingsDisabled({
      disabled,
      message,
      updatedBy: user?.id || null,
    });
    setSaving(false);
    return result;
  }, [isAdmin, user?.id]);

  const value = useMemo(() => ({
    ready,
    saving,
    bookingsDisabled: isBookingsDisabled() || Boolean(settings.bookingsDisabled),
    message: settings.message || getMaintenanceMessage(),
    settings,
    updateMaintenance,
  }), [ready, saving, settings, updateMaintenance]);

  return (
    <AppSettingsContext.Provider value={value}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings() {
  const ctx = useContext(AppSettingsContext);
  if (!ctx) throw new Error('useAppSettings must be used within AppSettingsProvider');
  return ctx;
}
