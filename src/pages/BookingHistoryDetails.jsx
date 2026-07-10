import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Star,
  Clock,
  Calendar,
  CreditCard,
  ChevronRight,
  Image,
  Timer,
  CalendarClock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useParking } from '../context/ParkingContext';
import { calculateBookingPrice, formatDurationLabel } from '../lib/bookingPricing';
import {
  getCancellationPolicyDescription,
  getCancellationPreview,
} from '../lib/cancellationPolicy';
import Button from '../components/ui/Button';
import Icon from '../components/ui/Icon';
import StarRating from '../components/ui/StarRating';
import { Textarea } from '../components/ui/Input';
import './BookingHistoryDetails.css';

const HEBREW_DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const UPCOMING_STATUSES = ['scheduled', 'saved', 'pending_arrival'];

const typeLabels = {
  private: 'חניה פרטית',
  public: 'חניה ציבורית',
  office: 'חניה משרדית',
};

function formatDisplayDate(dateStr) {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

function getDayName(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return HEBREW_DAYS[new Date(year, month - 1, day).getDay()];
}

const statusMeta = {
  scheduled: { label: 'שמורה', className: 'badge--success' },
  saved: { label: 'בהמתנה', className: 'badge--success' },
  pending_arrival: { label: 'ממתינה להגעה', className: 'badge--success' },
  completed: { label: 'הושלמה', className: 'badge--inactive' },
  cancelled: { label: 'בוטלה', className: 'badge--error' },
};

export default function BookingHistoryDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    getBookingById,
    getParkingById,
    addBookingReview,
    cancelBooking,
    PRE_START_HOLD_MINUTES,
  } = useParking();
  const booking = getBookingById(id);
  const parking = booking ? getParkingById(booking.parkingId) : null;

  const [rating, setRating] = useState(booking?.review?.rating ?? 0);
  const [reviewText, setReviewText] = useState(booking?.review?.text ?? '');
  const [savedReview, setSavedReview] = useState(booking?.review ?? null);
  const [reviewError, setReviewError] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  if (!booking || booking.userId !== user?.id || !parking) {
    return (
      <div className="page">
        <div className="empty-state card">
          <h2>הזמנה לא נמצאה</h2>
          <Button onClick={() => navigate('/history')}>חזרה להיסטוריה</Button>
        </div>
      </div>
    );
  }

  const isUpcoming = UPCOMING_STATUSES.includes(booking.status);
  const isCompleted = booking.status === 'completed';
  const isCancelled = booking.status === 'cancelled';

  if (!isUpcoming && !isCompleted && !isCancelled) {
    return (
      <div className="page">
        <div className="empty-state card">
          <h2>הזמנה לא נמצאה</h2>
          <Button onClick={() => navigate('/history')}>חזרה להיסטוריה</Button>
        </div>
      </div>
    );
  }

  const durationMinutes = booking.durationMinutes ?? Math.round(booking.durationHours * 60);
  const pricing = calculateBookingPrice(parking.pricePerHour, durationMinutes);
  const hasReview = Boolean(savedReview?.rating);
  const cancellationPreview = getCancellationPreview(booking);
  const status = statusMeta[booking.status] || statusMeta.completed;

  const handleCancel = async () => {
    if (!isUpcoming) return;

    if (cancellationPreview.fee > 0) {
      const confirmed = window.confirm(
        `ביטול ההזמנה יחויב ב-₪${cancellationPreview.fee}. להמשיך?`,
      );
      if (!confirmed) return;
    }

    setCancelling(true);
    const result = cancelBooking(booking.id, user.id);
    setCancelling(false);

    if (result.ok) {
      navigate('/history', { replace: true });
    }
  };

  const handleSubmitReview = async () => {
    if (rating === 0) return;

    setReviewError('');
    setSubmittingReview(true);

    const result = addBookingReview(booking.id, user.id, {
      rating,
      text: reviewText.trim(),
    });

    setSubmittingReview(false);

    if (result.ok) {
      setSavedReview(result.booking.review);
    } else {
      setReviewError(result.error || 'שגיאה בשמירת הביקורת');
    }
  };

  return (
    <div className="page booking-history-details">
      <button type="button" className="page-back" onClick={() => navigate('/history')}>
        <Icon icon={ChevronRight} size={18} />
        חזרה להיסטוריה
      </button>

      <div className="booking-history-details__parking card">
        {parking.image ? (
          <img
            src={parking.image}
            alt=""
            className="booking-history-details__hero"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="booking-history-details__hero image-placeholder">
            <Icon icon={Image} size={40} className="app-icon--muted" />
          </div>
        )}

        <div className="booking-history-details__parking-body">
          <div className="booking-history-details__parking-header">
            <div>
              <span className={`badge ${status.className} booking-history-details__status-top`}>
                <span className="badge__dot" />
                {status.label}
              </span>
              <h1 className="booking-history-details__title">{parking.name}</h1>
              <p className="booking-history-details__address">
                <Icon icon={MapPin} size={14} className="app-icon--muted" />
                {parking.address}
              </p>
            </div>
            <div className="booking-history-details__rating">
              <span className="booking-history-details__rating-value">
                <Icon icon={Star} size={16} className="app-icon--primary" />
                {parking.rating}
              </span>
              <span className="booking-history-details__reviews">({parking.reviewsCount} ביקורות)</span>
            </div>
          </div>

          <div className="booking-history-details__stats">
            <div className="booking-history-details__stat">
              <span className="booking-history-details__stat-value">₪{parking.pricePerHour}</span>
              <span className="booking-history-details__stat-label">לשעה</span>
            </div>
            <div className="booking-history-details__stat">
              <span className="booking-history-details__stat-value">{typeLabels[parking.type]}</span>
              <span className="booking-history-details__stat-label">סוג</span>
            </div>
            <div className="booking-history-details__stat">
              <span className="booking-history-details__stat-value">{parking.covered ? 'מקורה' : 'פתוחה'}</span>
              <span className="booking-history-details__stat-label">מקום {parking.spotNumber}</span>
            </div>
          </div>
        </div>
      </div>

      <section className="booking-history-details__section card">
        <h2 className="booking-history-details__section-title">
          {isUpcoming ? 'פרטי ההזמנה' : 'פרטי החניה שבוצעה'}
        </h2>
        <div className="booking-history-details__info-grid">
          <div className="booking-history-details__info-item">
            <Icon icon={Calendar} size={16} className="app-icon--muted" />
            <div>
              <span className="booking-history-details__info-label">תאריך</span>
              <span className="booking-history-details__info-value">
                {formatDisplayDate(booking.date)} · יום {getDayName(booking.date)}
              </span>
            </div>
          </div>
          <div className="booking-history-details__info-item">
            <Icon icon={Clock} size={16} className="app-icon--muted" />
            <div>
              <span className="booking-history-details__info-label">שעות</span>
              <span className="booking-history-details__info-value" dir="ltr">
                {booking.startTime} – {booking.endTime}
              </span>
            </div>
          </div>
          <div className="booking-history-details__info-item">
            <Icon icon={Timer} size={16} className="app-icon--muted" />
            <div>
              <span className="booking-history-details__info-label">משך החניה</span>
              <span className="booking-history-details__info-value">
                {formatDurationLabel(durationMinutes)}
              </span>
            </div>
          </div>
        </div>
        {!isUpcoming && (
          <span className="badge badge--inactive booking-history-details__status">הושלמה</span>
        )}
      </section>

      {isUpcoming && (
        <section className="booking-history-details__section card booking-history-details__upcoming">
          <h2 className="booking-history-details__section-title">
            <Icon icon={CalendarClock} size={18} className="app-icon--primary" />
            הזמנה שמורה
          </h2>
          <p className="booking-history-details__upcoming-text">
            החניה שמורה עבורכם עד לשעת ההתחלה.
            {booking.status === 'scheduled' && (
              <> {PRE_START_HOLD_MINUTES} דקות לפני ההתחלה תועברו למסך ההמתנה.</>
            )}
          </p>
          <p className="booking-history-details__policy">
            {getCancellationPolicyDescription(booking)}
          </p>
          <p className="booking-history-details__policy-note">
            {cancellationPreview.message}
          </p>
          <div className="booking-history-details__estimated">
            <span>תקרת תשלום משוערת</span>
            <strong>₪{pricing.total}</strong>
          </div>
          <Button
            variant="ghost"
            fullWidth
            onClick={handleCancel}
            disabled={cancelling}
          >
            {cancelling ? 'מבטל...' : 'ביטול הזמנה'}
          </Button>
        </section>
      )}

      {isCancelled && (
        <section className="booking-history-details__section card">
          <p className="booking-history-details__cancelled-note">
            ההזמנה בוטלה
            {booking.cancellationFee > 0 ? ` · חויב ב-₪${booking.cancellationFee}` : ''}
          </p>
        </section>
      )}

      {isCompleted && (
        <>
          <section className="booking-history-details__section card">
            <h2 className="booking-history-details__section-title">תשלום</h2>
            <div className="booking-history-details__payment">
              <div className="booking-history-details__payment-row">
                <span>מחיר בסיס</span>
                <span>₪{pricing.base}</span>
              </div>
              {pricing.discountPercent > 0 && (
                <div className="booking-history-details__payment-row booking-history-details__payment-row--discount">
                  <span>{pricing.discountLabel}</span>
                  <span>−{pricing.discountPercent}%</span>
                </div>
              )}
              <div className="booking-history-details__payment-total">
                <span>סה״כ שולם</span>
                <span className="booking-history-details__payment-amount">₪{booking.totalPrice}</span>
              </div>
              <div className="booking-history-details__payment-method">
                <Icon icon={CreditCard} size={16} className="app-icon--muted" />
                <span>{booking.paymentMethod}</span>
              </div>
            </div>
          </section>

          <section className="booking-history-details__section card">
            <h2 className="booking-history-details__section-title">סיכום וביקורת</h2>

            {hasReview ? (
              <div className="booking-history-details__review-display">
                <StarRating value={savedReview.rating} readonly size={20} />
                {savedReview.text && (
                  <p className="booking-history-details__review-text">{savedReview.text}</p>
                )}
                <p className="booking-history-details__review-thanks">תודה על הביקורת!</p>
              </div>
            ) : (
              <div className="booking-history-details__review-form">
                <p className="booking-history-details__review-prompt">איך הייתה החוויה?</p>
                <StarRating value={rating} onChange={setRating} size={28} />
                <Textarea
                  label="חוות דעת קצרה (אופציונלי)"
                  placeholder="ספרו על החניה, הנגישות, הניקיון..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  rows={3}
                  maxLength={300}
                />
                <Button
                  fullWidth
                  onClick={handleSubmitReview}
                  disabled={rating === 0 || submittingReview}
                >
                  {submittingReview ? 'שולח...' : 'שליחת ביקורת'}
                </Button>
                {reviewError && <p className="error-message">{reviewError}</p>}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
