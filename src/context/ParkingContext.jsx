import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as parkingStore from '../lib/parkingStore';

const ParkingContext = createContext(null);

export function ParkingProvider({ children }) {
  const [version, setVersion] = useState(0);

  useEffect(() => parkingStore.subscribe(() => setVersion((v) => v + 1)), []);

  const value = useMemo(() => ({
    version,
    getParkings: parkingStore.getParkings,
    getParkingById: parkingStore.getParkingById,
    getAvailableParkings: parkingStore.getAvailableParkings,
    getBookingsByUserId: parkingStore.getBookingsByUserId,
    getBookingById: parkingStore.getBookingById,
    getParkingsByOwnerId: parkingStore.getParkingsByOwnerId,
    getSavedBookingByUserId: parkingStore.getSavedBookingByUserId,
    getScheduledBookingByUserId: parkingStore.getScheduledBookingByUserId,
    getPendingArrivalBookingByUserId: parkingStore.getPendingArrivalBookingByUserId,
    getActiveBookingByUserId: parkingStore.getActiveBookingByUserId,
    getReservationConflicts: parkingStore.getReservationConflicts,
    isParkingOccupied: parkingStore.isParkingOccupied,
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
    HOLD_MINUTES: parkingStore.HOLD_MINUTES,
    PRE_START_HOLD_MINUTES: parkingStore.PRE_START_HOLD_MINUTES,
    SAVED_HOLD_MINUTES: parkingStore.SAVED_HOLD_MINUTES,
  }), [version]);

  return (
    <ParkingContext.Provider value={value}>
      {children}
    </ParkingContext.Provider>
  );
}

export function useParking() {
  const ctx = useContext(ParkingContext);
  if (!ctx) throw new Error('useParking must be used within ParkingProvider');
  return ctx;
}
