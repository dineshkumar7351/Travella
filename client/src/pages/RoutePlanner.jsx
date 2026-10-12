import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  HiOutlineMapPin,
  HiOutlineArrowPath,
  HiOutlineSparkles,
  HiOutlineClock,
  HiOutlineStar,
  HiOutlineCheck,
  HiOutlinePlus,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
} from 'react-icons/hi2';
import Button from '../components/common/Button';
import CityAutocomplete from '../components/common/CityAutocomplete';
import RouteExplorerMap from '../components/map/RouteExplorerMap';
import DownloadRouteModal from '../components/routes/DownloadRouteModal';
import api from '../api/axios';
import toast from 'react-hot-toast';

const ROUTE_PRESETS = [
  { from: 'Chinniyampalayam, Coimbatore', to: 'Ooty, Tamil Nadu', label: 'Coimbatore → Ooty Ghat Hwy' },
  { from: 'Coimbatore, Tamil Nadu', to: 'Goa, India', label: 'Coimbatore → Goa Highway' },
  { from: 'Mumbai, Maharashtra', to: 'Goa, India', label: 'Mumbai → Goa Road Trip' },
  { from: 'Bangalore, Karnataka', to: 'Coorg, Karnataka', label: 'Bangalore → Coorg Scenic' },
];

const TRAVEL_MODES = [
  { id: 'DRIVE', label: 'Driving (Car)', icon: '🚗' },
  { id: 'TWO_WHEELER', label: 'Two-Wheeler (Bike)', icon: '🏍️' },
  { id: 'WALK', label: 'Walking', icon: '🚶' },
];

