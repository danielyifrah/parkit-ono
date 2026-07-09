import { parkings as seedParkings, bookings as seedBookings } from '../data/mockData';
import { isSupabaseConfigured, supabase } from './supabaseClient';
import { bookingFromRow, bookingToRow, parkingFromRow, parkingToRow } from './supabaseMappers';
import { calculateBookingPrice, getActualChargeMinutes, getElapsedMinutesFromStartedAt, toLocalDateStr } from './bookingPricing';
import {
  addMinutesToTime,
  getBookingStartMs,
  getMaxExtensionMinutes,
  normalizeTime,
  parseAvailabilityHours,
  timeToMinutes,
  validateBookingSlot,
} from './availability';

const STORAGE_KEY = 'parkit_store_v1';
export const HOLD_MINUTES = 10;
export const PRE_START_HOLD_MINUTES = 10;
/** @deprecated use HOLD_MINUTES */
export const SAVED_HOLD_MINUTES = HOLD_MINUTES;

const listeners = new Set();

function cloneSeed() {
  return {
    parkings: JSON.parse(JSON.stringify(seedParkings)),
    bookings: JSON.parse(JSON.stringify(seedBookings)),
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.parkings?.length) return parsed;
    }
  } catch {
    /* use seed */
  }
  return cloneSeed();
}

let state = isSupabaseConfigured() ? { parkings: [], bookings: [] } : loadState();
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

async function syncParking(parking) {
  if (!isSupabaseConfigured() || !parking) return;
  const { error } = await supabase.from('parkings').upsert(parkingToRow(parking));
  if (error) console.error('syncParking failed', error);
}

async function syncBooking(booking) {
  if (!isSupabaseConfigured() || !booking) return;
  const { error } = await supabase.from('bookings').upsert(bookingToRow(booking));
  if (error) console.error('syncBooking failed', error);
}

async function deleteParkingFromDb(parkingId) {
  if (!isSupabaseConfigured()) return;
  const { error } = await supabase.from('parkings').delete().eq('id', parkingId);
  if (error) console.error('deleteParking failed', error);
}

function persistBookingChange(booking) {
  persist();
  const parking = findParking(booking?.parkingId);
  if (parking) syncParking(parking);
  if (booking) syncBooking(booking);
}

function persistParkingChange(parking) {
  persist();
  if (parking) syncParking(parking);
}

export function invalidateInit() {
  initPromise = null;
}

