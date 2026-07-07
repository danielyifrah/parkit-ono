import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Star, Clock, Image, ChevronRight, CalendarDays } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useParking } from '../context/ParkingContext';
import { getTodayTomorrowAvailability } from '../data/mockData';
import Button from '../components/ui/Button';
import Icon from '../components/ui/Icon';
import './ParkingDetails.css';

const typeLabels = {
  private: 'חניה פרטית',
  public: 'חניה ציבורית',
  office: 'חניה משרדית',
};

function formatDisplayDate(dateStr) {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

export default function ParkingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getParkingById, isParkingOccupied } = useParking();
  const parking = getParkingById(id);
  const todayTomorrowAvailability = parking ? getTodayTomorrowAvailability(parking) : [];

  if (!parking) {
    return (
      <div className="page">
        <div className="empty-state">
          <h2>חניה לא נמצאה</h2>
          <Button onClick={() => navigate('/')}>חזרה למפה</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="page parking-details">
      <button type="button" className="page-back" onClick={() => navigate('/')}>
        <Icon icon={ChevronRight} size={18} />
        חזרה למפה
      </button>

      <div className="parking-details__card card">
        <div className="parking-details__layout">
          {parking.image ? (
            <img src={parking.image} alt="" className="parking-details__hero" referrerPolicy="no-referrer" />
          ) : (
            <div className="parking-details__hero image-placeholder">
              <Icon icon={Image} size={48} className="app-icon--muted" />
            </div>
          )}

          <div className="parking-details__content">
            <div className="parking-details__header">
              <div>
                <span className="badge badge--success">
                  <span className="badge__dot" />
                  פנוי עכשיו
                </span>
                <h1 className="parking-details__title">{parking.name}</h1>
                <p className="parking-details__address">
                  <Icon icon={MapPin} size={14} className="app-icon--muted" />
                  {parking.address}
                </p>
              </div>
              <div className="parking-details__rating">
                <span className="parking-details__rating-value">
                  <Icon icon={Star} size={16} className="app-icon--primary" />
                  {parking.rating}
                </span>
                <span className="parking-details__reviews">({parking.reviewsCount} ביקורות)</span>
              </div>
            </div>

            {parking.images?.length > 1 && (
              <div className="parking-details__gallery">
                {parking.images.slice(0, 4).map((src) => (
                  <img key={src} src={src} alt="" className="parking-details__gallery-thumb" loading="lazy" referrerPolicy="no-referrer" />
                ))}
              </div>
            )}

            <div className="parking-details__stats">
              <div className="parking-details__stat">
                <span className="parking-details__stat-value">₪{parking.pricePerHour}</span>
                <span className="parking-details__stat-label">לשעה</span>
              </div>
              <div className="parking-details__stat">
                <span className="parking-details__stat-value">{parking.walkMinutes} דק&apos;</span>
                <span className="parking-details__stat-label">הליכה</span>
              </div>
              <div className="parking-details__stat">
                <span className="parking-details__stat-value">{typeLabels[parking.type]}</span>
                <span className="parking-details__stat-label">סוג</span>
              </div>
            </div>

            <div className="divider" />

            <h2 className="parking-details__section-title">תיאור</h2>
            <p className="parking-details__description">{parking.description}</p>

            <h2 className="parking-details__section-title">זמינות</h2>
            <p className="parking-details__availability">
              <Icon icon={Clock} size={14} className="app-icon--muted" />
              {parking.availabilityHours}
            </p>
            <p className="parking-details__availability">מקום: {parking.spotNumber}</p>

            <div className="parking-details__calendar">
              <div className="parking-details__calendar-header">
                <Icon icon={CalendarDays} size={16} className="app-icon--primary" />
                <span>זמינות להיום ומחר</span>
              </div>
              <div className="parking-details__calendar-grid parking-details__calendar-grid--two">
                {todayTomorrowAvailability.map((day) => (
                  <div
                    key={day.date}
                    className={`parking-details__calendar-day ${day.available ? 'parking-details__calendar-day--open' : 'parking-details__calendar-day--closed'}`}
                  >
                    {day.relativeLabel && (
                      <span className="parking-details__calendar-relative">{day.relativeLabel}</span>
                    )}
                    <span className="parking-details__calendar-date">{formatDisplayDate(day.date)}</span>
                    <span className="parking-details__calendar-weekday">{day.dayName}</span>
                    <span className="parking-details__calendar-hours">{day.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <Button
              fullWidth
              size="lg"
              onClick={() => navigate(`/parking/${id}/book`)}
              disabled={isParkingOccupied(id)}
            >
              {isParkingOccupied(id) ? 'החניה תפוסה כרגע' : 'הזמן חניה'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
