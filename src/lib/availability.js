const HEBREW_DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

export function normalizeTime(timeStr) {
  if (!timeStr) return '00:00';
  const [h, m] = timeStr.split(':').map(Number);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function timeToMinutes(timeStr) {
  const [h, m] = normalizeTime(timeStr).split(':').map(Number);
  return h * 60 + m;
}

export function minutesToTime(minutes) {
  const total = ((minutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function addMinutesToTime(timeStr, minutes) {
  return minutesToTime(timeToMinutes(timeStr) + minutes);
}

export function getDayOfWeek(dateStr) {
  const [y, mo, d] = dateStr.split('-').map(Number);
  return new Date(y, mo - 1, d).getDay();
}

export function getDayName(dateStr) {
  return HEBREW_DAYS[getDayOfWeek(dateStr)];
}

export function getScheduleForDate(parking, dateStr) {
  const schedules = getSchedulesForDate(parking, dateStr);
  return schedules[0] || null;
}

function normalizeScheduleSlots(daySchedule) {
  if (!daySchedule) return [];
  const schedules = Array.isArray(daySchedule) ? daySchedule : [daySchedule];
  return schedules
    .filter((slot) => slot?.start && slot?.end)
    .map((slot) => ({
      start: normalizeTime(slot.start),
      end: normalizeTime(slot.end),
    }))
    .sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
}

export function getSchedulesForDate(parking, dateStr) {
  if (!parking?.availability) return [];
  const { weekly = {}, blockedDates = [], dateOverrides = {} } = parking.availability;
  if (blockedDates.includes(dateStr)) return [];

  if (Object.prototype.hasOwnProperty.call(dateOverrides, dateStr)) {
    return normalizeScheduleSlots(dateOverrides[dateStr]);
  }

  return normalizeScheduleSlots(weekly[getDayOfWeek(dateStr)]);
}

export function getBookedSlotsForDate(parking, dateStr) {
  return (parking?.availability?.bookedSlots || [])
    .filter((slot) => slot.date === dateStr)
    .map((slot) => ({
      ...slot,
      start: normalizeTime(slot.start),
      end: normalizeTime(slot.end),
    }));
}

export function rangesOverlap(start1, end1, start2, end2) {
  return start1 < end2 && start2 < end1;
}

export function getClosingMinutes(schedule) {
  const start = timeToMinutes(schedule.start);
  const end = timeToMinutes(schedule.end);
  if (end <= start) return end + 24 * 60;
  return end;
}

export function getMaxDurationMinutes(parking, dateStr, startTime, extraReservations = []) {
  const schedules = getSchedulesForDate(parking, dateStr);
  if (schedules.length === 0) return 0;

  const startMin = timeToMinutes(startTime);
  const schedule = schedules.find((slot) => {
    const openMin = timeToMinutes(slot.start);
    const closeMin = getClosingMinutes(slot);
    return startMin >= openMin && startMin < closeMin;
  });
  if (!schedule) return 0;

  const closingMin = getClosingMinutes(schedule);
  let maxDuration = closingMin - startMin;
  for (const slot of slotsForValidation(parking, dateStr, extraReservations)) {
    const slotStart = timeToMinutes(slot.start);
    const slotEnd = timeToMinutes(slot.end);
    if (slotEnd <= startMin) continue;
    if (slotStart >= startMin + maxDuration) continue;
    if (slotStart > startMin) {
      maxDuration = Math.min(maxDuration, slotStart - startMin);
    } else if (rangesOverlap(startMin, startMin + maxDuration, slotStart, slotEnd)) {
      return 0;
    }
  }

  return Math.max(0, maxDuration);
}

export function getMaxExtensionMinutes(parking, dateStr, currentEndTime) {
  const schedules = getSchedulesForDate(parking, dateStr);
  if (schedules.length === 0) return 0;

  const currentEnd = timeToMinutes(currentEndTime);
  const schedule = schedules.find((slot) => currentEnd >= timeToMinutes(slot.start) && currentEnd < getClosingMinutes(slot));
  if (!schedule) return 0;
  const closingMin = getClosingMinutes(schedule);
  let maxExtend = closingMin - currentEnd;

  if (maxExtend <= 0) return 0;

  for (const slot of getBookedSlotsForDate(parking, dateStr)) {
    const slotStart = timeToMinutes(slot.start);
    if (slotStart <= currentEnd) continue;
    if (slotStart < currentEnd + maxExtend) {
      maxExtend = slotStart - currentEnd;
    }
  }

  return Math.max(0, maxExtend);
}

export function validateBookingSlot(parking, dateStr, startTime, durationMinutes, extraReservations = []) {
  const schedules = getSchedulesForDate(parking, dateStr);
  if (schedules.length === 0) {
    return { valid: false, error: 'החניה אינה זמינה בתאריך זה.' };
  }

  const startMin = timeToMinutes(startTime);
  const endMin = startMin + durationMinutes;
  const schedule = schedules.find((slot) => startMin >= timeToMinutes(slot.start) && startMin < getClosingMinutes(slot));
  if (!schedule) {
    return { valid: false, error: 'החניה אינה פנויה בשעה שנבחרה.', maxDurationMinutes: 0 };
  }
  const openMin = timeToMinutes(schedule.start);
  const closingMin = getClosingMinutes(schedule);
  const maxDuration = getMaxDurationMinutes(parking, dateStr, startTime, extraReservations);

  if (startMin < openMin) {
    return {
      valid: false,
      error: `החניה פנויה החל מ-${schedule.start}.`,
      maxDurationMinutes: maxDuration,
    };
  }

  if (durationMinutes > maxDuration) {
    if (maxDuration === 0) {
      return { valid: false, error: 'החניה אינה פנויה בשעה שנבחרה.', maxDurationMinutes: 0 };
    }
    const hours = Math.floor(maxDuration / 60);
    const mins = maxDuration % 60;
    let durationText = '';
    if (hours > 0 && mins > 0) durationText = `${hours} שעות ו-${mins} דקות`;
    else if (hours > 0) durationText = hours === 1 ? 'שעה אחת' : hours === 2 ? 'שעתיים' : `${hours} שעות`;
    else durationText = `${mins} דקות`;

    return {
      valid: false,
      error: `החניה פנויה עד ${schedule.end}. המקסימום שניתן להזמין הוא ${durationText}.`,
      maxDurationMinutes: maxDuration,
    };
  }

  if (endMin > closingMin) {
    return {
      valid: false,
      error: `החניה פנויה עד ${schedule.end}. המקסימום שניתן להזמין הוא ${Math.floor(maxDuration / 60)} שעות.`,
      maxDurationMinutes: maxDuration,
    };
  }

  for (const slot of slotsForValidation(parking, dateStr, extraReservations)) {
    if (rangesOverlap(startMin, endMin, timeToMinutes(slot.start), timeToMinutes(slot.end))) {
      const maxDur = getMaxDurationMinutes(parking, dateStr, startTime, extraReservations);
      if (maxDur > 0 && maxDur < durationMinutes) {
        const hours = Math.floor(maxDur / 60);
        const mins = maxDur % 60;
        const durationText = hours > 0
          ? (mins > 0 ? `${hours} שעות ו-${mins} דקות` : (hours === 1 ? 'שעה אחת' : `${hours} שעות`))
          : `${mins} דקות`;
        return {
          valid: false,
          error: `המשבצת תפוסה בחלק מהזמן. המקסימום שניתן להזמין הוא ${durationText}.`,
          maxDurationMinutes: maxDur,
        };
      }
      return { valid: false, error: 'המשבצת תפוסה בזמן שנבחר.', maxDurationMinutes: maxDur };
    }
  }

  return { valid: true, maxDurationMinutes: maxDuration };
}

export function parseAvailabilityHours(str) {
  const match = String(str || '').match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
  if (!match) return { start: '08:00', end: '20:00' };
  return { start: normalizeTime(match[1]), end: normalizeTime(match[2]) };
}

export function formatCountdown(totalSeconds) {
  const s = Math.max(0, totalSeconds);
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function getCurrentTimeStr(date = new Date()) {
  return normalizeTime(`${date.getHours()}:${date.getMinutes()}`);
}

export function formatDisplayDate(dateStr) {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

export function formatBookingScheduleRtl(booking) {
  if (!booking) return '';
  return `${formatDisplayDate(booking.date)} · ${booking.startTime} – ${booking.endTime}`;
}

export function isStartTimeNow(dateStr, startTimeStr, toleranceMinutes = 10) {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  if (dateStr !== today) return false;
  const diff = timeToMinutes(startTimeStr) - timeToMinutes(getCurrentTimeStr(now));
  return diff <= toleranceMinutes;
}

export function getBookingStartMs(booking) {
  const [y, mo, d] = booking.date.split('-').map(Number);
  const [sh, sm] = booking.startTime.split(':').map(Number);
  return new Date(y, mo - 1, d, sh, sm, 0).getTime();
}

function slotsForValidation(parking, dateStr, extraReservations = []) {
  const booked = getBookedSlotsForDate(parking, dateStr);
  const extra = extraReservations
    .filter((r) => r.date === dateStr)
    .map((r) => ({
      start: normalizeTime(r.startTime || r.start),
      end: normalizeTime(r.endTime || r.end),
    }));
  return [...booked, ...extra];
}

import { toLocalDateStr } from './bookingPricing';

export function getUpcomingAvailability(parking, fromDate = new Date(), days = 14) {
  if (!parking?.availability) return [];

  const result = [];
  const dayLabels = ['היום', 'מחר'];

  for (let i = 0; i < days; i += 1) {
    const date = new Date(fromDate);
    date.setDate(date.getDate() + i);
    const dateStr = toLocalDateStr(date);
    const schedules = getSchedulesForDate(parking, dateStr);
    const relativeLabel = dayLabels[i] || null;

    if (schedules.length === 0) {
      result.push({
        date: dateStr,
        dayName: getDayName(dateStr),
        relativeLabel,
        available: false,
        label: 'סגור',
      });
      continue;
    }

    result.push({
      date: dateStr,
      dayName: getDayName(dateStr),
      relativeLabel,
      available: true,
      label: schedules.map((slot) => `${slot.start} - ${slot.end}`).join(' · '),
    });
  }

  return result;
}

export function getTodayTomorrowAvailability(parking, fromDate = new Date()) {
  return getUpcomingAvailability(parking, fromDate, 2);
}

/** Latest end time for a booking starting at startTime on dateStr (schedule + conflicts). */
export function getAvailableUntilTime(parking, dateStr, startTime, extraReservations = []) {
  const maxMinutes = getMaxDurationMinutes(parking, dateStr, startTime, extraReservations);
  if (maxMinutes <= 0) return null;
  return addMinutesToTime(startTime, maxMinutes);
}

export function formatTimerParts(totalSeconds) {
  const s = Math.max(0, totalSeconds);
  return {
    hours: String(Math.floor(s / 3600)).padStart(2, '0'),
    minutes: String(Math.floor((s % 3600) / 60)).padStart(2, '0'),
    seconds: String(s % 60).padStart(2, '0'),
  };
}
