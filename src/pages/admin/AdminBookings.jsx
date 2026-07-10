import { useCallback, useEffect, useMemo, useState } from 'react';
import { Ban, RotateCcw, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import { useParking } from '../../context/ParkingContext';
import {
  BOOKING_STATUS_LABELS,
  fetchAllProfiles,
} from '../../lib/adminStore';
import { AUDIT_ACTIONS, logAdminAction } from '../../lib/auditLog';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Icon from '../../components/ui/Icon';
import '../AdminDashboard.css';

const STATUS_FILTERS = [
  { value: 'all', label: 'הכל' },
  { value: 'open', label: 'פתוחות' },
  { value: 'completed', label: 'הושלמו' },
  { value: 'cancelled', label: 'בוטלו' },
];

const OPEN_STATUSES = ['scheduled', 'saved', 'pending_arrival', 'active'];

function formatBookingWhen(booking) {
  if (!booking?.date) return '—';
  const [y, m, d] = booking.date.split('-');
  return `${d}/${m}/${y} · ${booking.startTime || ''}–${booking.endTime || ''}`;
}

export default function AdminBookings() {
  const { user: actor } = useAuth();
  const { formatPrice } = useCurrency();
  const {
    version,
    getBookings,
    getParkingById,
    adminCancelBooking,
    adminRefundBooking,
  } = useParking();
  const [profilesById, setProfilesById] = useState({});
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('open');
  const [confirmAction, setConfirmAction] = useState(null);
  const [working, setWorking] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionOk, setActionOk] = useState('');

  useEffect(() => {
    let active = true;
    fetchAllProfiles()
      .then((list) => {
        if (active) setProfilesById(Object.fromEntries(list.map((p) => [p.id, p])));
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const bookings = useMemo(() => {
    void version;
    return [...getBookings()].sort((a, b) => {
      const aTime = new Date(a.createdAt || a.date || 0).getTime();
      const bTime = new Date(b.createdAt || b.date || 0).getTime();
      return bTime - aTime;
    });
  }, [version, getBookings]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bookings.filter((booking) => {
      if (statusFilter === 'open' && !OPEN_STATUSES.includes(booking.status)) return false;
      if (statusFilter === 'completed' && booking.status !== 'completed') return false;
      if (statusFilter === 'cancelled' && booking.status !== 'cancelled') return false;

      if (!q) return true;
      const parking = getParkingById(booking.parkingId);
      const driver = profilesById[booking.userId];
      return (
        parking?.name?.toLowerCase().includes(q)
        || parking?.address?.toLowerCase().includes(q)
        || driver?.name?.toLowerCase().includes(q)
        || driver?.email?.toLowerCase().includes(q)
        || booking.id?.toLowerCase().includes(q)
      );
    });
  }, [bookings, statusFilter, query, getParkingById, profilesById]);

  const openConfirm = (type, booking) => {
    setActionError('');
    setActionOk('');
    setConfirmAction({ type, booking });
  };

  const runAction = useCallback(async () => {
    if (!confirmAction) return;
    const { type, booking } = confirmAction;
    const parking = getParkingById(booking.parkingId);
    const driver = profilesById[booking.userId];
    const parkingLabel = parking?.name || 'חניה';
    const driverLabel = driver?.name || 'נהג';

    setWorking(true);
    setActionError('');

    if (type === 'cancel') {
      const result = adminCancelBooking(booking.id);
      if (!result.ok) {
        setWorking(false);
        setActionError(result.error || 'הביטול נכשל');
        return;
      }
      await logAdminAction({
        actor,
        actionType: AUDIT_ACTIONS.booking_cancelled.value,
        summary: `${actor?.name || 'מנהל'} ביטל הזמנה של ${driverLabel} ב${parkingLabel} (כולל החזר)`,
        entityType: 'booking',
        entityLabel: parkingLabel,
      });
      setActionOk('ההזמנה בוטלה והוחזר התשלום.');
    } else if (type === 'refund') {
      const result = adminRefundBooking(booking.id);
      if (!result.ok) {
        setWorking(false);
        setActionError(result.error || 'ההחזר נכשל');
        return;
      }
      await logAdminAction({
        actor,
        actionType: AUDIT_ACTIONS.booking_refunded.value,
        summary: `${actor?.name || 'מנהל'} סימן החזר מלא להזמנה של ${driverLabel} ב${parkingLabel} (${formatPrice(booking.totalPrice)})`,
        entityType: 'booking',
        entityLabel: parkingLabel,
      });
      setActionOk('סומן החזר מלא להזמנה.');
    }

    setWorking(false);
    setConfirmAction(null);
  }, [confirmAction, adminCancelBooking, adminRefundBooking, actor, getParkingById, profilesById, formatPrice]);

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <h1 className="admin-page__title">ניהול הזמנות</h1>
        <p className="admin-page__subtitle">
          צפייה בהזמנות, ביטול ידני והחזרים. ביטול של הזמנה פתוחה כולל החזר מלא.
        </p>
      </header>

      <div className="admin-toolbar">
        <div className="admin-toolbar__search">
          <Input
            placeholder="חיפוש לפי חניה, נהג או מזהה"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            icon={<Icon icon={Search} size={16} />}
          />
        </div>
        <div className="admin-toolbar__filters">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              className={`admin-chip ${statusFilter === f.value ? 'admin-chip--active' : ''}`}
              onClick={() => setStatusFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {actionOk && <p className="admin-page__success">{actionOk}</p>}
      {actionError && !confirmAction && <p className="admin-page__error">{actionError}</p>}

      <div className="admin-booking-list">
        {filtered.map((booking) => {
          const parking = getParkingById(booking.parkingId);
          const driver = profilesById[booking.userId];
          const canCancel = OPEN_STATUSES.includes(booking.status);
          const canRefund = ['completed', 'cancelled'].includes(booking.status) && !booking.refunded;

          return (
            <article key={booking.id} className="admin-booking-card">
              <div className="admin-booking-card__top">
                <div>
                  <h3>{parking?.name || 'חניה'}</h3>
                  <p>{parking?.address || booking.parkingId}</p>
                </div>
                <div className="admin-booking-card__badges">
                  <span className={`admin-booking-status admin-booking-status--${booking.status}`}>
                    {BOOKING_STATUS_LABELS[booking.status] || booking.status}
                  </span>
                  {booking.refunded && (
                    <span className="admin-booking-status admin-booking-status--refunded">הוחזר</span>
                  )}
                </div>
              </div>

              <dl className="admin-parking-card__meta">
                <div>
                  <dt>נהג</dt>
                  <dd>
                    {driver ? (
                      <>
                        <strong>{driver.name}</strong>
                        <span className="admin-page__muted"> · {driver.email}</span>
                      </>
                    ) : (booking.userId || '—')}
                  </dd>
                </div>
                <div>
                  <dt>מועד</dt>
                  <dd>{formatBookingWhen(booking)}</dd>
                </div>
                <div>
                  <dt>סכום</dt>
                  <dd>{formatPrice(booking.totalPrice || 0)}</dd>
                </div>
                <div>
                  <dt>תשלום</dt>
                  <dd>{booking.paymentMethod || '—'}</dd>
                </div>
              </dl>

              <div className="admin-parking-card__actions">
                {canCancel && (
                  <Button size="sm" variant="secondary" onClick={() => openConfirm('cancel', booking)}>
                    <Icon icon={Ban} size={14} />
                    ביטול + החזר
                  </Button>
                )}
                {canRefund && (
                  <Button size="sm" variant="secondary" onClick={() => openConfirm('refund', booking)}>
                    <Icon icon={RotateCcw} size={14} />
                    סימון החזר
                  </Button>
                )}
                {!canCancel && !canRefund && (
                  <span className="admin-page__muted">אין פעולות זמינות</span>
                )}
              </div>
            </article>
          );
        })}
        {filtered.length === 0 && (
          <p className="admin-page__muted">לא נמצאו הזמנות</p>
        )}
      </div>

      <Modal
        title={confirmAction?.type === 'refund' ? 'סימון החזר' : 'ביטול הזמנה'}
        isOpen={!!confirmAction}
        onClose={() => !working && setConfirmAction(null)}
      >
        {confirmAction && (
          <div className="admin-form">
            <p>
              {confirmAction.type === 'cancel'
                ? 'לבטל את ההזמנה ולסמן החזר מלא לנהג? החניה תתפנה מיד.'
                : `לסמן החזר מלא בסך ${formatPrice(confirmAction.booking.totalPrice || 0)}?`}
            </p>
            {actionError && <p className="admin-page__error">{actionError}</p>}
            <div className="admin-form__actions">
              <Button variant="secondary" onClick={() => setConfirmAction(null)} disabled={working}>
                חזרה
              </Button>
              <Button onClick={runAction} disabled={working}>
                {working ? 'מבצע...' : 'אישור'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
