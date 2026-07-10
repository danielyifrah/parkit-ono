import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import * as parkingStore from '../lib/parkingStore';
import { isSupabaseConfigured } from '../lib/supabaseClient';
import Button from '../components/ui/Button';

const ParkingContext = createContext(null);

function loadParkingData(userId, { onSuccess, onError }) {
  parkingStore.invalidateInit();

  return parkingStore.init({ userId, force: true })
    .then(() => onSuccess?.())
    .catch((err) => {
      console.error(err);
      onError?.();
    });
}

export function ParkingProvider({ children }) {
  const { user } = useAuth();
  const [version, setVersion] = useState(0);
  const [ready, setReady] = useState(!isSupabaseConfigured());
  const [error, setError] = useState(null);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => parkingStore.subscribe(() => setVersion((v) => v + 1)), []);

  useEffect(() => {
    if (!isSupabaseConfigured()) return undefined;

    let active = true;
    setReady(false);
    setError(null);

    loadParkingData(user?.id || null, {
      onSuccess: () => {
        if (active) setReady(true);
      },
      onError: () => {
        if (active) {
          setError('שגיאה בטעינת נתונים מהשרת');
          setReady(true);
        }
      },
    });

    return () => {
      active = false;
    };
  }, [user?.id]);

  const retryLoad = useCallback(async () => {
    if (!isSupabaseConfigured() || retrying) return;

    setRetrying(true);
    setReady(false);
    setError(null);

    await loadParkingData(user?.id || null, {
      onSuccess: () => {
        setReady(true);
        setRetrying(false);
      },
      onError: () => {
        setError('שגיאה בטעינת נתונים מהשרת');
        setReady(true);
        setRetrying(false);
      },
    });
  }, [user?.id, retrying]);

  const value = useMemo(() => ({
    version,
    ready,
    error,
    retryLoad,
    getParkings: parkingStore.getParkings,
    getParkingById: parkingStore.getParkingById,
    getAvailableParkings: parkingStore.getAvailableParkings,
    getBookingsByUserId: parkingStore.getBookingsByUserId,
    getBookingById: parkingStore.getBookingById,
    getProfileById: parkingStore.getProfileById,
    getParkingsByOwnerId: parkingStore.getParkingsByOwnerId,
    getOwnerUpcomingBookings: parkingStore.getOwnerUpcomingBookings,
    getOwnerParkingDisplayStatus: parkingStore.getOwnerParkingDisplayStatus,
    getSavedBookingByUserId: parkingStore.getSavedBookingByUserId,
    getScheduledBookingByUserId: parkingStore.getScheduledBookingByUserId,
    getPendingArrivalBookingByUserId: parkingStore.getPendingArrivalBookingByUserId,
    getActiveBookingByUserId: parkingStore.getActiveBookingByUserId,
    getReservationConflicts: parkingStore.getReservationConflicts,
    isParkingOccupied: parkingStore.isParkingOccupied,
    isParkingPubliclyBlocked: parkingStore.isParkingPubliclyBlocked,
    isParkingBookable: parkingStore.isParkingBookable,
    isParkingOccupiedByOther: parkingStore.isParkingOccupiedByOther,
    getSavedHoldRemainingMs: parkingStore.getSavedHoldRemainingMs,
    getActiveRemainingMs: parkingStore.getActiveRemainingMs,
    getScheduledHoldStartMs: parkingStore.getScheduledHoldStartMs,
    shouldEnterHoldPhase: parkingStore.shouldEnterHoldPhase,
    checkScheduledHoldsForUser: parkingStore.checkScheduledHoldsForUser,
    addParking: parkingStore.addParking,
    updateParkingAvailability: parkingStore.updateParkingAvailability,
    updateParkingWeeklyAvailability: parkingStore.updateParkingWeeklyAvailability,
    updateParkingUpcomingAvailability: parkingStore.updateParkingUpcomingAvailability,
    updateParkingDetails: parkingStore.updateParkingDetails,
    setParkingStatus: parkingStore.setParkingStatus,
    removeParking: parkingStore.removeParking,
    createBooking: parkingStore.createBooking,
    createSavedBooking: parkingStore.createSavedBooking,
    confirmArrivalHere: parkingStore.confirmArrivalHere,
    confirmArrivalOnWay: parkingStore.confirmArrivalOnWay,
    cancelBooking: parkingStore.cancelBooking,
    cancelSavedBooking: parkingStore.cancelSavedBooking,
    startBooking: parkingStore.startBooking,
    extendActiveBooking: parkingStore.extendActiveBooking,
    completeBooking: parkingStore.completeBooking,
    addBookingReview: parkingStore.addBookingReview,
    HOLD_MINUTES: parkingStore.HOLD_MINUTES,
    PRE_START_HOLD_MINUTES: parkingStore.PRE_START_HOLD_MINUTES,
    SAVED_HOLD_MINUTES: parkingStore.SAVED_HOLD_MINUTES,
  }), [version, ready, error, retryLoad]);

  if (!ready) {
    return (
      <div className="app-loading" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        {retrying ? 'מנסה שוב...' : 'טוען נתונים...'}
      </div>
    );
  }

  return (
    <ParkingContext.Provider value={value}>
      {error && (
        <div className="parking-data-error" role="alert">
          <p className="parking-data-error__text">{error}</p>
          <Button size="sm" variant="secondary" onClick={retryLoad} disabled={retrying}>
            {retrying ? 'מנסה...' : 'נסו שוב'}
          </Button>
        </div>
      )}
      {children}
    </ParkingContext.Provider>
  );
}

export function useParking() {
  const ctx = useContext(ParkingContext);
  if (!ctx) throw new Error('useParking must be used within ParkingProvider');
  return ctx;
}
