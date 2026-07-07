import { Star } from 'lucide-react';
import Icon from './Icon';
import './StarRating.css';

export default function StarRating({
  value = 0,
  onChange,
  readonly = false,
  size = 24,
  max = 5,
  label = 'דירוג',
}) {
  return (
    <div className="star-rating" role={readonly ? 'img' : 'group'} aria-label={label}>
      {Array.from({ length: max }, (_, index) => {
        const starValue = index + 1;
        const filled = starValue <= value;

        if (readonly) {
          return (
            <span key={starValue} className={`star-rating__star ${filled ? 'star-rating__star--filled' : ''}`}>
              <Icon icon={Star} size={size} className={filled ? 'app-icon--primary' : 'app-icon--muted'} />
            </span>
          );
        }

        return (
          <button
            key={starValue}
            type="button"
            className={`star-rating__star ${filled ? 'star-rating__star--filled' : ''}`}
            onClick={() => onChange?.(starValue)}
            aria-label={`${starValue} כוכבים`}
          >
            <Icon icon={Star} size={size} className={filled ? 'app-icon--primary' : 'app-icon--muted'} />
          </button>
        );
      })}
    </div>
  );
}
