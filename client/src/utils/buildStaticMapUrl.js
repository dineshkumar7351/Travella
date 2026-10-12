import { decodeGooglePolyline, simplifyToMaxPoints, encodeGooglePolyline } from './simplifyPolyline.js';

export const CATEGORY_COLOR_CONFIG = {
  gas_station: { label: 'Petrol Pumps', hex: '#ea580c', staticColor: '0xea580c', icon: '⛽' },
  restaurants: { label: 'Food / Dhaba', hex: '#ea580c', staticColor: '0xea580c', icon: '🍽️' },
  hotels: { label: 'Hotels & Stays', hex: '#9333ea', staticColor: '0x9333ea', icon: '🏨' },
  cafe_24h: { label: '24h Tea/Coffee', hex: '#ca8a04', staticColor: '0xca8a04', icon: '☕' },
  hospital: { label: 'Hospitals', hex: '#dc2626', staticColor: '0xdc2626', icon: '🏥' },
  pharmacy: { label: 'Pharmacies', hex: '#16a34a', staticColor: '0x16a34a', icon: '💊' },
  car_repair: { label: 'Auto Repair', hex: '#7c3aed', staticColor: '0x7c3aed', icon: '🔧' },
  tire_shop: { label: 'Tyre Shops', hex: '#0284c7', staticColor: '0x0284c7', icon: '🛞' },
  atm: { label: 'ATMs', hex: '#2563eb', staticColor: '0x2563eb', icon: '🏧' },
  ev_charging: { label: 'EV Charging', hex: '#16a34a', staticColor: '0x16a34a', icon: '⚡' },
  parking: { label: 'Parking & Rest', hex: '#db2777', staticColor: '0xdb2777', icon: '🅿️' },
  attractions: { label: 'Attractions', hex: '#4f46e5', staticColor: '0x4f46e5', icon: '🏛️' },
};

/**
 * Builds Google Static Maps API URL with simplified route polyline and categorized markers
 */
export const buildStaticMapUrl = ({
  polyline = '',
  origin = null,
  destination = null,
  places = [],
  apiKey = '',
  width = 720,
  height = 360,
  maxRoutePoints = 180,
  maxServiceMarkers = 28,
}) => {
  const key = apiKey || import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  // 1. Decode & Simplify Polyline using Douglas-Peucker
  let points = [];
  if (polyline) {
    points = decodeGooglePolyline(polyline);
  }
  const simplifiedPoints = simplifyToMaxPoints(points, maxRoutePoints);
  const encodedPath = encodeGooglePolyline(simplifiedPoints);

  const origLat = origin?.coordinates?.latitude ?? origin?.lat ?? (points[0]?.lat);
  const origLng = origin?.coordinates?.longitude ?? origin?.lng ?? (points[0]?.lng);
  const destLat = destination?.coordinates?.latitude ?? destination?.lat ?? (points[points.length - 1]?.lat);
  const destLng = destination?.coordinates?.longitude ?? destination?.lng ?? (points[points.length - 1]?.lng);

  // 2. Base static map URL
  const params = [
    `size=${width}x${height}`,
    `scale=2`, // Retina resolution for crisp PDF print
    `maptype=roadmap`,
  ];

  // 3. Add Royal Blue Route Polyline (#1a73e8 with weight 5)
  if (encodedPath) {
    params.push(`path=color:0x1a73e8ff|weight:5|enc:${encodeURIComponent(encodedPath)}`);
  }

  // 4. Start (Green A) and Destination (Red B) Markers
  if (origLat && origLng) {
    params.push(`markers=color:green|label:A|${origLat.toFixed(5)},${origLng.toFixed(5)}`);
  }
  if (destLat && destLng) {
    params.push(`markers=color:red|label:B|${destLat.toFixed(5)},${destLng.toFixed(5)}`);
  }

  // 5. Categorized Service Markers (color-coded, capped to avoid URL length overflow)
  if (Array.isArray(places) && places.length > 0) {
    // Group places by category
    const byCategory = {};
    places.forEach((p) => {
      const cat = p.category || 'other';
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(p);
    });

    // Sample evenly across categories up to maxServiceMarkers
    const selectedMarkers = [];
    const catKeys = Object.keys(byCategory);
    const perCat = Math.max(1, Math.floor(maxServiceMarkers / catKeys.length));

    catKeys.forEach((catKey) => {
      const items = byCategory[catKey];
      const sampled = items.slice(0, perCat);
      sampled.forEach((item) => {
        if (item.latitude && item.longitude) {
          selectedMarkers.push({
            lat: Number(item.latitude).toFixed(4),
            lng: Number(item.longitude).toFixed(4),
            category: catKey,
          });
        }
      });
    });

    // Group selected markers by color to optimize URL length
    const colorGroups = {};
    selectedMarkers.forEach((m) => {
      const cfg = CATEGORY_COLOR_CONFIG[m.category] || { staticColor: '0x475569' };
      const color = cfg.staticColor;
      if (!colorGroups[color]) colorGroups[color] = [];
      colorGroups[color].push(`${m.lat},${m.lng}`);
    });

    Object.entries(colorGroups).forEach(([color, coords]) => {
      params.push(`markers=size:tiny|color:${color}|${coords.join('|')}`);
    });
  }

  if (key) {
    params.push(`key=${key}`);
  }

  return `https://maps.googleapis.com/maps/api/staticmap?${params.join('&')}`;
};

export default buildStaticMapUrl;
