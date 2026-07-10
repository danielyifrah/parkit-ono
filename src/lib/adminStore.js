import { users as seedUsers } from '../data/mockData';
import { isSupabaseConfigured, supabase } from './supabaseClient';
import { profileFromRow } from './supabaseMappers';
import { USER_ROLES } from './roles';
import { getOwnerParkingStatus } from './ownerParkingStatus';
import * as parkingStore from './parkingStore';
import { AUDIT_ACTIONS, logAdminAction } from './auditLog';

const LOCAL_PROFILES_KEY = 'parkit_admin_profiles';

function seedProfiles() {
  return seedUsers.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    phone: u.phone || '',
    role: u.role,
    avatar: u.avatar || null,
    suspended: false,
    suspendedAt: null,
    suspendedReason: '',
    createdAt: null,
  }));
}

function loadLocalProfiles() {
  const base = seedProfiles();
  try {
    const raw = localStorage.getItem(LOCAL_PROFILES_KEY);
    if (!raw) return base;
    const overrides = JSON.parse(raw);
    const byId = Object.fromEntries(base.map((p) => [p.id, p]));
    (overrides || []).forEach((p) => {
      if (p?.id) byId[p.id] = { ...byId[p.id], ...p };
    });
    try {
      const saved = JSON.parse(localStorage.getItem('parkit_user') || 'null');
      if (saved?.id && !byId[saved.id]) {
        byId[saved.id] = {
          id: saved.id,
          email: saved.email,
          name: saved.name,
          phone: saved.phone || '',
          role: saved.role || USER_ROLES.DRIVER,
          avatar: saved.avatar || null,
          suspended: Boolean(saved.suspended),
          suspendedAt: saved.suspendedAt || null,
          suspendedReason: saved.suspendedReason || '',
          createdAt: null,
        };
      }
    } catch {
      /* ignore */
    }
    return Object.values(byId);
  } catch {
    return base;
  }
}

function saveLocalProfiles(profiles) {
  localStorage.setItem(LOCAL_PROFILES_KEY, JSON.stringify(profiles));
}

function mapProfile(row) {
  return {
    ...profileFromRow(row),
    createdAt: row.created_at || row.createdAt || null,
  };
}

export async function fetchAllProfiles() {
  if (!isSupabaseConfigured()) {
    return loadLocalProfiles();
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, name, phone, role, avatar, suspended, suspended_at, suspended_reason, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to load profiles', error);
    throw error;
  }

  return (data || []).map(mapProfile);
}

export async function findLocalProfileByEmail(email) {
  const profiles = loadLocalProfiles();
  return profiles.find((p) => p.email?.toLowerCase() === email?.toLowerCase()) || null;
}

export async function updateAdminProfile(profileId, updates, { actor } = {}) {
  const allowedRoles = Object.values(USER_ROLES);
  const patch = {};

  if (typeof updates.name === 'string') patch.name = updates.name.trim();
  if (typeof updates.phone === 'string') patch.phone = updates.phone.trim();
  if (typeof updates.email === 'string') patch.email = updates.email.trim();
  if (updates.role && allowedRoles.includes(updates.role)) patch.role = updates.role;

  let previous = null;

  if (!isSupabaseConfigured()) {
    const profiles = loadLocalProfiles();
    const idx = profiles.findIndex((p) => p.id === profileId);
    if (idx < 0) return { ok: false, error: 'משתמש לא נמצא' };
    previous = { ...profiles[idx] };
    profiles[idx] = { ...profiles[idx], ...patch };
    saveLocalProfiles(profiles);

    await writeProfileAudit(actor, previous, profiles[idx]);
    return { ok: true, profile: profiles[idx] };
  }

  const { data: before } = await supabase
    .from('profiles')
    .select('id, email, name, phone, role, avatar, suspended, suspended_at, suspended_reason, created_at')
    .eq('id', profileId)
    .maybeSingle();
  previous = before ? mapProfile(before) : null;

  const { data, error } = await supabase
    .from('profiles')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', profileId)
    .select('id, email, name, phone, role, avatar, suspended, suspended_at, suspended_reason, created_at')
    .single();

  if (error) {
    console.error('Admin profile update failed', error);
    return { ok: false, error: 'עדכון המשתמש נכשל' };
  }

  const profile = mapProfile(data);
  await writeProfileAudit(actor, previous, profile);
  return { ok: true, profile };
}

