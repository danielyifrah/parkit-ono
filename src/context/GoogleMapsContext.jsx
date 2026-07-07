import { createContext, useContext } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import {
  googleMapsApiKey,
  googleMapsLibraries,
} from '../lib/googleMapsConfig';

const GoogleMapsContext = createContext({
  isLoaded: false,
  loadError: null,
});

export function GoogleMapsProvider({ children }) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey,
    libraries: googleMapsLibraries,
    language: 'he',
    region: 'IL',
  });

  return (
    <GoogleMapsContext.Provider value={{ isLoaded, loadError }}>
      {children}
    </GoogleMapsContext.Provider>
  );
}

export function useGoogleMaps() {
  return useContext(GoogleMapsContext);
}
