import { Clock, Banknote, Star, ChevronDown, Home, CircleParking, Building2, SlidersHorizontal } from 'lucide-react';
import Icon from '../ui/Icon';
import { useCurrency } from '../../context/CurrencyContext';
import {
  DURATION_OPTIONS,
  RATING_OPTIONS,
  buildSearchDateOptions,
  getPriceOptions,
  isFiltersActive,
  isPanelActive,
  normalizeFilters,
  SEARCH_TIME_OPTIONS,
  getSearchSummaryLabel,
} from '../../lib/parkingFilters';
import './FilterBar.css';

function SearchTimeFields({ filters, onChange }) {
  const normalized = normalizeFilters(filters);
  const dateOptions = buildSearchDateOptions();
  const isToday = normalized.dateOffset === 0;
  const timeOptions = isToday
    ? SEARCH_TIME_OPTIONS
    : SEARCH_TIME_OPTIONS.filter((option) => option.value !== 'now');

  const handleDateOffset = (offset) => {
    const next = { dateOffset: offset };
    if (offset > 0 && normalized.searchTime === 'now') {
      next.searchTime = '08:00';
    }
    onChange(next);
  };

  return (
    <>
      <div className="filter-fields__section">
        <label className="filter-fields__label">תאריך הגעה</label>
        <div className="filter-fields__date-grid">
          {dateOptions.map((option) => (
            <button
              key={option.offset}
              type="button"
              className={`filter-fields__date-btn ${normalized.dateOffset === option.offset ? 'filter-fields__date-btn--active' : ''}`}
              onClick={() => handleDateOffset(option.offset)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-fields__section">
        <label className="filter-fields__label">שעת הגעה</label>
        <select
          className="filter-fields__select"
          value={normalized.searchTime}
          onChange={(e) => onChange({ searchTime: e.target.value })}
        >
          {timeOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div className="filter-fields__section">
        <label className="filter-fields__label">משך זמן</label>
        <div className="filter-fields__toggle">
          {DURATION_OPTIONS.map((d) => (
            <button
              key={d}
              type="button"
              className={`filter-fields__toggle-btn ${normalized.duration === d ? 'filter-fields__toggle-btn--active' : ''}`}
              onClick={() => onChange({ duration: d })}
            >
              {d}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

export function FilterFields({ filters, onChange }) {
  const { formatPrice } = useCurrency();
  const normalized = normalizeFilters(filters);
  const priceOptions = getPriceOptions(formatPrice);

  const setTypes = (type, checked) => {
    onChange({
      types: { ...normalized.types, [type]: checked },
    });
  };

  const updateFilters = (partial) => {
    onChange({ ...normalized, ...partial });
  };

  return (
    <>
      <SearchTimeFields filters={normalized} onChange={updateFilters} />

      <div className="filter-fields__section">
        <label className="filter-fields__label">מחיר מקסימלי</label>
        <div className="filter-fields__options">
          {priceOptions.map((opt) => (
            <button
              key={String(opt.value)}
              type="button"
              className={`filter-fields__option ${normalized.maxPrice === opt.value ? 'filter-fields__option--active' : ''}`}
              onClick={() => updateFilters({ maxPrice: opt.value })}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-fields__section">
        <label className="filter-fields__label">דירוג מינימלי</label>
        <div className="filter-fields__options">
          {RATING_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              type="button"
              className={`filter-fields__option ${normalized.minRating === opt.value ? 'filter-fields__option--active' : ''}`}
              onClick={() => updateFilters({ minRating: opt.value })}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-fields__section">
        <label className="filter-fields__label">סוג חניה</label>
        <label className="filter-fields__checkbox">
          <input
            type="checkbox"
            checked={normalized.types.private}
            onChange={(e) => setTypes('private', e.target.checked)}
          />
          <Icon icon={Home} size={16} className="app-icon--muted" />
          חניה פרטית
        </label>
        <label className="filter-fields__checkbox">
          <input
            type="checkbox"
            checked={normalized.types.public}
            onChange={(e) => setTypes('public', e.target.checked)}
          />
          <Icon icon={CircleParking} size={16} className="app-icon--muted" />
          חניה ציבורית
        </label>
        <label className="filter-fields__checkbox">
          <input
            type="checkbox"
            checked={normalized.types.office}
            onChange={(e) => setTypes('office', e.target.checked)}
          />
          <Icon icon={Building2} size={16} className="app-icon--muted" />
          חניה משרדית
        </label>
      </div>
    </>
  );
}

function TimePanel({ filters, onChange }) {
  const normalized = normalizeFilters(filters);
  const updateFilters = (partial) => onChange({ ...normalized, ...partial });

  return (
    <div className="filter-bar__panel-content">
      <SearchTimeFields filters={normalized} onChange={updateFilters} />
    </div>
  );
}

function PricePanel({ filters, onChange }) {
  const { formatPrice } = useCurrency();
  const normalized = normalizeFilters(filters);
  const priceOptions = getPriceOptions(formatPrice);
  return (
    <div className="filter-bar__panel-content filter-fields__options">
      {priceOptions.map((opt) => (
        <button
          key={String(opt.value)}
          type="button"
          className={`filter-fields__option ${normalized.maxPrice === opt.value ? 'filter-fields__option--active' : ''}`}
          onClick={() => onChange({ ...normalized, maxPrice: opt.value })}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function RatingPanel({ filters, onChange }) {
  const normalized = normalizeFilters(filters);
  return (
    <div className="filter-bar__panel-content filter-fields__options">
      {RATING_OPTIONS.map((opt) => (
        <button
          key={opt.label}
          type="button"
          className={`filter-fields__option ${normalized.minRating === opt.value ? 'filter-fields__option--active' : ''}`}
          onClick={() => onChange({ ...normalized, minRating: opt.value })}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

const filterChips = [
  { id: 'time', label: 'זמן', icon: Clock },
  { id: 'price', label: 'מחיר', icon: Banknote },
  { id: 'rating', label: 'דירוג', icon: Star },
];

export default function FilterBar({
  filters,
  onChange,
  openPanel,
  onOpenPanel,
  onClear,
  className = '',
}) {
  const { formatPrice } = useCurrency();
  const normalized = normalizeFilters(filters);
  const hasActiveFilters = isFiltersActive(normalized);

  const handleChipClick = (id) => {
    onOpenPanel?.(openPanel === id ? null : id);
  };

  const getChipLabel = (id, defaultLabel) => {
    if (id === 'price' && normalized.maxPrice != null) {
      return `עד ${formatPrice(normalized.maxPrice)}`;
    }
    if (id === 'rating' && normalized.minRating != null) {
      return `${normalized.minRating}+`;
    }
    if (id === 'time' && isPanelActive(normalized, 'time')) {
      return getSearchSummaryLabel(normalized);
    }
    return defaultLabel;
  };

  const updateFilters = (partial) => {
    onChange({ ...normalized, ...partial });
  };

  return (
    <div className={`filter-bar-wrap ${className}`}>
      <div className="filter-bar">
        <button
          type="button"
          className={`filter-bar__chip filter-bar__chip--clear ${hasActiveFilters ? 'filter-bar__chip--clear-active' : ''}`}
          onClick={hasActiveFilters ? onClear : undefined}
          disabled={!hasActiveFilters}
          aria-label="נקה מסננים"
        >
          נקה
        </button>

        {filterChips.map((chip) => {
          const isOpen = openPanel === chip.id;
          const isActive = isOpen || (
            chip.id === 'time'
              ? isPanelActive(normalized, 'time')
              : chip.id === 'price'
                ? normalized.maxPrice != null
                : normalized.minRating != null
          );

          return (
            <button
              key={chip.id}
              type="button"
              className={`filter-bar__chip ${isActive ? 'filter-bar__chip--active' : ''}`}
              onClick={() => handleChipClick(chip.id)}
              aria-expanded={isOpen}
            >
              <Icon icon={chip.icon} size={16} />
              <span>{getChipLabel(chip.id, chip.label)}</span>
              <Icon
                icon={ChevronDown}
                size={14}
                className={`filter-bar__chevron ${isOpen ? 'filter-bar__chevron--open' : ''}`}
              />
            </button>
          );
        })}
      </div>

      {openPanel && openPanel !== 'filters' && (
        <div className="filter-bar__panel">
          {openPanel === 'time' && (
            <TimePanel filters={normalized} onChange={updateFilters} />
          )}
          {openPanel === 'price' && (
            <PricePanel filters={normalized} onChange={updateFilters} />
          )}
          {openPanel === 'rating' && (
            <RatingPanel filters={normalized} onChange={updateFilters} />
          )}
        </div>
      )}
    </div>
  );
}

export function SidebarFilters({ filters, onChange, onClear }) {
  const normalized = normalizeFilters(filters);
  const hasActiveFilters = isFiltersActive(normalized);

  const updateFilters = (partial) => {
    onChange({ ...normalized, ...partial });
  };

  return (
    <div className="sidebar-filters">
      <div className="sidebar-filters__header">
        <h3 className="sidebar-filters__title">
          <Icon icon={SlidersHorizontal} size={18} className="app-icon--primary" />
          מסננים
        </h3>
        <button
          type="button"
          className="sidebar-filters__clear"
          onClick={onClear}
          disabled={!hasActiveFilters}
        >
          נקה הכל
        </button>
      </div>

      <FilterFields filters={normalized} onChange={updateFilters} />
    </div>
  );
}
