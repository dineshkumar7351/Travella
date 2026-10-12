import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-500 to-accent-500 flex items-center justify-center text-white text-lg font-bold">
                ✈️
              </div>
              <span className="text-xl font-extrabold text-white tracking-tight">TRAVELMIND AI</span>
            </div>
            <p className="text-slate-400 text-sm max-w-sm leading-relaxed">
              Production-grade AI itinerary orchestrator combining OpenAI natural language planning with verified Google Places and Google Routes data.
            </p>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span className="px-2 py-1 bg-slate-800 rounded-md border border-slate-700">Groq AI (Llama 3.3 70B)</span>
              <span className="px-2 py-1 bg-slate-800 rounded-md border border-slate-700">Google Places API</span>
              <span className="px-2 py-1 bg-slate-800 rounded-md border border-slate-700">Google Routes API</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider mb-3">Quick Navigation</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-slate-400 hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/planner" className="text-slate-400 hover:text-white transition-colors">
                  AI Trip Planner
                </Link>
              </li>
              <li>
                <Link to="/my-trips" className="text-slate-400 hover:text-white transition-colors">
                  My Saved Trips
                </Link>
              </li>
              <li>
                <Link to="/profile" className="text-slate-400 hover:text-white transition-colors">
                  User Profile
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider mb-3">Supported Features</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>• Natural language parsing</li>
              <li>• Google Places coordinates</li>
              <li>• Real-time distance matrix</li>
              <li>• Interactive Google Maps</li>
              <li>• AI-powered modifications</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} TravelMind AI. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built for precision travel planning with real-world Google geospatial data.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