async function writeProfileAudit(actor, previous, next) {
  if (!actor || !previous || !next) return;

  if (previous.role !== next.role) {
    const roleLabel = {
      [USER_ROLES.DRIVER]: 'נהג',
      [USER_ROLES.OWNER]: 'בעל חניה',
      [USER_ROLES.ADMIN]: 'מנהל',
    };
    await logAdminAction({
      actor,
      actionType: AUDIT_ACTIONS.user_role_changed.value,
      summary: `${actor.name} שינה את התפקיד של ${next.name} מ-${roleLabel[previous.role] || previous.role} ל-${roleLabel[next.role] || next.role}`,
      entityType: 'user',
      entityLabel: next.name,
    });
    return;
  }

  await logAdminAction({
    actor,
    actionType: AUDIT_ACTIONS.user_updated.value,
    summary: `${actor.name} עדכן את פרטי המשתמש ${next.name}`,
    entityType: 'user',
    entityLabel: next.name,
  });
}

export async function setUserSuspended(profileId, { suspended, reason = '', actor } = {}) {
  if (!profileId) return { ok: false, error: 'משתמש לא נמצא' };

  const patch = {
    suspended: Boolean(suspended),
    suspended_at: suspended ? new Date().toISOString() : null,
    suspended_reason: suspended ? String(reason || '').trim() : '',
    updated_at: new Date().toISOString(),
  };

  if (!isSupabaseConfigured()) {
    const profiles = loadLocalProfiles();
    const idx = profiles.findIndex((p) => p.id === profileId);
    if (idx < 0) return { ok: false, error: 'משתמש לא נמצא' };
    if (profiles[idx].role === USER_ROLES.ADMIN && suspended) {
      return { ok: false, error: 'לא ניתן להשעות מנהל מערכת' };
    }
    profiles[idx] = {
      ...profiles[idx],
      suspended: patch.suspended,
      suspendedAt: patch.suspended_at,
      suspendedReason: patch.suspended_reason,
    };
    saveLocalProfiles(profiles);

    await logAdminAction({
      actor,
      actionType: suspended
        ? AUDIT_ACTIONS.user_suspended.value
        : AUDIT_ACTIONS.user_unsuspended.value,
      summary: suspended
        ? `${actor?.name || 'מנהל'} השעה את ${profiles[idx].name}${reason ? ` (${reason})` : ''}`
        : `${actor?.name || 'מנהל'} ביטל את ההשעיה של ${profiles[idx].name}`,
      entityType: 'user',
      entityLabel: profiles[idx].name,
    });

    return { ok: true, profile: profiles[idx] };
  }

  const { data: existing } = await supabase
    .from('profiles')
    .select('id, name, role')
    .eq('id', profileId)
    .maybeSingle();

  if (!existing) return { ok: false, error: 'משתמש לא נמצא' };
  if (existing.role === USER_ROLES.ADMIN && suspended) {
    return { ok: false, error: 'לא ניתן להשעות מנהל מערכת' };
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', profileId)
    .select('id, email, name, phone, role, avatar, suspended, suspended_at, suspended_reason, created_at')
    .single();

  if (error) {
    console.error('Suspend user failed', error);
    return { ok: false, error: 'עדכון ההשעיה נכשל' };
  }

  const profile = mapProfile(data);
  await logAdminAction({
    actor,
    actionType: suspended
      ? AUDIT_ACTIONS.user_suspended.value
      : AUDIT_ACTIONS.user_unsuspended.value,
    summary: suspended
      ? `${actor?.name || 'מנהל'} השעה את ${profile.name}${reason ? ` (${reason})` : ''}`
      : `${actor?.name || 'מנהל'} ביטל את ההשעיה של ${profile.name}`,
    entityType: 'user',
    entityLabel: profile.name,
  });

  return { ok: true, profile };
}

function startOfLocalDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysAgo(n) {
  const d = startOfLocalDay();
  d.setDate(d.getDate() - n);
  return d;
}

function bookingCreatedAt(booking) {
  if (booking.createdAt) return new Date(booking.createdAt);
  if (booking.date) return new Date(`${booking.date}T00:00:00`);
  return null;
}

function isCompletedOrPaid(booking) {
  return ['completed', 'active', 'scheduled', 'saved', 'pending_arrival'].includes(booking.status)
    && booking.status !== 'cancelled';
}

function sumRevenue(bookings) {
  return bookings.reduce((sum, b) => sum + (Number(b.totalPrice) || 0), 0);
}

function filterBookingsSince(bookings, since) {
  return bookings.filter((b) => {
    if (b.status === 'cancelled') return false;
    const created = bookingCreatedAt(b);
    if (!created || Number.isNaN(created.getTime())) return false;
    return created >= since;
  });
}

export function computeAdminStats({ profiles = [], parkings = [], bookings = [] } = {}) {
  const drivers = profiles.filter((p) => p.role === USER_ROLES.DRIVER).length;
  const owners = profiles.filter((p) => p.role === USER_ROLES.OWNER).length;
  const admins = profiles.filter((p) => p.role === USER_ROLES.ADMIN).length;
  const suspended = profiles.filter((p) => p.suspended).length;

  const activeParkings = parkings.filter((p) => p.status === 'active').length;
  const frozenParkings = parkings.filter((p) => p.status === 'inactive').length;

  let availableNow = 0;
  let occupiedNow = 0;
  let reservedNow = 0;
  let unavailableNow = 0;

  parkings.forEach((parking) => {
    const display = getOwnerParkingStatus(parking, bookings);
    const status = display?.status || 'unavailable';
    if (status === 'available') availableNow += 1;
    else if (status === 'occupied') occupiedNow += 1;
    else if (status === 'reserved') reservedNow += 1;
    else if (status === 'frozen') { /* counted in frozen */ }
    else unavailableNow += 1;
  });

  const periods = [
    { key: 'today', label: 'היום', since: startOfLocalDay() },
    { key: 'week', label: 'שבוע אחרון', since: daysAgo(7) },
    { key: 'month', label: 'חודש אחרון', since: daysAgo(30) },
    { key: 'year', label: 'שנה אחרונה', since: daysAgo(365) },
  ];

  const bookingPeriods = Object.fromEntries(
    periods.map(({ key, label, since }) => {
      const list = filterBookingsSince(bookings, since);
      return [key, { label, count: list.length, revenue: sumRevenue(list) }];
    }),
  );

  const allNonCancelled = bookings.filter((b) => b.status !== 'cancelled');
  const activeSessions = bookings.filter((b) => ['active', 'saved', 'pending_arrival', 'scheduled'].includes(b.status)).length;
  const completed = bookings.filter((b) => b.status === 'completed').length;

  return {
    users: {
      total: profiles.length,
      drivers,
      owners,
      admins,
      suspended,
    },
    parkings: {
      total: parkings.length,
      active: activeParkings,
      frozen: frozenParkings,
      availableNow,
      occupiedNow,
      reservedNow,
      unavailableNow,
    },
    bookings: {
      total: allNonCancelled.length,
      activeSessions,
      completed,
      periods: bookingPeriods,
      totalRevenue: sumRevenue(allNonCancelled.filter(isCompletedOrPaid)),
    },
  };
}

export function getAdminParkingsSnapshot() {
  const parkings = parkingStore.getParkings();
  const bookings = parkingStore.getBookings();
  return parkings.map((parking) => {
    const display = getOwnerParkingStatus(parking, bookings);
    return {
      parking,
      displayStatus: display?.status || 'unavailable',
      activeBooking: display?.booking || null,
    };
  });
}

export const BOOKING_STATUS_LABELS = {
  scheduled: 'מתוכננת',
  saved: 'שמורה',
  pending_arrival: 'ממתינה להגעה',
  active: 'פעילה',
  completed: 'הושלמה',
  cancelled: 'בוטלה',
};
