import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Car,
  MapPin,
  Clock,
  Timer,
  Plus,
  Square,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useParking } from '../context/ParkingContext';
import { useScreenLock, useWakeLock } from '../hooks/useScreenLock';
import {
  formatTimerParts,
  getMaxExtensionMinutes,
} from '../lib/availability';
import {
  formatDurationLabel,
  calculateActualPrice,
  MINIMUM_CHARGE_MINUTES,
} from '../lib/bookingPricing';
import Button from '../components/ui/Button';
import Icon from '../components/ui/Icon';
import Modal from '../components/ui/Modal';
import StarRating from '../components/ui/StarRating';
import { Textarea } from '../components/ui/Input';
import DurationWheel from '../components/booking/DurationWheel';
import './ActiveParking.css';

function getLivePricing(parking, startedAt) {
  if (!parking || !startedAt) return null;
  const elapsedMinutes = Math.max(
    0,
    Math.ceil((Date.now() - new Date(startedAt).getTime()) / 60000),
  );
  return calculateActualPrice(parking.pricePerHour, elapsedMinutes);
}

export default function ActiveParking() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    getActiveBookingByUserId,
    getParkingById,
    getActiveRemainingMs,
    extendActiveBooking,
    completeBooking,
  } = useParking();

  const activeBooking = getActiveBookingByUserId(user?.id || '');
  const parking = activeBooking ? getParkingById(activeBooking.parkingId) : null;

  const [remainingMs, setRemainingMs] = useState(() =>
    activeBooking ? getActiveRemainingMs(activeBooking) : 0,
  );
  const [livePrice, setLivePrice] = useState(0);
  const [liveChargeMinutes, setLiveChargeMinutes] = useState(0);
  const [showExtend, setShowExtend] = useState(false);
  const [extendMinutes, setExtendMinutes] = useState(30);
  const [extendError, setExtendError] = useState('');
  const [showSummary, setShowSummary] = useState(false);
  const [summaryPricing, setSummaryPricing] = useState(null);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [finishError, setFinishError] = useState('');

  useScreenLock(Boolean(activeBooking) && !showSummary);
  useWakeLock(Boolean(activeBooking) && !showSummary);

  const maxExtensionMinutes = parking && activeBooking
    ? getMaxExtensionMinutes(parking, activeBooking.date, activeBooking.endTime)
    : 0;

  const handleSessionEnd = useCallback(() => {
    const pricing = getLivePricing(parking, activeBooking?.startedAt);
    setSummaryPricing(pricing);
    setShowSummary(true);
  }, [parking, activeBooking?.startedAt]);

  useEffect(() => {
    if (!activeBooking || showSummary) return undefined;

    const tick = () => {
      const remaining = getActiveRemainingMs(activeBooking);
      setRemainingMs(remaining);
      const pricing = getLivePricing(parking, activeBooking.startedAt);
      setLivePrice(pricing?.total ?? 0);
      setLiveChargeMinutes(pricing?.chargeMinutes ?? 0);
      if (remaining <= 0) handleSessionEnd();
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [activeBooking, parking, getActiveRemainingMs, handleSessionEnd, showSummary]);

  const handleExtend = () => {
    setExtendError('');
    if (maxExtensionMinutes <= 0) {
      setExtendError('לא ניתן להאריך — החניה אינה פנויה לאחר מכן.');
      return;
    }
    const result = extendActiveBooking(activeBooking.id, user.id, extendMinutes);
    if (!result.ok) {
      setExtendError(result.error || 'לא ניתן להאריך');
      return;
    }
    setShowExtend(false);
  };

  const handleFinish = (withReview = false) => {
    setFinishError('');
    const review = withReview && rating > 0 ? { rating, text: reviewText.trim() } : null;
    const result = completeBooking(activeBooking.id, user.id, review);
    if (result.ok) {
      navigate(`/history/${activeBooking.id}`, { replace: true });
    } else {
      setFinishError(result.error || 'לא ניתן לסיים את החניה');
    }
  };

  if (!activeBooking || !parking) {
    return (
      <div className="page active-parking">
        <div className="empty-state card active-parking__empty">
          <Icon icon={Car} size={40} className="app-icon--muted" />
          <h2>אין חניה פעילה כרגע</h2>
          <p>כשתתחילו חניה, תוכלו לעקוב אחר הזמן והחיוב בזמן אמת מכאן.</p>
          <Button onClick={() => navigate('/')}>חיפוש חניה</Button>
        </div>
      </div>
    );
  }

  const timer = formatTimerParts(Math.ceil(remainingMs / 1000));

  return (
    <div className="page active-parking">
      {!showSummary && (
        <div className="active-parking__lock-notice info-banner">
          לא ניתן לעזוב מסך זה עד לסיום החניה
        </div>
      )}

      <div className="active-parking__layout">
        <div className="active-parking__primary">
          <div className="active-parking__timer-card card">
            <span className="badge badge--success">
              <span className="badge__dot" />
              חניה פעילה
            </span>

            <div className="active-parking__timer" dir="ltr" aria-live="polite">
              <div className="active-parking__time-unit">
                <span className="active-parking__digits">{timer.hours}</span>
                <small>שעות</small>
              </div>
              <span className="active-parking__separator" aria-hidden="true">:</span>
              <div className="active-parking__time-unit">
                <span className="active-parking__digits">{timer.minutes}</span>
                <small>דקות</small>
              </div>
              <span className="active-parking__separator" aria-hidden="true">:</span>
              <div className="active-parking__time-unit">
                <span className="active-parking__digits">{timer.seconds}</span>
                <small>שניות</small>
              </div>
            </div>

            <p className="active-parking__price-label">חיוב משוער עד כה</p>
            <p className="active-parking__price">₪{livePrice}</p>
            <span className="active-parking__rate">
              ₪{parking.pricePerHour} לשעה
              {liveChargeMinutes > 0 && liveChargeMinutes < MINIMUM_CHARGE_MINUTES + 1 && (
                <> · מינימום {MINIMUM_CHARGE_MINUTES} דקות</>
              )}
            </span>
          </div>

          {!showSummary && (
            <div className="active-parking__actions">
              <button
                type="button"
                className="active-parking__extend-btn"
                onClick={() => {
                  setExtendError('');
                  setExtendMinutes(Math.min(30, maxExtensionMinutes) || 15);
                  setShowExtend(true);
                }}
              >
                <span className="active-parking__action-icon-wrap active-parking__action-icon-wrap--outline">
                  <Icon icon={Plus} size={22} className="app-icon--primary" />
                </span>
                <strong>הארכת חניה</strong>
                {maxExtensionMinutes > 0 && (
                  <small>עד {formatDurationLabel(maxExtensionMinutes)}</small>
                )}
              </button>

              <button
                type="button"
                className="active-parking__end-btn"
                onClick={handleSessionEnd}
              >
                <span className="active-parking__action-icon-wrap">
                  <Icon icon={Square} size={20} className="app-icon--white" />
                </span>
                <strong>סיום חניה</strong>
                <small>סיום מוקדם</small>
              </button>
            </div>
          )}
        </div>

        <div className="active-parking__details card">
          <h2 className="active-parking__details-title">פרטי החניה</h2>
          <div className="active-parking__row">
            <div className="active-parking__row-icon">
              <Icon icon={MapPin} size={18} className="app-icon--primary" />
            </div>
            <div>
              <p className="active-parking__row-value">{parking.name}</p>
              <p className="active-parking__row-sub">{parking.address}</p>
            </div>
          </div>
          <div className="active-parking__row">
            <div className="active-parking__row-icon">
              <Icon icon={Clock} size={18} className="app-icon--primary" />
            </div>
            <div className="active-parking__row-flex">
              <span>שעות</span>
              <span className="active-parking__pill" dir="ltr">
                {activeBooking.startTime} – {activeBooking.endTime}
              </span>
            </div>
          </div>
          <div className="active-parking__row">
            <div className="active-parking__row-icon">
              <Icon icon={Timer} size={18} className="app-icon--primary" />
            </div>
            <div className="active-parking__row-flex">
              <span>תקרת הזמנה</span>
              <span className="active-parking__pill">₪{activeBooking.totalPrice}</span>
            </div>
          </div>
        </div>
      </div>

      <Modal
        title="הארכת חניה"
        isOpen={showExtend}
        onClose={() => setShowExtend(false)}
      >
        {maxExtensionMinutes <= 0 ? (
          <p>לא ניתן להאריך — החניה פנויה רק עד {activeBooking.endTime}.</p>
        ) : (
          <>
            <p className="active-parking__extend-info">
              ניתן להאריך עד <strong>{formatDurationLabel(maxExtensionMinutes)}</strong> נוספות
              (עד {parking.availabilityHours.split('-').pop()?.trim()}).
            </p>
            <DurationWheel
              value={extendMinutes}
              onChange={setExtendMinutes}
              maxMinutes={maxExtensionMinutes}
            />
            {extendError && <div className="error-message">{extendError}</div>}
            <Button fullWidth onClick={handleExtend} style={{ marginTop: 16 }}>
              אישור הארכה
            </Button>
          </>
        )}
      </Modal>

      <Modal
        title="סיכום חניה"
        isOpen={showSummary}
        onClose={() => {}}
        closable={false}
      >
        <div className="active-parking__summary">
          <p className="active-parking__summary-total">
            סה״כ לתשלום: <strong>₪{summaryPricing?.total ?? livePrice}</strong>
          </p>
          {summaryPricing?.chargeMinutes != null && (
            <p className="active-parking__summary-duration">
              זמן חיוב: {formatDurationLabel(summaryPricing.chargeMinutes)}
              {summaryPricing.chargeMinutes === MINIMUM_CHARGE_MINUTES && (
                <> (מינימום {MINIMUM_CHARGE_MINUTES} דקות)</>
              )}
            </p>
          )}
          {summaryPricing?.discountLabel && (
            <p className="active-parking__summary-discount">{summaryPricing.discountLabel}</p>
          )}
          <p className="active-parking__summary-payment">
            שולם ב-{activeBooking.paymentMethod}
          </p>

          <div className="divider" />

          <p className="active-parking__summary-prompt">איך הייתה החוויה?</p>
          <StarRating value={rating} onChange={setRating} size={28} />
          <Textarea
            label="חוות דעת קצרה (אופציונלי)"
            placeholder="ספרו על החניה..."
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            rows={3}
          />

          <div className="active-parking__summary-actions">
            {finishError && <div className="error-message">{finishError}</div>}
            <Button fullWidth onClick={() => handleFinish(true)} disabled={rating === 0}>
              שליחה וסיום
            </Button>
            <Button variant="ghost" fullWidth onClick={() => handleFinish(false)}>
              דילוג
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
