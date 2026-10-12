import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  HiOutlineMapPin,
  HiOutlineClock,
  HiOutlineStar,
  HiOutlineTrash,
  HiOutlineSparkles,
  HiOutlineChatBubbleLeftRight,
  HiOutlineArrowLeft,
  HiOutlineCurrencyRupee,
  HiOutlineBuildingOffice2,
  HiOutlineCake,
} from 'react-icons/hi2';
import api from '../api/axios';
import Button from '../components/common/Button';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import ErrorState from '../components/common/ErrorState';
import TripMap from '../components/map/TripMap';
import toast from 'react-hot-toast';

const TripDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeDay, setActiveDay] = useState(1);
  const [showAllDays, setShowAllDays] = useState(false);

  const [modifyInput, setModifyInput] = useState('');
  const [modifying, setModifying] = useState(false);
  const [showModifyPanel, setShowModifyPanel] = useState(false);
  const [latestModNote, setLatestModNote] = useState(null);

  const fetchTripDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/trips/${id}`);
      if (res.data.success && res.data.trip) {
        setTrip(res.data.trip);
        setError(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load trip details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTripDetails();
  }, [id]);

  const currentDayData = useMemo(() => {
    if (!trip?.itinerary) return null;
    return trip.itinerary.find((d) => d.day === activeDay) || trip.itinerary[0];
  }, [trip, activeDay]);

  const handleModifyTrip = async (e) => {
    e?.preventDefault();
    if (!modifyInput.trim()) return;

    setModifying(true);
    try {
      const res = await api.post('/ai/modify-itinerary', {
        tripId: id,
        modification: modifyInput.trim(),
      });

      if (res.data.success && res.data.trip) {
        setTrip(res.data.trip);
        setLatestModNote(res.data.modificationsApplied || modifyInput.trim());
        setModifyInput('');
        toast.success('Trip itinerary updated and saved!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to modify trip');
    } finally {
      setModifying(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this trip permanently?')) return;

    try {
      await api.delete(`/trips/${id}`);
      toast.success('Trip deleted');
      navigate('/my-trips');
    } catch (err) {
      toast.error('Failed to delete trip');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <LoadingSkeleton type="itinerary" count={2} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <ErrorState message={error} onRetry={fetchTripDetails} />
      </div>
    );
  }

  if (!trip) return null;

  const budget = trip.budgetSummary || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in space-y-8">
      {/* Back to trips link */}
      <div>
        <Link
          to="/my-trips"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-primary-600 transition-colors"
        >
          <HiOutlineArrowLeft className="w-4 h-4" /> Back to My Saved Trips
        </Link>
      </div>

      {/* Header Banner */}
      <div className="card p-6 sm:p-8 bg-gradient-to-br from-white via-indigo-50/20 to-slate-50 border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary-700 border border-primary-200 text-xs font-bold uppercase tracking-wider">
            <HiOutlineSparkles className="w-3.5 h-3.5" />
            Saved Itinerary
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            {trip.destination}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500 pt-1">
            <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-lg">
              📅 {trip.numberOfDays} Days
            </span>
            <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-lg">
              👥 {trip.travelers || 2} Travelers
            </span>
            <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-lg capitalize">
              ⚡ {trip.travelStyle || 'Balanced'} Pace
            </span>
            {budget.estimatedTotal > 0 && (
              <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-lg">
                💰 ₹{budget.estimatedTotal.toLocaleString()} Budget
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={() => setShowModifyPanel(!showModifyPanel)} variant="secondary" size="md">
            <HiOutlineChatBubbleLeftRight className="w-4 h-4 text-primary-600" />
            {showModifyPanel ? 'Hide AI Chat' : 'Modify with AI'}
          </Button>
          <Button onClick={handleDelete} variant="danger" size="md">
            <HiOutlineTrash className="w-4 h-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* AI Modify Panel */}
      {showModifyPanel && (
        <div className="card p-6 border-primary-200 bg-primary-50/40 animate-slide-up space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <HiOutlineSparkles className="w-4 h-4 text-primary-600" />
              Modify this saved itinerary with AI
            </div>
            <span className="text-[11px] text-slate-500 font-medium">Saves changes directly to database</span>
          </div>

          <form onSubmit={handleModifyTrip} className="flex gap-2">
            <input
              type="text"
              value={modifyInput}
              onChange={(e) => setModifyInput(e.target.value)}
              placeholder='e.g. "Add more evening viewpoints", "Make Day 1 more relaxed", "Add rooftop restaurants"'
              className="input-field flex-1"
            />
            <Button type="submit" loading={modifying} variant="accent" size="md">
              Apply & Save
            </Button>
          </form>
        </div>
      )}

      {latestModNote && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center justify-between animate-fade-in">
          <span>✨ Applied Modification: {latestModNote}</span>
          <button onClick={() => setLatestModNote(null)} className="text-emerald-600 hover:text-emerald-900">
            ✕
          </button>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Schedule (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Day Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {trip.itinerary?.map((day) => (
              <button
                key={day.day}
                onClick={() => {
                  setActiveDay(day.day);
                  setShowAllDays(false);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wide uppercase transition-all flex-shrink-0 ${
                  activeDay === day.day && !showAllDays
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                Day {day.day}
              </button>
            ))}

            <button
              onClick={() => setShowAllDays(true)}
              className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wide uppercase transition-all flex-shrink-0 ${
                showAllDays
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              🗺️ All Days
            </button>
          </div>

          {currentDayData && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div>
                  <h3 className="text-lg font-black text-slate-900">{currentDayData.title}</h3>
                  {currentDayData.theme && (
                    <p className="text-xs text-slate-500 mt-0.5">{currentDayData.theme}</p>
                  )}
                </div>
                <span className="text-xs font-bold text-primary-600 bg-primary-50 px-3 py-1 rounded-full border border-primary-100">
                  {currentDayData.activities?.length || 0} Stops
                </span>
              </div>

              {/* Activity Cards */}
              <div className="space-y-4">
                {currentDayData.activities?.map((activity, idx) => {
                  const place = activity.place || {};

                  return (
                    <div key={idx} className="space-y-2">
                      <div className="card p-5 hover:border-primary-300 transition-all bg-white">
                        <div className="flex items-start gap-4">
                          <div className="flex flex-col items-center justify-center w-20 flex-shrink-0 text-center p-2 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="text-xs font-black text-primary-600 leading-tight">
                              {activity.time}
                            </span>
                            <span className="text-[10px] uppercase font-bold text-slate-400 mt-0.5">
                              {activity.period || 'Stop'}
                            </span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-bold text-slate-900 text-base leading-snug">
                                {place.name || 'Selected Place'}
                              </h4>
                              {place.rating > 0 && (
                                <span className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md flex-shrink-0">
                                  <HiOutlineStar className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                  {place.rating}
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-1 truncate">
                              <HiOutlineMapPin className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
                              <span>{place.address || place.vicinity || 'Verified Google Coordinates'}</span>
                            </p>

                            {activity.notes && (
                              <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600">
                                💡 <span className="font-medium">{activity.notes}</span>
                              </div>
                            )}

                            <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                              <span className="capitalize font-semibold text-slate-500">
                                {place.category || 'Sightseeing'}
                              </span>
                              {activity.estimatedCost > 0 && (
                                <span className="font-bold text-emerald-600">
                                  Est. ₹{activity.estimatedCost.toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {activity.routeToNext && (
                        <div className="flex items-center gap-2.5 px-6 py-2 text-xs text-indigo-700 bg-indigo-50/70 border border-indigo-100 rounded-xl">
                          <span className="font-black">🚗 Route:</span>
                          <span>{activity.routeToNext.distance}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <HiOutlineClock className="w-3.5 h-3.5" />
                            {activity.routeToNext.duration}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Google Map + Stays + Dining (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Map */}
          <div className="card p-3 border-slate-200 shadow-sm overflow-hidden sticky top-20">
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 mb-2">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                📍 Interactive Geospatial Map
              </span>
              <span className="text-[11px] text-slate-500 font-semibold">
                {showAllDays ? 'All Days' : `Day ${activeDay}`}
              </span>
            </div>
            <div className="h-[360px] w-full">
              <TripMap trip={trip} activeDay={activeDay} showAllDays={showAllDays} />
            </div>
          </div>

          {/* Budget Breakdown */}
          <div className="card p-6 border-slate-200 bg-white">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <HiOutlineCurrencyRupee className="w-5 h-5 text-primary-600" />
              <h3 className="font-bold text-slate-900 text-sm">Budget Breakdown</h3>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>🏨 Stays & Hotels</span>
                <span className="font-bold text-slate-800">₹{(budget.accommodation || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>🍽️ Food & Dining</span>
                <span className="font-bold text-slate-800">₹{(budget.food || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>🎫 Activities & Attractions</span>
                <span className="font-bold text-slate-800">₹{(budget.activities || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>🚕 Local Transport</span>
                <span className="font-bold text-slate-800">₹{(budget.transport || 0).toLocaleString()}</span>
              </div>
              <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-sm font-black">
                <span className="text-slate-900">Total</span>
                <span className="text-primary-600">₹{(budget.estimatedTotal || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Hotels */}
          {trip.hotelRecommendations && trip.hotelRecommendations.length > 0 && (
            <div className="card p-6 border-slate-200 bg-white space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <HiOutlineBuildingOffice2 className="w-5 h-5 text-rose-500" />
                <h3 className="font-bold text-slate-900 text-sm">Curated Stays</h3>
              </div>
              <div className="space-y-3">
                {trip.hotelRecommendations.slice(0, 4).map((hotel, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 truncate max-w-[200px]">{hotel.name}</h4>
                      {hotel.rating > 0 && (
                        <span className="text-amber-600 font-bold">⭐ {hotel.rating}</span>
                      )}
                    </div>
                    <p className="text-slate-500 truncate">{hotel.address || hotel.vicinity}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Restaurants */}
          {trip.restaurantRecommendations && trip.restaurantRecommendations.length > 0 && (
            <div className="card p-6 border-slate-200 bg-white space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <HiOutlineCake className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-slate-900 text-sm">Curated Dining</h3>
              </div>
              <div className="space-y-3">
                {trip.restaurantRecommendations.slice(0, 4).map((rest, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 truncate max-w-[200px]">{rest.name}</h4>
                      {rest.rating > 0 && (
                        <span className="text-amber-600 font-bold">⭐ {rest.rating}</span>
                      )}
                    </div>
                    <p className="text-slate-500 truncate">{rest.address || rest.vicinity}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TripDetails;
