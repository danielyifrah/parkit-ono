import { isSupabaseConfigured, supabase } from './supabaseClient';

const STORAGE_KEY = 'parkit_admin_activity_log';

/** Action types used for filtering — labels are Hebrew for the admin UI. */
export const AUDIT_ACTIONS = {
  user_updated: { value: 'user_updated', label: 'עריכת משתמש' },
  user_role_changed: { value: 'user_role_changed', label: 'שינוי תפקיד' },
  user_suspended: { value: 'user_suspended', label: 'השעיית משתמש' },
  user_unsuspended: { value: 'user_unsuspended', label: 'ביטול השעיה' },
  parking_updated: { value: 'parking_updated', label: 'עריכת חניה' },
  parking_frozen: { value: 'parking_frozen', label: 'הקפאת חניה' },
  parking_unfrozen: { value: 'parking_unfrozen', label: 'הפשרת חניה' },
  parking_removed: { value: 'parking_removed', label: 'הסרת חניה' },
  booking_cancelled: { value: 'booking_cancelled', label: 'ביטול הזמנה' },
  booking_refunded: { value: 'booking_refunded', label: 'החזר כספי' },
  app_disabled: { value: 'app_disabled', label: 'השבתת אפליקציה' },
  app_enabled: { value: 'app_enabled', label: 'הפעלת אפליקציה' },
};

function loadLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocal(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, 500)));
}

function fromRow(row) {
  return {
    id: row.id,
    createdAt: row.created_at,
    actorId: row.actor_id,
    actorName: row.actor_name || 'מנהל',
    actionType: row.action_type,
    summary: row.summary,
    entityType: row.entity_type || null,
    entityLabel: row.entity_label || null,
  };
}

/**
 * Record a human-readable admin action.
 * Prefer a ready Hebrew `summary` sentence — this is what the admin sees.
 */
export async function logAdminAction({
  actor,
  actionType,
  summary,
  entityType = null,
  entityLabel = null,
} = {}) {
  if (!summary || !actionType) return { ok: false };

  const entry = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    actorId: actor?.id || null,
    actorName: actor?.name || 'מנהל',
    actionType,
    summary: String(summary).trim(),
    entityType,
    entityLabel,
  };

  if (!isSupabaseConfigured()) {
    const list = loadLocal();
    list.unshift(entry);
    saveLocal(list);
    return { ok: true, entry };
  }

  const { data, error } = await supabase
    .from('admin_activity_log')
    .insert({
      actor_id: entry.actorId,
      actor_name: entry.actorName,
      action_type: entry.actionType,
      summary: entry.summary,
      entity_type: entry.entityType,
      entity_label: entry.entityLabel,
    })
    .select('*')
    .single();

  if (error) {
    console.error('Failed to write admin activity log', error);
    return { ok: false, error: 'שמירת הפעולה ביומן נכשלה' };
  }

  return { ok: true, entry: fromRow(data) };
}

export async function fetchAdminActivityLog({ limit = 100, actionType = null } = {}) {
  if (!isSupabaseConfigured()) {
    let list = loadLocal();
    if (actionType && actionType !== 'all') {
      list = list.filter((e) => e.actionType === actionType);
    }
    return list.slice(0, limit);
  }

  let query = supabase
    .from('admin_activity_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (actionType && actionType !== 'all') {
    query = query.eq('action_type', actionType);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Failed to load admin activity log', error);
    throw error;
  }

  return (data || []).map(fromRow);
}

export function getActionLabel(actionType) {
  return AUDIT_ACTIONS[actionType]?.label || 'פעולה';
}

export function formatActivityTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('he-IL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
