import { useCallback, useState } from 'react';
import { Autocomplete } from '@react-google-maps/api';
import { useGoogleMaps } from '../../context/GoogleMapsContext';
import '../ui/Input.css';
import './PlacesSearchInput.css';

const autocompleteOptions = {
  componentRestrictions: { country: 'il' },
  fields: ['formatted_address', 'geometry', 'name'],
  types: ['geocode', 'establishment'],
};

export default function PlacesSearchInput({
  value,
  onChange,
  onPlaceSelect,
  placeholder,
  icon,
  iconEnd,
  className = '',
  disabled = false,
}) {
  const { isLoaded } = useGoogleMaps();
  const [autocomplete, setAutocomplete] = useState(null);

  const onLoad = useCallback((instance) => {
    setAutocomplete(instance);
  }, []);

  const onPlaceChanged = useCallback(() => {
    if (!autocomplete) return;

    const place = autocomplete.getPlace();
    const location = place.geometry?.location;

    if (!location) return;

    const address = place.formatted_address || place.name || '';
    onPlaceSelect?.({
      address,
      location: {
        lat: location.lat(),
        lng: location.lng(),
      },
    });
  }, [autocomplete, onPlaceSelect]);

  const inputClassName = [
    'input-field',
    icon ? 'input-field--with-icon-start' : '',
    iconEnd ? 'input-field--with-icon-end' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={`input-wrapper places-search ${className}`}>
      <div className="input-field-wrap">
        {icon && <span className="input-icon input-icon--start">{icon}</span>}

        {isLoaded ? (
          <Autocomplete
            onLoad={onLoad}
            onPlaceChanged={onPlaceChanged}
            options={autocompleteOptions}
          >
            <input
              type="text"
              className={inputClassName}
              placeholder={placeholder}
              value={value}
              onChange={onChange}
              disabled={disabled}
              autoComplete="off"
            />
          </Autocomplete>
        ) : (
          <input
            type="text"
            className={inputClassName}
            placeholder={placeholder || 'טוען חיפוש...'}
            value={value}
            onChange={onChange}
            disabled
          />
        )}

        {iconEnd && (
          <span className="input-icon input-icon--end places-search__icon-end">
            {iconEnd}
          </span>
        )}
      </div>
    </div>
  );
}
