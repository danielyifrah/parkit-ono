import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isAdmin } from '../lib/roles';
import Home from './Home';
import Landing from './Landing';

export default function HomeRoute() {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated && isAdmin(user)) {
    return <Navigate to="/admin" replace />;
  }

  if (isAuthenticated) {
    return <Home />;
  }

  return <Landing />;
}
