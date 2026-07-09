import { useState } from 'react';
import { Fingerprint, ScanFace } from 'lucide-react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import { useAuth } from '../../context/AuthContext';
import './SecurityModal.css';

export default function SecurityModal({ isOpen, onClose }) {
  const { changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('הסיסמאות החדשות אינן תואמות');
      return;
    }

    setSaving(true);

    try {
      const result = await changePassword(currentPassword, newPassword);

      if (result.success) {
        setSuccess('הסיסמה עודכנה בהצלחה');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError(result.error || 'שגיאה בעדכון הסיסמה');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="אבטחה וסיסמה" isOpen={isOpen} onClose={handleClose} className="modal--wide">
      <form className="security-form" onSubmit={handleSubmit}>
        <p className="security-form__intro">
          עדכנו את הסיסמה שלכם לשמירה על אבטחת החשבון.
        </p>

        <Input
          label="סיסמה נוכחית"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />
        <Input
          label="סיסמה חדשה"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <Input
          label="אימות סיסמה חדשה"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        {error && <p className="security-form__error">{error}</p>}
        {success && <p className="security-form__success">{success}</p>}

        <Button type="submit" fullWidth disabled={saving}>
          {saving ? 'מעדכן...' : 'עדכון סיסמה'}
        </Button>
      </form>

      <div className="security-form__biometric">
        <h3 className="security-form__biometric-title">כניסה מהירה</h3>

        <div className="security-form__biometric-item">
          <span className="security-form__biometric-icon">
            <Icon icon={ScanFace} size={18} className="app-icon--primary" />
          </span>
          <div className="security-form__biometric-text">
            <span>זיהוי פנים</span>
            <span className="security-form__soon">בקרוב</span>
          </div>
        </div>

        <div className="security-form__biometric-item">
          <span className="security-form__biometric-icon">
            <Icon icon={Fingerprint} size={18} className="app-icon--primary" />
          </span>
          <div className="security-form__biometric-text">
            <span>טביעת אצבע</span>
            <span className="security-form__soon">בקרוב</span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
