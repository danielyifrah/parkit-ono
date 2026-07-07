import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { hasRole } from '../lib/roles';

export default function RoleRoute({ children, roles, redirectTo = '/' }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!hasRole(user, roles)) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}