const RoutePlanner = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Locations state
  const [origin, setOrigin] = useState(location.state?.initialOrigin || '');
  const [destination, setDestination] = useState(location.state?.initialDestination || '');
  const [travelMode, setTravelMode] = useState('DRIVE');

  const [loading, setLoading] = useState(false);
  const [routeData, setRouteData] = useState(null);
  const [activeRouteId, setActiveRouteId] = useState('route_1');

  // Turn-by-Turn Directions View ("route map with direction")
  const [showDirections, setShowDirections] = useState(false);
  const [focusedStep, setFocusedStep] = useState(null);

  // Selected Category for filtering along-route places
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Custom User Pinned Places on Map
  const [customPinnedPlaces, setCustomPinnedPlaces] = useState([]);

  // Currently focused place to highlight on map
  const [focusedPlace, setFocusedPlace] = useState(null);

  // Selected Stops to carry forward to trip itinerary
  const [selectedStops, setSelectedStops] = useState([]);

  // Download Route Map PDF modal state & map DOM ref
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const mapContainerRef = useRef(null);

  const togglePinPlace = (place, originType = 'route') => {
    const isPinned = customPinnedPlaces.some(
      (p) => (p.placeId && p.placeId === place.placeId) || (p.name && p.name === place.name)
    );
    if (isPinned) {
      setCustomPinnedPlaces((prev) =>
        prev.filter((p) => p.placeId !== place.placeId && p.name !== place.name)
      );
      toast('Removed pin from map', { icon: '📍' });
    } else {
      const enriched = {
        ...place,
        originType, // 'start', 'destination', or 'route'
      };
      setCustomPinnedPlaces((prev) => [...prev, enriched]);
      setFocusedPlace(enriched);
      toast.success(`Pinned ${place.name} on the map route!`);
    }
  };

  const handleFocusPlace = (place, originType = 'route') => {
    const isPinned = customPinnedPlaces.some(
      (p) => (p.placeId && p.placeId === place.placeId) || (p.name && p.name === place.name)
    );
    if (!isPinned) {
      const enriched = { ...place, originType };
      setCustomPinnedPlaces((prev) => [...prev, enriched]);
    }
    setFocusedPlace(place);
    toast(`Focused ${place.name} on map`, { icon: '📍' });
  };

  const handleExportPDF = () => {
    setIsDownloadModalOpen(true);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    toast.loading('Detecting your current location...', { id: 'geo' });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const locString = `Current Location (${latitude.toFixed(3)}, ${longitude.toFixed(3)})`;
        setOrigin(locString);
        toast.success('Found your location!', { id: 'geo' });
      },
      () => {
        toast.error('Could not detect location. Please type your city name.', { id: 'geo' });
      }
    );
  };

  // Trigger route planning
  const handlePlanRoute = async (customOrigin, customDest, customMode) => {
    const orig = customOrigin !== undefined ? customOrigin : origin;
    const dest = customDest !== undefined ? customDest : destination;
    const mode = customMode !== undefined ? customMode : travelMode;

    if (!orig.trim() || !dest.trim()) {
      toast.error('Please enter both starting point and destination');
      return;
    }

    setLoading(true);
    toast.loading('Calculating real road route & along-route services...', { id: 'routePlan' });
    try {
      const res = await api.post('/routes/plan', {
        origin: orig.trim(),
        destination: dest.trim(),
        travelMode: mode,
      });

      if (res.data.success) {
        setRouteData(res.data);
        setActiveRouteId(res.data.activeRouteId || 'route_1');
        const count = res.data.alongRoutePlaces?.totalPlaces || 0;
        toast.success(`Connected real road route with ${count} verified highway services!`, { id: 'routePlan' });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to calculate route and services', { id: 'routePlan' });
    } finally {
      setLoading(false);
    }
  };

  // If passed from external state, plan route
  useEffect(() => {
    if (location.state?.initialOrigin && location.state?.initialDestination) {
      handlePlanRoute(location.state.initialOrigin, location.state.initialDestination);
    }
  }, [location.state]);

  // Handle switching active route
  const handleSelectRoute = async (routeId) => {
    setActiveRouteId(routeId);
    const chosenRoute = routeData?.routes?.find((r) => r.id === routeId);

    if (chosenRoute) {
      toast(`Switched to ${chosenRoute.name}`, { icon: '🛣️' });

      try {
        const placesRes = await api.post('/routes/along-route', {
          polyline: chosenRoute.polyline,
          waypoints: chosenRoute.waypoints,
          steps: chosenRoute.steps,
          originName: routeData?.origin?.query,
          destName: routeData?.destination?.query,
        });

        if (placesRes.data.success) {
          setRouteData((prev) => ({
            ...prev,
            alongRoutePlaces: placesRes.data,
          }));
        }
      } catch (err) {
        console.warn('Error refreshing along-route places:', err.message);
      }
    }
  };

  const swapLocations = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
    if (destination.trim() && origin.trim()) {
      handlePlanRoute(destination, origin);
    }
  };

  const toggleStop = (place) => {
    if (selectedStops.some((s) => s.placeId === place.placeId)) {
      setSelectedStops((prev) => prev.filter((s) => s.placeId !== place.placeId));
      toast('Removed from trip stops', { icon: '🗑️' });
    } else {
      setSelectedStops((prev) => [...prev, place]);
      toast.success(`Added ${place.name} to itinerary stops!`);
    }
  };

  const handleCreateItinerary = () => {
    const activeRoute = routeData?.routes?.find((r) => r.id === activeRouteId);
    navigate('/planner', {
      state: {
        initialDestination: destination,
        initialPrompt: `Plan a road trip from ${origin} to ${destination} via ${activeRoute?.name || 'Highway Corridor'}. Include stops at: ${selectedStops.map((s) => s.name).join(', ') || 'key highway attractions and 24h rest areas'}`,
      },
    });
  };

  const activeRoute = routeData?.routes?.find((r) => r.id === activeRouteId) || routeData?.routes?.[0];
  const allPlaces = routeData?.alongRoutePlaces?.places || [];
  const categoriesList = routeData?.alongRoutePlaces?.categories || [];

  const filteredPlaces =
    selectedCategory === 'all'
      ? allPlaces
      : allPlaces.filter((p) => p.category === selectedCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in space-y-6">
      {/* ── Top Google Maps-Style Navigation Card ── */}
      <div className="card p-6 bg-white border-slate-200 shadow-md">
        {/* Travel Mode Selector Tabs (Google Maps style) */}
        <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-100 overflow-x-auto">
          {TRAVEL_MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => {
                setTravelMode(m.id);
                if (origin.trim() && destination.trim()) {
                  handlePlanRoute(origin, destination, m.id);
                }
              }}
              className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-sm ${
                travelMode === m.id
                  ? 'bg-blue-600 text-white shadow-blue-500/20'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <span className="text-base">{m.icon}</span>
              <span>{m.label}</span>
            </button>
          ))}

          <div className="ml-auto hidden md:flex items-center gap-2">
            <span className="text-xs text-slate-400 font-bold uppercase">Popular:</span>
            {ROUTE_PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => {
                  setOrigin(p.from);
                  setDestination(p.to);
                  handlePlanRoute(p.from, p.to);
                }}
                className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input Controls */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Origin */}
          <div className="md:col-span-5">
            <CityAutocomplete
              label="Starting Point (A)"
              value={origin}
              onChange={(val) => setOrigin(val)}
              placeholder="e.g. Chinniyampalayam, Coimbatore, Tamil Nadu"
              iconColor="text-emerald-500"
            />
            <button
              onClick={handleUseCurrentLocation}
              type="button"
              className="text-[11px] text-emerald-700 hover:text-emerald-800 font-bold mt-1 inline-flex items-center gap-1"
            >
              <span>📍</span> Use My Current Location
            </button>
          </div>

          {/* Swap Button */}
          <div className="md:col-span-1 flex justify-center md:pt-4">
            <button
              onClick={swapLocations}
              className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 shadow-sm transition-transform active:scale-95"
              title="Swap Locations"
            >
              <HiOutlineArrowPath className="w-4 h-4" />
            </button>
          </div>

          {/* Destination */}
          <div className="md:col-span-4">
            <CityAutocomplete
              label="Destination (B)"
              value={destination}
              onChange={(val) => setDestination(val)}
              placeholder="e.g. Ooty, Tamil Nadu"
              iconColor="text-rose-500"
            />
          </div>

          {/* Search CTA */}
          <div className="md:col-span-2 md:pt-4">
            <Button
              onClick={() => handlePlanRoute()}
              loading={loading}
              variant="accent"
              size="md"
              className="w-full font-bold shadow-md"
            >
              Get Directions
            </Button>
          </div>
        </div>
      </div>

      {/* ── Route Alternatives & Directions Summary Cards (Google Maps style) ── */}
      {routeData?.routes && routeData.routes.length > 0 && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {routeData.routes.map((r) => {
              const isActive = r.id === activeRouteId;
              const hasSteps = Array.isArray(r.steps) && r.steps.length > 0;
              return (
                <div
                  key={r.id}
                  onClick={() => handleSelectRoute(r.id)}
                  className={`card p-4 cursor-pointer transition-all duration-200 relative ${
                    isActive
                      ? 'border-2 border-blue-600 bg-blue-50/40 shadow-md ring-2 ring-blue-500/10'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">
                        {travelMode === 'TWO_WHEELER' ? '🏍️' : travelMode === 'WALK' ? '🚶' : '🚗'}
                      </span>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm leading-snug line-clamp-1">{r.name}</h4>
                        <span className="text-[11px] font-bold text-emerald-600">{r.diffSummary}</span>
                      </div>
                    </div>
                    {isActive ? (
                      <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-extrabold flex-shrink-0">
                        ACTIVE ROUTE
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 font-semibold">Select</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100">
                    <span className="text-base font-black text-slate-900">{r.duration}</span>
                    <span className="font-bold text-slate-600">{r.distance}</span>

                    {/* Details Button to open Turn-by-Turn Directions */}
                    {hasSteps && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectRoute(r.id);
                          setShowDirections((prev) => !prev);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold flex items-center gap-1 transition-all"
                      >
                        <span>Details</span>
                        {showDirections && isActive ? (
                          <HiOutlineChevronUp className="w-3 h-3" />
                        ) : (
                          <HiOutlineChevronDown className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Collapsible Turn-by-Turn Directions Drawer ("route map with direction") ── */}
          {showDirections && activeRoute?.steps && (
            <div className="card p-5 bg-white border-blue-200 shadow-md animate-slide-up space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-blue-50 text-blue-600 rounded-xl text-lg font-bold">🧭</span>
                  <div>
                    <h3 className="font-black text-slate-900 text-sm">
                      Turn-by-Turn Directions — {activeRoute.name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Total: {activeRoute.distance} • {activeRoute.duration} • {activeRoute.steps.length} steps. Click any turn to zoom map to that location.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowDirections(false)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  ✕ Close Directions
                </button>
              </div>

              {/* Steps Scrollable List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[360px] overflow-y-auto pr-1">
                {activeRoute.steps.map((step) => {
                  const isFocused = focusedStep?.stepNumber === step.stepNumber;
                  return (
                    <div
                      key={step.stepNumber}
                      onClick={() => setFocusedStep(step)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-2.5 ${
                        isFocused
                          ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500/20 shadow-sm'
                          : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/80 hover:border-slate-300'
                      }`}
                    >
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-[11px] flex items-center justify-center flex-shrink-0 mt-0.5">
                        {step.stepNumber}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 leading-snug">{step.instruction}</p>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                          <span className="font-semibold text-blue-700 bg-blue-100/60 px-1.5 py-0.2 rounded">
                            {step.distance}
                          </span>
                          {step.roadName && <span className="truncate">{step.roadName}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Empty State Prompt ── */}
      {!routeData && !loading && (
        <div className="card p-12 text-center bg-white border-slate-200 shadow-sm space-y-4">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center text-3xl shadow-sm">
            🛣️
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="font-black text-slate-900 text-lg">Enter Start & Destination Above</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Type your starting point (e.g. Chinniyampalayam, Coimbatore) and destination (e.g. Ooty) to immediately connect the road route line with real turn-by-turn directions.
            </p>
          </div>
          <div className="flex justify-center gap-2 pt-2">
            <button
              onClick={() => {
                setOrigin('Chinniyampalayam, Coimbatore');
                setDestination('Ooty, Tamil Nadu');
                handlePlanRoute('Chinniyampalayam, Coimbatore', 'Ooty, Tamil Nadu');
              }}
              className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-md hover:bg-blue-700 transition-all"
            >
              🚀 Try: Coimbatore → Ooty Route
            </button>
          </div>
        </div>
      )}

      {/* ── Main Section: Map (7 cols) + Side Panel (5 cols) ── */}
      {routeData && (
        <div className="space-y-6">
          {/* Header Bar with Export PDF & Pin Count */}
          <div className="card p-4 bg-white border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span>🛣️</span> Google Navigation Map & Along-Route Explorer
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Solid blue highway route line active. Click place cards or search pills to pin stops onto the route line!
              </p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold">
                📍 {customPinnedPlaces.length} Stops Pinned
              </span>

              <button
                onClick={() => setIsDownloadModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md shadow-blue-500/25 transition-all flex items-center gap-1.5"
                title="Download Route Map PDF with categorized along-route services"
              >
                <span>🗺️</span>
                <span>Download Route Map</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Interactive Google Route Map (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div
                ref={mapContainerRef}
                className="card p-3 border-slate-200 shadow-sm overflow-hidden sticky top-20 print-map-wrapper"
              >
                <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 mb-2">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    📍 Road Navigation Route Map
                  </span>
                  <span className="text-[11px] text-blue-700 font-bold bg-blue-50 px-2.5 py-0.5 rounded-full">
                    {activeRoute?.name || 'Active Route'}
                  </span>
                </div>

                <div className="h-[620px] w-full">
                  <RouteExplorerMap
                    routes={routeData?.routes || []}
                    activeRouteId={activeRouteId}
                    onSelectRoute={handleSelectRoute}
                    places={allPlaces}
                    customPinnedPlaces={customPinnedPlaces}
                    origin={routeData?.origin}
                    destination={routeData?.destination}
                    selectedCategory={selectedCategory}
                    onSelectCategory={setSelectedCategory}
                    focusedPlace={focusedPlace}
                    focusedStep={focusedStep}
                    isLoading={loading}
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Side Details & Services Panel (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Origin & Destination Famous Places */}
              <div className="card p-4 bg-white border-slate-200 shadow-sm space-y-4">
                <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
                  📍 Origin & Destination Highlights
                </h4>

                <div className="grid grid-cols-1 gap-4">
                  {/* Origin Famous Places Card */}
                  {routeData.origin?.details && (
                    <div className="p-3.5 rounded-xl bg-emerald-50/40 border border-emerald-200/80 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                            A
                          </span>
                          <h5 className="font-extrabold text-slate-900 text-xs">{routeData.origin?.query}</h5>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-700 uppercase">Start Point</span>
                      </div>

                      <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                        {[
                          ...(routeData.origin.details.attractions || []),
                          ...(routeData.origin.details.hotels || []),
                          ...(routeData.origin.details.restaurants || []),
                        ]
                          .slice(0, 6)
                          .map((item, idx) => {
                            const isPinned = customPinnedPlaces.some(
                              (p) => (p.placeId && p.placeId === item.placeId) || p.name === item.name
                            );
                            return (
                              <div
                                key={idx}
                                onClick={() => handleFocusPlace(item, 'start')}
                                className={`p-2 rounded-lg border text-xs flex items-center justify-between gap-2 cursor-pointer transition-all ${
                                  focusedPlace?.name === item.name
                                    ? 'bg-emerald-100 border-emerald-400 font-bold'
                                    : 'bg-white border-slate-200 hover:border-emerald-300'
                                }`}
                              >
                                <div className="truncate">
                                  <span className="font-bold text-slate-900 block truncate">{item.name}</span>
                                  <span className="text-[10px] text-slate-500">{item.address || item.vicinity}</span>
                                </div>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    togglePinPlace(item, 'start');
                                  }}
                                  className={`px-2 py-1 rounded text-[10px] font-extrabold flex-shrink-0 ${
                                    isPinned
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                  }`}
                                >
                                  {isPinned ? '✓ Pinned' : '+ Pin'}
                                </button>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {/* Destination Famous Places Card */}
                  {routeData.destination?.details && (
                    <div className="p-3.5 rounded-xl bg-rose-50/40 border border-rose-200/80 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs font-bold">
                            B
                          </span>
                          <h5 className="font-extrabold text-slate-900 text-xs">{routeData.destination?.query}</h5>
                        </div>
                        <span className="text-[10px] font-bold text-rose-700 uppercase">Destination</span>
                      </div>

                      <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                        {[
                          ...(routeData.destination.details.attractions || []),
                          ...(routeData.destination.details.hotels || []),
                          ...(routeData.destination.details.restaurants || []),
                        ]
                          .slice(0, 6)
                          .map((item, idx) => {
                            const isPinned = customPinnedPlaces.some(
                              (p) => (p.placeId && p.placeId === item.placeId) || p.name === item.name
                            );
                            return (
                              <div
                                key={idx}
                                onClick={() => handleFocusPlace(item, 'destination')}
                                className={`p-2 rounded-lg border text-xs flex items-center justify-between gap-2 cursor-pointer transition-all ${
                                  focusedPlace?.name === item.name
                                    ? 'bg-rose-100 border-rose-400 font-bold'
                                    : 'bg-white border-slate-200 hover:border-rose-300'
                                }`}
                              >
                                <div className="truncate">
                                  <span className="font-bold text-slate-900 block truncate">{item.name}</span>
                                  <span className="text-[10px] text-slate-500">{item.address || item.vicinity}</span>
                                </div>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    togglePinPlace(item, 'destination');
                                  }}
                                  className={`px-2 py-1 rounded text-[10px] font-extrabold flex-shrink-0 ${
                                    isPinned
                                      ? 'bg-rose-600 text-white'
                                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                  }`}
                                >
                                  {isPinned ? '✓ Pinned' : '+ Pin'}
                                </button>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Along-Route Services List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
                    ⛽ Services Along Route ({filteredPlaces.length})
                  </h4>
                </div>

                {/* Categories Filter Chips */}
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`chip ${selectedCategory === 'all' ? 'chip-active' : 'chip-inactive'}`}
                  >
                    <span>🌐</span>
                    <span>All ({allPlaces.length})</span>
                  </button>

                  {categoriesList.map((cat) => (
                    <button
                      key={cat.key}
                      onClick={() => setSelectedCategory(cat.key)}
                      className={`chip ${selectedCategory === cat.key ? 'chip-active' : 'chip-inactive'}`}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                      <span className="opacity-75 font-normal">({cat.count})</span>
                    </button>
                  ))}
                </div>

                {/* Places Along Route Scrollable Cards */}
                <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                  {filteredPlaces.length === 0 ? (
                    <div className="card p-6 text-center text-slate-400">
                      <p className="text-xs">No services found in this category along this route section.</p>
                    </div>
                  ) : (
                    filteredPlaces.map((place) => {
                      const isSelected = selectedStops.some((s) => s.placeId === place.placeId);
                      const isPinned = customPinnedPlaces.some(
                        (p) => (p.placeId && p.placeId === place.placeId) || p.name === place.name
                      );
                      const isFocused = focusedPlace?.name === place.name;

                      return (
                        <div
                          key={place.placeId}
                          onClick={() => handleFocusPlace(place, 'route')}
                          className={`card p-3.5 transition-all cursor-pointer bg-white flex items-start justify-between gap-3 ${
                            isFocused
                              ? 'border-2 border-blue-500 bg-blue-50/20 shadow-md ring-2 ring-blue-500/10'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-start gap-2.5 flex-1 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-lg flex-shrink-0">
                              {place.categoryIcon || '📍'}
                            </div>

                            <div className="flex-1 min-w-0 space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <h5 className="font-bold text-slate-900 text-xs truncate">{place.name}</h5>
                                {place.is24Hours && (
                                  <span className="text-[8px] font-black uppercase bg-emerald-100 text-emerald-800 px-1 py-0.5 rounded flex-shrink-0">
                                    24/7
                                  </span>
                                )}
                              </div>

                              <p className="text-[11px] text-slate-500 truncate">{place.address || place.vicinity}</p>

                              <div className="flex items-center gap-2 text-[11px] pt-1">
                                <span className="font-extrabold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                                  🚗 {place.detourDistance} ({place.detourDuration})
                                </span>
                                {place.rating > 0 && (
                                  <span className="font-bold text-amber-600">⭐ {place.rating}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                togglePinPlace(place, 'route');
                              }}
                              className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                                isPinned
                                  ? 'bg-amber-500 text-white'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              }`}
                              title={isPinned ? 'Pinned on Map' : 'Pin to Map'}
                            >
                              {isPinned ? '✓ Pinned' : '+ Pin'}
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleStop(place);
                              }}
                              className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                                isSelected
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              }`}
                              title={isSelected ? 'Stop Added' : 'Add Stop'}
                            >
                              {isSelected ? (
                                <HiOutlineCheck className="w-3.5 h-3.5" />
                              ) : (
                                <HiOutlinePlus className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Build Itinerary Button */}
                <div className="pt-2">
                  <Button onClick={handleCreateItinerary} variant="accent" size="md" className="w-full text-xs font-bold">
                    <HiOutlineSparkles className="w-4 h-4" />
                    Build Itinerary with {selectedStops.length} Stops
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Printable PDF Route & Directions Summary (Visible only when Printing / PDF) ── */}
      {routeData && (
        <div className="hidden print:block p-6 space-y-6 bg-white text-black border border-slate-300 rounded-xl my-6">
          <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-black tracking-tight">✈️ TRAVELMIND AI — NAVIGATION ROUTE REPORT</h1>
              <p className="text-sm font-semibold text-slate-700 mt-1">
                Route: <strong className="text-black">{origin}</strong> ➔ <strong className="text-black">{destination}</strong> via {activeRoute?.name || 'Highway Corridor'}
              </p>
            </div>
            <div className="text-right text-xs font-semibold">
              <p>Distance: <strong className="text-black">{activeRoute?.distance}</strong></p>
              <p>Duration: <strong className="text-black">{activeRoute?.duration}</strong></p>
              <p className="text-slate-500 mt-1">{new Date().toLocaleDateString()}</p>
            </div>
          </div>

          {/* Turn-by-Turn Directions Print Section */}
          {activeRoute?.steps && (
            <div className="space-y-3">
              <h3 className="font-extrabold text-sm uppercase tracking-wider border-b pb-1">
                🧭 Turn-by-Turn Navigation Steps ({activeRoute.steps.length} Steps)
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {activeRoute.steps.map((s) => (
                  <div key={s.stepNumber} className="p-2 border rounded border-slate-200">
                    <span className="font-bold mr-1">#{s.stepNumber}:</span>
                    <span>{s.instruction}</span>
                    <span className="text-slate-500 font-semibold ml-2">({s.distance})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pinned Locations List */}
          <div className="space-y-3">
            <h3 className="font-extrabold text-sm uppercase tracking-wider border-b pb-1">
              📍 Pinned Stops & Services Breakdown ({customPinnedPlaces.length} Pinned Markers)
            </h3>

            {customPinnedPlaces.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No custom pins selected.</p>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-300 bg-slate-50 font-bold">
                    <th className="py-2 px-2">#</th>
                    <th className="py-2 px-2">Type</th>
                    <th className="py-2 px-2">Place Name</th>
                    <th className="py-2 px-2">Address</th>
                    <th className="py-2 px-2">Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {customPinnedPlaces.map((pin, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="py-2 px-2 font-bold">{i + 1}</td>
                      <td className="py-2 px-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            pin.originType === 'start'
                              ? 'bg-emerald-100 text-emerald-800'
                              : pin.originType === 'destination'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {pin.originType === 'start' ? 'Start' : pin.originType === 'destination' ? 'Destination' : 'Along Route'}
                        </span>
                      </td>
                      <td className="py-2 px-2 font-bold">{pin.name}</td>
                      <td className="py-2 px-2 text-slate-600">{pin.address || pin.vicinity}</td>
                      <td className="py-2 px-2 font-bold text-amber-700">⭐ {pin.rating || 4.5}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── Download Route Map Modal ── */}
      <DownloadRouteModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
        route={activeRoute}
        origin={routeData?.origin}
        destination={routeData?.destination}
        places={allPlaces}
        travelMode={travelMode}
        activeCategoryFilter={selectedCategory}
        mapContainerRef={mapContainerRef}
      />
    </div>
  );
};

export default RoutePlanner;
