import { FULL_DAY_MINUTES, toLocalDateStr } from './bookingPricing';
import { isParkingAvailableForSlot } from './availability';

export const DEFAULT_FILTERS = {
  types: { private: true, public: true, office: true },
  maxPrice: null,
  minRating: null,
  arrival: 'now',
  duration: 'שעה',
};

export const PRICE_OPTIONS = [
  { value: null, label: 'כל המחירים' },
  { value: 15, label: 'עד ₪15 לשעה' },
  { value: 20, label: 'עד ₪20 לשעה' },
  { value: 25, label: 'עד ₪25 לשעה' },
  { value: 30, label: 'עד ₪30 לשעה' },
];

export const RATING_OPTIONS = [
  { value: null, label: 'כל הדירוגים' },
  { value: 4, label: '4 כוכבים ומעלה' },
  { value: 4.5, label: '4.5 כוכבים ומעלה' },
];

export const ARRIVAL_OPTIONS = [
  { value: 'now', label: 'היום, עכשיו' },
  { value: 'tomorrow-morning', label: 'מחר בבוקר' },
  { value: 'evening', label: 'היום בערב' },
];

export const DURATION_OPTIONS = ['שעה', 'שעתיים', 'יום'];

export function durationLabelToMinutes(duration) {
  switch (duration) {
    case 'שעתיים':
      return 120;
    case 'יום':
      return FULL_DAY_MINUTES;
    default:
      return 60;
  }
}

export function getArrivalDateTime(arrival) {
  const now = new Date();

  if (arrival === 'tomorrow-morning') {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return { dateStr: toLocalDateStr(tomorrow), startTime: '08:00' };
  }

  if (arrival === 'evening') {
    return { dateStr: toLocalDateStr(now), startTime: '18:00' };
  }

  return {
    dateStr: toLocalDateStr(now),
    startTime: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
  };
}


export function isFiltersActive(filters) {
  return (
    filters.maxPrice != null
    || filters.minRating != null
    || filters.arrival !== 'now'
    || filters.duration !== 'שעה'
    || !filters.types.private
    || !filters.types.public
    || !filters.types.office
  );
}

export function isPanelActive(filters, panelId) {
  switch (panelId) {
    case 'filters':
      return isFiltersActive(filters);
    case 'time':
      return filters.arrival !== 'now' || filters.duration !== 'שעה';
    case 'price':
      return filters.maxPrice != null;
    case 'rating':
      return filters.minRating != null;
    default:
      return false;
  }
}

function matchesSearchWindow(parking, arrival, duration, getConflictsForParking) {
  const { dateStr, startTime } = getArrivalDateTime(arrival);
  const durationMinutes = durationLabelToMinutes(duration);
  const conflicts = getConflictsForParking ? getConflictsForParking(parking.id) : [];
  return isParkingAvailableForSlot(parking, dateStr, startTime, durationMinutes, conflicts);
}

export function applyParkingFilters(allParkings, filters, getConflictsForParking = null) {
  let result = allParkings.filter((p) => p.available !== false && p.status === 'active');

  if (!filters.types.private) {
    result = result.filter((p) => p.type !== 'private');
  }
  if (!filters.types.public) {
    result = result.filter((p) => p.type !== 'public');
  }
  if (!filters.types.office) {
    result = result.filter((p) => p.type !== 'office');
  }

  if (filters.maxPrice != null) {
    result = result.filter((p) => p.pricePerHour <= filters.maxPrice);
  }

  if (filters.minRating != null) {
    result = result.filter((p) => p.rating >= filters.minRating);
  }

  result = result.filter(
    (p) => matchesSearchWindow(p, filters.arrival, filters.duration, getConflictsForParking),
  );

  return result;
}

export function getPriceChipLabel(maxPrice) {
  const option = PRICE_OPTIONS.find((o) => o.value === maxPrice);
  return option?.value ? `עד ₪${maxPrice}` : 'מחיר';
}

export function getRatingChipLabel(minRating) {
  const option = RATING_OPTIONS.find((o) => o.value === minRating);
  return option?.value ? `${minRating}+` : 'דירוג';
}
