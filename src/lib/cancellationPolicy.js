import { getBookingStartMs } from './availability';

export const CANCELLATION_FEE = 15;
const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;

export function getFreeCancellationDeadlineMs(booking) {
  if (!booking?.createdAt) return null;

  const startMs = getBookingStartMs(booking);
  const bookedAtMs = new Date(booking.createdAt).getTime();
  const leadTimeMs = startMs - bookedAtMs;
  const hoursBeforeStart = leadTimeMs <= FOUR_HOURS_MS ? 2 : 4;

  return startMs - hoursBeforeStart * 60 * 60 * 1000;
}

export function getCancellationPolicyDescription(booking) {
  if (!booking) return '';

  const startMs = getBookingStartMs(booking);
  const bookedAtMs = new Date(booking.createdAt || Date.now()).getTime();
  const leadTimeMs = startMs - bookedAtMs;
  const hoursBeforeStart = leadTimeMs <= FOUR_HOURS_MS ? 2 : 4;

  return `ביטול חינם עד ${hoursBeforeStart} שעות לפני תחילת החניה. לאחר מכן חיוב ביטול של ₪${CANCELLATION_FEE}.`;
}

export function getCancellationPreview(booking, now = new Date()) {
  if (!booking) {
    return { fee: 0, isFree: true, message: '' };
  }

  if (['pending_arrival', 'saved'].includes(booking.status)) {
    return {
      fee: 0,
      isFree: true,
      message: 'ביטול ללא חיוב',
    };
  }

  if (booking.status !== 'scheduled') {
    return { fee: 0, isFree: true, message: '' };
  }

  const deadlineMs = getFreeCancellationDeadlineMs(booking);
  const nowMs = now.getTime();
  const isFree = deadlineMs == null || nowMs <= deadlineMs;
  const fee = isFree ? 0 : CANCELLATION_FEE;
  const hoursBeforeStart = (getBookingStartMs(booking) - new Date(booking.createdAt).getTime()) <= FOUR_HOURS_MS
    ? 2
    : 4;

  return {
    fee,
    isFree,
    deadlineMs,
    message: isFree
      ? `ביטול חינם עד ${hoursBeforeStart} שעות לפני תחילת החניה`
      : `ביטול כרגע יחויב ב-₪${CANCELLATION_FEE}`,
  };
}
