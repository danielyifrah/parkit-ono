import { useEffect, useMemo, useState } from 'react';
import { useCurrency } from '../../context/CurrencyContext';
import { useParking } from '../../context/ParkingContext';
import {
  BOOKING_STATUS_LABELS,
  computeAdminStats,
  fetchAllProfiles,
  getAdminParkingsSnapshot,
} from '../../lib/adminStore';
import { USER_ROLES } from '../../lib/roles';
import { OWNER_PARKING_STATUS_META } from '../../lib/ownerParkingStatus';
import StatCard from '../../components/ui/StatCard';
import Modal from '../../components/ui/Modal';
import '../AdminDashboard.css';

const ROLE_LABELS = {
  [USER_ROLES.DRIVER]: 'נהג',
  [USER_ROLES.OWNER]: 'בעל חניה',
  [USER_ROLES.ADMIN]: 'מנהל',
};

const OPEN_BOOKING_STATUSES = ['active', 'saved', 'pending_arrival', 'scheduled'];

function startOfLocalDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysAgo(n) {
  const d = startOfLocalDay();
  d.setDate(d.getDate() - n);
  return d;
}

function bookingCreatedAt(booking) {
  if (booking.createdAt) return new Date(booking.createdAt);
  if (booking.date) return new Date(`${booking.date}T00:00:00`);
  return null;
}

function filterBookingsSince(bookings, since) {
  return bookings.filter((b) => {
    if (b.status === 'cancelled') return false;
    const created = bookingCreatedAt(b);
    if (!created || Number.isNaN(created.getTime())) return false;
    return created >= since;
  });
}

function formatBookingWhen(booking) {
  if (!booking?.date) return '—';
  const [y, m, d] = booking.date.split('-');
  return `${d}/${m}/${y} · ${booking.startTime || ''}–${booking.endTime || ''}`;
}

function EmptyDrillList() {
  return <p className="admin-drill__empty">אין פריטים להצגה בקטגוריה זו.</p>;
}

function UserDrillList({ users }) {
  if (!users.length) return <EmptyDrillList />;
  return (
    <ul className="admin-drill__list">
      {users.map((user) => (
        <li key={user.id} className="admin-drill__item">
          <div className="admin-drill__item-main">
            <span className="admin-drill__item-title">{user.name || 'ללא שם'}</span>
            <span className="admin-drill__item-meta">
              {ROLE_LABELS[user.role] || user.role}
              {user.suspended ? ' · מושעה' : ''}
            </span>
          </div>
          <div className="admin-drill__item-side">
            <span className="admin-drill__item-meta">{user.email || '—'}</span>
            {user.phone && <span className="admin-drill__item-meta">{user.phone}</span>}
          </div>
        </li>
      ))}
    </ul>
  );
}

