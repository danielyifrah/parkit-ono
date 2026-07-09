import { useCallback, useEffect, useRef, useState } from 'react';
import { Info } from 'lucide-react';
import { generateDurationOptions, MINIMUM_CHARGE_MINUTES } from '../../lib/bookingPricing';
import Icon from '../ui/Icon';
import './DurationWheel.css';

const ITEM_HEIGHT = 44;
const options = generateDurationOptions();

const DURATION_INFO =
  `הזמן והמחיר יחושבו לפי זמן החניה בפועל בסיום. המשך שנבחר כאן נועד לבדוק זמינות בלבד. מינימום חיוב: ${MINIMUM_CHARGE_MINUTES} דקות.`;

export default function DurationWheel({ value, onChange, maxMinutes }) {
  const listRef = useRef(null);
  const scrollTimeout = useRef(null);
  const [showInfo, setShowInfo] = useState(false);

  const filteredOptions = maxMinutes != null
    ? options.filter((opt) => opt.minutes <= maxMinutes)
    : options;

  const safeOptions = filteredOptions.length > 0 ? filteredOptions : options.slice(0, 1);

  const selectedIndex = Math.max(
    0,
    safeOptions.findIndex((opt) => opt.minutes === value),
  );

  useEffect(() => {
    if (maxMinutes != null && value > maxMinutes) {
      const best = safeOptions[safeOptions.length - 1];
      if (best) onChange(best.minutes);
    }
  }, [maxMinutes, value, safeOptions, onChange]);

  const syncScrollToIndex = useCallback((index, smooth = false) => {
    const list = listRef.current;
    if (!list) return;
    list.scrollTo({
      top: index * ITEM_HEIGHT,
      behavior: smooth ? 'smooth' : 'auto',
    });
  }, []);

  useEffect(() => {
    syncScrollToIndex(selectedIndex);
  }, [selectedIndex, syncScrollToIndex]);

  const handleScroll = () => {
    clearTimeout(scrollTimeout.current);

    scrollTimeout.current = setTimeout(() => {
      const list = listRef.current;
      if (!list) return;

      const index = Math.round(list.scrollTop / ITEM_HEIGHT);
      const clamped = Math.min(Math.max(index, 0), safeOptions.length - 1);
      const selected = safeOptions[clamped];

      syncScrollToIndex(clamped, true);

      if (selected.minutes !== value) {
        onChange(selected.minutes);
      }
    }, 80);
  };

  return (
    <div className="duration-wheel">
      <div className="duration-wheel__header">
        <label className="duration-wheel__label" htmlFor="duration-wheel-list">
          משך זמן מוערך
        </label>
        <button
          type="button"
          className="duration-wheel__info-btn"
          onClick={() => setShowInfo((open) => !open)}
          aria-label="מידע על משך זמן מוערך"
          aria-expanded={showInfo}
        >
          <Icon icon={Info} size={16} className="app-icon--muted" />
        </button>
      </div>

      {showInfo && (
        <p className="duration-wheel__info" role="note">
          {DURATION_INFO}
        </p>
      )}

      <div className="duration-wheel__viewport">
        <div className="duration-wheel__fade duration-wheel__fade--top" aria-hidden="true" />
        <div className="duration-wheel__highlight" aria-hidden="true" />
        <ul
          id="duration-wheel-list"
          ref={listRef}
          className="duration-wheel__list"
          onScroll={handleScroll}
          role="listbox"
          aria-label="משך זמן מוערך"
        >
          <li className="duration-wheel__spacer" aria-hidden="true" />
          {safeOptions.map((opt) => (
            <li
              key={opt.minutes}
              className={`duration-wheel__item ${opt.minutes === value ? 'duration-wheel__item--selected' : ''}`}
              role="option"
              aria-selected={opt.minutes === value}
              onClick={() => onChange(opt.minutes)}
            >
              <span>{opt.label}</span>
              {opt.isFullDay && (
                <span className="duration-wheel__badge">25% הנחה</span>
              )}
              {!opt.isFullDay && opt.minutes >= 360 && opt.minutes <= 480 && (
                <span className="duration-wheel__badge duration-wheel__badge--muted">15% הנחה</span>
              )}
            </li>
          ))}
          <li className="duration-wheel__spacer" aria-hidden="true" />
        </ul>
        <div className="duration-wheel__fade duration-wheel__fade--bottom" aria-hidden="true" />
      </div>
    </div>
  );
}
