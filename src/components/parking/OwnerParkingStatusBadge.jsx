import { useState } from 'react';
import { Info } from 'lucide-react';
import Icon from '../ui/Icon';
import { getOwnerParkingStatusMeta } from '../../lib/ownerParkingStatus';
import './OwnerParkingStatusBadge.css';

export default function OwnerParkingStatusBadge({ displayStatus }) {
  const [infoOpen, setInfoOpen] = useState(false);
  const meta = getOwnerParkingStatusMeta(displayStatus);
  const booking = displayStatus?.booking;
  const isInteractive = meta.showBookingInfo && booking;

  const toggleInfo = () => {
    if (!isInteractive) return;
    setInfoOpen((open) => !open);
  };

  return (
    <div className="owner-status-badge">
      {isInteractive ? (
        <button
          type="button"
          className={`badge owner-status-badge__label ${meta.badgeClass} owner-status-badge__label--interactive`}
          onClick={toggleInfo}
          aria-expanded={infoOpen}
          aria-label={`${meta.label} — הצגת פרטי הזמנה`}
        >
          <span>{meta.label}</span>
          <Icon icon={Info} size={13} className="owner-status-badge__hint-icon" />
        </button>
      ) : (
        <span className={`badge owner-status-badge__label ${meta.badgeClass}`}>
          {meta.label}
        </span>
      )}

      {isInteractive && infoOpen && (
        <div className="owner-status-badge__info" role="status">
          <span>החניה מוזמנת עד {booking.endTime}</span>
        </div>
      )}
    </div>
  );
}
