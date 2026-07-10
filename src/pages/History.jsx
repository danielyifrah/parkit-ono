import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useParking } from '../context/ParkingContext';
import BookingCard from '../components/parking/BookingCard';
import './History.css';

const UPCOMING_STATUSES = ['scheduled', 'saved', 'pending_arrival'];

export default function History() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { getBookingsByUserId } = useParking();
  const bookings = getBookingsByUserId(user?.id || '');
  const upcomingBookings = bookings.filter((b) => UPCOMING_STATUSES.includes(b.status));
  const completedBookings = bookings.filter((b) => b.status === 'completed');

  return (
    <div className="page history-page">
      <section className="page-section">
        <h2 className="list-section-title">הזמנות קרובות</h2>
        {upcomingBookings.length > 0 ? (
          <div className="cards-grid">
            {upcomingBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onClick={() => navigate(`/history/${booking.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state card">
            <p>אין הזמנות קרובות</p>
          </div>
        )}
      </section>

      <section className="page-section">
        <h2 className="list-section-title">הזמנות שהסתיימו</h2>
        {completedBookings.length > 0 ? (
          <div className="cards-grid">
            {completedBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onClick={() => navigate(`/history/${booking.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state card">
            <p>אין הזמנות קודמות</p>
          </div>
        )}
      </section>
    </div>
  );
}
