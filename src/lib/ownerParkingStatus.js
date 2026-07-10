import { toLocalDateStr } from './bookingPricing';
import {
  getBookingStartMs,
  getClosingMinutes,
  getCurrentTimeStr,
  getSchedulesForDate,
  timeToMinutes,
} from './availability';

const PRE_START_HOLD_MINUTES = 10;

export const OWNER_PARKING_STATUS_META = {
  frozen: { label: 'מוקפאת', badgeClass: 'badge--frozen' },
  available: { label: 'פנויה', badgeClass: 'badge--available' },
  reserved: { label: 'שמורה', badgeClass: 'badge--reserved', showBookingInfo: true },
  occupied: { label: 'תפוסה', badgeClass: 'badge--occupied', showBookingInfo: true },
  unavailable: { label: 'לא בזמינות', badgeClass: 'badge--unavailable' },
};

export function isParkingOpenNow(parking, now = new Date()) {
  const dateStr = toLocalDateStr(now);
  const schedules = getSchedulesForDate(parking, dateStr);
  if (schedules.length === 0) return false;

  const currentMin = timeToMinutes(getCurrentTimeStr(now));
  return schedules.some((slot) => {
    const openMin = timeToMinutes(slot.start);
    const closeMin = getClosingMinutes(slot);
    return currentMin >= openMin && currentMin < closeMin;
  });
}

function isInHoldPhase(booking) {
  if (!booking || booking.status !== 'scheduled') return false;
  const holdStartMs = getBookingStartMs(booking) - PRE_START_HOLD_MINUTES * 60 * 1000;
  return Date.now() >= holdStartMs;
}

function findActiveBooking(parkingId, bookings) {
  return bookings.find((b) => b.parkingId === parkingId && b.status === 'active') || null;
}

function findReservedBooking(parkingId, bookings) {
  return bookings.find((b) => {
    if (b.parkingId !== parkingId) return false;
    if (b.status === 'pending_arrival' || b.status === 'saved') return true;
    if (b.status === 'scheduled' && isInHoldPhase(b)) return true;
    return false;
  }) || null;
}

export function getOwnerParkingStatus(parking, bookings, now = new Date()) {
  if (!parking) return null;

  if (parking.status === 'inactive') {
    return { status: 'frozen', booking: null };
  }

  const activeBooking = findActiveBooking(parking.id, bookings);
  if (activeBooking) {
    return { status: 'occupied', booking: activeBooking };
  }

  const reservedBooking = findReservedBooking(parking.id, bookings);
  if (reservedBooking) {
    return { status: 'reserved', booking: reservedBooking };
  }

  if (!isParkingOpenNow(parking, now)) {
    return { status: 'unavailable', booking: null };
  }

  return { status: 'available', booking: null };
}

export function getOwnerParkingStatusMeta(displayStatus) {
  if (!displayStatus?.status) return OWNER_PARKING_STATUS_META.available;
  return OWNER_PARKING_STATUS_META[displayStatus.status] || OWNER_PARKING_STATUS_META.available;
}
