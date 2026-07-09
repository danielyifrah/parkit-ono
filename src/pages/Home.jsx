import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapPin, Crosshair, Search, CalendarClock } from 'lucide-react';
import { recentSearches } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import { useParking } from '../context/ParkingContext';
import { formatBookingScheduleRtl } from '../lib/availability';
import { useHeaderSearch } from '../context/HeaderContext';
import {
  DEFAULT_FILTERS,
  applyParkingFilters,
  isFiltersActive,
} from '../lib/parkingFilters';
import { getDistanceKm } from '../lib/geo';
import { searchRadiusKm } from '../lib/googleMapsConfig';
import ParkingMap from '../components/parking/ParkingMap';
import PlacesSearchInput from '../components/parking/PlacesSearchInput';
import FilterBar, { SidebarFilters } from '../components/parking/FilterBar';
import ParkingCard from '../components/parking/ParkingCard';
import Icon from '../components/ui/Icon';
import Button from '../components/ui/Button';
import './Home.css';

function getShortAddress(address) {
  if (!address) return '';
  const firstPart = address.split(',')[0]?.trim();
  return firstPart || address;
}

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const {
    getAvailableParkings,
    getScheduledBookingByUserId,
    getParkingById,
    cancelBooking,
    PRE_START_HOLD_MINUTES,
  } = useParking();
  const availableParkings = getAvailableParkings();
  const scheduledBooking = getScheduledBookingByUserId(user?.id || '');
  const scheduledParking = scheduledBooking
    ? getParkingById(scheduledBooking.parkingId)
    : null;
  const showScheduledToast = location.state?.scheduledBooking;
  const { setSearch } = useHeaderSearch();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLocation, setSearchLocation] = useState(null);
  const [selectedId, setSelectedId] = useState('p1');
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [openFilterPanel, setOpenFilterPanel] = useState(null);
  const [locateRequest, setLocateRequest] = useState(0);
  const [locateError, setLocateError] = useState('');

  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setSearchLocation(null);
  }, []);

  const handlePlaceSelect = useCallback(({ address, location }) => {
    setSearchQuery(address);
    setSearchLocation(location);
  }, []);

  const handleLocate = useCallback(() => {
    setSearchLocation(null);
    setLocateError('');
    setLocateRequest((n) => n + 1);
  }, []);

  const handleLocateError = useCallback((message) => {
    setLocateError(message);
  }, []);

  useEffect(() => {
    setSearch({
      value: searchQuery,
      onChange: handleSearchChange,
      onPlaceSelect: handlePlaceSelect,
      onLocate: handleLocate,
      placeholder: 'איפה תרצו לחנות?',
    });
    return () => setSearch(null);
  }, [searchQuery, handleSearchChange, handlePlaceSelect, handleLocate, setSearch]);

  const filteredParkings = useMemo(() => {
    let result = applyParkingFilters(availableParkings, filters);

    if (searchLocation) {
      result = result
        .map((parking) => ({
          ...parking,
          distanceKm: getDistanceKm(
            searchLocation.lat,
            searchLocation.lng,
            parking.lat,
            parking.lng
          ),
        }))
        .filter((parking) => parking.distanceKm <= searchRadiusKm)
        .sort((a, b) => a.distanceKm - b.distanceKm);
    } else if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.address.toLowerCase().includes(q)
      );
    }

    return result;
  }, [searchQuery, searchLocation, filters, availableParkings]);

  const hasActiveSearch = Boolean(searchLocation || searchQuery.trim());
  const hasActiveFilters = isFiltersActive(filters);
  const showNoResultsPanel = (hasActiveSearch || hasActiveFilters) && filteredParkings.length === 0;

  const selectedParking = !showNoResultsPanel
    ? (filteredParkings.find((p) => p.id === selectedId) || filteredParkings[0])
    : null;

  useEffect(() => {
    if (!filteredParkings.length) return;
    if (!filteredParkings.some((p) => p.id === selectedId)) {
      setSelectedId(filteredParkings[0].id);
    }
  }, [filteredParkings, selectedId]);

  const handleFiltersChange = (nextFilters) => {
    setFilters(nextFilters);
  };

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setOpenFilterPanel(null);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchLocation(null);
  };

  const handleRecentSearch = (query) => {
    setSearchQuery(query);
    setSearchLocation(null);
  };

  const noResultsMessage = searchLocation
    ? `לא נמצאו חניות ברדיוס של ${searchRadiusKm} ק"מ מהמיקום שבחרתם`
    : hasActiveFilters
      ? 'לא נמצאו חניות לפי המסננים שבחרתם'
      : 'נסו לחפש באזור אחר או לשנות את המסננים';

  const focusLabel = searchLocation ? getShortAddress(searchQuery) : '';

  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)');
    const onChange = (e) => setIsMobile(e.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  const mapPadding = useMemo(() => {
    const hasBottomPanel = showNoResultsPanel || Boolean(selectedParking);

    if (isMobile) {
      return {
        top: 16,
        right: 20,
        bottom: hasBottomPanel ? 300 : 100,
        left: 20,
      };
    }

    return {
      top: 40,
      right: 40,
      bottom: 40,
      left: showNoResultsPanel ? 360 : 40,
    };
  }, [isMobile, showNoResultsPanel, selectedParking]);

  return (
    <div className="home-page">
      {locateError && (
        <div className="home-locate-error info-banner" role="alert">
          <Icon icon={Crosshair} size={18} className="app-icon--primary" />
          <p className="home-locate-error__text">{locateError}</p>
          <Button variant="ghost" size="sm" onClick={() => setLocateError('')}>
            סגירה
          </Button>
        </div>
      )}
      {(showScheduledToast || scheduledBooking) && (
        <div className="home-scheduled-banner info-banner">
          <Icon icon={CalendarClock} size={18} className="app-icon--primary" />
          <div className="home-scheduled-banner__text">
            <strong>החניה שמורה</strong>
            {scheduledBooking && scheduledParking && (
              <span dir="rtl">
                {scheduledParking.name} · {formatBookingScheduleRtl(scheduledBooking)}
                {' · '}
                {PRE_START_HOLD_MINUTES} דקות לפני ההתחלה תועברו למסך ההמתנה
              </span>
            )}
            {showScheduledToast && !scheduledBooking && (
              <span>ההזמנה נשמרה בהצלחה</span>
            )}
          </div>
          {scheduledBooking && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => cancelBooking(scheduledBooking.id, user.id)}
            >
              ביטול
            </Button>
          )}
        </div>
      )}
      <div className="home-layout">
        <div className="home-mobile-top mobile-only">
          <div className="home-search">
            <PlacesSearchInput
              placeholder="חפש לפי כתובת או אזור"
              icon={<Icon icon={MapPin} size={18} className="app-icon--muted" />}
              iconEnd={(
                <button
                  type="button"
                  className="home-search__locate"
                  onClick={handleLocate}
                  aria-label="מרכוז למיקום שלי"
                >
                  <Icon icon={Crosshair} size={18} className="app-icon--muted" />
                </button>
              )}
              value={searchQuery}
              onChange={handleSearchChange}
              onPlaceSelect={handlePlaceSelect}
            />
          </div>
          <div className="home-filters-scroll">
            <FilterBar
              filters={filters}
              onChange={handleFiltersChange}
              openPanel={openFilterPanel}
              onOpenPanel={setOpenFilterPanel}
              onClear={clearFilters}
            />
          </div>
        </div>

        <div className="home-map-area">
          <ParkingMap
            parkings={filteredParkings}
            selectedId={selectedParking?.id}
            onSelectParking={setSelectedId}
            locateRequest={locateRequest}
            focusLocation={searchLocation}
            focusLabel={focusLabel}
            mapPadding={mapPadding}
            onLocateError={handleLocateError}
          />

          {showNoResultsPanel && (
            <div className="home-no-results card">
              <div className="home-no-results__icon">
                <Icon icon={Search} size={28} className="app-icon--muted" />
              </div>
              <h3 className="home-no-results__title">לא נמצאו חניות</h3>
              <p className="home-no-results__text">{noResultsMessage}</p>
              <Button variant="secondary" fullWidth onClick={hasActiveSearch ? clearSearch : clearFilters}>
                {hasActiveSearch ? 'נקה חיפוש' : 'נקה מסננים'}
              </Button>
            </div>
          )}

          {selectedParking && (
            <>
              <div className="desktop-only">
                <ParkingCard
                  parking={selectedParking}
                  variant="overlay"
                  onViewDetails={(id) => navigate(`/parking/${id}`)}
                />
              </div>
              <div className="home-mobile-card mobile-only">
                <ParkingCard
                  parking={selectedParking}
                  variant="compact"
                  onViewDetails={(id) => navigate(`/parking/${id}`)}
                />
              </div>
            </>
          )}
        </div>

        <aside className="home-sidebar desktop-only">
          <SidebarFilters
            filters={filters}
            onChange={handleFiltersChange}
            onClear={clearFilters}
          />

          <div className="home-recent-searches">
            <h4 className="list-section-title">חיפושים אחרונים</h4>
            {recentSearches.map((s) => (
              <button
                key={s.id}
                type="button"
                className="recent-search-item"
                onClick={() => handleRecentSearch(s.query)}
              >
                <span>{s.query}</span>
                <span className="recent-search-time">{s.time}</span>
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
