import './BookingCard.css';
import { MapPin, Calendar, Clock } from 'lucide-react';
import { useParking } from '../../context/ParkingContext';
import Icon from '../ui/Icon';

const statusLabels = {
  scheduled: { text: 'שמורה', class: 'badge--success' },
  pending_arrival: { text: 'ממתינה', class: 'badge--success' },
  active: { text: 'פעילה', class: 'badge--success' },
  saved: { text: 'בהמתנה', class: 'badge--success' },
  completed: { text: 'הושלמה', class: 'badge--inactive' },
  cancelled: { text: 'בוטלה', class: 'badge--error' },
};

export default function BookingCard({ booking, onClick }) {
  const { getParkingById } = useParking();
  const parking = getParkingById(booking.parkingId);
  const status = statusLabels[booking.status] || statusLabels.completed;

  return (
    <button type="button" className="booking-card card" onClick={onClick}>
      <div className="booking-card__header">
        <h3 className="booking-card__title">{parking?.name || 'חניה'}</h3>
        <span className={`badge ${status.class}`}>{status.text}</span>
      </div>
      <p className="booking-card__address">
        <Icon icon={MapPin} size={14} className="app-icon--muted" />
        {parking?.address}
      </p>
      <div className="booking-card__details">
        <span className="booking-card__detail">
          <Icon icon={Calendar} size={14} />
          {booking.date}
        </span>
        <span className="booking-card__detail">
          <Icon icon={Clock} size={14} />
          {booking.startTime} - {booking.endTime}
        </span>
        <span className="booking-card__price">₪{booking.totalPrice}</span>
      </div>
    </button>
  );
}
