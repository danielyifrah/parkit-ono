import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useParking } from '../context/ParkingContext';

const LOCKED_PATHS = {
  saved: '/saved',
  active: '/active',
};

export default function BookingSessionGuard() {
  const { user } = useAuth();
  const location = useLocation();
  const {
    getSavedBookingByUserId,
    getActiveBookingByUserId,
    checkScheduledHoldsForUser,
    version,
  } = useParking();

  const userId = user?.id || '';

  useEffect(() => {
    if (!userId) return undefined;
    const tick = () => checkScheduledHoldsForUser(userId);
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [userId, checkScheduledHoldsForUser, version]);

  const activeBooking = getActiveBookingByUserId(userId);
  const savedBooking = getSavedBookingByUserId(userId);

  if (activeBooking && location.pathname !== LOCKED_PATHS.active) {
    return <Navigate to={LOCKED_PATHS.active} replace />;
  }

  if (!activeBooking && savedBooking && location.pathname !== LOCKED_PATHS.saved) {
    return <Navigate to={LOCKED_PATHS.saved} replace />;
  }

  return <Outlet />;
}
