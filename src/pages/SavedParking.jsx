import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookmarkX } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useParking } from '../context/ParkingContext';
import { useScreenLock, useWakeLock } from '../hooks/useScreenLock';
import { formatCountdown, formatBookingScheduleRtl } from '../lib/availability';
import Button from '../components/ui/Button';
import Icon from '../components/ui/Icon';
import './SavedParking.css';

export default function SavedParking() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    getSavedBookingByUserId,
    getParkingById,
    getSavedHoldRemainingMs,
    cancelBooking,
    startBooking,
    HOLD_MINUTES,
  } = useParking();

  const savedBooking = getSavedBookingByUserId(user?.id || '');
  const parking = savedBooking ? getParkingById(savedBooking.parkingId) : null;

  const [countdown, setCountdown] = useState(() =>
    savedBooking ? getSavedHoldRemainingMs(savedBooking) : 0,
  );

  const inHoldPhase = Boolean(savedBooking?.holdStartedAt);

  useScreenLock(inHoldPhase);
  useWakeLock(inHoldPhase);

  const handleAutoStart = useCallback(() => {
    if (!savedBooking) return;
    const result = startBooking(savedBooking.id, user.id);
    if (result.ok) navigate('/active', { replace: true });
  }, [savedBooking, startBooking, user?.id, navigate]);

  useEffect(() => {
    if (!savedBooking || !inHoldPhase) return undefined;

    const tick = () => {
      const remaining = getSavedHoldRemainingMs(savedBooking);
      setCountdown(remaining);
      if (remaining <= 0) handleAutoStart();
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [savedBooking, inHoldPhase, getSavedHoldRemainingMs, handleAutoStart]);

  const handleCancel = () => {
    if (!savedBooking) return;
    cancelBooking(savedBooking.id, user.id);
    navigate('/', { replace: true });
  };

  const handleManualStart = () => {
    if (!savedBooking) return;
    const result = startBooking(savedBooking.id, user.id);
    if (result.ok) navigate('/active', { replace: true });
  };

  if (!savedBooking || !parking || !inHoldPhase) {
    return (
      <div className="page saved-parking">
        <div className="empty-state card saved-parking__empty">
          <Icon icon={BookmarkX} size={40} className="app-icon--muted" />
          <h2>אין חניה שמורה כרגע</h2>
          <p>10 דקות לפני תחילת ההזמנה תועברו לכאן אוטומטית.</p>
          <Button onClick={() => navigate('/')}>חיפוש חניה</Button>
        </div>
      </div>
    );
  }

  const countdownSeconds = Math.ceil(countdown / 1000);

  return (
    <div className="page saved-parking">
      <div className="saved-parking__lock-notice info-banner">
        לא ניתן לעזוב מסך זה עד להתחלת החניה או ביטול ההזמנה
      </div>

      <div className="saved-parking__layout page-split page-split--equal">
        <div className="saved-parking__timer card">
          <span className="badge badge--success">
            <span className="badge__dot" />
            ממתין להתחלה
          </span>
          <p className="saved-parking__timer-label">הזמנה שמורה — {HOLD_MINUTES} דקות</p>
          <p className="saved-parking__countdown" dir="ltr" aria-live="polite">
            {formatCountdown(countdownSeconds)}
          </p>
          <p className="saved-parking__countdown-hint">
            {countdownSeconds > 0
              ? 'בסיום הספירה החניה תתחיל אוטומטית'
              : 'מתחיל חניה...'}
          </p>
          <p className="saved-parking__scheduled" dir="ltr">
            {formatBookingScheduleRtl(savedBooking)}
          </p>
        </div>

        <div className="saved-parking__side">
          <div className="saved-parking__details card">
            <h2 className="saved-parking__name">{parking.name}</h2>
            <p className="saved-parking__address">{parking.address}</p>
            <div className="saved-parking__meta">
              <span>מקום: <strong>{parking.spotNumber}</strong></span>
              <span>מחיר: <strong>₪{parking.pricePerHour} לשעה</strong></span>
              <span>תשלום: <strong>{savedBooking.paymentMethod}</strong></span>
            </div>
          </div>

          <p className="saved-parking__start-prompt">הגעת כבר לחניה?</p>

          <Button fullWidth size="lg" onClick={handleManualStart}>
            התחל חניה עכשיו
          </Button>

          <Button variant="ghost" fullWidth onClick={handleCancel}>
            ביטול הזמנה
          </Button>
        </div>
      </div>
    </div>
  );
}
