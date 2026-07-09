import { parseAvailabilityHours, timeToMinutes } from './availability';

export const AVAILABILITY_HOURS_PATTERN = /^\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}$/;

export function validateParkingName(name) {
  if (!name?.trim()) return 'יש להזין שם לחניה';
  return null;
}

export function validateParkingAddress(address) {
  if (!address?.trim()) return 'יש להזין כתובת';
  return null;
}

export function validateParkingPrice(pricePerHour) {
  const price = Number(pricePerHour);
  if (pricePerHour === '' || pricePerHour == null || Number.isNaN(price) || price <= 0) {
    return 'יש להזין מחיר חיובי לשעה';
  }
  return null;
}

export function validateAvailabilityHours(hours) {
  const trimmed = String(hours || '').trim();
  if (!AVAILABILITY_HOURS_PATTERN.test(trimmed)) {
    return 'שעות הזמינות חייבות להיות בפורמט 08:00 - 20:00';
  }

  const { start, end } = parseAvailabilityHours(trimmed);
  if (timeToMinutes(end) <= timeToMinutes(start)) {
    return 'שעת הסיום חייבת להיות אחרי שעת ההתחלה';
  }

  return null;
}

export function validateAddParkingForm(form) {
  return validateParkingName(form.name)
    || validateParkingAddress(form.address)
    || validateParkingPrice(form.pricePerHour)
    || validateAvailabilityHours(form.availabilityHours);
}

export function validateOwnerParkingSettings(form) {
  return validateParkingName(form.name)
    || validateParkingAddress(form.address)
    || validateParkingPrice(form.pricePerHour);
}

export function validateAvailabilityDayPlans(dayPlans) {
  for (const day of dayPlans) {
    if (!day.enabled) continue;

    for (const slot of day.slots) {
      if (timeToMinutes(slot.end) <= timeToMinutes(slot.start)) {
        const dayLabel = day.relativeLabel || `יום ${day.dayName}`;
        return `ב${dayLabel}: שעת הסיום חייבת להיות אחרי שעת ההתחלה`;
      }
    }
  }

  return null;
}
