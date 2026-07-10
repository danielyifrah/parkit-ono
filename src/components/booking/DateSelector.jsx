import { useEffect, useState } from 'react';
import { toLocalDateStr } from '../../lib/bookingPricing';
import { MAX_SEARCH_DAYS_AHEAD } from '../../lib/searchContext';
import './DateSelector.css';

function getDateWithOffset(offset) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date;
}

function formatCustomLabel(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const weekday = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'][date.getDay()];
  return `${weekday} ${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}`;
}

export default function DateSelector({ value, onChange }) {
  const [mode, setMode] = useState('today');
  const [showCalendar, setShowCalendar] = useState(false);

  const todayStr = toLocalDateStr(getDateWithOffset(0));
  const tomorrowStr = toLocalDateStr(getDateWithOffset(1));
  const maxDateStr = toLocalDateStr(getDateWithOffset(MAX_SEARCH_DAYS_AHEAD));

  useEffect(() => {
    if (value === todayStr) setMode('today');
    else if (value === tomorrowStr) setMode('tomorrow');
    else setMode('custom');
  }, [value, todayStr, tomorrowStr]);

  const selectToday = () => {
    setMode('today');
    setShowCalendar(false);
    onChange(todayStr);
  };

  const selectTomorrow = () => {
    setMode('tomorrow');
    setShowCalendar(false);
    onChange(tomorrowStr);
  };

  const openCustom = () => {
    setMode('custom');
    setShowCalendar(true);
  };

  const handleCustomDate = (e) => {
    onChange(e.target.value);
    setMode('custom');
  };

  return (
    <div className="date-selector">
      <span className="date-selector__label">תאריך</span>
      <div className="date-selector__row">
        <button
          type="button"
          className={`date-selector__btn ${mode === 'today' ? 'date-selector__btn--active' : ''}`}
          onClick={selectToday}
        >
          היום
        </button>
        <button
          type="button"
          className={`date-selector__btn ${mode === 'tomorrow' ? 'date-selector__btn--active' : ''}`}
          onClick={selectTomorrow}
        >
          מחר
        </button>
      </div>
      <button
        type="button"
        className={`date-selector__btn date-selector__btn--full ${mode === 'custom' ? 'date-selector__btn--active' : ''}`}
        onClick={openCustom}
      >
        {mode === 'custom' && value !== todayStr && value !== tomorrowStr
          ? formatCustomLabel(value)
          : 'יום אחר'}
      </button>
      {showCalendar && (
        <input
          type="date"
          className="date-selector__input"
          value={value}
          min={todayStr}
          max={maxDateStr}
          onChange={handleCustomDate}
        />
      )}
    </div>
  );
}
