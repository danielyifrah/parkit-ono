import { useCallback, useEffect, useMemo, useState } from 'react';
import { Ban, Pencil, Search, UserCheck } from 'lucide-react';
import { fetchAllProfiles, setUserSuspended, updateAdminProfile } from '../../lib/adminStore';
import { USER_ROLES } from '../../lib/roles';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input, { Select, Textarea } from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Icon from '../../components/ui/Icon';
import '../AdminDashboard.css';

const ROLE_LABELS = {
  [USER_ROLES.DRIVER]: 'נהג',
  [USER_ROLES.OWNER]: 'בעל חניה',
  [USER_ROLES.ADMIN]: 'מנהל',
};

const ROLE_FILTERS = [
  { value: 'all', label: 'הכל' },
  { value: USER_ROLES.DRIVER, label: 'נהגים' },
  { value: USER_ROLES.OWNER, label: 'בעלי חניה' },
  { value: USER_ROLES.ADMIN, label: 'מנהלים' },
  { value: 'suspended', label: 'מושעים' },
];

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: USER_ROLES.DRIVER });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [suspendTarget, setSuspendTarget] = useState(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [suspendWorking, setSuspendWorking] = useState(false);
  const [suspendError, setSuspendError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchAllProfiles();
      setProfiles(list);
      setError('');
    } catch {
      setError('שגיאה בטעינת משתמשים');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return profiles.filter((p) => {
      if (roleFilter === 'suspended') {
        if (!p.suspended) return false;
      } else if (roleFilter !== 'all' && p.role !== roleFilter) {
        return false;
      }
      if (!q) return true;
      return (
        p.name?.toLowerCase().includes(q)
        || p.email?.toLowerCase().includes(q)
        || p.phone?.includes(q)
      );
    });
  }, [profiles, query, roleFilter]);

  const openEdit = (profile) => {
    setEditing(profile);
    setForm({
      name: profile.name || '',
      email: profile.email || '',
      phone: profile.phone || '',
      role: profile.role || USER_ROLES.DRIVER,
    });
    setFormError('');
  };

  const handleSave = async () => {
    if (!editing) return;
    if (!form.name.trim()) {
      setFormError('יש להזין שם');
      return;
    }

    setSaving(true);
    setFormError('');
    const result = await updateAdminProfile(editing.id, {
      name: form.name,
      phone: form.phone,
      role: form.role,
    }, { actor: currentUser });
    setSaving(false);

    if (!result.ok) {
      setFormError(result.error || 'העדכון נכשל');
      return;
    }

    setProfiles((prev) => prev.map((p) => (p.id === editing.id ? { ...p, ...result.profile } : p)));
    setEditing(null);
  };

  const handleSuspendConfirm = async () => {
    if (!suspendTarget) return;
    setSuspendWorking(true);
    setSuspendError('');

    const nextSuspended = !suspendTarget.suspended;
    const result = await setUserSuspended(suspendTarget.id, {
      suspended: nextSuspended,
      reason: suspendReason,
      actor: currentUser,
    });

    setSuspendWorking(false);
    if (!result.ok) {
      setSuspendError(result.error || 'הפעולה נכשלה');
      return;
    }

    setProfiles((prev) => prev.map((p) => (p.id === suspendTarget.id ? { ...p, ...result.profile } : p)));
    setSuspendTarget(null);
    setSuspendReason('');
  };

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <h1 className="admin-page__title">ניהול משתמשים</h1>
        <p className="admin-page__subtitle">
          עריכת פרטים, שינוי תפקיד והשעיה. משתמש מושעה לא יכול להתחבר. פרטי אשראי אינם זמינים.
        </p>
      </header>

      <div className="admin-toolbar">
        <div className="admin-toolbar__search">
          <Input
            placeholder="חיפוש לפי שם, אימייל או טלפון"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            icon={<Icon icon={Search} size={16} />}
          />
        </div>
        <div className="admin-toolbar__filters">
          {ROLE_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              className={`admin-chip ${roleFilter === f.value ? 'admin-chip--active' : ''}`}
              onClick={() => setRoleFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="admin-page__muted">טוען משתמשים...</p>}
      {error && <p className="admin-page__error">{error}</p>}

      {!loading && !error && (
        <>
          <div className="admin-view--desktop">
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>שם</th>
                    <th>אימייל</th>
                    <th>טלפון</th>
                    <th>תפקיד</th>
                    <th>סטטוס</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((profile) => (
                    <tr key={profile.id} className={profile.suspended ? 'admin-table__row--muted' : ''}>
                      <td>
                        <div className="admin-table__name">
                          <strong>{profile.name}</strong>
                          {profile.id === currentUser?.id && (
                            <span className="admin-table__you">את/ה</span>
                          )}
                        </div>
                      </td>
                      <td>{profile.email}</td>
                      <td>{profile.phone || '—'}</td>
                      <td>
                        <span className={`admin-role admin-role--${profile.role}`}>
                          {ROLE_LABELS[profile.role] || profile.role}
                        </span>
                      </td>
                      <td>
                        {profile.suspended ? (
                          <span className="admin-status-pill admin-status-pill--danger">מושעה</span>
                        ) : (
                          <span className="admin-status-pill admin-status-pill--ok">פעיל</span>
                        )}
                      </td>
                      <td>
                        <div className="admin-table__actions">
                          <button
                            type="button"
                            className="admin-table__action"
                            onClick={() => openEdit(profile)}
                            aria-label={`עריכת ${profile.name}`}
                          >
                            <Icon icon={Pencil} size={16} />
                          </button>
                          {profile.role !== USER_ROLES.ADMIN && profile.id !== currentUser?.id && (
                            <button
                              type="button"
                              className="admin-table__action"
                              onClick={() => {
                                setSuspendTarget(profile);
                                setSuspendReason(profile.suspendedReason || '');
                                setSuspendError('');
                              }}
                              aria-label={profile.suspended ? `ביטול השעיה של ${profile.name}` : `השעיית ${profile.name}`}
                            >
                              <Icon icon={profile.suspended ? UserCheck : Ban} size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="admin-table__empty">לא נמצאו משתמשים</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="admin-view--mobile">
            <div className="admin-parking-list">
              {filtered.map((profile) => (
                <article
                  key={profile.id}
                  className={`admin-parking-card ${profile.suspended ? 'admin-table__row--muted' : ''}`}
                >
                  <div className="admin-parking-card__top">
                    <div>
                      <h3>
                        <span className="admin-table__name">
                          {profile.name}
                          {profile.id === currentUser?.id && (
                            <span className="admin-table__you">את/ה</span>
                          )}
                        </span>
                      </h3>
                      <p>{profile.email}</p>
                    </div>
                    {profile.suspended ? (
                      <span className="admin-status-pill admin-status-pill--danger">מושעה</span>
                    ) : (
                      <span className="admin-status-pill admin-status-pill--ok">פעיל</span>
                    )}
                  </div>
                  <dl className="admin-parking-card__meta">
                    <div>
                      <dt>טלפון</dt>
                      <dd>{profile.phone || '—'}</dd>
                    </div>
                    <div>
                      <dt>תפקיד</dt>
                      <dd>
                        <span className={`admin-role admin-role--${profile.role}`}>
                          {ROLE_LABELS[profile.role] || profile.role}
                        </span>
                      </dd>
                    </div>
                  </dl>
                  <div className="admin-parking-card__actions">
                    <Button size="sm" variant="secondary" onClick={() => openEdit(profile)}>
                      <Icon icon={Pencil} size={14} />
                      עריכה
                    </Button>
                    {profile.role !== USER_ROLES.ADMIN && profile.id !== currentUser?.id && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setSuspendTarget(profile);
                          setSuspendReason(profile.suspendedReason || '');
                          setSuspendError('');
                        }}
                      >
                        <Icon icon={profile.suspended ? UserCheck : Ban} size={14} />
                        {profile.suspended ? 'ביטול השעיה' : 'השעיה'}
                      </Button>
                    )}
                  </div>
                </article>
              ))}
              {filtered.length === 0 && (
                <p className="admin-page__muted">לא נמצאו משתמשים</p>
              )}
            </div>
          </div>
        </>
      )}

      <Modal
        title="עריכת משתמש"
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
            label="אימייל"
            type="email"
            value={form.email}
            disabled
          />
          <Input
            label="טלפון"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
          <Select
            label="תפקיד"
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            disabled={editing?.id === currentUser?.id}
          >
            {Object.entries(ROLE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
          {editing?.id === currentUser?.id && (
            <p className="admin-page__muted">לא ניתן לשנות את התפקיד של עצמך.</p>
          )}
          <p className="admin-page__muted">
            אימייל משמש להתחברות ולכן אינו ניתן לשינוי כאן. אמצעי תשלום אינם מוצגים.
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

      <Modal
        title={suspendTarget?.suspended ? 'ביטול השעיה' : 'השעיית משתמש'}
        isOpen={!!suspendTarget}
        onClose={() => !suspendWorking && setSuspendTarget(null)}
      >
        {suspendTarget && (
          <div className="admin-form">
            <p>
              {suspendTarget.suspended
                ? `לאפשר ל-${suspendTarget.name} להתחבר שוב לאפליקציה?`
                : `${suspendTarget.name} לא יוכל/תוכל להתחבר עד לביטול ההשעיה.`}
            </p>
            {!suspendTarget.suspended && (
              <Textarea
                label="סיבה (אופציונלי, ליומן הפעולות)"
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                rows={3}
              />
            )}
            {suspendError && <p className="admin-page__error">{suspendError}</p>}
            <div className="admin-form__actions">
              <Button variant="secondary" onClick={() => setSuspendTarget(null)} disabled={suspendWorking}>
                חזרה
              </Button>
              <Button onClick={handleSuspendConfirm} disabled={suspendWorking}>
                {suspendWorking
                  ? 'מעדכן...'
                  : (suspendTarget.suspended ? 'ביטול השעיה' : 'השעיה')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
