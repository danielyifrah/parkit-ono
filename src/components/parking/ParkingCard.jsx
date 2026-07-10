import './ParkingCard.css';
import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, Star, Image, MoreVertical, Pencil, BarChart3, ArrowLeft } from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';
import { useParking } from '../../context/ParkingContext';
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import OwnerParkingStatusBadge from './OwnerParkingStatusBadge';

function ParkingThumbnail({ parking, className }) {
  if (parking.image) {
    return <img src={parking.image} alt="" className={className} loading="lazy" referrerPolicy="no-referrer" />;
  }

  return (
    <div className={`image-placeholder ${className}`}>
      <Icon icon={Image} size={24} className="app-icon--muted" />
    </div>
  );
}

export default function ParkingCard({
  parking,
  variant = 'overlay',
  onViewDetails,
  onEditDetails,
  onViewPerformance,
  onOpenSettings,
  showBookButton = true,
  availabilityLabel = 'זמין לחיפוש',
}) {
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();
  const { getOwnerParkingDisplayStatus } = useParking();

  if (!parking) return null;

  const handleView = () => {
    if (onViewDetails) {
      onViewDetails(parking.id);
    } else {
      navigate(`/parking/${parking.id}`);
    }
  };

  if (variant === 'overlay') {
    return (
      <div className="parking-card parking-card--overlay card">
        <div className="parking-card__overlay-content">
          <div className="parking-card__overlay-top">
            <span className="badge badge--success">
              <span className="badge__dot" />
              {availabilityLabel}
            </span>
            <span className="parking-card__rating">
              <Icon icon={Star} size={14} className="app-icon--primary" />
              {parking.rating}
            </span>
          </div>
          <div className="parking-card__overlay-body">
            <div className="parking-card__info">
              <h3 className="parking-card__title">{parking.name}</h3>
              <p className="parking-card__address">
                <Icon icon={MapPin} size={14} className="app-icon--muted" />
                {parking.address}
              </p>
              <div className="parking-card__tags">
                <span className="parking-card__tag">{formatPrice(parking.pricePerHour)} לשעה</span>
                <span className="parking-card__tag">
                  <Icon icon={Clock} size={12} />
                  {parking.walkMinutes} דק&apos; הליכה
                </span>
              </div>
            </div>
            <ParkingThumbnail parking={parking} className="parking-card__image" />
          </div>
          {showBookButton && (
            <Button fullWidth onClick={handleView}>
              צפה בפרטים והזמן חניה
              <Icon icon={ArrowLeft} size={18} className="app-icon--white" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="parking-card parking-card--compact card">
        <ParkingThumbnail parking={parking} className="parking-card__thumb" />
        <div className="parking-card__compact-info">
          <div className="parking-card__compact-top">
            <h3 className="parking-card__title">{parking.name}</h3>
            <span className="parking-card__rating">
              <Icon icon={Star} size={14} className="app-icon--primary" />
              {parking.rating}
            </span>
          </div>
          <p className="parking-card__address">
            <Icon icon={MapPin} size={14} className="app-icon--muted" />
            {parking.address}
          </p>
          <div className="parking-card__tags">
            <span className="parking-card__tag">{formatPrice(parking.pricePerHour)} לשעה</span>
            <span className="parking-card__tag">
              <Icon icon={Clock} size={12} />
              {parking.walkMinutes} דק&apos; הליכה
            </span>
          </div>
          <Button variant="dark" fullWidth size="sm" onClick={handleView}>
            צפה בפרטים
          </Button>
        </div>
      </div>
    );
  }

  if (variant === 'owner') {
    const displayStatus = getOwnerParkingDisplayStatus(parking.id);

    return (
      <div className="parking-card parking-card--owner card">
        <div className="parking-card__owner-header">
          <OwnerParkingStatusBadge displayStatus={displayStatus} />
          <button
            type="button"
            className="parking-card__menu"
            aria-label="אפשרויות"
            onClick={() => onOpenSettings?.(parking)}
          >
            <Icon icon={MoreVertical} size={18} className="app-icon--muted" />
          </button>
        </div>
        <div className="parking-card__owner-body">
          <div className="parking-card__owner-info">
            <h3 className="parking-card__title">{parking.name}</h3>
            <p className="parking-card__address">{parking.address}</p>
            <p className="parking-card__meta">
              {formatPrice(parking.pricePerHour)} / שעה · {parking.covered ? 'מקורה' : 'פתוחה'}
            </p>
            <p className="parking-card__stats">
              {parking.bookingsToday} הזמנות היום · הכנסה {formatPrice(parking.incomeToday)}
            </p>
          </div>
          <div className="parking-card__owner-image-wrap">
            <ParkingThumbnail parking={parking} className="parking-card__owner-image" />
            <span className="parking-card__photos-count">{parking.photosCount} תמונות</span>
          </div>
        </div>
        <div className="parking-card__owner-actions">
          <Button variant="secondary" size="sm" onClick={() => onEditDetails?.(parking)}>
            <Icon icon={Pencil} size={16} />
            עריכת זמינות
          </Button>
          <Button variant="secondary" size="sm" onClick={() => onViewPerformance?.(parking)}>
            <Icon icon={BarChart3} size={16} />
            ביצועי החניה
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
