import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HiOutlineMapPin,
  HiOutlineCalendarDays,
  HiOutlineUsers,
  HiOutlineTrash,
  HiOutlineSparkles,
  HiOutlineArrowRight,
} from 'react-icons/hi2';
import api from '../api/axios';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import Button from '../components/common/Button';
import toast from 'react-hot-toast';

const MyTrips = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const res = await api.get('/trips');
      if (res.data.success) {
        setTrips(res.data.trips || []);
        setError(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load saved trips');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const handleDeleteTrip = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!window.confirm('Are you sure you want to delete this itinerary?')) return;

    try {
      await api.delete(`/trips/${id}`);
      setTrips((prev) => prev.filter((t) => t._id !== id));
      toast.success('Trip itinerary removed');
    } catch (err) {
      toast.error('Failed to delete trip');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900">My Saved Trips</h1>
        </div>
        <LoadingSkeleton type="cards" count={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <ErrorState message={error} onRetry={fetchTrips} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            My Saved Trips
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Access and manage all your AI-generated travel itineraries
          </p>
        </div>

        <Link to="/planner" className="btn-primary text-xs py-2.5 px-4 self-start sm:self-auto">
          <HiOutlineSparkles className="w-4 h-4" />
          Plan New Trip
        </Link>
      </div>

      {trips.length === 0 ? (
        <EmptyState
          icon="✈️"
          title="No Saved Trips Yet"
          message="You haven't generated or saved any trip itineraries yet. Plan your first adventure now!"
          action={
            <Link to="/planner" className="btn-accent text-sm">
              ✨ Plan Your First Trip
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => (
            <div
              key={trip._id}
              className="card group overflow-hidden flex flex-col justify-between border-slate-200 hover:border-primary-300 bg-white shadow-sm"
            >
              <div>
                {/* Header Banner */}
                <div className="h-32 bg-gradient-to-tr from-primary-700 via-indigo-600 to-accent-600 p-5 text-white flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl">🌴</div>
                  <div className="flex justify-between items-start z-10">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md">
                      {trip.numberOfDays} Days
                    </span>
                    <button
                      onClick={(e) => handleDeleteTrip(trip._id, e)}
                      title="Delete Trip"
                      className="p-1.5 rounded-lg bg-black/20 hover:bg-rose-600/80 text-white transition-colors"
                    >
                      <HiOutlineTrash className="w-4 h-4" />
                    </button>
                  </div>
                  <h3 className="text-xl font-extrabold text-white tracking-tight truncate z-10">
                    {trip.destination}
                  </h3>
                </div>

                {/* Content */}
                <div className="p-5 space-y-4">
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-semibold">
                    <span className="flex items-center gap-1">
                      <HiOutlineUsers className="w-4 h-4 text-slate-400" />
                      {trip.travelers || 2} Travelers
                    </span>
                    <span className="flex items-center gap-1 capitalize">
                      ⚡ {trip.travelStyle || 'Balanced'} Pace
                    </span>
                  </div>

                  {trip.budgetSummary?.estimatedTotal > 0 && (
                    <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex items-center justify-between text-xs">
                      <span className="text-emerald-800 font-medium">Estimated Budget:</span>
                      <span className="font-bold text-emerald-700">
                        ₹{trip.budgetSummary.estimatedTotal.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="p-5 pt-0">
                <Link
                  to={`/trips/${trip._id}`}
                  className="btn-secondary w-full text-xs py-2.5 flex items-center justify-center gap-1.5 font-bold text-primary-700 hover:text-primary-800 hover:bg-primary-50"
                >
                  Open Itinerary & Map
                  <HiOutlineArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyTrips;
