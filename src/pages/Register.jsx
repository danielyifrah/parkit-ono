import { useState } from 'react';
import { Link, useMatch, useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { USER_ROLES } from '../lib/roles';
import Button from '../components/ui/Button';
import Icon from '../components/ui/Icon';
import Input from '../components/ui/Input';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const isOwnerSignup = Boolean(useMatch('/register/owner'));
  const role = isOwnerSignup ? USER_ROLES.OWNER : USER_ROLES.DRIVER;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('יש להזין שם מלא');
      return;
    }

    if (password.length < 6) {
      setError('הסיסמה חייבת להכיל לפחות 6 תווים');
      return;
    }

    setSubmitting(true);
    const result = await register(name.trim(), email.trim(), password, role);
    setSubmitting(false);
    if (result.success) {
      navigate(isOwnerSignup ? '/partner' : '/');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <Link to="/" className="page-back auth-back">
          <Icon icon={ChevronRight} size={18} />
          חזרה לדף הנחיתה
        </Link>
        <div className="auth-logo">
          <span className="auth-logo-icon">P</span>
          <span className="auth-logo-text">Parkit</span>
        </div>
        <h1 className={`auth-title${isOwnerSignup ? ' auth-title--with-subtitle' : ''}`}>
          {isOwnerSignup ? 'הירשם כבעל חניה' : 'הרשמה'}
        </h1>
        {isOwnerSignup && (
          <p className="auth-subtitle">
            חשבון בעל חניה מאפשר לפרסם חניות, לנהל זמינות — וגם להזמין חניות כמו נהג.
          </p>
        )}

        {error && <div className="error-message">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <Input
            label="שם מלא"
            placeholder="ישראל ישראלי"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
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
            minLength={6}
            required
          />
          <Button type="submit" fullWidth size="lg" disabled={submitting}>
            {submitting
              ? 'נרשם...'
              : isOwnerSignup
                ? 'הירשם כבעל חניה'
                : 'הרשמה'}
          </Button>
        </form>

        <p className="auth-switch">
          כבר יש לך חשבון? <Link to="/login">התחברות</Link>
        </p>
        <p className="auth-switch auth-switch--secondary">
          {isOwnerSignup ? (
            <>
              רוצים רק להזמין חניה? <Link to="/register">הרשמה כנהג</Link>
            </>
          ) : (
            <>
              יש לכם חניה פנויה? <Link to="/register/owner">הירשם כבעל חניה</Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
