/**
 * Douglas-Peucker Polyline Simplification Algorithm
 * Reduces polyline point count to stay within Google Static Maps URL length limits
 */

/**
 * Calculates perpendicular distance from a point to a line segment
 */
const getPerpendicularDistance = (point, lineStart, lineEnd) => {
  const pLat = point.lat ?? point.latitude;
  const pLng = point.lng ?? point.longitude;
  const sLat = lineStart.lat ?? lineStart.latitude;
  const sLng = lineStart.lng ?? lineStart.longitude;
  const eLat = lineEnd.lat ?? lineEnd.latitude;
  const eLng = lineEnd.lng ?? lineEnd.longitude;

  const dx = eLng - sLng;
  const dy = eLat - sLat;

  if (dx === 0 && dy === 0) {
    const latDiff = pLat - sLat;
    const lngDiff = pLng - sLng;
    return Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
  }

  const u = ((pLng - sLng) * dx + (pLat - sLat) * dy) / (dx * dx + dy * dy);
  const clampedU = Math.max(0, Math.min(1, u));

  const projLng = sLng + clampedU * dx;
  const projLat = sLat + clampedU * dy;

  const dLng = pLng - projLng;
  const dLat = pLat - projLat;

  return Math.sqrt(dLng * dLng + dLat * dLat);
};

/**
 * Standard Douglas-Peucker recursive simplification
 */
export const simplifyPolyline = (points = [], tolerance = 0.0005) => {
  if (!points || points.length <= 2) return points;

  let maxDistance = 0;
  let maxIndex = 0;
  const end = points.length - 1;

  for (let i = 1; i < end; i++) {
    const distance = getPerpendicularDistance(points[i], points[0], points[end]);
    if (distance > maxDistance) {
      maxDistance = distance;
      maxIndex = i;
    }
  }

  if (maxDistance > tolerance) {
    const left = simplifyPolyline(points.slice(0, maxIndex + 1), tolerance);
    const right = simplifyPolyline(points.slice(maxIndex), tolerance);
    return left.slice(0, -1).concat(right);
  }

  return [points[0], points[end]];
};

/**
 * Dynamically adjusts tolerance so the simplified point count is at most maxPoints (default ~180)
 */
export const simplifyToMaxPoints = (points = [], maxPoints = 180) => {
  if (!points || points.length <= maxPoints) return points;

  let minTol = 0.00001;
  let maxTol = 0.1;
  let result = points;

  // Binary search for ideal tolerance
  for (let iter = 0; iter < 12; iter++) {
    const midTol = (minTol + maxTol) / 2;
    const simplified = simplifyPolyline(points, midTol);

    if (simplified.length <= maxPoints) {
      result = simplified;
      maxTol = midTol; // try lower tolerance to retain more details
    } else {
      minTol = midTol; // increase tolerance to reduce points
    }
  }

  // If still above maxPoints, sample evenly
  if (result.length > maxPoints) {
    const sampled = [result[0]];
    const step = (result.length - 1) / (maxPoints - 1);
    for (let i = 1; i < maxPoints - 1; i++) {
      sampled.push(result[Math.round(i * step)]);
    }
    sampled.push(result[result.length - 1]);
    return sampled;
  }

  return result;
};

/**
 * Encodes array of { lat, lng } points into Google Encoded Polyline format
 */
export const encodeGooglePolyline = (points = []) => {
  if (!points || points.length === 0) return '';
  let encoded = '';
  let prevLat = 0;
  let prevLng = 0;

  for (const point of points) {
    const lat = Math.round((point.lat ?? point.latitude) * 1e5);
    const lng = Math.round((point.lng ?? point.longitude) * 1e5);

    let dLat = lat - prevLat;
    let dLng = lng - prevLng;

    prevLat = lat;
    prevLng = lng;

    [dLat, dLng].forEach((val) => {
      let num = val < 0 ? ~(val << 1) : val << 1;
      while (num >= 0x20) {
        encoded += String.fromCharCode((0x20 | (num & 0x1f)) + 63);
        num >>= 5;
      }
      encoded += String.fromCharCode(num + 63);
    });
  }

  return encoded;
};

/**
 * Decodes Google Encoded Polyline into LatLng array
 */
export const decodeGooglePolyline = (encoded = '') => {
  if (!encoded) return [];
  const poly = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    poly.push({
      lat: lat / 1e5,
      lng: lng / 1e5,
    });
  }
  return poly;
};

export default {
  simplifyPolyline,
  simplifyToMaxPoints,
  encodeGooglePolyline,
  decodeGooglePolyline,
};
