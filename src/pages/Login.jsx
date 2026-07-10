import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.92a8.78 8.78 0 0 0 2.68-6.61z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.33A8.99 8.99 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.97 10.71A5.41 5.41 0 0 1 3.68 9c0-.59.1-1.16.29-1.71V4.96H.96A8.99 8.99 0 0 0 0 9c0 1.45.35 2.82.96 4.04l3.01-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.89 11.43 0 9 0A8.99 8.99 0 0 0 .96 4.96l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
    </svg>
  );
}

export default function Login() {
  const { login, loginWithGoogle, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    const result = await login(email, password);
    setSubmitting(false);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
  };

  const handleGoogle = async () => {
    setSubmitting(true);
    setError('');
    const result = await loginWithGoogle();
    setSubmitting(false);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || 'ההתחברות נכשלה');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <div className="auth-logo">
          <span className="auth-logo-icon">P</span>
          <span className="auth-logo-text">Parkit</span>
        </div>
        <h1 className="auth-title">התחברות</h1>

        {error && <div className="error-message">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <Input
            label="אימייל"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="סיסמה"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div className="auth-forgot">
            <Link to="/forgot-password">שכחת סיסמה?</Link>
          </div>
          <Button type="submit" fullWidth size="lg" disabled={submitting}>
            {submitting ? 'מתחבר...' : 'התחברות'}
          </Button>
        </form>

        <div className="auth-divider">או</div>

        <Button variant="secondary" fullWidth onClick={handleGoogle} disabled={submitting}>
          <GoogleIcon />
          {submitting ? 'מתחבר...' : 'התחברות עם Google'}
        </Button>

        <p className="auth-switch">
          אין לך חשבון? <Link to="/register">הרשמה</Link>
          {' · '}
          <Link to="/register/owner">הירשם כבעל חניה</Link>
        </p>

        <div className="auth-demo card">
          <p className="auth-demo__title">חשבונות לדוגמה (סיסמה: demo1234)</p>
          <ul className="auth-demo__list">
            <li><strong>נהג:</strong> israel@example.com</li>
            <li><strong>בעל חניה:</strong> danny@example.com</li>
            <li><strong>מנהל:</strong> admin@parkit.com</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
