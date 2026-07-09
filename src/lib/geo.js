/** הודעת שגיאה ידידותית לכשל בקבלת מיקום GPS */
export function getGeolocationErrorMessage(error) {
  if (!error) return 'לא ניתן לקבל את המיקום שלכם';

  switch (error.code) {
    case 1:
      return 'הגישה למיקום נדחתה. אפשרו גישה בהגדרות הדפדפן ונסו שוב.';
    case 2:
      return 'לא ניתן לקבל את המיקום כרגע. נסו שוב.';
    case 3:
      return 'בקשת המיקום ארכה יותר מדי. נסו שוב.';
    default:
      return 'לא ניתן לקבל את המיקום שלכם';
  }
}

/** מרחק בקילומטרים בין שתי נקודות (נוסחת Haversine) */
export function getDistanceKm(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const earthRadiusKm = 6371;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
