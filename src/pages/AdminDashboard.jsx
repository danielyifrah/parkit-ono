import { useNavigate } from 'react-router-dom';
import { ArrowRight, Shield, Users, MapPin, CalendarDays } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Icon from '../components/ui/Icon';
import './AdminDashboard.css';

const COMING_SOON = [
  {
    icon: Users,
    title: 'ניהול משתמשים',
    text: 'צפייה בתפקידים, שדרוג לבעל חניה, והשעיה — יגיע כאן.',
  },
  {
    icon: MapPin,
    title: 'ניהול חניות',
    text: 'כל החניות במערכת, כולל מוקפאות — אישור, עריכה והסרה.',
  },
  {
    icon: CalendarDays,
    title: 'הזמנות ותמיכה',
    text: 'סקירת הזמנות וטיפול בפניות — עם הרשאות מלאות ב־DB כבר מוכנות.',
  },
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="admin-dashboard">
      <header className="admin-dashboard__header">
        <button
          type="button"
          className="admin-dashboard__back"
          onClick={() => navigate('/profile')}
        >
          <Icon icon={ArrowRight} size={18} />
          חזרה לפרופיל
        </button>
        <div className="admin-dashboard__title-row">
          <span className="admin-dashboard__badge">
            <Icon icon={Shield} size={16} />
            מנהל מערכת
          </span>
          <h1 className="admin-dashboard__title">דשבורד ניהול</h1>
          <p className="admin-dashboard__subtitle">
            שלום {user?.name || 'מנהל'} — הרשאות הניהול ב־Supabase פעילות.
            ממשק הניהול המלא ייבנה כאן בהמשך.
          </p>
        </div>
      </header>

      <section className="admin-dashboard__section">
        <h2 className="admin-dashboard__section-title">בקרוב בממשק</h2>
        <ul className="admin-dashboard__list">
          {COMING_SOON.map((item) => (
            <li key={item.title} className="admin-dashboard__card">
              <span className="admin-dashboard__card-icon">
                <Icon icon={item.icon} size={20} />
              </span>
              <div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <div className="admin-dashboard__actions">
        <Button variant="secondary" onClick={() => navigate('/')}>
          חזרה לאפליקציה
        </Button>
      </div>
    </div>
  );
}
