import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { CATEGORY_COLOR_CONFIG, buildStaticMapUrl } from './buildStaticMapUrl.js';
import { decodeGooglePolyline } from './simplifyPolyline.js';

/**
 * Calculates Haversine distance in meters between two lat/lng points
 */
const calculateHaversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
};

/**
 * Estimates distance from start (in meters) along the route for a given place
 */
export const getDistanceFromStartMeters = (place, routePoints = []) => {
  const pLat = place.latitude ?? place.lat;
  const pLng = place.longitude ?? place.lng;
  if (!pLat || !pLng || !routePoints || routePoints.length < 2) return 0;

  // Find closest point index on route
  let minDistance = Infinity;
  let closestIndex = 0;

  for (let i = 0; i < routePoints.length; i++) {
    const d = calculateHaversine(pLat, pLng, routePoints[i].lat, routePoints[i].lng);
    if (d < minDistance) {
      minDistance = d;
      closestIndex = i;
    }
  }

  // Calculate cumulative distance up to closest point
  let cumulative = 0;
  for (let i = 0; i < closestIndex; i++) {
    cumulative += calculateHaversine(
      routePoints[i].lat,
      routePoints[i].lng,
      routePoints[i + 1].lat,
      routePoints[i + 1].lng
    );
  }

  return cumulative;
};

/**
 * Loads an image URL and converts it into a Base64 data URL
 */
const loadImageAsBase64 = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = (e) => reject(new Error('Failed to load image from URL'));
    img.src = url;
  });
};

/**
 * Captures map container using html2canvas as fallback
 */
export const captureMapContainer = async (mapElement) => {
  if (!mapElement) return null;
  try {
    const canvas = await html2canvas(mapElement, {
      useCORS: true,
      allowTaint: true,
      scale: 2,
      logging: false,
      ignoreElements: (el) => el.classList?.contains('gm-control-active') || el.classList?.contains('gmnoprint'),
    });
    return canvas.toDataURL('image/png');
  } catch (err) {
    console.warn('html2canvas map capture fallback failed:', err.message);
    return null;
  }
};

/**
 * Clean file name utility: Travella_<Start>_to_<Destination>.pdf
 */
export const generatePdfFileName = (startName = 'Start', destName = 'Destination', ext = 'pdf') => {
  const sanitize = (str) =>
    (str || 'Location')
      .split(',')[0]
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .replace(/_+/g, '_');

  return `Travella_${sanitize(startName)}_to_${sanitize(destName)}.${ext}`;
};

/**
 * Core PDF Export Function
 * Renders A4 Landscape PDF with Header, Map Image, Legend, and Services Table
 */
