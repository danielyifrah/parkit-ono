import { useEffect, useState } from 'react';
import { AlertTriangle, Power } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppSettings } from '../../context/AppSettingsContext';
import { AUDIT_ACTIONS, logAdminAction } from '../../lib/auditLog';
import Button from '../../components/ui/Button';
import { Textarea } from '../../components/ui/Input';
import Icon from '../../components/ui/Icon';
import '../AdminDashboard.css';

export default function AdminSettings() {
  const { user: actor } = useAuth();
  const { bookingsDisabled, message, updateMaintenance, saving } = useAppSettings();
  const [draftMessage, setDraftMessage] = useState(message);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setDraftMessage(message);
  }, [message]);

  const handleToggle = async () => {
    setFeedback('');
    setError('');
    const nextDisabled = !bookingsDisabled;
    const result = await updateMaintenance({
      disabled: nextDisabled,
      message: draftMessage,
    });
    if (!result.ok) {
      setError(result.error || 'העדכון נכשל');
      return;
    }

    await logAdminAction({
      actor,
      actionType: nextDisabled
        ? AUDIT_ACTIONS.app_disabled.value
        : AUDIT_ACTIONS.app_enabled.value,
      summary: nextDisabled
        ? `${actor?.name || 'מנהל'} השבית את האפליקציה זמנית`
        : `${actor?.name || 'מנהל'} החזיר את האפליקציה לפעילות`,
      entityType: 'app',
      entityLabel: 'Parkit',
    });

    setFeedback(nextDisabled
      ? 'האפליקציה הושבתה. משתמשים יראו הודעה ולא יוכלו להזמין או לנהל חניות.'
      : 'האפליקציה חזרה לפעילות מלאה.');
  };

  const handleSaveMessage = async () => {
    setFeedback('');
    setError('');
    const result = await updateMaintenance({
      disabled: bookingsDisabled,
      message: draftMessage,
    });
    if (!result.ok) {
      setError(result.error || 'שמירת ההודעה נכשלה');
      return;
    }
    setFeedback('ההודעה עודכנה.');
  };

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <h1 className="admin-page__title">השבתת אפליקציה</h1>
        <p className="admin-page__subtitle">
          במצב השבתה משתמשים יכולים להתחבר, אך לא לבצע הזמנות ובעלי חניה לא יכולים לנהל חניות.
        </p>
      </header>

      <section className={`admin-maintenance ${bookingsDisabled ? 'admin-maintenance--on' : ''}`}>
        <div className="admin-maintenance__status">
          <Icon icon={bookingsDisabled ? AlertTriangle : Power} size={28} />
          <div>
            <h2>{bookingsDisabled ? 'האפליקציה מושבתת כרגע' : 'האפליקציה פעילה'}</h2>
            <p>
              {bookingsDisabled
                ? 'הזמנות חדשות ופעולות בעלי חניה חסומות.'
                : 'כל הפעולות זמינות למשתמשים.'}
            </p>
          </div>
        </div>

        <Button
          variant={bookingsDisabled ? 'primary' : 'secondary'}
          onClick={handleToggle}
          disabled={saving}
        >
          {saving ? 'מעדכן...' : (bookingsDisabled ? 'הפעלת האפליקציה מחדש' : 'השבתה זמנית של האפליקציה')}
        </Button>
      </section>

      <section className="admin-page__section">
        <h2 className="admin-page__section-title">הודעה למשתמשים</h2>
        <Textarea
          label="טקסט שיוצג באפליקציה במצב השבתה"
          value={draftMessage}
          onChange={(e) => setDraftMessage(e.target.value)}
          rows={4}
        />
        <div className="admin-form__actions">
          <Button variant="secondary" onClick={handleSaveMessage} disabled={saving}>
            שמירת הודעה
          </Button>
        </div>
      </section>

      {feedback && <p className="admin-page__success">{feedback}</p>}
      {error && <p className="admin-page__error">{error}</p>}
    </div>
  );
}
