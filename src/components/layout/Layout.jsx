import { Outlet, useLocation, matchPath } from 'react-router-dom';
import { HeaderProvider } from '../../context/HeaderContext';
import { GoogleMapsProvider } from '../../context/GoogleMapsContext';
import { useAuth } from '../../context/AuthContext';
import AppDisabledBanner from '../AppDisabledBanner';
import Header from './Header';
import BottomNav from './BottomNav';

const AUTH_ROUTES = ['/login', '/register', '/register/owner', '/forgot-password'];
const HIDE_HEADER_PREFIXES = ['/partner', '/admin'];
const HIDE_BOTTOM_NAV_PREFIXES = ['/partner', '/admin'];
const HIDE_BOTTOM_NAV_EXACT = ['/active', '/saved'];

const PAGE_TITLES = {
  '/active': 'חניה פעילה',
  '/saved': 'חניה שמורה',
  '/history': 'היסטוריית חניות',
  '/profile': 'פרופיל והגדרות',
  '/profile/payment-methods': 'אמצעי תשלום',
  '/support': 'מרכז תמיכה',
  '/partner/add': 'הוספת חניה',
  '/admin': 'דשבורד ניהול',
};

function matchesPrefix(pathname, prefixes) {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function LayoutContent() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const isAuthPage = AUTH_ROUTES.includes(location.pathname);
  const isLanding = location.pathname === '/' && !isAuthenticated;
  const hideHeader = matchesPrefix(location.pathname, HIDE_HEADER_PREFIXES) || isLanding;
  const hideBottomNav = matchesPrefix(location.pathname, HIDE_BOTTOM_NAV_PREFIXES)
    || HIDE_BOTTOM_NAV_EXACT.includes(location.pathname)
    || isLanding;
  const showSearch = location.pathname === '/' && isAuthenticated;
  const isHome = location.pathname === '/' && isAuthenticated;
  const bookingMatch = matchPath('/parking/:id/book', location.pathname);
  const historyDetailMatch = matchPath('/history/:id', location.pathname);
  const title = historyDetailMatch
    ? 'פרטי חניה'
    : bookingMatch
      ? 'הזמנת חניה'
      : PAGE_TITLES[location.pathname] || null;

  const sessionLocked = ['/saved', '/active'].includes(location.pathname);

  if (isAuthPage || isLanding) {
    return <Outlet />;
  }

  return (
    <div className="app-layout">
      {!hideHeader && (
        <Header showSearch={showSearch} title={title} sessionLocked={sessionLocked} />
      )}
      <AppDisabledBanner />
      <main className={`app-main ${hideBottomNav ? 'app-main--no-bottom-nav' : ''} ${isHome ? 'app-main--home' : ''}`}>
        <Outlet />
      </main>
      {!hideBottomNav && <BottomNav />}
    </div>
  );
}

export default function Layout() {
  return (
    <GoogleMapsProvider>
      <HeaderProvider>
        <LayoutContent />
      </HeaderProvider>
    </GoogleMapsProvider>
  );
}
