const PARKING_PRIMARY = '#003B95';
const PARKING_SELECTED = '#0055FF';
const SEARCH_GREEN = '#4CAF50';

function svgToIcon(google, svg, width, height, anchorX, anchorY) {
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(width, height),
    anchor: new google.maps.Point(anchorX, anchorY),
  };
}

export function createParkingMarkerIcon(google, price, selected) {
  const priceText = `₪${price}`;
  const width = Math.max(54, priceText.length * 9 + 28);
  const bubbleFill = selected ? PARKING_PRIMARY : '#ffffff';
  const bubbleStroke = selected ? PARKING_PRIMARY : '#e5e7eb';
  const textFill = selected ? '#ffffff' : '#111827';
  const pinFill = selected ? PARKING_SELECTED : PARKING_PRIMARY;
  const mid = width / 2;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="42" viewBox="0 0 ${width} 42">
      <rect x="2" y="2" width="${width - 4}" height="24" rx="12" fill="${bubbleFill}" stroke="${bubbleStroke}" stroke-width="1.5"/>
      <text x="${mid}" y="18" text-anchor="middle" font-family="Rubik,Arial,sans-serif" font-size="11" font-weight="700" fill="${textFill}">${priceText}</text>
      <path d="M${mid} 38 L${mid - 6} 28 L${mid + 6} 28 Z" fill="${pinFill}" stroke="#ffffff" stroke-width="2"/>
    </svg>
  `;

  return svgToIcon(google, svg, width, 42, mid, 42);
}

export function createSearchMarkerIcon(google, label) {
  const text = (label || '').slice(0, 22);
  const width = Math.max(72, text.length * 8 + 32);
  const mid = width / 2;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="48" viewBox="0 0 ${width} 48">
      <rect x="2" y="2" width="${width - 4}" height="26" rx="13" fill="${SEARCH_GREEN}" stroke="#ffffff" stroke-width="2"/>
      <text x="${mid}" y="20" text-anchor="middle" font-family="Rubik,Arial,sans-serif" font-size="11" font-weight="600" fill="#ffffff">${text}</text>
      <path d="M${mid} 46 L${mid - 7} 30 L${mid + 7} 30 Z" fill="${SEARCH_GREEN}" stroke="#ffffff" stroke-width="2"/>
    </svg>
  `;

  return svgToIcon(google, svg, width, 48, mid, 48);
}

export function createUserLocationIcon(google) {
  return {
    path: google.maps.SymbolPath.CIRCLE,
    scale: 9,
    fillColor: PARKING_PRIMARY,
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: 3,
  };
}

export const searchCircleStyle = {
  fillColor: SEARCH_GREEN,
  fillOpacity: 0.05,
  strokeColor: SEARCH_GREEN,
  strokeOpacity: 0.28,
  strokeWeight: 1.5,
};
