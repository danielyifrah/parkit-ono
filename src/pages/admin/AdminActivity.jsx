import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollText } from 'lucide-react';
import {
  fetchAdminActivityLog,
  formatActivityTime,
  getActionLabel,
} from '../../lib/auditLog';
import Icon from '../../components/ui/Icon';
import '../AdminDashboard.css';

const FILTERS = [
  { value: 'all', label: 'הכל' },
  { value: 'users', label: 'משתמשים', types: ['user_updated', 'user_role_changed', 'user_suspended', 'user_unsuspended'] },
  { value: 'parkings', label: 'חניות', types: ['parking_updated', 'parking_frozen', 'parking_unfrozen', 'parking_removed'] },
  { value: 'bookings', label: 'הזמנות', types: ['booking_cancelled', 'booking_refunded'] },
  { value: 'app', label: 'אפליקציה', types: ['app_disabled', 'app_enabled'] },
];

export default function AdminActivity() {
  const [allEntries, setAllEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [groupFilter, setGroupFilter] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchAdminActivityLog({ limit: 150, actionType: 'all' });
      setAllEntries(list);
      setError('');
    } catch {
      setError('שגיאה בטעינת יומן הפעולות');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const entries = useMemo(() => {
    const group = FILTERS.find((f) => f.value === groupFilter);
    if (!group?.types) return allEntries;
    return allEntries.filter((e) => group.types.includes(e.actionType));
  }, [allEntries, groupFilter]);

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <h1 className="admin-page__title">יומן פעולות</h1>
        <p className="admin-page__subtitle">
          מה קרה במערכת — בקצרה ובשפה פשוטה.
        </p>
      </header>

      <div className="admin-toolbar">
        <div className="admin-toolbar__filters">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              className={`admin-chip ${groupFilter === f.value ? 'admin-chip--active' : ''}`}
              onClick={() => setGroupFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="admin-page__muted">טוען יומן...</p>}
      {error && <p className="admin-page__error">{error}</p>}

      {!loading && !error && entries.length === 0 && (
        <div className="admin-activity-empty">
          <Icon icon={ScrollText} size={28} />
          <p>עדיין אין פעולות ביומן. פעולות ניהול יופיעו כאן אוטומטית.</p>
        </div>
      )}

      {!loading && !error && entries.length > 0 && (
        <ul className="admin-activity-list">
          {entries.map((entry) => (
            <li key={entry.id} className="admin-activity-item">
              <div className="admin-activity-item__meta">
                <span className="admin-activity-item__time">{formatActivityTime(entry.createdAt)}</span>
                <span className="admin-activity-item__type">{getActionLabel(entry.actionType)}</span>
              </div>
              <p className="admin-activity-item__summary">{entry.summary}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