export async function init({ userId = null, force = false } = {}) {
  if (!isSupabaseConfigured()) return;
  if (initPromise && !force) return initPromise;

  initPromise = (async () => {
    const { data: parkings, error: parkingsError } = await supabase
      .from('parkings')
      .select('*');

    if (parkingsError) {
      console.error('Failed to load parkings', parkingsError);
      throw parkingsError;
    }

    let bookings = [];
    if (userId) {
      // RLS returns only the user's bookings + bookings on parkings they own
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*');

      if (bookingsError) {
        console.error('Failed to load bookings', bookingsError);
        throw bookingsError;
      }

      bookings = bookingsData || [];
    }

    state = {
      parkings: (parkings || []).map(parkingFromRow),
      bookings: bookings.map(bookingFromRow),
    };
    notify();
  })();

  return initPromise;
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getState() {
  return state;
}

function weeklySchedule(start, end, openDays = [0, 1, 2, 3, 4, 5, 6]) {
  const weekly = {};
  for (let day = 0; day < 7; day += 1) {
    weekly[day] = openDays.includes(day) ? { start, end } : null;
  }
  return weekly;
}

function monthAvailability(weekly, blockedDates = [], bookedSlots = []) {
  return { weekly, blockedDates, bookedSlots };
}

function nextId(prefix, items) {
  const nums = items
    .map((item) => Number(String(item.id).replace(prefix, '')))
    .filter((n) => !Number.isNaN(n));
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `${prefix}${next}`;
}

function findParking(parkingId) {
  return state.parkings.find((p) => p.id === parkingId) || null;
}

export function getReservationConflicts(parkingId, excludeBookingId = null) {
  return state.bookings
    .filter(
      (b) => b.parkingId === parkingId
        && ['scheduled', 'saved', 'active', 'pending_arrival'].includes(b.status)
        && b.id !== excludeBookingId,
    )
    .map((b) => ({
      date: b.date,
      startTime: b.startTime,
      endTime: b.endTime,
    }));
}

function hasOpenSession(userId) {
  return state.bookings.some(
    (b) => b.userId === userId
      && ['scheduled', 'saved', 'active', 'pending_arrival'].includes(b.status),
  );
}

function findBooking(bookingId) {
  return state.bookings.find((b) => b.id === bookingId) || null;
}

function addBookedSlot(parkingId, date, start, end, bookingId) {
  const parking = findParking(parkingId);
  if (!parking) return;
  if (!parking.availability) {
    parking.availability = monthAvailability(weeklySchedule('00:00', '23:59'));
  }
  if (!parking.availability.bookedSlots) {
    parking.availability.bookedSlots = [];
  }
  parking.availability.bookedSlots.push({
    date,
    start: normalizeTime(start),
    end: normalizeTime(end),
    bookingId,
  });
}

function removeBookedSlot(parkingId, bookingId) {
  const parking = findParking(parkingId);
  if (!parking?.availability?.bookedSlots) return;
  parking.availability.bookedSlots = parking.availability.bookedSlots.filter(
    (slot) => slot.bookingId !== bookingId,
  );
}

function updateBookedSlotEnd(parkingId, bookingId, newEnd) {
  const parking = findParking(parkingId);
  const slot = parking?.availability?.bookedSlots?.find((s) => s.bookingId === bookingId);
  if (slot) slot.end = normalizeTime(newEnd);
}

export function getParkings() {
  return state.parkings;
}

export function getParkingById(id) {
  return findParking(id);
}

export function getBookings() {
  return state.bookings;
}

export function getBookingsByUserId(userId) {
  return state.bookings
    .filter((b) => b.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function getBookingById(id) {
  return findBooking(id);
}

export function getParkingsByOwnerId(ownerId) {
  return state.parkings.filter((p) => p.ownerId === ownerId);
}

export function getScheduledBookingByUserId(userId) {
  return state.bookings.find((b) => b.userId === userId && b.status === 'scheduled') || null;
}

export function getPendingArrivalBookingByUserId(userId) {
  return state.bookings.find((b) => b.userId === userId && b.status === 'pending_arrival') || null;
}

export function getSavedBookingByUserId(userId) {
  return state.bookings.find((b) => b.userId === userId && b.status === 'saved') || null;
}

export function getActiveBookingByUserId(userId) {
  return state.bookings.find((b) => b.userId === userId && b.status === 'active') || null;
}

export function isParkingOccupied(parkingId, excludeBookingId = null) {
  return state.bookings.some(
    (b) => b.parkingId === parkingId
      && (
        b.status === 'active'
        || b.status === 'pending_arrival'
        || (b.status === 'saved' && b.slotBlocked)
      )
      && b.id !== excludeBookingId,
  );
}

export function getAvailableParkings() {
  return state.parkings.filter(
    (p) => p.available !== false && p.status === 'active' && !isParkingOccupied(p.id),
  );
}

export function getScheduledHoldStartMs(booking) {
  return getBookingStartMs(booking) - PRE_START_HOLD_MINUTES * 60 * 1000;
}

export function shouldEnterHoldPhase(booking) {
  if (!booking || booking.status !== 'scheduled') return false;
  return Date.now() >= getScheduledHoldStartMs(booking);
}

export function getSavedHoldRemainingMs(booking) {
  if (!booking?.holdStartedAt) return 0;
  const expiresAt = new Date(booking.holdStartedAt).getTime() + HOLD_MINUTES * 60 * 1000;
  return Math.max(0, expiresAt - Date.now());
}

export function getActiveRemainingMs(booking) {
  if (!booking) return 0;
  const [y, mo, d] = booking.date.split('-').map(Number);
  const [eh, em] = booking.endTime.split(':').map(Number);
  const endAt = new Date(y, mo - 1, d, eh, em, 0).getTime();
  return Math.max(0, endAt - Date.now());
}

function blockSlotForBooking(booking) {
  if (booking.slotBlocked) return;
  addBookedSlot(
    booking.parkingId,
    booking.date,
    booking.startTime,
    booking.endTime,
    booking.id,
  );
  booking.slotBlocked = true;
}

function buildBookingBase({ userId, parkingId, date, startTime, durationMinutes, paymentMethod }) {
  const parking = findParking(parkingId);
  const endTime = addMinutesToTime(startTime, durationMinutes);
  const pricing = calculateBookingPrice(parking.pricePerHour, durationMinutes);
  const id = nextId('b', state.bookings);
  return {
    id,
    userId,
    parkingId,
    date,
    startTime: normalizeTime(startTime),
    endTime,
    durationHours: durationMinutes / 60,
    durationMinutes,
    totalPrice: pricing.total,
    basePrice: pricing.base,
    discountPercent: pricing.discountPercent,
    discountLabel: pricing.discountLabel,
    paymentMethod,
    slotBlocked: false,
    createdAt: new Date().toISOString(),
  };
}

export function createBooking({
  userId,
  parkingId,
  date,
  startTime,
  durationMinutes,
  paymentMethod = 'כרטיס אשראי',
  immediate = false,
}) {
  const parking = findParking(parkingId);
  if (!parking) return { ok: false, error: 'חניה לא נמצאה' };

  if (isParkingOccupied(parkingId)) {
    return { ok: false, error: 'החניה תפוסה כרגע על ידי משתמש אחר.' };
  }

  const conflicts = getReservationConflicts(parkingId);
  const validation = validateBookingSlot(parking, date, startTime, durationMinutes, conflicts);
  if (!validation.valid) {
    return { ok: false, error: validation.error, maxDurationMinutes: validation.maxDurationMinutes };
  }

  if (hasOpenSession(userId)) {
    return { ok: false, error: 'יש לכם כבר הזמנה פעילה או שמורה.' };
  }

  const booking = {
    ...buildBookingBase({ userId, parkingId, date, startTime, durationMinutes, paymentMethod }),
    status: immediate ? 'pending_arrival' : 'scheduled',
  };

  state.bookings.push(booking);

  if (booking.status === 'scheduled' || booking.status === 'pending_arrival') {
    addBookedSlot(
      booking.parkingId,
      booking.date,
      booking.startTime,
      booking.endTime,
      booking.id,
    );
    booking.slotBlocked = true;
  }

  persistBookingChange(booking);
  return { ok: true, booking, immediate };
}

/** @deprecated use createBooking */
export function createSavedBooking(params) {
  return createBooking({ ...params, immediate: false });
}

export function confirmArrivalHere(bookingId, userId) {
  const booking = findBooking(bookingId);
  if (!booking || booking.userId !== userId || booking.status !== 'pending_arrival') {
    return { ok: false, error: 'לא ניתן להתחיל חניה. ההזמנה אינה תקפה.' };
  }

  const now = new Date();
  const durationMinutes = booking.durationMinutes || Math.round(booking.durationHours * 60);
  const startTime = normalizeTime(`${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`);
  const endTime = addMinutesToTime(startTime, durationMinutes);
  const date = toLocalDateStr(now);

  booking.status = 'active';
  booking.startedAt = now.toISOString();
  booking.date = date;
  booking.startTime = startTime;
  booking.endTime = endTime;
  blockSlotForBooking(booking);
  persistBookingChange(booking);
  return { ok: true, booking };
}

export function confirmArrivalOnWay(bookingId, userId) {
  const booking = findBooking(bookingId);
  if (!booking || booking.userId !== userId || booking.status !== 'pending_arrival') {
    return { ok: false, error: 'לא ניתן לשמור חניה. ההזמנה אינה תקפה.' };
  }

  booking.status = 'saved';
  booking.holdStartedAt = new Date().toISOString();
  blockSlotForBooking(booking);
  persistBookingChange(booking);
  return { ok: true, booking };
}

export function enterScheduledHold(bookingId) {
  const booking = findBooking(bookingId);
  if (!booking || booking.status !== 'scheduled') return { ok: false };

  booking.status = 'saved';
  booking.holdStartedAt = new Date().toISOString();
  blockSlotForBooking(booking);
  persistBookingChange(booking);
  return { ok: true, booking };
}

export function checkScheduledHoldsForUser(userId) {
  const scheduled = getScheduledBookingByUserId(userId);
  if (!scheduled || !shouldEnterHoldPhase(scheduled)) return null;
  return enterScheduledHold(scheduled.id).booking;
}

export function cancelBooking(bookingId, userId) {
  const booking = findBooking(bookingId);
  if (!booking || booking.userId !== userId) return { ok: false };
  if (!['scheduled', 'saved', 'pending_arrival'].includes(booking.status)) return { ok: false };

  if (booking.slotBlocked) {
    removeBookedSlot(booking.parkingId, bookingId);
  }
  booking.status = 'cancelled';
  booking.slotBlocked = false;
  persistBookingChange(booking);
  return { ok: true };
}

/** @deprecated use cancelBooking */
export function cancelSavedBooking(bookingId, userId) {
  return cancelBooking(bookingId, userId);
}

function updateBookedSlotRange(parkingId, bookingId, date, start, end) {
  const parking = findParking(parkingId);
  const slot = parking?.availability?.bookedSlots?.find((s) => s.bookingId === bookingId);
  if (slot) {
    slot.date = date;
    slot.start = normalizeTime(start);
    slot.end = normalizeTime(end);
  }
}

export function addParking(ownerId, form) {
  const { start, end } = parseAvailabilityHours(form.availabilityHours);
  const id = nextId('p', state.parkings);
  const parking = {
    id,
    ownerId,
    name: form.name,
    address: form.address,
    city: form.address.split(',').pop()?.trim() || 'תל אביב',
    pricePerHour: Number(form.pricePerHour),
    type: form.type,
    spotNumber: form.spotNumber || '—',
    description: form.description || '',
    rating: 0,
    reviewsCount: 0,
    walkMinutes: 3,
    available: true,
    status: 'active',
    image: null,
    images: [],
    lat: 32.07 + Math.random() * 0.03,
    lng: 34.77 + Math.random() * 0.03,
    availabilityHours: form.availabilityHours || `${start} - ${end}`,
    availability: monthAvailability(weeklySchedule(start, end)),
    bookingsToday: 0,
    incomeToday: 0,
    covered: form.type !== 'public',
    photosCount: 0,
  };
  state.parkings.push(parking);
  persistParkingChange(parking);
  return parking;
}

export function updateParkingAvailability(parkingId, availabilityHours) {
  const parking = findParking(parkingId);
  if (!parking) return null;
  const { start, end } = parseAvailabilityHours(availabilityHours);
  const bookedSlots = parking.availability?.bookedSlots || [];
  parking.availabilityHours = availabilityHours;
  parking.availability = monthAvailability(weeklySchedule(start, end), [], bookedSlots);
  persistParkingChange(parking);
  return parking;
}

export function updateParkingWeeklyAvailability(parkingId, weeklySlots) {
  const parking = findParking(parkingId);
  if (!parking) return null;

  const bookedSlots = parking.availability?.bookedSlots || [];
  const normalizedWeekly = {};

  for (let day = 0; day < 7; day += 1) {
    const rawSlots = Array.isArray(weeklySlots?.[day]) ? weeklySlots[day] : [];
    const slots = rawSlots
      .filter((slot) => slot?.start && slot?.end)
      .map((slot) => ({
        start: normalizeTime(slot.start),
        end: normalizeTime(slot.end),
      }));

    normalizedWeekly[day] = slots.length === 0
      ? null
      : (slots.length === 1 ? slots[0] : slots);
  }

  parking.availability = {
    ...monthAvailability(normalizedWeekly, [], bookedSlots),
    dateOverrides: parking.availability?.dateOverrides || {},
  };
  parking.availabilityHours = 'זמינות משתנה לפי ימים';
  persistParkingChange(parking);
  return parking;
}

export function updateParkingUpcomingAvailability(parkingId, dayPlans) {
  const parking = findParking(parkingId);
  if (!parking) return null;

  const bookedSlots = parking.availability?.bookedSlots || [];
  const weekly = parking.availability?.weekly || weeklySchedule('08:00', '20:00');
  const existingOverrides = { ...(parking.availability?.dateOverrides || {}) };
  const today = toLocalDateStr(new Date());

  Object.keys(existingOverrides).forEach((date) => {
    if (date < today) delete existingOverrides[date];
  });

  (dayPlans || []).forEach((plan) => {
    if (!plan?.date) return;
    const slots = (plan.slots || [])
      .filter((slot) => slot?.start && slot?.end)
      .map((slot) => ({
        start: normalizeTime(slot.start),
        end: normalizeTime(slot.end),
      }));

    if (!plan.enabled || slots.length === 0) {
      existingOverrides[plan.date] = null;
      return;
    }

    existingOverrides[plan.date] = slots.length === 1 ? slots[0] : slots;
  });

  parking.availability = {
    weekly,
    blockedDates: [],
    bookedSlots,
    dateOverrides: existingOverrides,
  };
  parking.availabilityHours = 'זמינות לפי ימים קרובים';
  persistParkingChange(parking);
  return parking;
}

export function updateParkingDetails(parkingId, updates) {
  const parking = findParking(parkingId);
  if (!parking) return null;

  const nextPrice = Number(updates?.pricePerHour);
  parking.name = updates?.name?.trim() || parking.name;
  parking.address = updates?.address?.trim() || parking.address;
  parking.spotNumber = updates?.spotNumber?.trim() || parking.spotNumber;
  parking.pricePerHour = Number.isFinite(nextPrice) && nextPrice > 0 ? nextPrice : parking.pricePerHour;
  parking.notes = updates?.notes?.trim() || '';

  if (typeof updates?.image === 'string') {
    parking.image = updates.image.trim() || null;
  }

  persistParkingChange(parking);
  return parking;
}

export function setParkingStatus(parkingId, status) {
  const parking = findParking(parkingId);
  if (!parking) return null;
  if (!['active', 'inactive'].includes(status)) return null;

  parking.status = status;
  parking.available = status === 'active';
  persistParkingChange(parking);
  return parking;
}

export function removeParking(parkingId) {
  const parking = findParking(parkingId);
  if (!parking) return { ok: false };

  const hasOpenSessions = state.bookings.some(
    (booking) => booking.parkingId === parkingId && ['scheduled', 'saved', 'pending_arrival', 'active'].includes(booking.status),
  );
  if (hasOpenSessions) {
    return { ok: false, error: 'לא ניתן להסיר חניה עם הזמנות פעילות.' };
  }

  state.parkings = state.parkings.filter((item) => item.id !== parkingId);
  persist();
  deleteParkingFromDb(parkingId);
  return { ok: true };
}

export function startBooking(bookingId, userId) {
  const booking = findBooking(bookingId);
  if (!booking || booking.userId !== userId || booking.status !== 'saved') {
    return { ok: false };
  }

  const now = new Date();
  const durationMinutes = booking.durationMinutes || Math.round(booking.durationHours * 60);
  const startTime = normalizeTime(`${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`);
  const endTime = addMinutesToTime(startTime, durationMinutes);
  const date = toLocalDateStr(now);

  booking.status = 'active';
  booking.startedAt = now.toISOString();
  booking.date = date;
  booking.startTime = startTime;
  booking.endTime = endTime;
  if (booking.slotBlocked) {
    updateBookedSlotRange(booking.parkingId, bookingId, date, startTime, endTime);
  } else {
    blockSlotForBooking(booking);
  }
  persistBookingChange(booking);
  return { ok: true, booking };
}

export function extendActiveBooking(bookingId, userId, extraMinutes) {
  const booking = findBooking(bookingId);
  const parking = findParking(booking?.parkingId);
  if (!booking || !parking || booking.userId !== userId || booking.status !== 'active') {
    return { ok: false, error: 'לא ניתן להאריך את החניה.' };
  }

  const maxExtend = getMaxExtensionMinutes(parking, booking.date, booking.endTime);
  if (extraMinutes <= 0 || extraMinutes > maxExtend) {
    return { ok: false, error: 'משך ההארכה אינו תקין.', maxExtensionMinutes: maxExtend };
  }

  const newDurationMinutes = (booking.durationMinutes || booking.durationHours * 60) + extraMinutes;
  const pricing = calculateBookingPrice(parking.pricePerHour, newDurationMinutes);
  booking.endTime = addMinutesToTime(booking.endTime, extraMinutes);
  booking.durationMinutes = newDurationMinutes;
  booking.durationHours = newDurationMinutes / 60;
  booking.totalPrice = pricing.total;
  booking.basePrice = pricing.base;
  booking.discountPercent = pricing.discountPercent;
  booking.discountLabel = pricing.discountLabel;

  if (!booking.slotBlocked) {
    blockSlotForBooking(booking);
  } else {
    updateBookedSlotEnd(booking.parkingId, bookingId, booking.endTime);
  }

  persistBookingChange(booking);
  return { ok: true, booking, maxExtensionMinutes: maxExtend };
}

export function completeBooking(bookingId, userId, review = null) {
  const booking = findBooking(bookingId);
  if (!booking || booking.userId !== userId || booking.status !== 'active') {
    return { ok: false, error: 'לא ניתן לסיים את החניה. נסו שוב.' };
  }

  const now = new Date();
  const actualEndTime = normalizeTime(
    `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`,
  );
  const parking = findParking(booking.parkingId);

  booking.endTime = actualEndTime;
  booking.completedAt = now.toISOString();

  const elapsedMinutes = booking.startedAt
    ? getElapsedMinutesFromStartedAt(booking.startedAt, now)
    : Math.max(1, timeToMinutes(actualEndTime) - timeToMinutes(booking.startTime));
  const durationMinutes = getActualChargeMinutes(elapsedMinutes);
  booking.durationMinutes = durationMinutes;
  booking.durationHours = durationMinutes / 60;

  if (parking) {
    const pricing = calculateBookingPrice(parking.pricePerHour, durationMinutes);
    booking.totalPrice = pricing.total;
    booking.basePrice = pricing.base;
    booking.discountPercent = pricing.discountPercent;
    booking.discountLabel = pricing.discountLabel;
  }

  if (booking.slotBlocked) {
    updateBookedSlotRange(
      booking.parkingId,
      bookingId,
      booking.date,
      booking.startTime,
      actualEndTime,
    );
  }

  booking.slotBlocked = false;
  booking.status = 'completed';
  if (review?.rating) {
    booking.review = review;
  }
  persistBookingChange(booking);
  return { ok: true, booking };
}

export function addBookingReview(bookingId, userId, review) {
  const booking = findBooking(bookingId);
  if (!booking || booking.userId !== userId || booking.status !== 'completed') {
    return { ok: false, error: 'לא ניתן לשמור ביקורת להזמנה זו' };
  }

  if (booking.review?.rating) {
    return { ok: false, error: 'כבר נשלחה ביקורת להזמנה זו' };
  }

  if (!review?.rating) {
    return { ok: false, error: 'יש לבחור דירוג' };
  }

  booking.review = {
    rating: review.rating,
    text: review.text?.trim() || '',
  };
  persistBookingChange(booking);
  return { ok: true, booking };
}

export function resetStore() {
  state = cloneSeed();
  persist();
}
