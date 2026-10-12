import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  HiOutlineSparkles,
  HiOutlineMapPin,
  HiOutlineClock,
  HiOutlineCurrencyRupee,
  HiOutlineShieldCheck,
  HiOutlineArrowRight,
  HiOutlineFire,
} from 'react-icons/hi2';
import Button from '../components/common/Button';
import { POPULAR_DESTINATIONS } from '../utils/constants';

const Home = () => {
  const navigate = useNavigate();
  const [naturalPrompt, setNaturalPrompt] = useState('');

  const handleQuickSubmit = (e) => {
    e.preventDefault();
    if (!naturalPrompt.trim()) return;
    navigate('/planner', { state: { initialPrompt: naturalPrompt } });
  };

  const selectDestination = (destName) => {
    navigate('/planner', { state: { initialDestination: destName } });
  };

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 bg-gradient-to-b from-indigo-50/50 via-white to-slate-50">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary-200/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -right-24 w-96 h-96 bg-accent-200/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-50 border border-primary-200 text-primary-700 text-xs font-bold tracking-wide uppercase shadow-sm">
              <HiOutlineSparkles className="w-4 h-4 text-primary-600" />
              Powered by Groq High-Speed AI & Google Maps Platform
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
              Intelligent Travel Itineraries with{' '}
              <span className="gradient-text">Real Coordinates & Routes</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal max-w-2xl mx-auto">
              Tell us your dream trip in plain English or configure your preferences. TravelMind AI fetches real attractions from Google Places, calculates drive times with Google Routes, and orchestrates an optimized day-by-day itinerary.
            </p>

            {/* Quick Natural Language Input Bar */}
            <form onSubmit={handleQuickSubmit} className="max-w-2xl mx-auto mt-8">
              <div className="card p-2 flex flex-col sm:flex-row items-center gap-2 border-primary-200 shadow-lg shadow-indigo-500/5 focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all">
                <div className="flex items-center gap-3 px-3 py-2 w-full">
                  <span className="text-xl">💬</span>
                  <input
                    type="text"
                    value={naturalPrompt}
                    onChange={(e) => setNaturalPrompt(e.target.value)}
                    placeholder='e.g. "Plan a 5-day Goa trip for 2 under ₹50,000 with beaches, food & adventure"'
                    className="w-full bg-transparent text-slate-900 placeholder-slate-400 text-sm focus:outline-none"
                  />
                </div>
                <Button type="submit" variant="accent" size="md" className="w-full sm:w-auto flex-shrink-0">
                  <HiOutlineSparkles className="w-4 h-4" />
                  Plan Trip
                </Button>
              </div>
            </form>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs text-slate-500 font-medium">
              <span className="text-slate-400">Popular Quick Prompts:</span>
              <button
                onClick={() =>
                  setNaturalPrompt('Plan a 5-day Goa trip for 2 people under ₹50,000 with beaches, food and adventure')
                }
                className="hover:text-primary-600 underline text-slate-600 transition-colors"
              >
                Goa 5-day Under ₹50k
              </button>
              <span>•</span>
              <button
                onClick={() =>
                  setNaturalPrompt('Plan a 4-day heritage tour to Jaipur & Udaipur for 2 travelers with royal palaces & cuisine')
                }
                className="hover:text-primary-600 underline text-slate-600 transition-colors"
              >
                Rajasthan 4-day Heritage
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Verified Real-World Architecture Highlights */}
      <section className="py-16 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-3">
              Never Hallucinated. Always Grounded.
            </h2>
            <p className="text-slate-500 text-sm">
              Unlike generic chatbot planners that make up fake locations and impossible travel times, TravelMind AI integrates real-world API data.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card p-6 border-slate-200 flex flex-col items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl">
                📍
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base mb-1">Real Google Places Data</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Real coordinates, opening hours, verified ratings, and authentic addresses queried directly through Google Places API (New).
                </p>
              </div>
            </div>

            <div className="card p-6 border-slate-200 flex flex-col items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-2xl">
                🚗
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base mb-1">Google Routes Distance Engine</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Exact drive distances, live transit estimates, and route polylines calculated between each stop so you never waste hours in traffic.
                </p>
              </div>
            </div>

            <div className="card p-6 border-slate-200 flex flex-col items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center text-2xl">
                🧠
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base mb-1">Groq AI Highway & Trip Tuning</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Advanced clustering and prompt engineering to organize places according to your pace, budget, dietary needs, and travel style.
                </p>
              </div>
            </div>
          </div>

          {/* Route-First Travel Spotlight Card */}
          <div className="mt-8 card p-6 sm:p-8 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg border border-slate-800">
            <div className="space-y-2 max-w-xl">
              <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                New Feature
              </span>
              <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                🛣️ Route-First Travel & Highway Services
              </h3>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                Driving between cities? Select preferred highway corridors, evaluate traffic-aware alternative routes, and find 24h tea stalls, emergency hospitals, EV fast chargers, petrol stations, and tyre repair shops along your exact path.
              </p>
            </div>
            <Link to="/route-planner" className="btn-accent text-xs sm:text-sm py-3 px-6 whitespace-nowrap">
              Explore Route Planner <HiOutlineArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Destinations */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <div className="flex items-center gap-2 text-primary-600 font-bold text-xs uppercase tracking-wider mb-1">
                <HiOutlineFire className="w-4 h-4" />
                Trending Destinations
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Where do you want to explore?
              </h2>
            </div>
            <Link to="/planner" className="btn-secondary text-xs self-start sm:self-auto">
              Custom Destination <HiOutlineArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {POPULAR_DESTINATIONS.map((dest) => (
              <div
                key={dest.name}
                onClick={() => selectDestination(dest.name)}
                className="card p-5 cursor-pointer group hover:-translate-y-1 hover:border-primary-300 transition-all duration-200 bg-white"
              >
                <div className="text-3xl mb-3">{dest.image}</div>
                <h4 className="font-bold text-slate-900 text-base group-hover:text-primary-600 transition-colors">
                  {dest.name}
                </h4>
                <p className="text-xs text-slate-500 font-medium mt-1">{dest.tag}</p>
                <div className="mt-4 flex items-center gap-1 text-xs font-bold text-primary-600">
                  Plan Itinerary <HiOutlineArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Footer Banner */}
      <section className="py-16 bg-gradient-to-r from-primary-900 via-indigo-900 to-slate-900 text-white relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready to experience effortless trip planning?
          </h2>
          <p className="text-slate-300 text-base max-w-xl mx-auto">
            Generate customized itineraries in seconds with full day schedules, hotels, dining, and maps.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link to="/planner" className="btn-accent text-sm py-3 px-8 w-full sm:w-auto">
              ✨ Start Planning Now
            </Link>
            <Link to="/register" className="btn-secondary text-sm py-3 px-8 w-full sm:w-auto bg-white/10 text-white border-white/20 hover:bg-white/20">
              Create Free Account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