function ParkingDrillList({ rows, profilesById }) {
  if (!rows.length) return <EmptyDrillList />;
  return (
    <ul className="admin-drill__list">
      {rows.map(({ parking, displayStatus }) => {
        const owner = profilesById[parking.ownerId];
        const statusMeta = OWNER_PARKING_STATUS_META[displayStatus];
        return (
          <li key={parking.id} className="admin-drill__item">
            <div className="admin-drill__item-main">
              <span className="admin-drill__item-title">{parking.name || 'חניה'}</span>
              <span className="admin-drill__item-meta">{parking.address || '—'}</span>
              <span className="admin-drill__item-meta">
                בעלים: {owner?.name || 'לא ידוע'}
                {owner?.email ? ` · ${owner.email}` : ''}
              </span>
            </div>
            <div className="admin-drill__item-side">
              {statusMeta && (
                <span className={`badge ${statusMeta.badgeClass}`}>{statusMeta.label}</span>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function BookingDrillList({ bookings, profilesById, parkingsById, formatPrice }) {
  if (!bookings.length) return <EmptyDrillList />;
  return (
    <ul className="admin-drill__list">
      {bookings.map((booking) => {
        const driver = profilesById[booking.userId];
        const parking = parkingsById[booking.parkingId];
        const owner = parking ? profilesById[parking.ownerId] : null;
        return (
          <li key={booking.id} className="admin-drill__item">
            <div className="admin-drill__item-main">
              <span className="admin-drill__item-title">
                {parking?.name || parking?.address || 'חניה'}
              </span>
              <span className="admin-drill__item-meta">{formatBookingWhen(booking)}</span>
              <span className="admin-drill__item-meta">
                נהג: {driver?.name || 'לא ידוע'}
                {owner ? ` · בעלים: ${owner.name}` : ''}
              </span>
            </div>
            <div className="admin-drill__item-side">
              <span className="admin-drill__item-value">{formatPrice(booking.totalPrice || 0)}</span>
              <span className="badge badge--unavailable">
                {BOOKING_STATUS_LABELS[booking.status] || booking.status}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default function AdminOverview() {
  const { formatPrice } = useCurrency();
  const { getParkings, getBookings, version } = useParking();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeKey, setActiveKey] = useState(null);

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

  const parkings = useMemo(() => {
    void version;
    return getParkings();
  }, [version, getParkings]);

  const bookings = useMemo(() => {
    void version;
    return getBookings();
  }, [version, getBookings]);

  const stats = useMemo(
    () => computeAdminStats({ profiles, parkings, bookings }),
    [profiles, parkings, bookings],
  );

  const profilesById = useMemo(
    () => Object.fromEntries(profiles.map((p) => [p.id, p])),
    [profiles],
  );

  const parkingsById = useMemo(
    () => Object.fromEntries(parkings.map((p) => [p.id, p])),
    [parkings],
  );

  const parkingRows = useMemo(() => {
    void version;
    return getAdminParkingsSnapshot();
  }, [version]);

  const drilldown = useMemo(() => {
    if (!activeKey) return null;

    const parkingsByStatus = (statuses) =>
      parkingRows.filter(({ displayStatus }) => statuses.includes(displayStatus));

    const revenueBookings = bookings.filter(
      (b) => b.status !== 'cancelled'
        && ['completed', 'active', 'scheduled', 'saved', 'pending_arrival'].includes(b.status),
    );

    const map = {
      'users-all': {
        title: 'כל המשתמשים הרשומים',
        count: profiles.length,
        content: <UserDrillList users={profiles} />,
      },
      'users-drivers': {
        title: 'נהגים',
        count: profiles.filter((p) => p.role === USER_ROLES.DRIVER).length,
        content: <UserDrillList users={profiles.filter((p) => p.role === USER_ROLES.DRIVER)} />,
      },
      'users-owners': {
        title: 'בעלי חניה',
        count: profiles.filter((p) => p.role === USER_ROLES.OWNER).length,
        content: <UserDrillList users={profiles.filter((p) => p.role === USER_ROLES.OWNER)} />,
      },
      'users-suspended': {
        title: 'משתמשים מושעים',
        count: profiles.filter((p) => p.suspended).length,
        content: <UserDrillList users={profiles.filter((p) => p.suspended)} />,
      },
      'parkings-all': {
        title: 'כל החניות',
        count: parkingRows.length,
        content: <ParkingDrillList rows={parkingRows} profilesById={profilesById} />,
      },
      'parkings-available': {
        title: 'חניות פנויות כרגע',
        count: parkingsByStatus(['available']).length,
        content: (
          <ParkingDrillList
            rows={parkingsByStatus(['available'])}
            profilesById={profilesById}
          />
        ),
      },
      'parkings-occupied': {
        title: 'חניות תפוסות כרגע',
        count: parkingsByStatus(['occupied']).length,
        content: (
          <ParkingDrillList
            rows={parkingsByStatus(['occupied'])}
            profilesById={profilesById}
          />
        ),
      },
      'parkings-reserved-unavailable': {
        title: 'שמורות / לא בזמינות',
        count: parkingsByStatus(['reserved', 'unavailable']).length,
        content: (
          <ParkingDrillList
            rows={parkingsByStatus(['reserved', 'unavailable'])}
            profilesById={profilesById}
          />
        ),
      },
      'bookings-today': {
        title: 'הזמנות מהיום',
        count: filterBookingsSince(bookings, startOfLocalDay()).length,
        content: (
          <BookingDrillList
            bookings={filterBookingsSince(bookings, startOfLocalDay())}
            profilesById={profilesById}
            parkingsById={parkingsById}
            formatPrice={formatPrice}
          />
        ),
      },
      'bookings-week': {
        title: 'הזמנות בשבוע האחרון',
        count: filterBookingsSince(bookings, daysAgo(7)).length,
        content: (
          <BookingDrillList
            bookings={filterBookingsSince(bookings, daysAgo(7))}
            profilesById={profilesById}
            parkingsById={parkingsById}
            formatPrice={formatPrice}
          />
        ),
      },
      'bookings-month': {
        title: 'הזמנות בחודש האחרון',
        count: filterBookingsSince(bookings, daysAgo(30)).length,
        content: (
          <BookingDrillList
            bookings={filterBookingsSince(bookings, daysAgo(30))}
            profilesById={profilesById}
            parkingsById={parkingsById}
            formatPrice={formatPrice}
          />
        ),
      },
      'bookings-year': {
        title: 'הזמנות בשנה האחרונה',
        count: filterBookingsSince(bookings, daysAgo(365)).length,
        content: (
          <BookingDrillList
            bookings={filterBookingsSince(bookings, daysAgo(365))}
            profilesById={profilesById}
            parkingsById={parkingsById}
            formatPrice={formatPrice}
          />
        ),
      },
      'bookings-active': {
        title: 'הזמנות פעילות כרגע',
        count: bookings.filter((b) => OPEN_BOOKING_STATUSES.includes(b.status)).length,
        content: (
          <BookingDrillList
            bookings={bookings.filter((b) => OPEN_BOOKING_STATUSES.includes(b.status))}
            profilesById={profilesById}
            parkingsById={parkingsById}
            formatPrice={formatPrice}
          />
        ),
      },
      'bookings-completed': {
        title: 'הזמנות שהושלמו',
        count: bookings.filter((b) => b.status === 'completed').length,
        content: (
          <BookingDrillList
            bookings={bookings.filter((b) => b.status === 'completed')}
            profilesById={profilesById}
            parkingsById={parkingsById}
            formatPrice={formatPrice}
          />
        ),
      },
      'bookings-revenue': {
        title: 'הזמנות במחזור (לא מבוטלות)',
        count: revenueBookings.length,
        content: (
          <BookingDrillList
            bookings={revenueBookings}
            profilesById={profilesById}
            parkingsById={parkingsById}
            formatPrice={formatPrice}
          />
        ),
      },
    };

    return map[activeKey] || null;
  }, [activeKey, profiles, parkingRows, bookings, profilesById, parkingsById, formatPrice]);

  const openDrill = (key) => setActiveKey(key);
  const closeDrill = () => setActiveKey(null);

  if (loading) {
    return <p className="admin-page__muted">טוען סטטיסטיקות...</p>;
  }

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <h1 className="admin-page__title">סקירת מערכת</h1>
        <p className="admin-page__subtitle">
          תמונת מצב של משתמשים, חניות והזמנות באפליקציה. לחצו על קוביה כדי לראות את הרשימה המלאה.
        </p>
      </header>

      {error && <p className="admin-page__error">{error}</p>}

      <section className="admin-sector admin-sector--users">
        <div className="admin-sector__head">
          <h2 className="admin-sector__title">משתמשים</h2>
          <p className="admin-sector__hint">פילוח לפי תפקיד וסטטוס חשבון</p>
        </div>
        <div className="admin-stats-grid">
          <StatCard
            title="סה״כ רשומים"
            value={stats.users.total}
            onClick={() => openDrill('users-all')}
            active={activeKey === 'users-all'}
          />
          <StatCard
            title="נהגים"
            value={stats.users.drivers}
            onClick={() => openDrill('users-drivers')}
            active={activeKey === 'users-drivers'}
          />
          <StatCard
            title="בעלי חניה"
            value={stats.users.owners}
            onClick={() => openDrill('users-owners')}
            active={activeKey === 'users-owners'}
          />
          <StatCard
            title="מושעים"
            value={stats.users.suspended}
            subtitle={`${stats.users.admins} מנהלים במערכת`}
            onClick={() => openDrill('users-suspended')}
            active={activeKey === 'users-suspended'}
          />
        </div>
      </section>

      <section className="admin-sector admin-sector--parkings">
        <div className="admin-sector__head">
          <h2 className="admin-sector__title">חניות</h2>
          <p className="admin-sector__hint">מצב נוכחי של כל החניות במערכת</p>
        </div>
        <div className="admin-stats-grid">
          <StatCard
            title="סה״כ חניות"
            value={stats.parkings.total}
            subtitle={`${stats.parkings.active} פעילות · ${stats.parkings.frozen} מוקפאות`}
            onClick={() => openDrill('parkings-all')}
            active={activeKey === 'parkings-all'}
          />
          <StatCard
            title="פנויות כרגע"
            value={stats.parkings.availableNow}
            onClick={() => openDrill('parkings-available')}
            active={activeKey === 'parkings-available'}
          />
          <StatCard
            title="תפוסות כרגע"
            value={stats.parkings.occupiedNow}
            onClick={() => openDrill('parkings-occupied')}
            active={activeKey === 'parkings-occupied'}
          />
          <StatCard
            title="שמורות / לא בזמינות"
            value={stats.parkings.reservedNow + stats.parkings.unavailableNow}
            subtitle={`${stats.parkings.reservedNow} שמורות · ${stats.parkings.unavailableNow} לא בזמינות`}
            onClick={() => openDrill('parkings-reserved-unavailable')}
            active={activeKey === 'parkings-reserved-unavailable'}
          />
        </div>
      </section>

      <section className="admin-sector admin-sector--bookings">
        <div className="admin-sector__head">
          <h2 className="admin-sector__title">הזמנות והכנסות</h2>
          <p className="admin-sector__hint">נפח הזמנות ומחזור לפי תקופה</p>
        </div>
        <div className="admin-stats-grid">
          <StatCard
            title="היום"
            value={stats.bookings.periods.today.count}
            subtitle={formatPrice(stats.bookings.periods.today.revenue)}
            onClick={() => openDrill('bookings-today')}
            active={activeKey === 'bookings-today'}
          />
          <StatCard
            title="שבוע אחרון"
            value={stats.bookings.periods.week.count}
            subtitle={formatPrice(stats.bookings.periods.week.revenue)}
            onClick={() => openDrill('bookings-week')}
            active={activeKey === 'bookings-week'}
          />
          <StatCard
            title="חודש אחרון"
            value={stats.bookings.periods.month.count}
            subtitle={formatPrice(stats.bookings.periods.month.revenue)}
            onClick={() => openDrill('bookings-month')}
            active={activeKey === 'bookings-month'}
          />
          <StatCard
            title="שנה אחרונה"
            value={stats.bookings.periods.year.count}
            subtitle={formatPrice(stats.bookings.periods.year.revenue)}
            onClick={() => openDrill('bookings-year')}
            active={activeKey === 'bookings-year'}
          />
        </div>
        <div className="admin-stats-grid admin-stats-grid--tight admin-stats-grid--3">
          <StatCard
            title="הזמנות פעילות כרגע"
            value={stats.bookings.activeSessions}
            onClick={() => openDrill('bookings-active')}
            active={activeKey === 'bookings-active'}
          />
          <StatCard
            title="הושלמו"
            value={stats.bookings.completed}
            onClick={() => openDrill('bookings-completed')}
            active={activeKey === 'bookings-completed'}
          />
          <StatCard
            title="סה״כ מחזור (לא מבוטלות)"
            value={formatPrice(stats.bookings.totalRevenue)}
            onClick={() => openDrill('bookings-revenue')}
            active={activeKey === 'bookings-revenue'}
          />
        </div>
      </section>

      <Modal
        title={drilldown?.title || ''}
        isOpen={Boolean(drilldown)}
        onClose={closeDrill}
        className="admin-drill-modal"
      >
        {drilldown && (
          <>
            <p className="admin-drill__count">{drilldown.count} פריטים</p>
            {drilldown.content}
          </>
        )}
      </Modal>
    </div>
  );
}
