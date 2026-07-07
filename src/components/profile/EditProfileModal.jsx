import { useState, useRef, useEffect } from 'react';
import { Camera, User } from 'lucide-react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import { useAuth } from '../../context/AuthContext';
import './EditProfileModal.css';

export default function EditProfileModal({ isOpen, onClose }) {
  const { user, updateProfile } = useAuth();
  const fileRef = useRef(null);

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatar, setAvatar] = useState(user?.avatar || null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setName(user?.name || '');
    setEmail(user?.email || '');
    setPhone(user?.phone || '');
    setAvatar(user?.avatar || null);
    setError('');
  }, [isOpen, user]);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('יש לבחור קובץ תמונה');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('גודל התמונה המקסימלי הוא 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setAvatar(reader.result);
    reader.readAsDataURL(file);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('יש להזין שם');
      return;
    }

    if (!email.trim() && !phone.trim()) {
      setError('יש להזין אימייל או טלפון');
      return;
    }

    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));

    const result = updateProfile({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      avatar,
    });

    setSaving(false);

    if (result.success) {
      onClose();
    } else {
      setError(result.error || 'שגיאה בשמירה');
    }
  };

  return (
    <Modal
      title="עריכת פרופיל"
      isOpen={isOpen}
      onClose={onClose}
      className="modal--wide"
    >
      <form className="edit-profile-form" onSubmit={handleSubmit}>
        <div className="edit-profile-form__avatar-section">
          <button
            type="button"
            className="edit-profile-form__avatar"
            onClick={() => fileRef.current?.click()}
            aria-label="החלפת תמונת פרופיל"
          >
            {avatar ? (
              <img src={avatar} alt="" className="edit-profile-form__avatar-img" />
            ) : (
              <Icon icon={User} size={36} className="app-icon--muted" />
            )}
            <span className="edit-profile-form__avatar-badge">
              <Icon icon={Camera} size={14} />
            </span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="edit-profile-form__file-input"
            onChange={handleAvatarChange}
          />
          <p className="edit-profile-form__avatar-hint">לחצו להעלאת תמונה</p>
        </div>

        <Input
          label="שם מלא"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input
          label="אימייל"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label="טלפון"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="05X-XXXXXXX"
        />

        {error && <p className="edit-profile-form__error">{error}</p>}

        <div className="edit-profile-form__actions">
          <Button type="button" variant="ghost" onClick={onClose}>
            ביטול
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'שומר...' : 'שמירה'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
