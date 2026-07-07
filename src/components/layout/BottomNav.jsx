import './BottomNav.css';
import { NavLink } from 'react-router-dom';
import { Home, Clock, User } from 'lucide-react';
import Icon from '../ui/Icon';

// סדר RTL: ימין → שמאל  |  בית | היסטוריה | פרופיל
const navItems = [
  { to: '/', label: 'בית', icon: Home, end: true },
  { to: '/history', label: 'היסטוריה', icon: Clock },
  { to: '/profile', label: 'פרופיל', icon: User },
];

export default function BottomNav() {
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
