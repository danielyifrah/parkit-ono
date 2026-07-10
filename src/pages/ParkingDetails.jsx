import { useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { MapPin, Star, Clock, Image, ChevronRight, CalendarDays } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { useParking } from '../context/ParkingContext';
import { useAppSettings } from '../context/AppSettingsContext';
import { isAdmin } from '../lib/roles';
import {
  getTodayTomorrowAvailability,
  hasOwnerConfiguredAvailability,
  isParkingAvailableForSlot,
} from '../lib/availability';
import { toLocalDateStr } from '../lib/bookingPricing';
import { durationLabelToMinutes } from '../lib/parkingFilters';
import { isImmediateSearch, resolveSearchDateTime } from '../lib/searchContext';
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
  const location = useLocation();
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const { bookingsDisabled, message: maintenanceMessage } = useAppSettings();
  const {
    getParkingById,
    isParkingPubliclyBlocked,
    getReservationConflicts,
  } = useParking();
  const parking = getParkingById(id);
  const isOwner = parking?.ownerId === user?.id;
  const adminUser = isAdmin(user);
  const bookingBlocked = bookingsDisabled || adminUser;

  const search = location.state?.search;
  const searchDate = search?.dateStr ?? toLocalDateStr(new Date());
  const searchTime = search?.startTime ?? resolveSearchDateTime({ dateOffset: 0, searchTime: 'now' }).startTime;
  const searchDurationMinutes = search?.durationMinutes ?? durationLabelToMinutes('שעה');
  const isImmediate = search?.isImmediate ?? isImmediateSearch({ dateOffset: 0, searchTime: 'now' });

  const todayTomorrowAvailability = parking ? getTodayTomorrowAvailability(parking) : [];
  const configured = parking ? hasOwnerConfiguredAvailability(parking) : false;
  const inactive = !parking?.available || parking?.status !== 'active';
  const blockedNow = parking ? isParkingPubliclyBlocked(parking.id) : false;
  const blockedForSearch = isImmediate && blockedNow;

  const bookableForSearch = useMemo(() => {
    if (!parking || inactive || !configured || blockedForSearch) return false;
    const conflicts = getReservationConflicts(parking.id);
    return isParkingAvailableForSlot(
      parking,
      searchDate,
      searchTime,
      searchDurationMinutes,
      conflicts,
    );
  }, [parking, inactive, configured, blockedForSearch, searchDate, searchTime, searchDurationMinutes, getReservationConflicts]);

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

  if (!isOwner && (!configured || inactive)) {
    return (
      <div className="page">
        <div className="empty-state">
          <h2>החניה אינה זמינה כרגע</h2>
          <p>ייתכן שבעל החניה עדיין לא הגדיר זמינות, או שהחניה אינה פעילה.</p>
          <Button onClick={() => navigate('/')}>חזרה למפה</Button>
        </div>
      </div>
    );
  }

  const statusBadge = inactive ? (
    <span className="badge badge--inactive">
      <span className="badge__dot" />
      לא פעילה
    </span>
  ) : !configured ? (
    <span className="badge badge--inactive">
      <span className="badge__dot" />
      טרם הוגדרה זמינות
    </span>
  ) : blockedForSearch ? (
    <span className="badge badge--error">
      <span className="badge__dot" />
      תפוסה כרגע
    </span>
  ) : bookableForSearch ? (
    <span className="badge badge--success">
      <span className="badge__dot" />
      {isImmediate ? 'פנוי עכשיו' : 'זמין לחיפוש'}
    </span>
  ) : (
    <span className="badge badge--inactive">
      <span className="badge__dot" />
      לא זמין בזמן שנבחר
    </span>
  );

  const handleBook = () => {
    navigate(`/parking/${id}/book`, {
      state: {
        search: {
          dateStr: searchDate,
          startTime: searchTime,
          durationMinutes: searchDurationMinutes,
          isImmediate,
        },
      },
    });
  };

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
                {statusBadge}
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
                <span className="parking-details__stat-value">{formatPrice(parking.pricePerHour)}</span>
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

            {bookingBlocked && (
              <p className="parking-details__maintenance">
                {adminUser
                  ? 'משתמש מנהל אינו מבצע הזמנות. ניהול המערכת זמין בדשבורד הניהול.'
                  : maintenanceMessage}
              </p>
            )}

            <Button
              fullWidth
              size="lg"
              onClick={handleBook}
              disabled={bookingBlocked || !bookableForSearch || inactive || !configured}
            >
              {adminUser
                ? 'הזמנה אינה זמינה למנהל'
                : bookingsDisabled
                  ? 'האפליקציה מושבתת זמנית'
                  : !configured
                    ? 'יש להגדיר זמינות לפני הזמנה'
                    : inactive
                      ? 'החניה לא פעילה'
                      : blockedForSearch
                        ? 'החניה תפוסה כרגע'
                        : bookableForSearch
                          ? 'הזמן חניה'
                          : 'החניה לא זמינה בזמן שנבחר'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
