/** הגדרות Google Maps — מפתח API נטען מ-.env.local */

export const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '';

/** חייב להיות מחוץ לקומפוננטה — מונע טעינה מחדש של הספרייה */
export const googleMapsLibraries = ['places'];

/** רדיוס חיפוש חניות סביב כתובת שנבחרה (ק\"מ) */
export const searchRadiusKm = 5;

/** מרכז ברירת מחדל: תל אביב */
export const defaultMapCenter = {
  lat: 32.0668,
  lng: 34.7778,
};

export const defaultMapZoom = 14;

export const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

export const mapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  fullscreenControl: false,
  streetViewControl: false,
  mapTypeControl: false,
  gestureHandling: 'greedy',
  clickableIcons: false,
};
