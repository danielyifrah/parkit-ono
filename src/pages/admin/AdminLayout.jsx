import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, MapPin, Power, LogOut, Shield, CalendarDays, ScrollText, User,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppSettings } from '../../context/AppSettingsContext';
import Icon from '../../components/ui/Icon';
import '../AdminDashboard.css';

const NAV = [
  { to: '/admin', end: true, label: 'סקירה', icon: LayoutDashboard },
  { to: '/admin/users', label: 'משתמשים', icon: Users },
  { to: '/admin/parkings', label: 'חניות', icon: MapPin },
  { to: '/admin/bookings', label: 'הזמנות', icon: CalendarDays },
  { to: '/admin/activity', label: 'יומן', icon: ScrollText },
  { to: '/admin/settings', label: 'השבתה', icon: Power },
];

function NavItems({ onNavigate }) {
  return NAV.map((item) => (
    <NavLink
      key={item.to}
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        `admin-shell__nav-item ${isActive ? 'admin-shell__nav-item--active' : ''}`
      }
      onClick={onNavigate}
    >
      <Icon icon={item.icon} size={18} />
      <span>{item.label}</span>
    </NavLink>
  ));
}

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { bookingsDisabled } = useAppSettings();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="admin-shell">
      <aside className="admin-shell__sidebar" aria-label="תפריט ניהול">
        <div className="admin-shell__sidebar-brand">
          <span className="admin-shell__badge">
            <Icon icon={Shield} size={14} />
            מנהל
          </span>
          <strong className="admin-shell__logo">Parkit</strong>
          <p className="admin-shell__hello">שלום, {user?.name || 'מנהל'}</p>
        </div>

        <nav className="admin-shell__sidebar-nav">
          <NavItems />
        </nav>

        <div className="admin-shell__sidebar-footer">
          {bookingsDisabled && (
            <span className="admin-shell__alert admin-shell__alert--block">האפליקציה מושבתת</span>
          )}
          <button
            type="button"
            className="admin-shell__sidebar-link"
            onClick={() => navigate('/profile')}
          >
            <Icon icon={User} size={18} />
            החשבון שלי
          </button>
          <button
            type="button"
            className="admin-shell__sidebar-link admin-shell__sidebar-link--danger"
            onClick={handleLogout}
          >
            <Icon icon={LogOut} size={18} />
            התנתקות
          </button>
        </div>
      </aside>

      <div className="admin-shell__body">
        <header className="admin-shell__header">
          <div className="admin-shell__brand">
            <span className="admin-shell__badge">
              <Icon icon={Shield} size={14} />
              מנהל
            </span>
            <div>
              <strong className="admin-shell__logo">Parkit</strong>
              <p className="admin-shell__hello">שלום, {user?.name || 'מנהל'}</p>
            </div>
          </div>
          <div className="admin-shell__header-actions">
            {bookingsDisabled && (
              <span className="admin-shell__alert">האפליקציה מושבתת</span>
            )}
            <button
              type="button"
              className="admin-shell__icon-btn"
              onClick={() => navigate('/profile')}
              aria-label="החשבון שלי"
            >
              <Icon icon={User} size={18} />
            </button>
            <button
              type="button"
              className="admin-shell__icon-btn"
              onClick={handleLogout}
              aria-label="התנתקות"
            >
              <Icon icon={LogOut} size={18} />
            </button>
          </div>
        </header>

        {bookingsDisabled && (
          <div className="admin-shell__maintenance-note">
            מצב השבתה פעיל — משתמשים רואים הודעה ולא יכולים להזמין או לנהל חניות.
          </div>
        )}

        <nav className="admin-shell__nav" aria-label="ניווט ניהול">
          <NavItems />
        </nav>

        <main className="admin-shell__main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
