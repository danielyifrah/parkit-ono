import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useParking } from '../context/ParkingContext';
import BookingCard from '../components/parking/BookingCard';
import './History.css';

export default function History() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { getBookingsByUserId } = useParking();
  const bookings = getBookingsByUserId(user?.id || '');
  const completedBookings = bookings.filter((b) => b.status === 'completed');

  return (
    <div className="page history-page">
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
