import './BottomNav.css';
import { NavLink } from 'react-router-dom';
import { Home, Clock, User, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { isAdmin } from '../../lib/roles';
import Icon from '../ui/Icon';

const driverNavItems = [
  { to: '/', label: 'בית', icon: Home, end: true },
  { to: '/history', label: 'היסטוריה', icon: Clock },
  { to: '/profile', label: 'פרופיל', icon: User },
];

const adminNavItems = [
  { to: '/admin', label: 'ניהול', icon: Shield, end: false },
  { to: '/profile', label: 'חשבון', icon: User },
];

export default function BottomNav() {
  const { user } = useAuth();
  const navItems = isAdmin(user) ? adminNavItems : driverNavItems;

  return (
    <nav className="bottom-nav" aria-label="ניווט ראשי">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            `bottom-nav__item ${isActive ? 'bottom-nav__item--active' : ''}`
          }
        >
          <Icon icon={item.icon} size={22} />
          <span className="bottom-nav__label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
