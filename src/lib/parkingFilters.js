import { isParkingAvailableForSlot } from './availability';
import { FULL_DAY_MINUTES } from './bookingPricing';
import {
  isImmediateSearch,
  migrateLegacyArrival,
  resolveSearchDateTime,
} from './searchContext';

export const DEFAULT_FILTERS = {
  types: { private: true, public: true, office: true },
  maxPrice: null,
  minRating: null,
  dateOffset: 0,
  searchTime: 'now',
  duration: 'שעה',
};

/** Filter thresholds stay in ILS; labels are built with formatPriceOptions. */
export const PRICE_OPTIONS = [
  { value: null, label: 'כל המחירים' },
  { value: 15, label: 'עד ₪15 לשעה' },
  { value: 20, label: 'עד ₪20 לשעה' },
  { value: 25, label: 'עד ₪25 לשעה' },
  { value: 30, label: 'עד ₪30 לשעה' },
];

export function getPriceOptions(formatPrice) {
  if (!formatPrice) return PRICE_OPTIONS;
  return PRICE_OPTIONS.map((opt) => (
    opt.value == null
      ? opt
      : { ...opt, label: `עד ${formatPrice(opt.value)} לשעה` }
  ));
}

export const RATING_OPTIONS = [
  { value: null, label: 'כל הדירוגים' },
  { value: 4, label: '4 כוכבים ומעלה' },
  { value: 4.5, label: '4.5 כוכבים ומעלה' },
];

export const DURATION_OPTIONS = ['שעה', 'שעתיים', 'יום'];

export { buildSearchDateOptions, SEARCH_TIME_OPTIONS, getSearchSummaryLabel, isImmediateSearch } from './searchContext';

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

export function normalizeFilters(filters) {
  if (!filters) return { ...DEFAULT_FILTERS };

  if (filters.arrival && filters.dateOffset == null) {
    const migrated = migrateLegacyArrival(filters.arrival);
    return {
      ...DEFAULT_FILTERS,
      ...filters,
      ...migrated,
      arrival: undefined,
    };
  }

  return { ...DEFAULT_FILTERS, ...filters };
}

export function getArrivalDateTime(filters) {
  return resolveSearchDateTime(normalizeFilters(filters));
}

export function isFiltersActive(filters) {
  const normalized = normalizeFilters(filters);
  return (
    normalized.maxPrice != null
    || normalized.minRating != null
    || normalized.dateOffset !== 0
    || normalized.searchTime !== 'now'
    || normalized.duration !== 'שעה'
    || !normalized.types.private
    || !normalized.types.public
    || !normalized.types.office
  );
}

export function isPanelActive(filters, panelId) {
  const normalized = normalizeFilters(filters);
  switch (panelId) {
    case 'filters':
      return isFiltersActive(filters);
    case 'time':
      return normalized.dateOffset !== 0
        || normalized.searchTime !== 'now'
        || normalized.duration !== 'שעה';
    case 'price':
      return normalized.maxPrice != null;
    case 'rating':
      return normalized.minRating != null;
    default:
      return false;
  }
}

function matchesSearchWindow(parking, filters, getConflictsForParking, isPubliclyBlocked = null) {
  const normalized = normalizeFilters(filters);
  const { dateStr, startTime } = resolveSearchDateTime(normalized);
  const durationMinutes = durationLabelToMinutes(normalized.duration);
  const conflicts = getConflictsForParking ? getConflictsForParking(parking.id) : [];

  if (isImmediateSearch(normalized) && isPubliclyBlocked?.(parking.id)) {
    return false;
  }

  return isParkingAvailableForSlot(parking, dateStr, startTime, durationMinutes, conflicts);
}

export function applyParkingFilters(
  allParkings,
  filters,
  getConflictsForParking = null,
  isPubliclyBlocked = null,
) {
  const normalized = normalizeFilters(filters);
  let result = allParkings.filter((p) => p.available !== false && p.status === 'active');

  if (!normalized.types.private) {
    result = result.filter((p) => p.type !== 'private');
  }
  if (!normalized.types.public) {
    result = result.filter((p) => p.type !== 'public');
  }
  if (!normalized.types.office) {
    result = result.filter((p) => p.type !== 'office');
  }

  if (normalized.maxPrice != null) {
    result = result.filter((p) => p.pricePerHour <= normalized.maxPrice);
  }

  if (normalized.minRating != null) {
    result = result.filter((p) => p.rating >= normalized.minRating);
  }

  result = result.filter(
    (p) => matchesSearchWindow(p, normalized, getConflictsForParking, isPubliclyBlocked),
  );

  return result;
}

export function getPriceChipLabel(maxPrice, formatPrice) {
  const option = PRICE_OPTIONS.find((o) => o.value === maxPrice);
  if (!option?.value) return 'מחיר';
  return formatPrice ? `עד ${formatPrice(maxPrice)}` : `עד ₪${maxPrice}`;
}

export function getRatingChipLabel(minRating) {
  const option = RATING_OPTIONS.find((o) => o.value === minRating);
  return option?.value ? `${minRating}+` : 'דירוג';
}

export function buildSearchStateFromFilters(filters) {
  const normalized = normalizeFilters(filters);
  const { dateStr, startTime } = resolveSearchDateTime(normalized);
  return {
    dateStr,
    startTime,
    durationMinutes: durationLabelToMinutes(normalized.duration),
    isImmediate: isImmediateSearch(normalized),
  };
}
