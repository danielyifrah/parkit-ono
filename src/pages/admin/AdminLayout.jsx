import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, MapPin, Power, LogOut, Shield, CalendarDays, ScrollText,
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
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `admin-shell__nav-item ${isActive ? 'admin-shell__nav-item--active' : ''}`
            }
          >
            <Icon icon={item.icon} size={18} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <main className="admin-shell__main">
        <Outlet />
      </main>
    </div>
  );
}
