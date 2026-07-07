import { Outlet, useLocation, matchPath } from 'react-router-dom';
import { HeaderProvider } from '../../context/HeaderContext';
import { GoogleMapsProvider } from '../../context/GoogleMapsContext';
import Header from './Header';
import BottomNav from './BottomNav';

const AUTH_ROUTES = ['/login', '/register', '/forgot-password'];
const HIDE_HEADER_ROUTES = ['/partner'];
const HIDE_BOTTOM_NAV_ROUTES = ['/partner', '/partner/add', '/active', '/saved'];

const PAGE_TITLES = {
  '/active': 'חניה פעילה',
  '/saved': 'חניה שמורה',
  '/history': 'היסטוריית חניות',
  '/profile': 'פרופיל והגדרות',
  '/support': 'מרכז תמיכה',
  '/partner/add': 'הוספת חניה',
};

function LayoutContent() {
  const location = useLocation();
  const isAuthPage = AUTH_ROUTES.includes(location.pathname);
  const hideHeader = HIDE_HEADER_ROUTES.includes(location.pathname);
  const hideBottomNav = HIDE_BOTTOM_NAV_ROUTES.includes(location.pathname);
  const showSearch = location.pathname === '/';
  const isHome = location.pathname === '/';
  const bookingMatch = matchPath('/parking/:id/book', location.pathname);
  const historyDetailMatch = matchPath('/history/:id', location.pathname);
  const title = historyDetailMatch
    ? 'פרטי חניה'
    : bookingMatch
      ? 'הזמנת חניה'
      : PAGE_TITLES[location.pathname] || null;

  const sessionLocked = ['/saved', '/active'].includes(location.pathname);

  if (isAuthPage) {
    return <Outlet />;
  }

  return (
    <div className="app-layout">
      {!hideHeader && (
        <Header showSearch={showSearch} title={title} sessionLocked={sessionLocked} />
      )}
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
