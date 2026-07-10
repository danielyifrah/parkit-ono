import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, LifeBuoy, User, Zap, ArrowUpDown, ArrowUp, ArrowDown, Download, FileText, Settings, Snowflake, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { useParking } from '../context/ParkingContext';
import { getOwnerStats } from '../data/mockData';
import { toLocalDateStr } from '../lib/bookingPricing';
import { formatDisplayDate, getDayName, getSchedulesForDate, normalizeTime } from '../lib/availability';
import {
  validateAvailabilityDayPlans,
  validateOwnerParkingSettings,
} from '../lib/parkingFormValidation';
import StatCard from '../components/ui/StatCard';
import ParkingCard from '../components/parking/ParkingCard';
import OwnerWeeklySchedule from '../components/owner/OwnerWeeklySchedule';
import Button from '../components/ui/Button';
import Input, { Select, Textarea } from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Icon from '../components/ui/Icon';
import './OwnerDashboard.css';

const COMMISSION_RATE = 0.15;
const RANGE_OPTIONS = [
  { value: 7, label: '7 ימים אחרונים' },
  { value: 30, label: 'חודש אחרון' },
  { value: 180, label: 'חצי שנה אחרונה' },
  { value: 365, label: 'שנה אחרונה' },
];
const DEFAULT_SLOT = { start: '08:00', end: '20:00' };

const STATUS_SORT_ORDER = {
  occupied: 0,
  reserved: 1,
  available: 2,
  unavailable: 3,
  frozen: 4,
};

function getStatusSortRank(parking, getOwnerParkingDisplayStatus) {
  const status = getOwnerParkingDisplayStatus(parking.id)?.status || 'available';
  return STATUS_SORT_ORDER[status] ?? STATUS_SORT_ORDER.available;
}

function normalizeTimeValue(value) {
  return normalizeTime(value || '00:00');
}

function readImageAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('שגיאה בקריאת קובץ התמונה'));
    reader.readAsDataURL(file);
  });
}

function getRelativeDayLabel(index) {
  if (index === 0) return 'היום';
  if (index === 1) return 'מחר';
  return null;
}

function buildUpcomingAvailabilityEditor(parking, days = 7) {
  const result = [];
  const today = new Date();

  for (let i = 0; i < days; i += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateStr = toLocalDateStr(date);
    const slots = getSchedulesForDate(parking, dateStr).map((slot) => ({
      start: normalizeTimeValue(slot.start),
      end: normalizeTimeValue(slot.end),
    }));

    result.push({
      date: dateStr,
      dayName: getDayName(dateStr),
      relativeLabel: getRelativeDayLabel(i),
      enabled: slots.length > 0,
      slots: slots.length > 0 ? slots : [{ ...DEFAULT_SLOT }],
    });
  }

  return result;
}

