import { useEffect, useState } from 'react';
import { toLocalDateStr } from '../../lib/bookingPricing';
import './DateSelector.css';

function getToday() {
  return new Date();
}

function getTomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d;
}

export default function DateSelector({ value, onChange }) {
  const [mode, setMode] = useState('today');
  const [showCalendar, setShowCalendar] = useState(false);

  const todayStr = toLocalDateStr(getToday());
  const tomorrowStr = toLocalDateStr(getTomorrow());

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
        יום אחר
      </button>
      {showCalendar && (
        <input
          type="date"
          className="date-selector__input"
          value={value}
          min={todayStr}
          onChange={handleCustomDate}
        />
      )}
    </div>
  );
}
