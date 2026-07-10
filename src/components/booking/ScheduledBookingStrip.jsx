import { ChevronLeft, CalendarClock } from 'lucide-react';
import { formatBookingScheduleRtl } from '../../lib/availability';
import { toLocalDateStr } from '../../lib/bookingPricing';
import Icon from '../ui/Icon';
import './ScheduledBookingStrip.css';

function getRelativeDateLabel(dateStr) {
  const today = toLocalDateStr(new Date());
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = toLocalDateStr(tomorrow);

  if (dateStr === today) return 'היום';
  if (dateStr === tomorrowStr) return 'מחר';

  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}`;
}

function formatCompactSchedule(booking) {
  const dateLabel = getRelativeDateLabel(booking.date);
  return `${dateLabel} · ${booking.startTime}–${booking.endTime}`;
}

export default function ScheduledBookingStrip({ booking, parking, onClick }) {
  if (!booking || !parking) return null;

  return (
    <button
      type="button"
      className="scheduled-booking-strip"
      onClick={onClick}
      aria-label={`החניה שמורה: ${parking.name}, ${formatBookingScheduleRtl(booking)}`}
    >
      <span className="scheduled-booking-strip__icon" aria-hidden="true">
        <Icon icon={CalendarClock} size={18} className="app-icon--primary" />
      </span>
      <span className="scheduled-booking-strip__content">
        <span className="scheduled-booking-strip__label">החניה שמורה</span>
        <span className="scheduled-booking-strip__meta">
          <span className="scheduled-booking-strip__name">{parking.name}</span>
          <span className="scheduled-booking-strip__dot" aria-hidden="true">·</span>
          <span className="scheduled-booking-strip__time" dir="ltr">
            {formatCompactSchedule(booking)}
          </span>
        </span>
      </span>
      <Icon icon={ChevronLeft} size={18} className="scheduled-booking-strip__chevron app-icon--muted" />
    </button>
  );
}
