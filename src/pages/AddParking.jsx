import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Upload } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useParking } from '../context/ParkingContext';
import Button from '../components/ui/Button';
import Input, { Textarea, Select } from '../components/ui/Input';
import Icon from '../components/ui/Icon';

export default function AddParking() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addParking } = useParking();
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    name: '',
    address: '',
    pricePerHour: '',
    type: 'private',
    spotNumber: '',
    description: '',
    availabilityHours: '08:00 - 20:00',
  });

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    addParking(user.id, form);
    setSuccess(true);
    setTimeout(() => navigate('/partner'), 2000);
  };

  return (
    <div className="page add-parking-page">
      <button type="button" className="page-back" onClick={() => navigate('/partner')}>
        <Icon icon={ChevronRight} size={18} />
        חזרה לדשבורד
      </button>

      {success && (
        <div className="success-message">
          החניה נוספה בהצלחה! מעביר לדשבורד...
        </div>
      )}

      <form className="card add-parking-form" onSubmit={handleSubmit}>
        <Input label="שם החניה" placeholder="חניה פרטית הרצל" value={form.name} onChange={handleChange('name')} required />
        <Input label="כתובת" placeholder="רח' הרצל 45, תל אביב" value={form.address} onChange={handleChange('address')} required />
        <Input label="מחיר לשעה (₪)" type="number" placeholder="22" value={form.pricePerHour} onChange={handleChange('pricePerHour')} required />
        <Select label="סוג חניה" value={form.type} onChange={handleChange('type')}>
          <option value="private">פרטית</option>
          <option value="public">ציבורית</option>
          <option value="office">משרדית</option>
        </Select>
        <Input label="מספר מקום" placeholder="B12" value={form.spotNumber} onChange={handleChange('spotNumber')} />
        <Textarea label="תיאור" placeholder="תאר את החניה..." value={form.description} onChange={handleChange('description')} />
        <Input label="שעות זמינות" placeholder="08:00 - 20:00" value={form.availabilityHours} onChange={handleChange('availabilityHours')} />

        <div className="form-group">
          <label className="form-label">תמונת חניה</label>
          <button type="button" className="add-parking-upload image-placeholder">
            <Icon icon={Upload} size={24} className="app-icon--muted" />
            <span>לחץ להעלאת תמונה</span>
          </button>
          <small className="form-hint">בעתיד: העלאה ל-Supabase Storage</small>
        </div>

        <Button type="submit" fullWidth size="lg">שמירת חניה</Button>
      </form>
    </div>
  );
}
