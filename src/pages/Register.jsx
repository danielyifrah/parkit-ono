import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    const result = await register(name, email, password);
    setSubmitting(false);
    if (result.success) {
      navigate('/');
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
        <h1 className="auth-title">הרשמה</h1>

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
            required
          />
          <Button type="submit" fullWidth size="lg" disabled={submitting}>
            {submitting ? 'נרשם...' : 'הרשמה'}
          </Button>
        </form>

        <p className="auth-switch">
          כבר יש לך חשבון? <Link to="/login">התחברות</Link>
        </p>
      </div>
    </div>
  );
}
