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

function matchesArrival(parking, arrival) {
  if (arrival === 'now') return true;

  const hours = parking.availabilityHours || '';

  if (arrival === 'tomorrow-morning') {
    return hours.includes('00:00') || hours.startsWith('07') || hours.startsWith('08');
  }

  if (arrival === 'evening') {
    return hours.includes('23:59') || hours.includes('18:00') || hours.includes('22:00');
  }

  return true;
}

export function applyParkingFilters(allParkings, filters) {
  let result = allParkings.filter((p) => p.available);

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

  result = result.filter((p) => matchesArrival(p, filters.arrival));

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
