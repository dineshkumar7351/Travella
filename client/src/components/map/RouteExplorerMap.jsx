import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '100%',
  minHeight: '560px',
  borderRadius: '1rem',
};

const libraries = [];

const CATEGORY_MARKER_COLORS = {
  gas_station: 'https://maps.google.com/mapfiles/ms/icons/orange-dot.png',
  restaurants: 'https://maps.google.com/mapfiles/ms/icons/orange-dot.png',
  hotels: 'https://maps.google.com/mapfiles/ms/icons/purple-dot.png',
  cafe_24h: 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
  hospital: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
  pharmacy: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
  car_repair: 'https://maps.google.com/mapfiles/ms/icons/purple-dot.png',
  tire_shop: 'https://maps.google.com/mapfiles/ms/icons/ltblue-dot.png',
  atm: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
  ev_charging: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
  attractions: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
  parking: 'https://maps.google.com/mapfiles/ms/icons/pink-dot.png',
  default: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
};

// Polyline decoder utility
const decodeGooglePolyline = (encoded) => {
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

    poly.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return poly;
};

const RouteExplorerMap = ({
  routes = [],
  activeRouteId,
  onSelectRoute,
  places = [],
  customPinnedPlaces = [],
  origin,
  destination,
  selectedCategory = 'all',
  onSelectCategory,
  focusedPlace = null,
  focusedStep = null,
  isLoading = false,
}) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey || 'AIzaSyDummyKeyForFallbackRender1234567890',
    libraries,
  });

  const [selectedPlace, setSelectedPlace] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [mapTypeId, setMapTypeId] = useState('roadmap'); // 'roadmap' | 'hybrid'

  // Native Google Maps overlay references
  const polylineRef = useRef(null);
  const casingRef = useRef(null);
  const altPolylinesRef = useRef([]);
  const startMarkerRef = useRef(null);
  const destMarkerRef = useRef(null);

  // Coordinates
  const originPos = useMemo(() => {
    if (origin?.coordinates?.latitude && origin?.coordinates?.longitude) {
      return { lat: Number(origin.coordinates.latitude), lng: Number(origin.coordinates.longitude) };
    }
    return null;
  }, [origin]);

  const destinationPos = useMemo(() => {
    if (destination?.coordinates?.latitude && destination?.coordinates?.longitude) {
      return { lat: Number(destination.coordinates.latitude), lng: Number(destination.coordinates.longitude) };
    }
    return null;
  }, [destination]);

  // Decode or extract direct path from routes
  const decodedRoutePaths = useMemo(() => {
    return routes.map((r) => {
      let path = [];
      if (Array.isArray(r.path) && r.path.length > 0) {
        path = r.path.map((p) => ({ lat: Number(p.lat), lng: Number(p.lng) }));
      } else if (r.polyline) {
        path = decodeGooglePolyline(r.polyline);
      } else if (originPos && destinationPos) {
        const waypoints = (r.waypoints || []).map((w) => ({
          lat: Number(w.latitude ?? w.lat),
          lng: Number(w.longitude ?? w.lng),
        }));
        path = [originPos, ...waypoints, destinationPos];
      }
      return {
        id: r.id,
        name: r.name,
        isPrimary: r.isPrimary,
        path,
        distance: r.distance,
        duration: r.duration,
      };
    });
  }, [routes, originPos, destinationPos]);

  // Active route path
  const activePath = useMemo(() => {
    const found = decodedRoutePaths.find((r) => r.id === activeRouteId);
    return found ? found.path : decodedRoutePaths[0]?.path || [];
  }, [decodedRoutePaths, activeRouteId]);

  // Alternate route paths
  const alternatePaths = useMemo(() => {
    return decodedRoutePaths.filter((r) => r.id !== activeRouteId);
  }, [decodedRoutePaths, activeRouteId]);

  // Center coordinate
  const center = useMemo(() => {
    if (originPos) return originPos;
    if (destinationPos) return destinationPos;
    return { lat: 11.0168, lng: 76.9558 };
  }, [originPos, destinationPos]);

  // Filtered places: strictly filter by selectedCategory
  const displayedPlaces = useMemo(() => {
    if (!selectedCategory || selectedCategory === 'all') return places;
    return places.filter((p) => p.category === selectedCategory);
  }, [places, selectedCategory]);

  // ─────────────────────────────────────────────────────────────
  // 1. GUARANTEED NATIVE GOOGLE MAPS POLYLINE RENDERING
  // Directly attaches to Google Maps canvas so it NEVER fails!
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapInstance || !window.google || !activePath || activePath.length < 2) return;

    // Clean up previous polylines
    if (polylineRef.current) polylineRef.current.setMap(null);
    if (casingRef.current) casingRef.current.setMap(null);
    altPolylinesRef.current.forEach((p) => p.setMap(null));
    altPolylinesRef.current = [];

    // Draw alternate routes in gray
    alternatePaths.forEach((alt) => {
      if (alt.path && alt.path.length > 1) {
        const altPoly = new window.google.maps.Polyline({
          path: alt.path,
          geodesic: true,
          strokeColor: '#94a3b8',
          strokeOpacity: 0.8,
          strokeWeight: 5,
          zIndex: 5,
          map: mapInstance,
        });
        if (onSelectRoute) {
          altPoly.addListener('click', () => onSelectRoute(alt.id));
        }
        altPolylinesRef.current.push(altPoly);
      }
    });

    // Draw casing outline for high contrast on both satellite & roadmap
    casingRef.current = new window.google.maps.Polyline({
      path: activePath,
      geodesic: true,
      strokeColor: '#ffffff',
      strokeOpacity: 0.95,
      strokeWeight: 10,
      zIndex: 10,
      map: mapInstance,
    });

    // Draw official thick royal blue navigation line
    polylineRef.current = new window.google.maps.Polyline({
      path: activePath,
      geodesic: true,
      strokeColor: '#1a73e8', // Official Google Maps Royal Blue
      strokeOpacity: 1.0,
      strokeWeight: 6,
      zIndex: 11,
      map: mapInstance,
    });

    return () => {
      if (polylineRef.current) polylineRef.current.setMap(null);
      if (casingRef.current) casingRef.current.setMap(null);
      altPolylinesRef.current.forEach((p) => p.setMap(null));
    };
  }, [mapInstance, activePath, alternatePaths, onSelectRoute]);

  // ─────────────────────────────────────────────────────────────
  // 2. GUARANTEED NATIVE GOOGLE MAPS START (A) & END (B) MARKERS
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapInstance || !window.google) return;

    if (startMarkerRef.current) startMarkerRef.current.setMap(null);
    if (destMarkerRef.current) destMarkerRef.current.setMap(null);

    if (originPos) {
      startMarkerRef.current = new window.google.maps.Marker({
        position: originPos,
        map: mapInstance,
        title: `Start: ${origin?.query || 'Origin'}`,
        label: { text: 'A', color: '#ffffff', fontWeight: 'bold' },
        icon: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
        zIndex: 25,
      });
    }

    if (destinationPos) {
      destMarkerRef.current = new window.google.maps.Marker({
        position: destinationPos,
        map: mapInstance,
        title: `Destination: ${destination?.query || 'Destination'}`,
        label: { text: 'B', color: '#ffffff', fontWeight: 'bold' },
        icon: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
        zIndex: 25,
      });
    }

    return () => {
      if (startMarkerRef.current) startMarkerRef.current.setMap(null);
      if (destMarkerRef.current) destMarkerRef.current.setMap(null);
    };
  }, [mapInstance, originPos, destinationPos, origin, destination]);

  // ─────────────────────────────────────────────────────────────
  // 3. FIT BOUNDS TO ROUTE CORRIDOR
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (mapInstance && window.google) {
      const bounds = new window.google.maps.LatLngBounds();
      let hasPoints = false;

      if (originPos) { bounds.extend(originPos); hasPoints = true; }
      if (destinationPos) { bounds.extend(destinationPos); hasPoints = true; }

      if (activePath && activePath.length > 0) {
        const step = Math.max(1, Math.floor(activePath.length / 30));
        for (let i = 0; i < activePath.length; i += step) {
          bounds.extend(activePath[i]);
        }
        bounds.extend(activePath[activePath.length - 1]);
        hasPoints = true;
      }

      if (hasPoints) {
        mapInstance.fitBounds(bounds, { top: 70, bottom: 60, left: 60, right: 60 });
      }
    }
  }, [mapInstance, originPos, destinationPos, activePath]);

  // Pan and zoom to focused step
  useEffect(() => {
    if (focusedStep && focusedStep.location && mapInstance && window.google) {
      mapInstance.panTo({
        lat: Number(focusedStep.location.lat),
        lng: Number(focusedStep.location.lng),
      });
      mapInstance.setZoom(15);
    }
  }, [focusedStep, mapInstance]);

  // Pan and zoom to focused place
  useEffect(() => {
    if (focusedPlace && focusedPlace.latitude && focusedPlace.longitude && mapInstance && window.google) {
      setSelectedPlace(focusedPlace);
      mapInstance.panTo({
        lat: Number(focusedPlace.latitude),
        lng: Number(focusedPlace.longitude),
      });
      if (mapInstance.getZoom() < 13) {
        mapInstance.setZoom(14);
      }
    }
  }, [focusedPlace, mapInstance]);

  const onLoad = useCallback(
    (map) => {
      setMapInstance(map);
      if (window.google) {
        const bounds = new window.google.maps.LatLngBounds();
        let hasPoints = false;
        if (originPos) { bounds.extend(originPos); hasPoints = true; }
        if (destinationPos) { bounds.extend(destinationPos); hasPoints = true; }
        if (activePath && activePath.length > 0) {
          activePath.forEach((pt) => bounds.extend(pt));
          hasPoints = true;
        }
        if (hasPoints) {
          map.fitBounds(bounds, 60);
        }
      }
    },
    [originPos, destinationPos, activePath]
  );

  if (loadError) {
    return (
      <div className="card p-6 min-h-[560px] flex items-center justify-center bg-slate-100">
        <p className="text-sm text-red-600 font-semibold">Google Maps failed to load. Check network connection.</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="card p-6 min-h-[560px] flex items-center justify-center bg-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Loading Google Maps Navigation View...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[560px] rounded-2xl overflow-hidden shadow-sm border border-slate-200">
      {/* ── Top Floating Bar: Google Maps Search Along Route Pills ── */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-[82%] pointer-events-auto bg-white/95 backdrop-blur-md p-1.5 rounded-2xl shadow-lg border border-slate-200/80">
          {[
            { key: 'all', icon: '🌐', label: 'All' },
            { key: 'gas_station', icon: '⛽', label: 'Gas / Petrol' },
            { key: 'restaurants', icon: '🍽️', label: 'Food / Dhaba' },
            { key: 'hotels', icon: '🏨', label: 'Hotels' },
            { key: 'cafe_24h', icon: '☕', label: '24h Cafe' },
            { key: 'hospital', icon: '🏥', label: 'Medical' },
            { key: 'car_repair', icon: '🔧', label: 'Auto Repair' },
            { key: 'tire_shop', icon: '🛞', label: 'Tyre Shops' },
            { key: 'atm', icon: '🏧', label: 'ATMs' },
            { key: 'ev_charging', icon: '⚡', label: 'EV Charging' },
          ].map((cat) => (
            <button
              key={cat.key}
              onClick={() => onSelectCategory && onSelectCategory(cat.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shadow-sm ${
                selectedCategory === cat.key
                  ? 'bg-blue-600 text-white shadow-blue-500/25 ring-2 ring-blue-400'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* ── Satellite / Default Layer Toggle Button (Google Maps "Layers" style) ── */}
        <div className="pointer-events-auto">
          <button
            onClick={() => setMapTypeId((prev) => (prev === 'roadmap' ? 'hybrid' : 'roadmap'))}
            className="p-2 px-3 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 shadow-lg text-xs font-black flex items-center gap-1.5 transition-all"
            title="Toggle Satellite Imagery"
          >
            <span>{mapTypeId === 'roadmap' ? '🛰️' : '🗺️'}</span>
            <span>{mapTypeId === 'roadmap' ? 'Satellite' : 'Map'}</span>
          </button>
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 bg-slate-900/90 text-white backdrop-blur px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-xs font-bold animate-pulse">
          <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          Calculating real road directions & services...
        </div>
      )}

      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={10}
        onLoad={onLoad}
        mapTypeId={mapTypeId}
        options={{
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: true,
          mapTypeControl: false,
          fullscreenControl: true,
          gestureHandling: 'greedy',
          scrollwheel: true,
        }}
      >
        {/* ── Focused Step Marker (when user clicks a turn step in navigation list) ── */}
        {focusedStep && focusedStep.location && (
          <Marker
            position={{ lat: Number(focusedStep.location.lat), lng: Number(focusedStep.location.lng) }}
            title={`Step ${focusedStep.stepNumber}: ${focusedStep.instruction}`}
            label={{
              text: `${focusedStep.stepNumber}`,
              color: '#ffffff',
              fontWeight: 'bold',
              fontSize: '12px',
            }}
            icon="https://maps.google.com/mapfiles/ms/icons/yellow-dot.png"
            zIndex={30}
          />
        )}

        {/* ── User Custom Pinned Places Markers ── */}
        {(customPinnedPlaces || []).map((place, idx) => (
          <Marker
            key={`pinned_${place.placeId || idx}`}
            position={{ lat: Number(place.latitude), lng: Number(place.longitude) }}
            title={`Pinned: ${place.name}`}
            icon={
              place.originType === 'start'
                ? 'https://maps.google.com/mapfiles/ms/icons/green-dot.png'
                : place.originType === 'destination'
                ? 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
                : 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png'
            }
            onClick={() => setSelectedPlace(place)}
            zIndex={20}
          />
        ))}

        {/* ── Along-Route Service Places Markers Surrounding the Route ── */}
        {displayedPlaces.map((place) => (
          <Marker
            key={place.placeId}
            position={{ lat: Number(place.latitude), lng: Number(place.longitude) }}
            title={`${place.name} (${place.categoryLabel || place.category}) - ${place.detourDistance} from route`}
            icon={CATEGORY_MARKER_COLORS[place.category] || CATEGORY_MARKER_COLORS.default}
            onClick={() => setSelectedPlace(place)}
            zIndex={15}
          />
        ))}

        {/* ── Place Info Window ── */}
        {selectedPlace && (
          <InfoWindow
            position={{ lat: Number(selectedPlace.latitude), lng: Number(selectedPlace.longitude) }}
            onCloseClick={() => setSelectedPlace(null)}
          >
            <div className="p-2 max-w-[250px]">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-sm">{selectedPlace.categoryIcon || '📍'}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {selectedPlace.categoryLabel || selectedPlace.category}
                </span>
                {selectedPlace.is24Hours && (
                  <span className="text-[9px] font-extrabold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                    24/7 OPEN
                  </span>
                )}
              </div>

              <h4 className="font-bold text-slate-900 text-sm leading-snug">{selectedPlace.name}</h4>
              <p className="text-xs text-slate-500 mt-1">{selectedPlace.address || selectedPlace.vicinity}</p>

              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                {selectedPlace.detourDistance && (
                  <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                    🚗 {selectedPlace.detourDistance} from route ({selectedPlace.detourDuration})
                  </span>
                )}
                {selectedPlace.rating > 0 && (
                  <span className="font-bold text-amber-600 flex items-center gap-0.5">⭐ {selectedPlace.rating}</span>
                )}
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
};

export default React.memo(RouteExplorerMap);
