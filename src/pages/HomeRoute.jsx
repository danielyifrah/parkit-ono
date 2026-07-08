import { useAuth } from '../context/AuthContext';
import Home from './Home';
import Landing from './Landing';

export default function HomeRoute() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Home />;
  }

  return <Landing />;
}
