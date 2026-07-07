import './Header.css';
import { Link, useNavigate } from 'react-router-dom';
import { LifeBuoy, Search, Crosshair } from 'lucide-react';
import PlacesSearchInput from '../parking/PlacesSearchInput';
import Icon from '../ui/Icon';
import { useHeaderSearch } from '../../context/HeaderContext';

export default function Header({ showSearch = false, title, sessionLocked = false }) {
  const navigate = useNavigate();
  const { search } = useHeaderSearch();
  const isHome = showSearch && !title;

  return (
    <header className="header">
      <div className={`header__inner ${isHome ? 'header__inner--home' : ''}`}>
        {/* ימין (RTL): לוגו */}
        {sessionLocked ? (
          <div className="header__logo header__logo--locked">
            <span className="header__logo-icon">P</span>
            <span className="header__logo-text">Parkit</span>
          </div>
        ) : (
          <Link to="/" className="header__logo">
            <span className="header__logo-icon">P</span>
            <span className="header__logo-text">Parkit</span>
          </Link>
        )}

        {/* מרכז: כותרת עמוד / חיפוש בדסקטופ-בית */}
        {title ? (
          <h1 className="header__title">{title}</h1>
        ) : isHome ? (
          <div className="header__search desktop-only">
            <PlacesSearchInput
              placeholder={search.placeholder || 'איפה תרצו לחנות?'}
              icon={<Icon icon={Search} size={18} className="app-icon--muted" />}
              iconEnd={search.onLocate ? (
                <button
                  type="button"
                  className="header__locate"
                  onClick={search.onLocate}
                  aria-label="מרכוז למיקום שלי"
                >
                  <Icon icon={Crosshair} size={18} className="app-icon--muted" />
                </button>
              ) : null}
              value={search.value}
              onChange={search.onChange}
              onPlaceSelect={search.onPlaceSelect}
            />
          </div>
        ) : (
          <div className="header__center" aria-hidden="true" />
        )}

        {/* שמאל (RTL): תמיכה בלבד */}
        <div className="header__actions">
          {!sessionLocked && (
            <button
              type="button"
              className="header__action-btn"
              onClick={() => navigate('/support')}
              aria-label="תמיכה"
            >
              <Icon icon={LifeBuoy} size={18} />
              <span className="header__action-label desktop-only">תמיכה</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
