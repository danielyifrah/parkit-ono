import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export default function ForgotPassword() {
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
        <form className="auth-form" onSubmit={(e) => e.preventDefault()}>
          <Input label="אימייל" type="email" placeholder="your@email.com" required />
          <Button type="submit" fullWidth size="lg">שליחת קישור</Button>
        </form>
        <p className="auth-switch">
          <Link to="/login">חזרה להתחברות</Link>
        </p>
      </div>
    </div>
  );
}
