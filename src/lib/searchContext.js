import { toLocalDateStr } from './bookingPricing';
import { getCurrentTimeStr } from './availability';

export const MAX_SEARCH_DAYS_AHEAD = 6;

export const SEARCH_TIME_OPTIONS = [
  { value: 'now', label: 'עכשיו' },
  { value: '08:00', label: '08:00' },
  { value: '12:00', label: '12:00' },
  { value: '18:00', label: '18:00' },
];

function formatShortDate(date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const weekday = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'][date.getDay()];
  return `${weekday} ${day}/${month}`;
}

export function buildSearchDateOptions(fromDate = new Date()) {
  const options = [];
  const relativeLabels = ['היום', 'מחר'];

  for (let offset = 0; offset <= MAX_SEARCH_DAYS_AHEAD; offset += 1) {
    const date = new Date(fromDate);
    date.setDate(date.getDate() + offset);
    options.push({
      offset,
      value: toLocalDateStr(date),
      label: relativeLabels[offset] || formatShortDate(date),
    });
  }

  return options;
}

export function resolveSearchDateTime(filters, now = new Date()) {
  const dateOffset = Number.isFinite(filters?.dateOffset) ? filters.dateOffset : 0;
  const searchDate = new Date(now);
  searchDate.setDate(searchDate.getDate() + dateOffset);
  const dateStr = toLocalDateStr(searchDate);

  const rawTime = filters?.searchTime || 'now';
  let startTime;
  if (dateOffset === 0 && rawTime === 'now') {
    startTime = getCurrentTimeStr(now);
  } else if (rawTime === 'now') {
    startTime = '08:00';
  } else {
    startTime = rawTime;
  }

  return {
    dateStr,
    startTime,
    dateOffset,
    searchTime: rawTime,
  };
}

export function getSearchSummaryLabel(filters, now = new Date()) {
  const { dateStr, startTime } = resolveSearchDateTime(filters, now);
  const dateLabel = buildSearchDateOptions(now).find((option) => option.value === dateStr)?.label || dateStr;
  const isNow = filters?.dateOffset === 0 && filters?.searchTime === 'now';

  if (isNow) return 'היום, עכשיו';

  const timeLabel = SEARCH_TIME_OPTIONS.find((option) => option.value === filters?.searchTime)?.label
    || startTime;
  return `${dateLabel}, ${timeLabel}`;
}

export function isImmediateSearch(filters) {
  return filters?.dateOffset === 0 && filters?.searchTime === 'now';
}

/** @deprecated legacy arrival presets */
export function migrateLegacyArrival(arrival) {
  switch (arrival) {
    case 'tomorrow-morning':
      return { dateOffset: 1, searchTime: '08:00' };
    case 'evening':
      return { dateOffset: 0, searchTime: '18:00' };
    default:
      return { dateOffset: 0, searchTime: 'now' };
  }
}
