import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, LifeBuoy, User, Zap, ArrowUpDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useParking } from '../context/ParkingContext';
import { getOwnerStats } from '../data/mockData';
import StatCard from '../components/ui/StatCard';
import ParkingCard from '../components/parking/ParkingCard';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Icon from '../components/ui/Icon';
import './OwnerDashboard.css';

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getParkingsByOwnerId, updateParkingAvailability } = useParking();
  const parkings = getParkingsByOwnerId(user?.id || '');
  const baseStats = getOwnerStats(user?.id || '');
  const ownerStats = {
    ...baseStats,
    activeParkings: parkings.filter((p) => p.status === 'active').length,
    totalParkings: parkings.length,
  };
  const progress = Math.round((ownerStats.monthlyIncome / ownerStats.monthlyGoal) * 100);

  const [editParking, setEditParking] = useState(null);
  const [availabilityHours, setAvailabilityHours] = useState('');

  const openEdit = (parking) => {
    setEditParking(parking);
    setAvailabilityHours(parking.availabilityHours || '08:00 - 20:00');
  };

  const handleSaveAvailability = () => {
    if (!editParking) return;
    updateParkingAvailability(editParking.id, availabilityHours);
    setEditParking(null);
  };

  return (
    <div className="owner-dashboard">
      <header className="owner-dashboard__header">
        <Button size="sm" onClick={() => navigate('/partner/add')}>
          <Icon icon={Plus} size={16} className="app-icon--white" />
          הוסף חניה
        </Button>

        <div className="owner-dashboard__brand">
          <span className="owner-dashboard__logo">Parkit</span>
          <span className="owner-dashboard__subtitle">PARTNER PORTAL</span>
        </div>

        <div className="owner-dashboard__header-actions">
          <button type="button" className="owner-dashboard__header-btn" onClick={() => navigate('/support')}>
            <Icon icon={LifeBuoy} size={18} />
            <span>תמיכה</span>
          </button>
          <button type="button" className="owner-dashboard__header-btn" onClick={() => navigate('/profile')}>
            <Icon icon={User} size={18} />
          </button>
        </div>
      </header>

      <div className="owner-dashboard__content page">
        <section className="owner-dashboard__section">
          <div className="owner-dashboard__section-header">
            <h2 className="list-section-title">סקירה כללית</h2>
            <button type="button" className="owner-dashboard__view-all">הצג הכל</button>
          </div>
          <div className="stats-grid">
            <StatCard
              variant="primary"
              title="הכנסה היום"
              value={`₪${ownerStats.incomeToday}`}
              subtitle={`ממוצע: ₪${ownerStats.incomeTodayAvg}`}
            />
            <StatCard
              variant="dark"
              title="הזמנות היום"
              value={ownerStats.bookingsToday}
              subtitle={ownerStats.bookingsChange}
            />
            <StatCard
              title="חניות פעילות"
              value={ownerStats.activeParkings}
              subtitle={`מתוך ${ownerStats.totalParkings} סה"כ`}
            />
            <StatCard
              title="הכנסה החודש"
              value={`₪${ownerStats.monthlyIncome.toLocaleString()}`}
              progress={progress}
            />
          </div>
        </section>

        <section className="owner-dashboard__section">
          <div className="owner-dashboard__section-header">
            <h2 className="list-section-title">החניות שלי</h2>
            <Icon icon={ArrowUpDown} size={18} className="app-icon--muted" />
          </div>
          <div className="owner-dashboard__list">
            {parkings.map((parking) => (
              <ParkingCard
                key={parking.id}
                parking={parking}
                variant="owner"
                onEditDetails={openEdit}
              />
            ))}
          </div>
        </section>

        <div className="owner-dashboard__promo card">
          <div className="owner-dashboard__promo-icon">
            <Icon icon={Zap} size={22} className="app-icon--primary" />
          </div>
          <div>
            <h3>שפר את הביצועים שלך</h3>
            <p>תמונות ותיאורים טובים יותר מובילים ל-3x יותר הזמנות</p>
            <Button size="sm">שדרג עכשיו</Button>
          </div>
        </div>

        <div className="owner-dashboard__back">
          <Button variant="ghost" onClick={() => navigate('/')}>
            חזרה לאפליקציית הנהג
          </Button>
        </div>
      </div>

      <Modal
        title={`עדכון זמינות — ${editParking?.name || ''}`}
        isOpen={Boolean(editParking)}
        onClose={() => setEditParking(null)}
      >
        <Input
          label="שעות זמינות"
          placeholder="08:00 - 20:00"
          value={availabilityHours}
          onChange={(e) => setAvailabilityHours(e.target.value)}
        />
        <p className="form-hint" style={{ marginTop: 8 }}>
          השינוי ישפיע מיד על כל הנהגים באפליקציה.
        </p>
        <Button fullWidth onClick={handleSaveAvailability} style={{ marginTop: 16 }}>
          שמירה
        </Button>
      </Modal>
    </div>
  );
}
