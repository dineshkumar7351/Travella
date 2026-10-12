import React, { useState, useMemo, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Polyline } from '@react-google-maps/api';
import { HiOutlineMapPin, HiOutlineStar, HiOutlineSparkles } from 'react-icons/hi2';

const containerStyle = {
  width: '100%',
  height: '100%',
  minHeight: '420px',
  borderRadius: '1rem',
};

const libraries = [];

const MARKER_ICONS = {
  attraction: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
  hotel: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
  restaurant: 'https://maps.google.com/mapfiles/ms/icons/orange-dot.png',
  default: 'https://maps.google.com/mapfiles/ms/icons/purple-dot.png',
};

// Polyline decoder
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

    poly.push({
      lat: lat / 1e5,
      lng: lng / 1e5,
    });
  }
  return poly;
};

const TripMap = ({ trip, activeDay = 1, showAllDays = false }) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const isKeyValid = apiKey && !apiKey.includes('your_google_maps') && !apiKey.includes('your-google-maps');

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: isKeyValid ? apiKey : 'AIzaSyDummyKeyForFallbackRender1234567890',
    libraries,
  });

  const [selectedMarker, setSelectedMarker] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);

  // Collect markers based on active day or show all
  const markers = useMemo(() => {
    if (!trip) return [];
    const list = [];

    // Filter day activities
    const daysToShow = showAllDays
      ? trip.itinerary || []
      : (trip.itinerary || []).filter((d) => d.day === activeDay);

    daysToShow.forEach((day) => {
      (day.activities || []).forEach((act, idx) => {
        if (act.place && act.place.latitude && act.place.longitude) {
          list.push({
            id: `${act.place.placeId || idx}_day${day.day}`,
            day: day.day,
            stopNumber: idx + 1,
            time: act.time,
            title: act.place.name,
            place: act.place,
            type: act.place.category === 'restaurant' ? 'restaurant' : 'attraction',
            position: {
              lat: Number(act.place.latitude),
              lng: Number(act.place.longitude),
            },
          });
        }
      });
    });

    // Add hotels
    (trip.hotelRecommendations || []).forEach((hotel, idx) => {
      if (hotel.latitude && hotel.longitude) {
        list.push({
          id: `hotel_${hotel.placeId || idx}`,
          title: hotel.name,
          place: hotel,
          type: 'hotel',
          position: {
            lat: Number(hotel.latitude),
            lng: Number(hotel.longitude),
          },
        });
      }
    });

    // Add restaurants
    (trip.restaurantRecommendations || []).forEach((rest, idx) => {
      if (rest.latitude && rest.longitude) {
        list.push({
          id: `rest_${rest.placeId || idx}`,
          title: rest.name,
          place: rest,
          type: 'restaurant',
          position: {
            lat: Number(rest.latitude),
            lng: Number(rest.longitude),
          },
        });
      }
    });

    return list;
  }, [trip, activeDay, showAllDays]);

  // Center coordinate
  const center = useMemo(() => {
    if (markers.length > 0) {
      return markers[0].position;
    }
    if (trip?.coordinates?.latitude && trip?.coordinates?.longitude) {
      return {
        lat: Number(trip.coordinates.latitude),
        lng: Number(trip.coordinates.longitude),
      };
    }
    return { lat: 15.2993, lng: 74.124 };
  }, [markers, trip]);

  // Full detailed road polyline for active day route
  const routePaths = useMemo(() => {
    const daysToShow = showAllDays
      ? trip?.itinerary || []
      : (trip?.itinerary || []).filter((d) => d.day === activeDay);

    const segments = [];

    daysToShow.forEach((day) => {
      const activities = day.activities || [];
      for (let i = 0; i < activities.length; i++) {
        const current = activities[i];
        const route = current.routeToNext;

        if (route && route.polyline) {
          const decoded = decodeGooglePolyline(route.polyline);
          if (decoded.length > 0) {
            segments.push(decoded);
          }
        } else if (i < activities.length - 1 && current.place && activities[i + 1].place) {
          segments.push([
            { lat: Number(current.place.latitude), lng: Number(current.place.longitude) },
            { lat: Number(activities[i + 1].place.latitude), lng: Number(activities[i + 1].place.longitude) },
          ]);
        }
      }
    });

    return segments;
  }, [trip, activeDay, showAllDays]);

  const onLoad = useCallback(
    (map) => {
      setMapInstance(map);
      if (markers.length > 0 && window.google) {
        const bounds = new window.google.maps.LatLngBounds();
        markers.forEach((m) => bounds.extend(m.position));
        map.fitBounds(bounds, 50);
      }
    },
    [markers]
  );

  const onUnmount = useCallback(() => {
    setMapInstance(null);
  }, []);

  // If Google Maps API key is not configured or failed to load, display interactive coordinates viewer
  if (!isKeyValid || loadError) {
    return (
      <div className="card p-6 min-h-[440px] flex flex-col justify-between bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl relative overflow-hidden shadow-lg border border-slate-700">
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl text-lg">🗺️</span>
              <div>
                <h3 className="font-bold text-white text-base">Connected Itinerary Map</h3>
                <p className="text-xs text-slate-400">
                  {trip?.destination} ({markers.length} mapped stops)
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <span className="text-[11px] px-2.5 py-1 bg-blue-500/20 text-blue-300 rounded-full border border-blue-500/30">
                ● Attractions
              </span>
              <span className="text-[11px] px-2.5 py-1 bg-rose-500/20 text-rose-300 rounded-full border border-rose-500/30">
                ● Hotels
              </span>
              <span className="text-[11px] px-2.5 py-1 bg-amber-500/20 text-amber-300 rounded-full border border-amber-500/30">
                ● Dining
              </span>
            </div>
          </div>

          <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
            {markers.slice(0, 8).map((m, idx) => (
              <div
                key={m.id || idx}
                onClick={() => setSelectedMarker(m)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  selectedMarker?.id === m.id
                    ? 'bg-indigo-600/30 border-indigo-400 text-white shadow-md'
                    : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                      m.type === 'hotel'
                        ? 'bg-rose-500/20 text-rose-300'
                        : m.type === 'restaurant'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-blue-500/20 text-blue-300'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold truncate max-w-[200px] sm:max-w-[280px]">{m.title}</h4>
                    <p className="text-[11px] text-slate-400 truncate max-w-[240px]">
                      {m.place.address || `${m.position.lat.toFixed(4)}, ${m.position.lng.toFixed(4)}`}
                    </p>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <span className="text-xs font-bold text-amber-400 flex items-center justify-end gap-1">
                    <HiOutlineStar className="w-3.5 h-3.5" />
                    {m.place.rating || 4.5}
                  </span>
                  <span className="text-[10px] text-slate-400 capitalize">{m.type}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Lat: {center.lat.toFixed(4)} | Lng: {center.lng.toFixed(4)}</span>
          <span className="text-indigo-400 font-medium flex items-center gap-1">
            <HiOutlineSparkles className="w-3.5 h-3.5" />
            Route Line Connected
          </span>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="card p-6 min-h-[420px] flex items-center justify-center bg-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Loading Google Maps Platform...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[420px] rounded-2xl overflow-hidden shadow-sm border border-slate-200">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={13}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
        }}
      >
        {/* Render Day Route Segments / Polylines with Google Maps Navigation Blue */}
        {routePaths.map((seg, idx) => (
          <React.Fragment key={idx}>
            {/* White outer border */}
            <Polyline
              path={seg}
              options={{
                strokeColor: '#ffffff',
                strokeOpacity: 0.9,
                strokeWeight: 8,
                zIndex: 2,
              }}
            />
            {/* Google Maps Blue Route Line */}
            <Polyline
              path={seg}
              options={{
                strokeColor: '#1a73e8', // Official Google Maps Blue
                strokeOpacity: 1.0,
                strokeWeight: 5,
                zIndex: 3,
              }}
            />
          </React.Fragment>
        ))}

        {/* Render Place Markers */}
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={marker.position}
            title={marker.title}
            label={
              marker.stopNumber
                ? {
                    text: String(marker.stopNumber),
                    color: '#ffffff',
                    fontWeight: 'bold',
                    fontSize: '11px',
                  }
                : undefined
            }
            icon={{
              url: MARKER_ICONS[marker.type] || MARKER_ICONS.default,
            }}
            onClick={() => setSelectedMarker(marker)}
          />
        ))}

        {/* Marker Popup Info Window */}
        {selectedMarker && (
          <InfoWindow
            position={selectedMarker.position}
            onCloseClick={() => setSelectedMarker(null)}
          >
            <div className="p-2 max-w-[220px]">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  selectedMarker.type === 'hotel'
                    ? 'bg-rose-100 text-rose-700'
                    : selectedMarker.type === 'restaurant'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-blue-100 text-blue-700'
                }`}
              >
                {selectedMarker.type}
              </span>
              <h4 className="font-bold text-slate-900 text-sm mt-1 mb-1">{selectedMarker.title}</h4>
              {selectedMarker.place.address && (
                <p className="text-xs text-slate-500 mb-2 truncate">{selectedMarker.place.address}</p>
              )}
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                <span className="font-semibold text-amber-600 flex items-center gap-1">
                  ⭐ {selectedMarker.place.rating || '4.5'}
                </span>
                {selectedMarker.time && (
                  <span className="text-slate-500 font-medium">{selectedMarker.time}</span>
                )}
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
};

export default React.memo(TripMap);
