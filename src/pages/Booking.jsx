import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useParking } from '../context/ParkingContext';
import {
  validateBookingSlot,
  getMaxDurationMinutes,
  getCurrentTimeStr,
  getScheduleForDate,
  isStartTimeNow,
} from '../lib/availability';
import { calculateBookingPrice, toLocalDateStr, formatDurationLabel } from '../lib/bookingPricing';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Icon from '../components/ui/Icon';
import Modal from '../components/ui/Modal';
import DurationWheel from '../components/booking/DurationWheel';
import DateSelector from '../components/booking/DateSelector';
import './Booking.css';

export default function Booking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    getParkingById,
    createBooking,
    confirmArrivalHere,
    confirmArrivalOnWay,
    getReservationConflicts,
    getPendingArrivalBookingByUserId,
    cancelBooking,
    isParkingOccupied,
    HOLD_MINUTES,
  } = useParking();
  const parking = getParkingById(id);

  const [date, setDate] = useState(() => toLocalDateStr(new Date()));
  const [startTime, setStartTime] = useState(() => getCurrentTimeStr());
  const [durationMinutes, setDurationMinutes] = useState(120);
  const [error, setError] = useState('');
  const [availabilityHint, setAvailabilityHint] = useState('');
  const [loading, setLoading] = useState(false);
  const [arrivalModalOpen, setArrivalModalOpen] = useState(false);
  const [pendingBookingId, setPendingBookingId] = useState(null);
  const [arrivalError, setArrivalError] = useState('');

  const reservations = useMemo(
    () => (parking ? getReservationConflicts(parking.id) : []),
    [parking, getReservationConflicts],
  );

  const maxDurationMinutes = useMemo(() => {
    if (!parking) return null;
    return getMaxDurationMinutes(parking, date, startTime, reservations);
  }, [parking, date, startTime, reservations]);

  const handleDateChange = useCallback((newDate) => {
    setDate(newDate);
    if (newDate === toLocalDateStr(new Date())) {
      setStartTime(getCurrentTimeStr());
    } else if (parking) {
      const schedule = getScheduleForDate(parking, newDate);
      setStartTime(schedule?.start || '08:00');
    }
  }, [parking]);

  useEffect(() => {
    if (!parking || maxDurationMinutes === null) return;

    const validation = validateBookingSlot(parking, date, startTime, durationMinutes, reservations);
    if (!validation.valid && validation.maxDurationMinutes != null) {
      setAvailabilityHint(validation.error);
      if (durationMinutes > validation.maxDurationMinutes && validation.maxDurationMinutes > 0) {
        setDurationMinutes(validation.maxDurationMinutes);
      }
    } else if (maxDurationMinutes === 0) {
      setAvailabilityHint('החניה אינה פנויה בתאריך ובשעה שנבחרו.');
    } else {
      setAvailabilityHint('');
    }
  }, [parking, date, startTime, reservations]);

  useEffect(() => {
    const pending = getPendingArrivalBookingByUserId(user?.id || '');
    if (pending?.parkingId === id) {
      setPendingBookingId(pending.id);
      setArrivalModalOpen(true);
    }
  }, [user?.id, id, getPendingArrivalBookingByUserId]);

  if (!parking) {
    return (
      <div className="page">
        <div className="empty-state"><h2>חניה לא נמצאה</h2></div>
      </div>
    );
  }

  if (isParkingOccupied(parking.id)) {
    return (
      <div className="page">
        <div className="empty-state card">
          <h2>החניה תפוסה כרגע</h2>
          <p>מישהו אחר הזמין את החניה. נסו חניה אחרת.</p>
          <Button onClick={() => navigate('/')}>חזרה למפה</Button>
        </div>
      </div>
    );
  }

  const pricing = calculateBookingPrice(parking.pricePerHour, durationMinutes);
  const isImmediate = isStartTimeNow(date, startTime);

  const handleConfirm = async () => {
    setLoading(true);
    setError('');

    const validation = validateBookingSlot(parking, date, startTime, durationMinutes, reservations);
    if (!validation.valid) {
      setError(validation.error);
      setLoading(false);
      return;
    }

    await new Promise((r) => setTimeout(r, 400));

    const result = createBooking({
      userId: user.id,
      parkingId: parking.id,
      date,
      startTime,
      durationMinutes,
      immediate: isImmediate,
    });

    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    if (isImmediate) {
      setPendingBookingId(result.booking.id);
      setArrivalModalOpen(true);
      return;
    }

    navigate('/', { replace: true, state: { scheduledBooking: true } });
  };

  const handleArrivalHere = () => {
    if (!pendingBookingId) return;
    setArrivalError('');
    const result = confirmArrivalHere(pendingBookingId, user.id);
    if (result.ok) {
      navigate('/active', { replace: true });
    } else {
      setArrivalError(result.error || 'לא ניתן להתחיל חניה');
    }
  };

  const handleArrivalOnWay = () => {
    if (!pendingBookingId) return;
    setArrivalError('');
    const result = confirmArrivalOnWay(pendingBookingId, user.id);
    if (result.ok) {
      navigate('/saved', { replace: true });
    } else {
      setArrivalError(result.error || 'לא ניתן לשמור חניה');
    }
  };

  return (
    <div className="page booking-page">
      <button type="button" className="page-back" onClick={() => {
        const pending = getPendingArrivalBookingByUserId(user?.id || '');
        if (pending?.parkingId === id) cancelBooking(pending.id, user.id);
        navigate(`/parking/${id}`);
      }}>
        <Icon icon={ChevronRight} size={18} />
        חזרה לפרטים
      </button>

      {error && <div className="error-message">{error}</div>}
      {availabilityHint && !error && (
        <div className="info-banner">{availabilityHint}</div>
      )}

      <div className="booking-page__layout page-split">
        <div className="booking-page__summary card">
          <h2 className="booking-page__parking-name">{parking.name}</h2>
          <p className="booking-page__parking-address">
            <Icon icon={MapPin} size={14} className="app-icon--muted" />
            {parking.address}
          </p>
          <p className="booking-page__rate">₪{parking.pricePerHour} לשעה</p>
          <p className="booking-page__availability-hours">
            זמינות: {parking.availabilityHours}
          </p>
          {maxDurationMinutes != null && maxDurationMinutes > 0 && (
            <p className="booking-page__max-duration">
              מקסימום להזמנה: {formatDurationLabel(maxDurationMinutes)}
            </p>
          )}
          <div className="booking-page__summary-note">
            <p>
              {isImmediate
                ? 'שעת ההתחלה מוגדרת לעכשיו. לאחר האישור תוכלו להתחיל מיד או לשמור ל-10 דקות.'
                : 'ההזמנה תישמר. 10 דקות לפני השעה תועברו למסך ההמתנה.'}
            </p>
          </div>
        </div>

        <div className="booking-page__form card">
          <DateSelector value={date} onChange={handleDateChange} />
          <Input
            label="שעת התחלה"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
          <DurationWheel
            value={durationMinutes}
            onChange={setDurationMinutes}
            maxMinutes={maxDurationMinutes ?? undefined}
          />

          <div className="booking-page__total">
            <div className="booking-page__total-info">
              <span>סה״כ לתשלום</span>
              {pricing.discountLabel && (
                <span className="booking-page__discount">{pricing.discountLabel}</span>
              )}
            </div>
            <div className="booking-page__total-prices">
              {pricing.discountPercent > 0 && (
                <span className="booking-page__total-base">₪{pricing.base}</span>
              )}
              <span className="booking-page__total-price">₪{pricing.total}</span>
            </div>
          </div>

          <Button
            fullWidth
            size="lg"
            onClick={handleConfirm}
            disabled={loading || maxDurationMinutes === 0}
          >
            {loading ? 'שומר...' : 'שמירת הזמנה'}
          </Button>
        </div>
      </div>

      <Modal
        title="הגעת לחניה?"
        isOpen={arrivalModalOpen}
        onClose={() => {}}
        closable={false}
      >
        <p className="booking-page__arrival-prompt">איך תרצו להמשיך?</p>
        {arrivalError && <div className="error-message">{arrivalError}</div>}
        <div className="booking-page__arrival-actions">
          <Button fullWidth size="lg" onClick={handleArrivalHere}>
            אני פה, התחל חניה
          </Button>
          <Button fullWidth variant="secondary" onClick={handleArrivalOnWay}>
            אני בדרך, שמור לי ל-{HOLD_MINUTES} דקות
          </Button>
        </div>
      </Modal>
    </div>
  );
}
