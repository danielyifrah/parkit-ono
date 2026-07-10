import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CircleDollarSign, Lock, Clock, CreditCard, LogOut,
  Pencil, ShieldCheck, Building2, ChevronLeft, User, Shield,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { useParking } from '../context/ParkingContext';
import { isAdmin, isOwner } from '../lib/roles';
import Button from '../components/ui/Button';
import Icon from '../components/ui/Icon';
import EditProfileModal from '../components/profile/EditProfileModal';
import SecurityModal from '../components/profile/SecurityModal';
import CurrencyModal from '../components/profile/CurrencyModal';
import './Profile.css';

const generalSettingsBase = [
  { icon: CircleDollarSign, title: 'מטבע', action: 'currency' },
  { icon: Lock, title: 'אבטחה וסיסמה', action: 'security' },
];

const accountActions = [
  { icon: Clock, title: 'היסטוריית חניות', path: '/history' },
  { icon: CreditCard, title: 'אמצעי תשלום', path: '/profile/payment-methods' },
  { icon: LogOut, title: 'התנתקות', danger: true },
];

export default function Profile() {
  const { user, logout } = useAuth();
  const { currencyMeta } = useCurrency();
  const { getBookingsByUserId } = useParking();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [securityOpen, setSecurityOpen] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const userBookings = getBookingsByUserId(user?.id || '');
  const stats = {
    savedParkings: userBookings.filter((b) => b.status === 'saved' || b.status === 'scheduled').length,
    completedParkings: userBookings.filter((b) => b.status === 'completed').length,
  };
  const showPartnerPortal = isOwner(user);
  const showAdminPortal = isAdmin(user);

  const generalSettings = (showAdminPortal
    ? generalSettingsBase.filter((item) => item.action === 'security')
    : generalSettingsBase
  ).map((item) => (
    item.action === 'currency'
      ? { ...item, subtitle: currencyMeta.label }
      : item
  ));

  const visibleAccountActions = showAdminPortal
    ? accountActions.filter((item) => item.danger)
    : accountActions;

  const handleAction = (item) => {
    if (item.danger) {
      logout();
      navigate('/login');
    } else if (item.path) {
      navigate(item.path);
    }
  };

  const handleSetting = (item) => {
    if (item.action === 'security') {
      setSecurityOpen(true);
    } else if (item.action === 'currency') {
      setCurrencyOpen(true);
    }
  };


  const contactLine = user?.phone || user?.email;

  return (
    <div className="page profile-page">
      <div className="profile-page__layout">
        <aside className="profile-page__aside">
          <div className="profile-card card">
            <div className="profile-card__top">
              <div className="profile-card__avatar">
                {user?.avatar ? (
                  <img src={user.avatar} alt="" className="profile-card__avatar-img" />
                ) : (
                  <Icon icon={User} size={32} className="app-icon--muted" />
                )}
              </div>
              <div className="profile-card__info">
                <h2 className="profile-card__name">{user?.name || 'משתמש'}</h2>
                <p className="profile-card__email">{contactLine}</p>
                {showAdminPortal && (
                  <span className="profile-card__role-badge">מנהל מערכת</span>
                )}
                {showPartnerPortal && (
                  <span className="profile-card__role-badge profile-card__role-badge--owner">בעל חניה</span>
                )}
                {!showAdminPortal && (
                  <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>
                    <Icon icon={Pencil} size={14} />
                    עריכת פרופיל
                  </Button>
                )}
              </div>
            </div>
            {!showAdminPortal && (
              <div className="profile-card__stats">
                <div className="profile-card__stat">
                  <span className="profile-card__stat-label">חניות שמורות</span>
                  <span className="profile-card__stat-value">{stats.savedParkings}</span>
                </div>
                <div className="profile-card__stat-divider" />
                <div className="profile-card__stat">
                  <span className="profile-card__stat-label">חניות שהושלמו</span>
                  <span className="profile-card__stat-value">{stats.completedParkings}</span>
                </div>
              </div>
            )}
          </div>

          <div className="profile-footer desktop-only">
            <p>
              <Icon icon={ShieldCheck} size={16} className="app-icon--success" />
              הפרטים שלכם מוצפנים ולא משותפים עם צד שלישי
            </p>
            <p className="profile-footer__version">PARKIT V. 2.4.0</p>
          </div>

          {showPartnerPortal && (
            <div className="profile-partner-link">
              <Button variant="ghost" onClick={() => navigate('/partner')}>
                <Icon icon={Building2} size={18} />
                כניסה לפורטל שותפים
              </Button>
            </div>
          )}

          {showAdminPortal && (
            <div className="profile-partner-link">
              <Button variant="ghost" onClick={() => navigate('/admin')}>
                <Icon icon={Shield} size={18} />
                כניסה לדשבורד ניהול
              </Button>
            </div>
          )}
        </aside>

        <div className="profile-page__main">
          <div className="profile-settings-col">
            <h3 className="settings-group-title">הגדרות כלליות</h3>
            <div className="settings-group card">
              {generalSettings.map((item) => (
                <button
                  key={item.title}
                  type="button"
                  className="settings-item"
                  onClick={() => handleSetting(item)}
                >
                  <span className="settings-item__icon">
                    <Icon icon={item.icon} size={18} className="app-icon--primary" />
                  </span>
                  <div className="settings-item__text">
                    <span>{item.title}</span>
                    {item.subtitle && <small>{item.subtitle}</small>}
                  </div>
                  <Icon icon={ChevronLeft} size={18} className="settings-item__arrow app-icon--muted" />
                </button>
              ))}
            </div>
          </div>

          <div className="profile-settings-col">
            <h3 className="settings-group-title">חשבון ופעולות</h3>
            <div className="settings-group card">
              {visibleAccountActions.map((item) => (
                <button
                  key={item.title}
                  type="button"
                  className={`settings-item ${item.danger ? 'settings-item--danger' : ''}`}
                  onClick={() => handleAction(item)}
                >
                  <span className={`settings-item__icon ${item.danger ? 'settings-item__icon--danger' : ''}`}>
                    <Icon icon={item.icon} size={18} className={item.danger ? 'app-icon--danger' : 'app-icon--primary'} />
                  </span>
                  <div className="settings-item__text">
                    <span>{item.title}</span>
                  </div>
                  {!item.danger && (
                    <Icon icon={ChevronLeft} size={18} className="settings-item__arrow app-icon--muted" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="profile-footer profile-footer--mobile-bottom mobile-only">
        <p>
          <Icon icon={ShieldCheck} size={16} className="app-icon--success" />
          הפרטים שלכם מוצפנים ולא משותפים עם צד שלישי
        </p>
        <p className="profile-footer__version">PARKIT V. 2.4.0</p>
      </div>

      <EditProfileModal isOpen={editOpen} onClose={() => setEditOpen(false)} />
      <SecurityModal isOpen={securityOpen} onClose={() => setSecurityOpen(false)} />
      <CurrencyModal isOpen={currencyOpen} onClose={() => setCurrencyOpen(false)} />
    </div>
  );
}
