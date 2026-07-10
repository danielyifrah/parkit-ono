import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pencil, Search, Snowflake, Sun, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useParking } from '../../context/ParkingContext';
import { useCurrency } from '../../context/CurrencyContext';
import { fetchAllProfiles, getAdminParkingsSnapshot } from '../../lib/adminStore';
import { AUDIT_ACTIONS, logAdminAction } from '../../lib/auditLog';
import { OWNER_PARKING_STATUS_META } from '../../lib/ownerParkingStatus';
import Button from '../../components/ui/Button';
import Input, { Select, Textarea } from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Icon from '../../components/ui/Icon';
import '../AdminDashboard.css';

const STATUS_FILTERS = [
  { value: 'all', label: 'הכל' },
  { value: 'available', label: 'פנויות' },
  { value: 'occupied', label: 'תפוסות' },
  { value: 'reserved', label: 'שמורות' },
  { value: 'unavailable', label: 'לא בזמינות' },
  { value: 'frozen', label: 'מוקפאות' },
];

export default function AdminParkings() {
  const { user: actor } = useAuth();
  const {
    version,
    updateParkingDetails,
    setParkingStatus,
    removeParking,
  } = useParking();
  const { formatPrice } = useCurrency();
  const [ownersById, setOwnersById] = useState({});
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '',
    address: '',
    spotNumber: '',
    pricePerHour: '',
    notes: '',
    listingStatus: 'active',
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    let active = true;
    fetchAllProfiles()
      .then((list) => {
        if (!active) return;
        setOwnersById(Object.fromEntries(list.map((p) => [p.id, p])));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const rows = useMemo(() => {
    void version;
    return getAdminParkingsSnapshot();
  }, [version]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(({ parking, displayStatus }) => {
      if (statusFilter !== 'all' && displayStatus !== statusFilter) return false;
      if (!q) return true;
      const owner = ownersById[parking.ownerId];
      return (
        parking.name?.toLowerCase().includes(q)
        || parking.address?.toLowerCase().includes(q)
        || owner?.name?.toLowerCase().includes(q)
        || owner?.email?.toLowerCase().includes(q)
      );
    });
  }, [rows, query, statusFilter, ownersById]);

  const openEdit = (parking) => {
    setEditing(parking);
    setForm({
      name: parking.name || '',
      address: parking.address || '',
      spotNumber: parking.spotNumber || '',
      pricePerHour: String(parking.pricePerHour ?? ''),
      notes: parking.notes || '',
      listingStatus: parking.status === 'inactive' ? 'inactive' : 'active',
    });
    setFormError('');
  };

  const handleSave = async () => {
    if (!editing) return;
    if (!form.name.trim() || !form.address.trim()) {
      setFormError('שם וכתובת הם שדות חובה');
      return;
    }

    setSaving(true);
    setFormError('');

    const updated = updateParkingDetails(editing.id, {
      name: form.name,
      address: form.address,
      spotNumber: form.spotNumber,
      pricePerHour: form.pricePerHour,
      notes: form.notes,
    }, { bypassAppDisabled: true });

    if (!updated) {
      setSaving(false);
      setFormError('עדכון החניה נכשל');
      return;
    }

    if (form.listingStatus !== editing.status) {
      setParkingStatus(editing.id, form.listingStatus, { bypassAppDisabled: true });
      await logAdminAction({
        actor,
        actionType: form.listingStatus === 'inactive'
          ? AUDIT_ACTIONS.parking_frozen.value
          : AUDIT_ACTIONS.parking_unfrozen.value,
        summary: form.listingStatus === 'inactive'
          ? `${actor?.name || 'מנהל'} הקפיא את החניה ${form.name.trim()}`
          : `${actor?.name || 'מנהל'} הפשיר את החניה ${form.name.trim()}`,
        entityType: 'parking',
        entityLabel: form.name.trim(),
      });
    } else {
      await logAdminAction({
        actor,
        actionType: AUDIT_ACTIONS.parking_updated.value,
        summary: `${actor?.name || 'מנהל'} עדכן את החניה ${form.name.trim()}`,
        entityType: 'parking',
        entityLabel: form.name.trim(),
      });
    }

    setSaving(false);
    setEditing(null);
  };

  const toggleFreeze = useCallback(async (parking) => {
    setActionError('');
    const next = parking.status === 'inactive' ? 'active' : 'inactive';
    const result = setParkingStatus(parking.id, next, { bypassAppDisabled: true });
    if (!result) {
      setActionError('עדכון סטטוס נכשל');
      return;
    }
    await logAdminAction({
      actor,
      actionType: next === 'inactive'
        ? AUDIT_ACTIONS.parking_frozen.value
        : AUDIT_ACTIONS.parking_unfrozen.value,
      summary: next === 'inactive'
        ? `${actor?.name || 'מנהל'} הקפיא את החניה ${parking.name}`
        : `${actor?.name || 'מנהל'} הפשיר את החניה ${parking.name}`,
      entityType: 'parking',
      entityLabel: parking.name,
    });
  }, [setParkingStatus, actor]);

  const handleRemove = useCallback(async (parking) => {
    if (!window.confirm(`להסיר את החניה "${parking.name}"? פעולה זו אינה הפיכה.`)) return;
    setActionError('');
    const result = removeParking(parking.id, { bypassAppDisabled: true });
    if (!result.ok) {
      setActionError(result.error || 'ההסרה נכשלה');
      return;
    }
    await logAdminAction({
      actor,
      actionType: AUDIT_ACTIONS.parking_removed.value,
      summary: `${actor?.name || 'מנהל'} הסיר את החניה ${parking.name}`,
      entityType: 'parking',
      entityLabel: parking.name,
    });
  }, [removeParking, actor]);

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <h1 className="admin-page__title">ניהול חניות</h1>
        <p className="admin-page__subtitle">
          צפייה ועריכה של כל החניות במערכת, כולל בעלים וסטטוס תפוסה.
        </p>
      </header>

      <div className="admin-toolbar">
        <div className="admin-toolbar__search">
          <Input
            placeholder="חיפוש לפי שם חניה, כתובת או בעלים"
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

      {actionError && <p className="admin-page__error">{actionError}</p>}

      <div className="admin-parking-list">
        {filtered.map(({ parking, displayStatus }) => {
          const meta = OWNER_PARKING_STATUS_META[displayStatus] || OWNER_PARKING_STATUS_META.unavailable;
          const owner = ownersById[parking.ownerId];
          return (
            <article key={parking.id} className="admin-parking-card">
              <div className="admin-parking-card__top">
                <div>
                  <h3>{parking.name}</h3>
                  <p>{parking.address}</p>
                </div>
                <span className={`badge ${meta.badgeClass}`}>{meta.label}</span>
              </div>
              <dl className="admin-parking-card__meta">
                <div>
                  <dt>בעלים</dt>
                  <dd>
                    {owner ? (
                      <>
                        <strong>{owner.name}</strong>
                        <span className="admin-page__muted"> · {owner.email}</span>
                      </>
                    ) : (
                      parking.ownerId
                    )}
                  </dd>
                </div>
                <div>
                  <dt>מחיר</dt>
                  <dd>{formatPrice(parking.pricePerHour)} / שעה</dd>
                </div>
                <div>
                  <dt>מס׳ מקום</dt>
                  <dd>{parking.spotNumber || '—'}</dd>
                </div>
                <div>
                  <dt>רישום</dt>
                  <dd>{parking.status === 'inactive' ? 'מוקפא' : 'פעיל'}</dd>
                </div>
              </dl>
              <div className="admin-parking-card__actions">
                <Button size="sm" variant="secondary" onClick={() => openEdit(parking)}>
                  <Icon icon={Pencil} size={14} />
                  עריכה
                </Button>
                <Button size="sm" variant="secondary" onClick={() => toggleFreeze(parking)}>
                  <Icon icon={parking.status === 'inactive' ? Sun : Snowflake} size={14} />
                  {parking.status === 'inactive' ? 'הפשרה' : 'הקפאה'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleRemove(parking)}>
                  <Icon icon={Trash2} size={14} />
                  הסרה
                </Button>
              </div>
            </article>
          );
        })}
        {filtered.length === 0 && (
          <p className="admin-page__muted">לא נמצאו חניות</p>
        )}
      </div>

      <Modal
        title="עריכת חניה"
        isOpen={!!editing}
        onClose={() => !saving && setEditing(null)}
      >
        <div className="admin-form">
          <Input
            label="שם"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <Input
            label="כתובת"
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
          />
          <Input
            label="מספר מקום"
            value={form.spotNumber}
            onChange={(e) => setForm((f) => ({ ...f, spotNumber: e.target.value }))}
          />
          <Input
            label="מחיר לשעה"
            type="number"
            min="1"
            value={form.pricePerHour}
            onChange={(e) => setForm((f) => ({ ...f, pricePerHour: e.target.value }))}
          />
          <Select
            label="סטטוס רישום"
            value={form.listingStatus}
            onChange={(e) => setForm((f) => ({ ...f, listingStatus: e.target.value }))}
          >
            <option value="active">פעילה / זמינה לרישום</option>
            <option value="inactive">מוקפאת (לא זמינה)</option>
          </Select>
          <Textarea
            label="הערות"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            rows={3}
          />
          <p className="admin-page__muted">
            תפוסה בפועל (תפוסה / שמורה / פנויה) נקבעת לפי הזמנות פעילות וזמינות שהגדיר הבעלים.
            הקפאה מסירה את החניה מהזמנות חדשות.
          </p>
          {formError && <p className="admin-page__error">{formError}</p>}
          <div className="admin-form__actions">
            <Button variant="secondary" onClick={() => setEditing(null)} disabled={saving}>
              ביטול
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'שומר...' : 'שמירה'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
