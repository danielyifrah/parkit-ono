export const FULL_DAY_HOURS = 12;
export const FULL_DAY_MINUTES = FULL_DAY_HOURS * 60;
export const MINIMUM_CHARGE_MINUTES = 15;
const MAX_REGULAR_MINUTES = 8 * 60;

export function toLocalDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatDurationLabel(minutes) {
  if (minutes === FULL_DAY_MINUTES) {
    return `יום שלם (${FULL_DAY_HOURS} שעות)`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    if (mins === 15) return 'רבע שעה';
    if (mins === 30) return 'חצי שעה';
    return `${mins} דקות`;
  }

  if (mins === 0) {
    if (hours === 1) return 'שעה אחת';
    if (hours === 2) return 'שעתיים';
    return `${hours} שעות`;
  }

  if (mins === 15) return `${hours === 1 ? 'שעה' : `${hours} שעות`} ורבע`;
  if (mins === 30) {
    if (hours === 0) return 'חצי שעה';
    if (hours === 1) return 'שעה וחצי';
    return `${hours === 2 ? 'שעתיים' : `${hours} שעות`} וחצי`;
  }
  if (mins === 45) return `${hours === 1 ? 'שעה' : `${hours} שעות`} ו-3/4`;

  return `${hours}:${String(mins).padStart(2, '0')} שעות`;
}

export function generateDurationOptions() {
  const options = [];
  const minutesList = [];

  for (let minutes = 15; minutes < 90; minutes += 15) {
    minutesList.push(minutes);
  }

  for (let minutes = 90; minutes <= 240; minutes += 30) {
    minutesList.push(minutes);
  }

  for (let minutes = 300; minutes <= MAX_REGULAR_MINUTES; minutes += 60) {
    minutesList.push(minutes);
  }

  for (const minutes of minutesList) {
    options.push({
      minutes,
      label: formatDurationLabel(minutes),
      isFullDay: false,
    });
  }

  options.push({
    minutes: FULL_DAY_MINUTES,
    label: formatDurationLabel(FULL_DAY_MINUTES),
    isFullDay: true,
  });

  return options;
}

export function getElapsedMinutesFromStartedAt(startedAt, endDate = new Date()) {
  if (!startedAt) return 0;
  const elapsedMs = endDate.getTime() - new Date(startedAt).getTime();
  return Math.max(0, Math.ceil(elapsedMs / 60000));
}

/** Billable minutes: at least MINIMUM_CHARGE_MINUTES once parking has started. */
export function getActualChargeMinutes(elapsedMinutes) {
  if (elapsedMinutes <= 0) return 0;
  return Math.max(MINIMUM_CHARGE_MINUTES, elapsedMinutes);
}

export function calculateActualPrice(pricePerHour, elapsedMinutes) {
  const chargeMinutes = getActualChargeMinutes(elapsedMinutes);
  if (chargeMinutes <= 0) return { chargeMinutes: 0, ...calculateBookingPrice(pricePerHour, 0) };
  return { chargeMinutes, ...calculateBookingPrice(pricePerHour, chargeMinutes) };
}

export function calculateBookingPrice(pricePerHour, minutes) {
  const hours = minutes / 60;
  const base = Math.round(pricePerHour * hours);

  if (minutes === FULL_DAY_MINUTES) {
    return {
      base,
      total: Math.round(base * 0.75),
      discountPercent: 25,
      discountLabel: '25% הנחה — יום שלם',
    };
  }

  if (minutes >= 6 * 60 && minutes <= MAX_REGULAR_MINUTES) {
    return {
      base,
      total: Math.round(base * 0.85),
      discountPercent: 15,
      discountLabel: '15% הנחה',
    };
  }

  return {
    base,
    total: base,
    discountPercent: 0,
    discountLabel: null,
  };
}
