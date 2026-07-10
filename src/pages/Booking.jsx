import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { MapPin, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { useParking } from '../context/ParkingContext';
import { useAppSettings } from '../context/AppSettingsContext';
import { isAdmin } from '../lib/roles';
import {
  validateBookingSlot,
  getMaxDurationMinutes,
  getAvailableUntilTime,
  getCurrentTimeStr,
  getScheduleForDate,
  hasOwnerConfiguredAvailability,
  isStartTimeNow,
} from '../lib/availability';
import { calculateBookingPrice, toLocalDateStr, formatDurationLabel, MINIMUM_CHARGE_MINUTES } from '../lib/bookingPricing';
import { getCancellationPolicyDescription } from '../lib/cancellationPolicy';
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
  const location = useLocation();
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const { bookingsDisabled, message: maintenanceMessage } = useAppSettings();
  const {
    getParkingById,
    createBooking,
    confirmArrivalHere,
    confirmArrivalOnWay,
    getReservationConflicts,
    getPendingArrivalBookingByUserId,
    cancelBooking,
    isParkingOccupiedByOther,
    HOLD_MINUTES,
  } = useParking();
  const parking = getParkingById(id);
  const initialSearch = location.state?.search;

  const [date, setDate] = useState(() => initialSearch?.dateStr || toLocalDateStr(new Date()));
  const [startTime, setStartTime] = useState(() => initialSearch?.startTime || getCurrentTimeStr());
  const [durationMinutes, setDurationMinutes] = useState(() => initialSearch?.durationMinutes || 120);
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

  const availableUntil = useMemo(() => {
    if (!parking || maxDurationMinutes == null || maxDurationMinutes <= 0) return null;
    return getAvailableUntilTime(parking, date, startTime, reservations);
  }, [parking, date, startTime, maxDurationMinutes, reservations]);

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
  }, [parking, date, startTime, durationMinutes, maxDurationMinutes, reservations]);

  useEffect(() => {
    const pending = getPendingArrivalBookingByUserId(user?.id || '');
    if (pending?.parkingId === id) {
      setPendingBookingId(pending.id);
      setArrivalModalOpen(true);
    }
  }, [user?.id, id, getPendingArrivalBookingByUserId]);

  if (isAdmin(user)) {
    return <Navigate to="/admin" replace />;
  }

  if (bookingsDisabled) {
    return (
      <div className="page booking-page">
        <div className="card" style={{ padding: 24 }}>
          <h2 style={{ marginTop: 0 }}>האפליקציה מושבתת זמנית</h2>
          <p>{maintenanceMessage}</p>
          <Button onClick={() => navigate('/')}>חזרה למפה</Button>
        </div>
      </div>
    );
  }

  if (!parking) {
    return (
      <div className="page">
        <div className="empty-state"><h2>חניה לא נמצאה</h2></div>
      </div>
    );
  }

  if (!hasOwnerConfiguredAvailability(parking) || parking.status !== 'active' || parking.available === false) {
    return (
      <div className="page">
        <div className="empty-state card">
          <h2>החניה אינה זמינה להזמנה</h2>
          <p>ייתכן שבעל החניה עדיין לא הגדיר זמינות.</p>
          <Button onClick={() => navigate('/')}>חזרה למפה</Button>
        </div>
      </div>
    );
  }

  const handleBackToMap = () => {
    const pending = getPendingArrivalBookingByUserId(user?.id || '');
    if (pending?.parkingId === parking.id) {
      cancelBooking(pending.id, user.id);
    }
    navigate('/', { replace: true });
  };

  const pricing = calculateBookingPrice(parking.pricePerHour, durationMinutes);
  const isImmediate = isStartTimeNow(date, startTime);

  if (isImmediate && isParkingOccupiedByOther(parking.id, user?.id || '')) {
    return (
      <div className="page">
        <div className="empty-state card">
          <h2>החניה תפוסה כרגע</h2>
          <p>מישהו אחר הזמין את החניה. נסו חניה אחרת.</p>
          <Button onClick={handleBackToMap}>חזרה למפה</Button>
        </div>
      </div>
    );
  }

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
          <p className="booking-page__rate">{formatPrice(parking.pricePerHour)} לשעה</p>
          <p className="booking-page__availability-hours">
            זמינות: {parking.availabilityHours}
          </p>
          {maxDurationMinutes != null && maxDurationMinutes > 0 && (
            <>
              <p className="booking-page__max-duration">
                מקסימום להזמנה: {formatDurationLabel(maxDurationMinutes)}
              </p>
              {availableUntil && (
                <p className="booking-page__available-until">
                  פנוי עד {availableUntil}
                </p>
              )}
            </>
          )}
          <div className="booking-page__summary-note">
            <p>
              {isImmediate
                ? 'שעת ההתחלה מוגדרת לעכשיו. לאחר האישור תוכלו להתחיל מיד או לשמור ל-10 דקות.'
                : 'החניה תישמר עבורכם עד לשעת ההתחלה. 10 דקות לפני תוכלו להיכנס למסך ההמתנה.'}
            </p>
            {!isImmediate && (
              <p className="booking-page__cancellation-note">
                {getCancellationPolicyDescription({
                  date,
                  startTime,
                  createdAt: new Date().toISOString(),
                }, formatPrice)}
              </p>
            )}
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
              <span>תקרת תשלום משוערת</span>
              {pricing.discountLabel && (
                <span className="booking-page__discount">{pricing.discountLabel}</span>
              )}
              <span className="booking-page__billing-note">
                החיוב הסופי לפי זמן בפועל · מינימום {MINIMUM_CHARGE_MINUTES} דקות
              </span>
            </div>
            <div className="booking-page__total-prices">
              {pricing.discountPercent > 0 && (
                <span className="booking-page__total-base">{formatPrice(pricing.base)}</span>
              )}
              <span className="booking-page__total-price">{formatPrice(pricing.total)}</span>
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
