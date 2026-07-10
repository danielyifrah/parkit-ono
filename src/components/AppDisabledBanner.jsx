import { AlertTriangle } from 'lucide-react';
import { useAppSettings } from '../context/AppSettingsContext';
import { useAuth } from '../context/AuthContext';
import Icon from './ui/Icon';
import './AppDisabledBanner.css';

export default function AppDisabledBanner() {
  const { bookingsDisabled, message, ready } = useAppSettings();
  const { isAdmin, isAuthenticated } = useAuth();

  if (!ready || !bookingsDisabled || !isAuthenticated || isAdmin) {
    return null;
  }

  return (
    <div className="app-disabled-banner" role="status">
      <Icon icon={AlertTriangle} size={18} />
      <p>{message}</p>
    </div>
  );
}