export const exportRoutePdf = async ({
  route,
  origin,
  destination,
  places = [],
  travelMode = 'DRIVE',
  mapElement = null,
  apiKey = '',
}) => {
  // 1. Prepare sorted places and distances
  const routePoints = route?.polyline ? decodeGooglePolyline(route.polyline) : (route?.path || []);

  const enrichedPlaces = places.map((p) => {
    const distMeters = getDistanceFromStartMeters(p, routePoints);
    return {
      ...p,
      distanceFromStartMeters: distMeters,
      distanceFromStartKm: (distMeters / 1000).toFixed(1),
    };
  });

  // Group by category, and sort each category by distance from start
  enrichedPlaces.sort((a, b) => {
    if (a.category === b.category) {
      return a.distanceFromStartMeters - b.distanceFromStartMeters;
    }
    return (a.category || '').localeCompare(b.category || '');
  });

  // 2. Fetch or Capture Map Image
  let mapImageBase64 = null;
  try {
    const staticMapUrl = buildStaticMapUrl({
      polyline: route?.polyline || '',
      origin,
      destination,
      places: enrichedPlaces,
      apiKey,
      width: 760,
      height: 340,
    });
    mapImageBase64 = await loadImageAsBase64(staticMapUrl);
  } catch (err) {
    console.warn('[PDF Export] Static Map API failed. Trying html2canvas fallback...');
    if (mapElement) {
      mapImageBase64 = await captureMapContainer(mapElement);
    }
  }

  // 3. Initialize jsPDF (A4 Landscape: 297mm x 210mm)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 297;
  const pageHeight = 210;
  const marginX = 14;
  let cursorY = 14;

  const startLabel = origin?.query || origin?.name || 'Starting Location';
  const destLabel = destination?.query || destination?.name || 'Destination Location';
  const modeLabel =
    travelMode === 'DRIVE' ? 'Driving (Car)' : travelMode === 'TWO_WHEELER' ? 'Two-Wheeler (Bike)' : 'Walking';
  const generatedDate = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  // ─────────────────────────────────────────────────────────────
  // 1. HEADER SECTION
  // ─────────────────────────────────────────────────────────────
  // Top Banner background
  doc.setFillColor(248, 250, 252); // slate-50
  doc.rect(marginX, cursorY, pageWidth - marginX * 2, 24, 'F');
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.rect(marginX, cursorY, pageWidth - marginX * 2, 24, 'S');

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(26, 115, 232); // Google Blue #1a73e8
  doc.text('Travella — Route Map', marginX + 6, cursorY + 8);

  // Metadata Grid
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85); // slate-700

  const col1X = marginX + 6;
  const col2X = marginX + 85;
  const col3X = marginX + 175;

  doc.setFont('helvetica', 'bold');
  doc.text('Start:', col1X, cursorY + 15);
  doc.setFont('helvetica', 'normal');
  doc.text(startLabel.substring(0, 38), col1X + 12, cursorY + 15);

  doc.setFont('helvetica', 'bold');
  doc.text('Destination:', col1X, cursorY + 20);
  doc.setFont('helvetica', 'normal');
  doc.text(destLabel.substring(0, 38), col1X + 22, cursorY + 20);

  doc.setFont('helvetica', 'bold');
  doc.text('Total Distance:', col2X, cursorY + 15);
  doc.setFont('helvetica', 'normal');
  doc.text(route?.distance || 'N/A', col2X + 24, cursorY + 15);

  doc.setFont('helvetica', 'bold');
  doc.text('Estimated Duration:', col2X, cursorY + 20);
  doc.setFont('helvetica', 'normal');
  doc.text(route?.duration || 'N/A', col2X + 32, cursorY + 20);

  doc.setFont('helvetica', 'bold');
  doc.text('Travel Mode:', col3X, cursorY + 15);
  doc.setFont('helvetica', 'normal');
  doc.text(modeLabel, col3X + 22, cursorY + 15);

  doc.setFont('helvetica', 'bold');
  doc.text('Generated On:', col3X, cursorY + 20);
  doc.setFont('helvetica', 'normal');
  doc.text(generatedDate, col3X + 25, cursorY + 20);

  cursorY += 28;

  // ─────────────────────────────────────────────────────────────
  // 2. MAP IMAGE SECTION
  // ─────────────────────────────────────────────────────────────
  const mapWidth = pageWidth - marginX * 2; // 269mm
  const mapHeight = 88; // 88mm high

  if (mapImageBase64) {
    try {
      doc.addImage(mapImageBase64, 'PNG', marginX, cursorY, mapWidth, mapHeight, undefined, 'FAST');
      doc.setDrawColor(203, 213, 225);
      doc.rect(marginX, cursorY, mapWidth, mapHeight, 'S');
      cursorY += mapHeight + 3;
    } catch (e) {
      console.warn('Could not render image in PDF:', e);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 2b. CATEGORY COLOR LEGEND BELOW MAP
  // ─────────────────────────────────────────────────────────────
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Map Marker Legend:', marginX, cursorY + 3);

  // Start "A" and Dest "B"
  let legendX = marginX + 32;

  // Green Start A
  doc.setFillColor(34, 197, 94);
  doc.circle(legendX + 2, cursorY + 2, 2, 'F');
  doc.text('A: Start', legendX + 6, cursorY + 3);
  legendX += 20;

  // Red Dest B
  doc.setFillColor(239, 68, 68);
  doc.circle(legendX + 2, cursorY + 2, 2, 'F');
  doc.text('B: Destination', legendX + 6, cursorY + 3);
  legendX += 26;

  // Active categories in the exported list
  const activeCategories = [...new Set(enrichedPlaces.map((p) => p.category))];
  activeCategories.slice(0, 8).forEach((catKey) => {
    const config = CATEGORY_COLOR_CONFIG[catKey] || { label: catKey, hex: '#475569' };
    const r = parseInt(config.hex.slice(1, 3), 16) || 71;
    const g = parseInt(config.hex.slice(3, 5), 16) || 85;
    const b = parseInt(config.hex.slice(5, 7), 16) || 105;

    doc.setFillColor(r, g, b);
    doc.rect(legendX, cursorY + 0.8, 3, 3, 'F');
    doc.setFont('helvetica', 'normal');
    doc.text(config.label, legendX + 4.5, cursorY + 3);
    legendX += doc.getTextWidth(config.label) + 7;
  });

  cursorY += 8;

  // ─────────────────────────────────────────────────────────────
  // 3. SERVICES TABLE (A4 Landscape, Grouped by Category)
  // ─────────────────────────────────────────────────────────────
  // If there's limited room on page 1, add a page for the table
  if (cursorY > pageHeight - 40) {
    doc.addPage();
    cursorY = 14;
  }

  const tableHeaders = [
    [
      'No.',
      'Name',
      'Category',
      'Location Details (Address / Lat, Lng)',
      'Dist. from Start',
      'Highway Detour',
      '24/7',
      'Phone',
      'Google Maps Link',
    ],
  ];

  const tableRows = enrichedPlaces.map((place, idx) => {
    const lat = Number(place.latitude || place.lat || 0).toFixed(4);
    const lng = Number(place.longitude || place.lng || 0).toFixed(4);
    const mapsLink = `https://www.google.com/maps?q=${lat},${lng}`;
    const address = (place.address || place.vicinity || 'Route Corridor').substring(0, 65);
    const is24h = place.is24Hours ? 'Yes' : 'No';
    const phone = place.phoneNumber || place.phone || 'N/A';

    return [
      idx + 1,
      place.name,
      place.categoryLabel || place.category,
      `${address}\n(${lat}, ${lng})`,
      `${place.distanceFromStartKm} km`,
      place.detourDistance ? `${place.detourDistance} (${place.detourDuration || ''})` : '150 m',
      is24h,
      phone,
      mapsLink,
    ];
  });

  autoTable(doc, {
    startY: cursorY,
    head: tableHeaders,
    body: tableRows,
    showHead: 'everyPage',
    theme: 'striped',
    margin: { left: marginX, right: marginX, bottom: 14 },
    styles: {
      fontSize: 8,
      cellPadding: 2,
      textColor: [30, 41, 59],
      overflow: 'linebreak',
      valign: 'middle',
    },
    headStyles: {
      fillColor: [26, 115, 232], // Royal Blue
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' }, // No.
      1: { cellWidth: 46, fontStyle: 'bold' }, // Name
      2: { cellWidth: 26 }, // Category
      3: { cellWidth: 62 }, // Location details
      4: { cellWidth: 24, halign: 'center' }, // Dist from start
      5: { cellWidth: 28, halign: 'center' }, // Detour
      6: { cellWidth: 12, halign: 'center' }, // 24/7
      7: { cellWidth: 20, halign: 'center' }, // Phone
      8: { cellWidth: 41, textColor: [26, 115, 232] }, // Google Maps Link
    },
    didDrawPage: (data) => {
      // Add Page Numbers at bottom center of each page
      const pageCount = doc.getNumberOfPages();
      const currentPage = data.pageNumber;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Travella Route Plan • Page ${currentPage} of ${pageCount}`,
        pageWidth / 2,
        pageHeight - 6,
        { align: 'center' }
      );
    },
  });

  // 4. Save the generated PDF
  const filename = generatePdfFileName(startLabel, destLabel, 'pdf');
  doc.save(filename);
  return filename;
};

/**
 * Optional CSV Export utility for the same route services table data
 */
export const exportRouteCsv = ({
  route,
  origin,
  destination,
  places = [],
}) => {
  const routePoints = route?.polyline ? decodeGooglePolyline(route.polyline) : (route?.path || []);

  const enrichedPlaces = places.map((p) => {
    const distMeters = getDistanceFromStartMeters(p, routePoints);
    return {
      ...p,
      distanceFromStartMeters: distMeters,
      distanceFromStartKm: (distMeters / 1000).toFixed(1),
    };
  });

  enrichedPlaces.sort((a, b) => a.distanceFromStartMeters - b.distanceFromStartMeters);

  const headers = [
    'No',
    'Name',
    'Category',
    'Address',
    'Latitude',
    'Longitude',
    'Distance from Start (km)',
    'Highway Detour',
    '24/7 Open',
    'Phone',
    'Google Maps URL',
  ];

  const rows = enrichedPlaces.map((p, idx) => {
    const lat = Number(p.latitude || p.lat || 0).toFixed(5);
    const lng = Number(p.longitude || p.lng || 0).toFixed(5);
    const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

    return [
      idx + 1,
      `"${(p.name || '').replace(/"/g, '""')}"`,
      `"${p.categoryLabel || p.category || ''}"`,
      `"${(p.address || p.vicinity || '').replace(/"/g, '""')}"`,
      lat,
      lng,
      p.distanceFromStartKm,
      `"${p.detourDistance || '150 m'}"`,
      p.is24Hours ? 'Yes' : 'No',
      `"${p.phoneNumber || p.phone || 'N/A'}"`,
      `"${mapsUrl}"`,
    ];
  });

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);

  const startLabel = origin?.query || origin?.name || 'Start';
  const destLabel = destination?.query || destination?.name || 'Destination';
  const filename = generatePdfFileName(startLabel, destLabel, 'csv');
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return filename;
};

export default {
  exportRoutePdf,
  exportRouteCsv,
  generatePdfFileName,
  getDistanceFromStartMeters,
};
