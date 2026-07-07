import { Clock, Banknote, Star, ChevronDown, Home, CircleParking, Building2, SlidersHorizontal } from 'lucide-react';
import Icon from '../ui/Icon';
import {
  ARRIVAL_OPTIONS,
  DURATION_OPTIONS,
  PRICE_OPTIONS,
  RATING_OPTIONS,
  isFiltersActive,
} from '../../lib/parkingFilters';
import './FilterBar.css';

export function FilterFields({ filters, onChange }) {
  const setTypes = (type, checked) => {
    onChange({
      types: { ...filters.types, [type]: checked },
    });
  };

  return (
    <>
      <div className="filter-fields__section">
        <label className="filter-fields__label">זמן הגעה</label>
        <select
          className="filter-fields__select"
          value={filters.arrival}
          onChange={(e) => onChange({ arrival: e.target.value })}
        >
          {ARRIVAL_OPTIONS.map((opt) => (
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
              className={`filter-fields__toggle-btn ${filters.duration === d ? 'filter-fields__toggle-btn--active' : ''}`}
              onClick={() => onChange({ duration: d })}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-fields__section">
        <label className="filter-fields__label">מחיר מקסימלי</label>
        <div className="filter-fields__options">
          {PRICE_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              type="button"
              className={`filter-fields__option ${filters.maxPrice === opt.value ? 'filter-fields__option--active' : ''}`}
              onClick={() => onChange({ maxPrice: opt.value })}
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
              className={`filter-fields__option ${filters.minRating === opt.value ? 'filter-fields__option--active' : ''}`}
              onClick={() => onChange({ minRating: opt.value })}
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
            checked={filters.types.private}
            onChange={(e) => setTypes('private', e.target.checked)}
          />
          <Icon icon={Home} size={16} className="app-icon--muted" />
          חניה פרטית
        </label>
        <label className="filter-fields__checkbox">
          <input
            type="checkbox"
            checked={filters.types.public}
            onChange={(e) => setTypes('public', e.target.checked)}
          />
          <Icon icon={CircleParking} size={16} className="app-icon--muted" />
          חניה ציבורית
        </label>
        <label className="filter-fields__checkbox">
          <input
            type="checkbox"
            checked={filters.types.office}
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
  return (
    <div className="filter-bar__panel-content">
      <div className="filter-fields__section">
        <label className="filter-fields__label">זמן הגעה</label>
        <select
          className="filter-fields__select"
          value={filters.arrival}
          onChange={(e) => onChange({ arrival: e.target.value })}
        >
          {ARRIVAL_OPTIONS.map((opt) => (
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
              className={`filter-fields__toggle-btn ${filters.duration === d ? 'filter-fields__toggle-btn--active' : ''}`}
              onClick={() => onChange({ duration: d })}
            >
              {d}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function PricePanel({ filters, onChange }) {
  return (
    <div className="filter-bar__panel-content filter-fields__options">
      {PRICE_OPTIONS.map((opt) => (
        <button
          key={opt.label}
          type="button"
          className={`filter-fields__option ${filters.maxPrice === opt.value ? 'filter-fields__option--active' : ''}`}
          onClick={() => onChange({ maxPrice: opt.value })}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function RatingPanel({ filters, onChange }) {
  return (
    <div className="filter-bar__panel-content filter-fields__options">
      {RATING_OPTIONS.map((opt) => (
        <button
          key={opt.label}
          type="button"
          className={`filter-fields__option ${filters.minRating === opt.value ? 'filter-fields__option--active' : ''}`}
          onClick={() => onChange({ minRating: opt.value })}
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
  const hasActiveFilters = isFiltersActive(filters);

  const handleChipClick = (id) => {
    onOpenPanel?.(openPanel === id ? null : id);
  };

  const getChipLabel = (id, defaultLabel) => {
    if (id === 'price' && filters.maxPrice != null) {
      return `עד ₪${filters.maxPrice}`;
    }
    if (id === 'rating' && filters.minRating != null) {
      return `${filters.minRating}+`;
    }
    if (id === 'time' && (filters.arrival !== 'now' || filters.duration !== 'שעה')) {
      const arrival = ARRIVAL_OPTIONS.find((o) => o.value === filters.arrival);
      return arrival?.value !== 'now' ? arrival?.label : filters.duration;
    }
    return defaultLabel;
  };

  const updateFilters = (partial) => {
    onChange({ ...filters, ...partial });
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
              ? filters.arrival !== 'now' || filters.duration !== 'שעה'
              : chip.id === 'price'
                ? filters.maxPrice != null
                : filters.minRating != null
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
            <TimePanel filters={filters} onChange={updateFilters} />
          )}
          {openPanel === 'price' && (
            <PricePanel filters={filters} onChange={updateFilters} />
          )}
          {openPanel === 'rating' && (
            <RatingPanel filters={filters} onChange={updateFilters} />
          )}
        </div>
      )}
    </div>
  );
}

export function SidebarFilters({ filters, onChange, onClear }) {
  const updateFilters = (partial) => {
    onChange({ ...filters, ...partial });
  };

  const hasActiveFilters = isFiltersActive(filters);

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

      <FilterFields filters={filters} onChange={updateFilters} />
    </div>
  );
}
