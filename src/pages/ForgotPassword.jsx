import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export default function ForgotPassword() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setSubmitting(true);

    const result = await requestPasswordReset(email);
    setSubmitting(false);

    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <div className="auth-logo">
          <span className="auth-logo-icon">P</span>
          <span className="auth-logo-text">Parkit</span>
        </div>
        <h1 className="auth-title">איפוס סיסמה</h1>
        <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', marginBottom: 24, fontSize: '0.875rem' }}>
          הזינו את כתובת האימייל שלכם ונשלח לכם קישור לאיפוס הסיסמה.
        </p>

        {success ? (
          <div className="success-message" style={{ marginBottom: 24 }}>
            <p>נשלח קישור לאיפוס סיסמה לכתובת <strong>{email.trim()}</strong>.</p>
            <p style={{ marginTop: 8, fontSize: '0.875rem' }}>בדקו את תיבת הדואר (כולל ספאם) ולחצו על הקישור.</p>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            <Input
              label="אימייל"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {error && <div className="error-message">{error}</div>}
            <Button type="submit" fullWidth size="lg" disabled={submitting}>
              {submitting ? 'שולח...' : 'שליחת קישור'}
            </Button>
          </form>
        )}

        <p className="auth-switch">
          <Link to="/login">חזרה להתחברות</Link>
        </p>
      </div>
    </div>
  );
}