function getParkingPerformance(parking, days) {
  const grossIncome = (parking.incomeToday || 0) * days;
  const netIncome = grossIncome * (1 - COMMISSION_RATE);
  const totalBookings = Math.round((parking.bookingsToday || 0) * days);
  const repeatRate = Math.min(0.8, 0.35 + (parking.rating || 0) * 0.08);
  const returningBookers = Math.round(totalBookings * repeatRate);
  const uniqueBookers = Math.max(0, totalBookings - returningBookers);

  return {
    grossIncome,
    netIncome,
    totalBookings,
    avgMonthlyBookings: Math.round((totalBookings / days) * 30),
    avgMonthlyNetIncome: Math.round((netIncome / days) * 30),
    uniqueBookers,
    returningBookers,
    occupancyRate: Math.min(98, Math.round((totalBookings / Math.max(days * 6, 1)) * 100)),
  };
}

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const {
    getParkingsByOwnerId,
    getOwnerParkingDisplayStatus,
    updateParkingUpcomingAvailability,
    updateParkingDetails,
    setParkingStatus,
    removeParking,
  } = useParking();
  const parkings = getParkingsByOwnerId(user?.id || '');
  const baseStats = getOwnerStats(user?.id || '');
  const ownerStats = {
    ...baseStats,
    activeParkings: parkings.filter((p) => p.status === 'active').length,
    totalParkings: parkings.length,
  };
  const progress = Math.round((ownerStats.monthlyIncome / ownerStats.monthlyGoal) * 100);

  const [sortDirection, setSortDirection] = useState('desc');
  const [reportsRange, setReportsRange] = useState(30);
  const [parkingPerformanceTarget, setParkingPerformanceTarget] = useState(null);
  const [settingsParking, setSettingsParking] = useState(null);
  const [availabilityParking, setAvailabilityParking] = useState(null);
  const [settingsForm, setSettingsForm] = useState({
    image: '',
    name: '',
    address: '',
    spotNumber: '',
    pricePerHour: '',
    notes: '',
  });
  const [availabilityDays, setAvailabilityDays] = useState([]);
  const [isGlobalReportsOpen, setIsGlobalReportsOpen] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [availabilityError, setAvailabilityError] = useState('');
  const [availabilitySaving, setAvailabilitySaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  const sortedParkings = useMemo(() => (
    [...parkings].sort((a, b) => {
      const statusSort = getStatusSortRank(a, getOwnerParkingDisplayStatus)
        - getStatusSortRank(b, getOwnerParkingDisplayStatus);
      if (statusSort !== 0) return statusSort;
      const incomeSort = sortDirection === 'asc'
        ? a.incomeToday - b.incomeToday
        : b.incomeToday - a.incomeToday;
      if (incomeSort !== 0) return incomeSort;
      return a.name.localeCompare(b.name, 'he');
    })
  ), [parkings, sortDirection, getOwnerParkingDisplayStatus]);

  const ownerPerformance = useMemo(() => {
    return sortedParkings.reduce((acc, parking) => {
      const stats = getParkingPerformance(parking, reportsRange);
      return {
        grossIncome: acc.grossIncome + stats.grossIncome,
        netIncome: acc.netIncome + stats.netIncome,
        totalBookings: acc.totalBookings + stats.totalBookings,
        uniqueBookers: acc.uniqueBookers + stats.uniqueBookers,
        returningBookers: acc.returningBookers + stats.returningBookers,
      };
    }, {
      grossIncome: 0,
      netIncome: 0,
      totalBookings: 0,
      uniqueBookers: 0,
      returningBookers: 0,
    });
  }, [reportsRange, sortedParkings]);

  const openSettings = (parking) => {
    setSettingsParking(parking);
    setSettingsError('');
    setSettingsForm({
      image: parking.image || '',
      name: parking.name || '',
      address: parking.address || '',
      spotNumber: parking.spotNumber || '',
      pricePerHour: String(parking.pricePerHour ?? ''),
      notes: parking.notes || '',
    });
  };

  const openAvailabilityEditor = (parking) => {
    setAvailabilityParking(parking);
    setAvailabilityError('');
    setAvailabilityDays(buildUpcomingAvailabilityEditor(parking));
  };

  const handleSaveSettings = async () => {
    if (!settingsParking || settingsSaving) return;

    const validationError = validateOwnerParkingSettings(settingsForm);
    if (validationError) {
      setSettingsError(validationError);
      return;
    }

    setSettingsError('');
    setSettingsSaving(true);
    await new Promise((r) => setTimeout(r, 300));

    updateParkingDetails(settingsParking.id, {
      ...settingsForm,
      name: settingsForm.name.trim(),
      address: settingsForm.address.trim(),
      spotNumber: settingsForm.spotNumber.trim(),
      notes: settingsForm.notes.trim(),
    });

    setSettingsSaving(false);
    setSettingsParking(null);
  };

  const handleSaveAvailability = async () => {
    if (!availabilityParking || availabilitySaving) return;

    const validationError = validateAvailabilityDayPlans(availabilityDays);
    if (validationError) {
      setAvailabilityError(validationError);
      return;
    }

    setAvailabilityError('');
    setAvailabilitySaving(true);
    await new Promise((r) => setTimeout(r, 300));

    updateParkingUpcomingAvailability(availabilityParking.id, availabilityDays);

    setAvailabilitySaving(false);
    setAvailabilityParking(null);
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setSettingsError('יש לבחור קובץ תמונה');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setSettingsError('גודל התמונה המקסימלי הוא 2MB');
      return;
    }

    setSettingsError('');
    setImageUploading(true);

    try {
      const dataUrl = await readImageAsDataUrl(file);
      setSettingsForm((prev) => ({ ...prev, image: dataUrl }));
    } catch {
      setSettingsError('שגיאה בהעלאת התמונה');
    } finally {
      setImageUploading(false);
    }
  };

  const updateDayPlan = (date, updater) => {
    setAvailabilityDays((prev) => prev.map((day) => (
      day.date === date ? updater(day) : day
    )));
  };

  const toggleDayEnabled = (date, enabled) => {
    updateDayPlan(date, (day) => ({
      ...day,
      enabled,
      slots: day.slots.length > 0 ? day.slots : [{ ...DEFAULT_SLOT }],
    }));
  };

  const addAvailabilitySlot = (date) => {
    updateDayPlan(date, (day) => ({
      ...day,
      enabled: true,
      slots: [...day.slots, { start: '18:00', end: '20:00' }],
    }));
  };

  const updateAvailabilitySlot = (date, index, field, value) => {
    updateDayPlan(date, (day) => ({
      ...day,
      slots: day.slots.map((slot, slotIndex) => (
        slotIndex === index ? { ...slot, [field]: normalizeTimeValue(value) } : slot
      )),
    }));
  };

  const removeAvailabilitySlot = (date, index) => {
    updateDayPlan(date, (day) => {
      const nextSlots = day.slots.filter((_, slotIndex) => slotIndex !== index);
      return {
        ...day,
        slots: nextSlots.length > 0 ? nextSlots : [{ ...DEFAULT_SLOT }],
        enabled: nextSlots.length > 0 ? day.enabled : false,
      };
    });
  };

  const handleToggleFreeze = () => {
    if (!settingsParking) return;
    const nextStatus = settingsParking.status === 'active' ? 'inactive' : 'active';
    setParkingStatus(settingsParking.id, nextStatus);
    setSettingsParking(null);
  };

  const handleRemoveParking = () => {
    if (!settingsParking) return;
    const shouldDelete = window.confirm(`להסיר את "${settingsParking.name}"? לא ניתן לבטל פעולה זו.`);
    if (!shouldDelete) return;

    const result = removeParking(settingsParking.id);
    if (result.ok) {
      setSettingsParking(null);
      setSettingsError('');
    } else {
      setSettingsError(result.error || 'לא ניתן להסיר את החניה');
    }
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
            <button
              type="button"
              className="owner-dashboard__view-all"
              onClick={() => setIsGlobalReportsOpen(true)}
            >
              דו&quot;חות וביצועים
            </button>
          </div>
          <div className="stats-grid">
            <StatCard
              variant="primary"
              title="הכנסה היום"
              value={formatPrice(ownerStats.incomeToday)}
              subtitle={`ממוצע: ${formatPrice(ownerStats.incomeTodayAvg)}`}
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
              value={formatPrice(ownerStats.monthlyIncome)}
              progress={progress}
            />
          </div>
        </section>

        {parkings.length > 0 && (
          <OwnerWeeklySchedule
            parkings={sortedParkings}
            ownerId={user?.id || ''}
          />
        )}

        <section className="owner-dashboard__section">
          <div className="owner-dashboard__section-header">
            <h2 className="list-section-title">החניות שלי</h2>
            <div className="owner-dashboard__sort">
              <Icon icon={ArrowUpDown} size={18} className="app-icon--muted" />
              <button
                type="button"
                className={`owner-dashboard__sort-btn ${sortDirection === 'desc' ? 'owner-dashboard__sort-btn--active' : ''}`}
                onClick={() => setSortDirection('desc')}
                aria-label="מיון הכנסה מהגבוה לנמוך"
              >
                <Icon icon={ArrowDown} size={14} />
              </button>
              <button
                type="button"
                className={`owner-dashboard__sort-btn ${sortDirection === 'asc' ? 'owner-dashboard__sort-btn--active' : ''}`}
                onClick={() => setSortDirection('asc')}
                aria-label="מיון הכנסה מהנמוך לגבוה"
              >
                <Icon icon={ArrowUp} size={14} />
              </button>
            </div>
          </div>
          <div className="owner-dashboard__list">
            {sortedParkings.map((parking) => (
              <ParkingCard
                key={parking.id}
                parking={parking}
                variant="owner"
                onEditDetails={openAvailabilityEditor}
                onOpenSettings={openSettings}
                onViewPerformance={setParkingPerformanceTarget}
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

      <Modal title="דו&quot;חות וביצועים - כלל החניות" isOpen={isGlobalReportsOpen} onClose={() => setIsGlobalReportsOpen(false)}>
        <Select
          label="טווח זמן"
          value={reportsRange}
          onChange={(e) => setReportsRange(Number(e.target.value))}
        >
          {RANGE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </Select>
        <div className="owner-dashboard__report-grid">
          <div className="owner-dashboard__report-card">
            <span>הכנסות ברוטו</span>
            <strong>{formatPrice(Math.round(ownerPerformance.grossIncome))}</strong>
          </div>
          <div className="owner-dashboard__report-card">
            <span>רווח נטו (לאחר 15% עמלה)</span>
            <strong>{formatPrice(Math.round(ownerPerformance.netIncome))}</strong>
          </div>
          <div className="owner-dashboard__report-card">
            <span>סה&quot;כ הזמנות</span>
            <strong>{ownerPerformance.totalBookings.toLocaleString()}</strong>
          </div>
          <div className="owner-dashboard__report-card">
            <span>מזמינים שונים / חוזרים</span>
            <strong>{ownerPerformance.uniqueBookers} / {ownerPerformance.returningBookers}</strong>
          </div>
        </div>
        <Button variant="secondary" fullWidth disabled>
          <Icon icon={Download} size={16} />
          הורדת PDF (בקרוב)
        </Button>
      </Modal>

      <Modal
        title={`ביצועי החניה - ${parkingPerformanceTarget?.name || ''}`}
        isOpen={Boolean(parkingPerformanceTarget)}
        onClose={() => setParkingPerformanceTarget(null)}
      >
        <Select
          label="טווח זמן"
          value={reportsRange}
          onChange={(e) => setReportsRange(Number(e.target.value))}
        >
          {RANGE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </Select>
        {parkingPerformanceTarget && (
          <div className="owner-dashboard__report-grid">
            {(() => {
              const stats = getParkingPerformance(parkingPerformanceTarget, reportsRange);
              return (
                <>
                  <div className="owner-dashboard__report-card">
                    <span>ממוצע הזמנות חודשי</span>
                    <strong>{stats.avgMonthlyBookings}</strong>
                  </div>
                  <div className="owner-dashboard__report-card">
                    <span>רווח חודשי ממוצע</span>
                    <strong>{formatPrice(Math.round(stats.avgMonthlyNetIncome))}</strong>
                  </div>
                  <div className="owner-dashboard__report-card">
                    <span>מזמינים שונים / חוזרים</span>
                    <strong>{stats.uniqueBookers} / {stats.returningBookers}</strong>
                  </div>
                  <div className="owner-dashboard__report-card">
                    <span>אחוז תפוסה משוער</span>
                    <strong>{stats.occupancyRate}%</strong>
                  </div>
                </>
              );
            })()}
          </div>
        )}
        <Button variant="secondary" fullWidth disabled>
          <Icon icon={FileText} size={16} />
          הורדת PDF (בקרוב)
        </Button>
      </Modal>

      <Modal
        title={`הגדרות חניה - ${settingsParking?.name || ''}`}
        isOpen={Boolean(settingsParking)}
        onClose={() => setSettingsParking(null)}
      >
        <div className="owner-dashboard__settings-grid">
          {settingsError && <div className="error-message">{settingsError}</div>}

          <Input
            label="תמונת חניה"
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={imageUploading}
          />
          {imageUploading && (
            <p className="owner-dashboard__upload-status">מעלה תמונה...</p>
          )}
          {settingsForm.image && <img src={settingsForm.image} alt="" className="owner-dashboard__image-preview" />}
          <Input
            label="שם החניה"
            value={settingsForm.name}
            onChange={(e) => {
              setSettingsError('');
              setSettingsForm((prev) => ({ ...prev, name: e.target.value }));
            }}
            required
          />
          <Input
            label="כתובת"
            value={settingsForm.address}
            onChange={(e) => {
              setSettingsError('');
              setSettingsForm((prev) => ({ ...prev, address: e.target.value }));
            }}
            required
          />
          <Input
            label="מספר מקום חניה"
            value={settingsForm.spotNumber}
            onChange={(e) => {
              setSettingsError('');
              setSettingsForm((prev) => ({ ...prev, spotNumber: e.target.value }));
            }}
          />
          <Input
            label="תעריף לשעה (₪)"
            type="number"
            min="1"
            step="1"
            value={settingsForm.pricePerHour}
            onChange={(e) => {
              setSettingsError('');
              setSettingsForm((prev) => ({ ...prev, pricePerHour: e.target.value }));
            }}
            required
          />
          <Textarea
            label="הערות"
            rows={3}
            value={settingsForm.notes}
            onChange={(e) => setSettingsForm((prev) => ({ ...prev, notes: e.target.value }))}
          />
        </div>
        <div className="owner-dashboard__settings-actions">
          <Button variant="secondary" onClick={handleSaveSettings} disabled={settingsSaving || imageUploading}>
            <Icon icon={Settings} size={16} />
            {settingsSaving ? 'שומר...' : 'שמירת עריכה'}
          </Button>
          <Button variant="secondary" onClick={handleToggleFreeze}>
            <Icon icon={Snowflake} size={16} />
            {settingsParking?.status === 'active' ? 'הקפאת החניה' : 'החזרת החניה לפעילות'}
          </Button>
          <Button variant="danger" onClick={handleRemoveParking}>
            <Icon icon={Trash2} size={16} className="app-icon--white" />
            הסרת החניה
          </Button>
        </div>
      </Modal>

      <Modal
        title={`עריכת זמינות — ${availabilityParking?.name || ''}`}
        isOpen={Boolean(availabilityParking)}
        onClose={() => setAvailabilityParking(null)}
        className="modal--wide"
      >
        <p className="owner-dashboard__availability-intro">
          הגדירו מתי החניה פנויה ב־7 הימים הקרובים. אפשר להשאיר ימים סגורים, או להוסיף כמה טווחים באותו יום.
        </p>

        {availabilityError && <div className="error-message">{availabilityError}</div>}

        <div className="owner-dashboard__availability-editor">
          {availabilityDays.map((day) => (
            <div
              key={day.date}
              className={`owner-dashboard__availability-day ${day.enabled ? '' : 'owner-dashboard__availability-day--closed'}`}
            >
              <div className="owner-dashboard__availability-day-header">
                <div className="owner-dashboard__availability-day-title">
                  <strong>
                    {day.relativeLabel ? `${day.relativeLabel} · ` : ''}
                    יום {day.dayName}
                  </strong>
                  <span>{formatDisplayDate(day.date)}</span>
                </div>

                <label className="owner-dashboard__day-toggle">
                  <input
                    type="checkbox"
                    checked={day.enabled}
                    onChange={(e) => toggleDayEnabled(day.date, e.target.checked)}
                  />
                  <span>{day.enabled ? 'פנוי' : 'סגור'}</span>
                </label>
              </div>

              {day.enabled ? (
                <div className="owner-dashboard__availability-slots">
                  {day.slots.map((slot, slotIndex) => (
                    <div key={`${day.date}-${slotIndex}`} className="owner-dashboard__availability-slot">
                      <div className="owner-dashboard__time-pair">
                        <label>
                          משעה
                          <input
                            type="time"
                            value={slot.start}
                            onChange={(e) => {
                            setAvailabilityError('');
                            updateAvailabilitySlot(day.date, slotIndex, 'start', e.target.value);
                          }}
                          />
                        </label>
                        <span className="owner-dashboard__time-sep">עד</span>
                        <label>
                          עד שעה
                          <input
                            type="time"
                            value={slot.end}
                            onChange={(e) => {
                            setAvailabilityError('');
                            updateAvailabilitySlot(day.date, slotIndex, 'end', e.target.value);
                          }}
                          />
                        </label>
                      </div>

                      {day.slots.length > 1 && (
                        <button
                          type="button"
                          className="owner-dashboard__remove-slot"
                          onClick={() => removeAvailabilitySlot(day.date, slotIndex)}
                          aria-label="הסרת טווח"
                        >
                          <Icon icon={Trash2} size={15} />
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    className="owner-dashboard__add-slot"
                    onClick={() => addAvailabilitySlot(day.date)}
                  >
                    <Icon icon={Plus} size={14} />
                    הוסף טווח שעות נוסף
                  </button>
                </div>
              ) : (
                <p className="owner-dashboard__availability-empty">החניה לא תהיה זמינה ביום זה</p>
              )}
            </div>
          ))}
        </div>

        <Button fullWidth onClick={handleSaveAvailability} disabled={availabilitySaving}>
          {availabilitySaving ? 'שומר...' : 'שמירת זמינות'}
        </Button>
      </Modal>
    </div>
  );
}
