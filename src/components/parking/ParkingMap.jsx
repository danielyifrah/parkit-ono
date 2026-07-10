import { useCallback, useEffect, useMemo, useState } from 'react';
import { Circle, GoogleMap, Marker } from '@react-google-maps/api';
import { useCurrency } from '../../context/CurrencyContext';
import { useGoogleMaps } from '../../context/GoogleMapsContext';
import {
  createParkingMarkerIcon,
  createSearchMarkerIcon,
  createUserLocationIcon,
  searchCircleStyle,
} from '../../lib/mapMarkers';
import { getGeolocationErrorMessage } from '../../lib/geo';
import {
  defaultMapCenter,
  defaultMapZoom,
  googleMapsApiKey,
  mapContainerStyle,
  mapOptions,
  searchRadiusKm,
} from '../../lib/googleMapsConfig';
import './ParkingMap.css';

const DEFAULT_PADDING = { top: 72, right: 48, bottom: 200, left: 48 };

export default function ParkingMap({
  parkings,
  selectedId,
  onSelectParking,
  locateRequest = 0,
  focusLocation = null,
  focusLabel = '',
  mapPadding = DEFAULT_PADDING,
  onLocateError,
}) {
  const { isLoaded, loadError } = useGoogleMaps();
  const { formatPrice } = useCurrency();

  const [map, setMap] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [userCenterActive, setUserCenterActive] = useState(false);

  const paddingKey = useMemo(
    () => JSON.stringify(mapPadding),
    [mapPadding]
  );

  const requestUserLocation = useCallback(
    (options = { enableHighAccuracy: false, maximumAge: 60000 }) =>
      new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation not supported'));
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            const location = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            setUserLocation(location);
            resolve(location);
          },
          reject,
          { enableHighAccuracy: false, timeout: 15000, ...options }
        );
      }),
    []
  );

  const centerMapOnUser = useCallback(
    (location) => {
      if (!map) return;
      map.setOptions({ padding: mapPadding });
      map.panTo(location);
      map.setZoom(16);
    },
    [map, mapPadding]
  );

  useEffect(() => {
    requestUserLocation().catch(() => {});
  }, [requestUserLocation]);

  useEffect(() => {
    if (focusLocation) {
      setUserCenterActive(false);
    }
  }, [focusLocation]);

  const onMapLoad = useCallback((mapInstance) => {
    setMap(mapInstance);
  }, []);

  const applyMapView = useCallback(() => {
    if (!map || !window.google || userCenterActive) return;

    map.setOptions({ padding: mapPadding });

    if (focusLocation) {
      const radiusDeg = searchRadiusKm / 111;
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend({
        lat: focusLocation.lat + radiusDeg * 0.65,
        lng: focusLocation.lng + radiusDeg * 0.65,
      });
      bounds.extend({
        lat: focusLocation.lat - radiusDeg * 0.65,
        lng: focusLocation.lng - radiusDeg * 0.65,
      });

      if (parkings.length > 0) {
        parkings.forEach((parking) => {
          bounds.extend({ lat: parking.lat, lng: parking.lng });
        });
      }

      map.fitBounds(bounds);
      return;
    }

    if (!parkings.length) return;

    const bounds = new window.google.maps.LatLngBounds();
    parkings.forEach((parking) => {
      bounds.extend({ lat: parking.lat, lng: parking.lng });
    });

    if (userLocation) {
      bounds.extend(userLocation);
    }

    map.fitBounds(bounds);
  }, [map, parkings, focusLocation, userLocation, mapPadding, userCenterActive]);

  useEffect(() => {
    applyMapView();
  }, [applyMapView, paddingKey]);

  useEffect(() => {
    if (!locateRequest) return;

    setUserCenterActive(true);

    requestUserLocation({ enableHighAccuracy: true, maximumAge: 0 })
      .then(centerMapOnUser)
      .catch((err) => {
        setUserCenterActive(false);
        onLocateError?.(getGeolocationErrorMessage(err));
      });
  }, [locateRequest, requestUserLocation, centerMapOnUser, onLocateError]);

  useEffect(() => {
    if (!userCenterActive || !map || !userLocation) return;
    centerMapOnUser(userLocation);
  }, [mapPadding, userCenterActive, userLocation, map, centerMapOnUser]);

  const parkingIcons = useMemo(() => {
    if (!isLoaded || !window.google) return {};
    return Object.fromEntries(
      parkings.map((parking) => [
        parking.id,
        createParkingMarkerIcon(
          window.google,
          formatPrice(parking.pricePerHour, { compact: true }),
          parking.id === selectedId
        ),
      ])
    );
  }, [isLoaded, parkings, selectedId, formatPrice]);

  const searchIcon = useMemo(() => {
    if (!isLoaded || !window.google || !focusLocation) return null;
    return createSearchMarkerIcon(window.google, focusLabel);
  }, [isLoaded, focusLocation, focusLabel]);

  const userIcon = useMemo(() => {
    if (!isLoaded || !window.google || !userLocation) return null;
    return createUserLocationIcon(window.google);
  }, [isLoaded, userLocation]);

  if (!googleMapsApiKey) {
    return (
      <div className="parking-map parking-map--message">
        <p className="parking-map__message-title">נדרש מפתח Google Maps</p>
        <p className="parking-map__message-text">
          צרו קובץ <code>.env.local</code> והוסיפו את המפתח{' '}
          <code>VITE_GOOGLE_MAPS_API_KEY</code>
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="parking-map parking-map--message">
        <p className="parking-map__message-title">שגיאה בטעינת המפה</p>
        <p className="parking-map__message-text">
          בדקו שהמפתח תקין וש-Maps JavaScript API מופעל ב-Google Cloud
        </p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="parking-map parking-map--loading">
        <div className="parking-map__spinner" aria-hidden="true" />
        <p>טוען מפה...</p>
      </div>
    );
  }

  return (
    <div className="parking-map">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={defaultMapCenter}
        zoom={defaultMapZoom}
        onLoad={onMapLoad}
        options={mapOptions}
      >
        {focusLocation && (
          <>
            <Circle
              center={focusLocation}
              radius={searchRadiusKm * 1000}
              options={{
                ...searchCircleStyle,
                clickable: false,
              }}
            />
            {searchIcon && (
              <Marker
                position={focusLocation}
                icon={searchIcon}
                zIndex={200}
                clickable={false}
              />
            )}
          </>
        )}

        {userLocation && userIcon && (
          <>
            <Circle
              center={userLocation}
              radius={40}
              options={{
                fillColor: '#003B95',
                fillOpacity: 0.12,
                strokeOpacity: 0,
                clickable: false,
              }}
            />
            <Marker
              position={userLocation}
              icon={userIcon}
              zIndex={150}
              clickable={false}
            />
          </>
        )}

        {parkings.map((parking) => (
          <Marker
            key={parking.id}
            position={{ lat: parking.lat, lng: parking.lng }}
            icon={parkingIcons[parking.id]}
            zIndex={parking.id === selectedId ? 100 : 10}
            onClick={() => onSelectParking(parking.id)}
            title={`${parking.name} — ${formatPrice(parking.pricePerHour)} לשעה`}
          />
        ))}
      </GoogleMap>
    </div>
  );
}
