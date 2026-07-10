import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, MapPin, Power, CalendarDays, ScrollText } from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';
import { useParking } from '../../context/ParkingContext';
import { useAppSettings } from '../../context/AppSettingsContext';
import { computeAdminStats, fetchAllProfiles } from '../../lib/adminStore';
import StatCard from '../../components/ui/StatCard';
import Icon from '../../components/ui/Icon';
import '../AdminDashboard.css';

export default function AdminOverview() {
  const { formatPrice } = useCurrency();
  const { getParkings, getBookings, version } = useParking();
  const { bookingsDisabled } = useAppSettings();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchAllProfiles()
      .then((list) => {
        if (active) {
          setProfiles(list);
          setError('');
        }
      })
      .catch(() => {
        if (active) setError('שגיאה בטעינת נתוני משתמשים');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(
    () => computeAdminStats({
      profiles,
      parkings: getParkings(),
      bookings: getBookings(),
    }),
    // version bumps when parkings/bookings change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [profiles, version],
  );

  if (loading) {
    return <p className="admin-page__muted">טוען סטטיסטיקות...</p>;
  }

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <h1 className="admin-page__title">סקירת מערכת</h1>
        <p className="admin-page__subtitle">
          תמונת מצב של משתמשים, חניות והזמנות באפליקציה.
        </p>
      </header>

      {error && <p className="admin-page__error">{error}</p>}

      <section className="admin-page__section">
        <h2 className="admin-page__section-title">משתמשים</h2>
        <div className="admin-stats-grid">
          <StatCard title="סה״כ רשומים" value={stats.users.total} />
          <StatCard title="נהגים" value={stats.users.drivers} variant="primary" />
          <StatCard title="בעלי חניה" value={stats.users.owners} />
          <StatCard
            title="מושעים"
            value={stats.users.suspended}
            subtitle={`${stats.users.admins} מנהלים`}
          />
        </div>
      </section>

      <section className="admin-page__section">
        <h2 className="admin-page__section-title">חניות</h2>
        <div className="admin-stats-grid">
          <StatCard
            title="סה״כ חניות"
            value={stats.parkings.total}
            subtitle={`${stats.parkings.active} פעילות · ${stats.parkings.frozen} מוקפאות`}
          />
          <StatCard title="פנויות כרגע" value={stats.parkings.availableNow} variant="primary" />
          <StatCard title="תפוסות כרגע" value={stats.parkings.occupiedNow} />
          <StatCard
            title="שמורות / לא בזמינות"
            value={stats.parkings.reservedNow + stats.parkings.unavailableNow}
            subtitle={`${stats.parkings.reservedNow} שמורות · ${stats.parkings.unavailableNow} לא בזמינות`}
          />
        </div>
      </section>

      <section className="admin-page__section">
        <h2 className="admin-page__section-title">הזמנות והכנסות</h2>
        <div className="admin-stats-grid">
          {Object.values(stats.bookings.periods).map((period) => (
            <StatCard
              key={period.label}
              title={period.label}
              value={period.count}
              subtitle={formatPrice(period.revenue)}
            />
          ))}
        </div>
        <div className="admin-stats-grid admin-stats-grid--tight">
          <StatCard title="הזמנות פעילות כרגע" value={stats.bookings.activeSessions} />
          <StatCard title="הושלמו" value={stats.bookings.completed} />
          <StatCard
            title="סה״כ מחזור (לא מבוטלות)"
            value={formatPrice(stats.bookings.totalRevenue)}
            variant="primary"
          />
        </div>
      </section>

      <section className="admin-page__section">
        <h2 className="admin-page__section-title">קיצורי דרך</h2>
        <div className="admin-shortcuts">
          <Link to="/admin/users" className="admin-shortcut">
            <Icon icon={Users} size={20} />
            משתמשים
          </Link>
          <Link to="/admin/parkings" className="admin-shortcut">
            <Icon icon={MapPin} size={20} />
            חניות
          </Link>
          <Link to="/admin/bookings" className="admin-shortcut">
            <Icon icon={CalendarDays} size={20} />
            הזמנות
          </Link>
          <Link to="/admin/activity" className="admin-shortcut">
            <Icon icon={ScrollText} size={20} />
            יומן פעולות
          </Link>
          <Link to="/admin/settings" className="admin-shortcut">
            <Icon icon={Power} size={20} />
            {bookingsDisabled ? 'ביטול השבתה' : 'השבתת אפליקציה'}
          </Link>
        </div>
      </section>
    </div>
  );
}
