import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  HiOutlineSparkles,
  HiOutlineMapPin,
  HiOutlineCalendarDays,
  HiOutlineUsers,
  HiOutlineCurrencyRupee,
  HiOutlineChatBubbleBottomCenterText,
  HiOutlinePaperAirplane,
  HiOutlineCheck,
} from 'react-icons/hi2';
import useAuth from '../hooks/useAuth';
import Button from '../components/common/Button';
import CityAutocomplete from '../components/common/CityAutocomplete';
import api from '../api/axios';
import { INTERESTS, TRAVEL_STYLES, GENERATION_STEPS } from '../utils/constants';
import toast from 'react-hot-toast';

const TripPlanner = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [mode, setMode] = useState('form'); // 'form' or 'natural'
  const [naturalInput, setNaturalInput] = useState('');
  const [generating, setGenerating] = useState(false);
  const [activeStep, setActiveStep] = useState(1);

  const [formData, setFormData] = useState({
    destination: '',
    startingLocation: '',
    numberOfDays: 4,
    travelers: 2,
    budgetAmount: '50000',
    currency: 'INR',
    interests: ['beaches', 'food', 'adventure'],
    travelStyle: 'balanced',
    constraints: '',
  });

  // Prefill prompt or destination if coming from Home page
  useEffect(() => {
    if (location.state?.initialPrompt) {
      setMode('natural');
      setNaturalInput(location.state.initialPrompt);
    } else if (location.state?.initialDestination) {
      setFormData((prev) => ({
        ...prev,
        destination: location.state.initialDestination,
      }));
    }
  }, [location.state]);

  const toggleInterest = (id) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.includes(id)
        ? prev.interests.filter((item) => item !== id)
        : [...prev.interests, id],
    }));
  };

  const handleGenerateItinerary = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in or register to generate and save itineraries');
      navigate('/login', { state: { from: location } });
      return;
    }

    setGenerating(true);
    setActiveStep(1);

    try {
      let finalTripParams = null;

      if (mode === 'natural') {
        if (!naturalInput.trim()) {
          toast.error('Please enter your trip description');
          setGenerating(false);
          return;
        }

        // Step 1: Parse Natural Language
        setActiveStep(1);
        const parseRes = await api.post('/ai/parse-trip', { input: naturalInput.trim() });
        finalTripParams = parseRes.data.tripParams;
      } else {
        if (!formData.destination.trim()) {
          toast.error('Please enter a travel destination (e.g. Goa, Paris, Jaipur)');
          setGenerating(false);
          return;
        }

        finalTripParams = {
          destination: formData.destination.trim(),
          startingLocation: formData.startingLocation.trim(),
          numberOfDays: Math.min(Math.max(parseInt(formData.numberOfDays, 10) || 1, 1), 30),
          travelers: Math.min(Math.max(parseInt(formData.travelers, 10) || 1, 1), 20),
          budget: {
            amount: parseInt(formData.budgetAmount, 10) || 0,
            currency: formData.currency || 'INR',
          },
          interests: formData.interests,
          travelStyle: formData.travelStyle,
          constraints: formData.constraints.trim(),
        };
      }

      // Step 2 & 3: Progress step animation indicators
      setActiveStep(2);
      await new Promise((r) => setTimeout(r, 600));
      setActiveStep(3);
      await new Promise((r) => setTimeout(r, 600));
      setActiveStep(4);

      // Call generate itinerary endpoint
      const genRes = await api.post('/ai/generate-itinerary', finalTripParams);

      setActiveStep(5);
      await new Promise((r) => setTimeout(r, 400));

      if (genRes.data.success && genRes.data.trip) {
        toast.success(`Itinerary for ${genRes.data.trip.destination} created successfully!`);
        navigate('/itinerary', {
          state: {
            trip: genRes.data.trip,
            tripParams: finalTripParams,
            naturalLanguageInput: mode === 'natural' ? naturalInput : '',
          },
        });
      }
    } catch (error) {
      console.error('Itinerary generation error:', error);
      toast.error(error.response?.data?.message || 'Failed to generate itinerary. Please try again.');
    } finally {
      setGenerating(false);
      setActiveStep(1);
    }
  };

  // Full Screen Step Loader during generation
  if (generating) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 animate-fade-in">
        <div className="card p-8 sm:p-10 max-w-lg w-full shadow-2xl border-primary-200 bg-white text-center">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-primary-600 to-accent-500 text-white text-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary-500/20 animate-pulse-slow">
            ✈️
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-1">
            Generating Your Itinerary
          </h2>
          <p className="text-sm text-slate-500 mb-8">
            Querying Google geospatial engines and building an optimized plan...
          </p>

          <div className="space-y-3.5 text-left">
            {GENERATION_STEPS.map((stepItem) => {
              const isDone = activeStep > stepItem.step;
              const isCurrent = activeStep === stepItem.step;

              return (
                <div
                  key={stepItem.step}
                  className={`p-3.5 rounded-xl border transition-all duration-300 flex items-center gap-3.5 ${
                    isDone
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                      : isCurrent
                      ? 'bg-primary-50 border-primary-300 text-primary-900 shadow-sm ring-1 ring-primary-500/20'
                      : 'bg-slate-50/60 border-slate-200/60 text-slate-400'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      isDone
                        ? 'bg-emerald-500 text-white'
                        : isCurrent
                        ? 'bg-primary-600 text-white'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {isDone ? <HiOutlineCheck className="w-4 h-4" /> : stepItem.step}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold truncate">{stepItem.title}</h4>
                    <p className="text-[11px] opacity-75 truncate">{stepItem.desc}</p>
                  </div>
                  {isCurrent && (
                    <svg className="animate-spin h-4 w-4 text-primary-600 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      <div className="text-center max-w-2xl mx-auto mb-8">
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-2">
          Design Your Next Adventure
        </h1>
        <p className="text-slate-500 text-sm">
          Customize your preferences or describe your travel dream in free-form English.
        </p>
      </div>

      {/* Mode Switcher */}
      <div className="flex items-center justify-center gap-2 mb-8">
        <button
          type="button"
          onClick={() => setMode('form')}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs tracking-wide uppercase transition-all ${
            mode === 'form'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          📋 Structured Form
        </button>
        <button
          type="button"
          onClick={() => setMode('natural')}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs tracking-wide uppercase transition-all flex items-center gap-1.5 ${
            mode === 'natural'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <HiOutlineSparkles className="w-4 h-4 text-primary-500" />
          Natural Language AI
        </button>
      </div>

      {mode === 'natural' ? (
        /* Natural Language Mode Card */
        <div className="card p-6 sm:p-8 space-y-6 shadow-md border-slate-200">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Describe your trip in natural language
            </label>
            <div className="relative">
              <HiOutlineChatBubbleBottomCenterText className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
              <textarea
                rows={5}
                value={naturalInput}
                onChange={(e) => setNaturalInput(e.target.value)}
                placeholder='e.g. "Plan a 5-day Goa trip for 2 people under ₹50,000 with beaches, food and adventure. We love scenic sunsets, authentic seafood, and comfortable beachside hotels."'
                className="input-field pl-12 pt-3.5 text-sm resize-none"
              />
            </div>
            <p className="text-xs text-slate-400">
              Tip: Include destination, duration in days, number of travelers, budget in INR/USD, and preferred activities.
            </p>
          </div>

          <div className="pt-2">
            <Button onClick={handleGenerateItinerary} variant="accent" size="lg" className="w-full">
              <HiOutlineSparkles className="w-5 h-5" />
              Generate AI Itinerary
            </Button>
          </div>
        </div>
      ) : (
        /* Structured Form Card */
        <div className="card p-6 sm:p-8 space-y-8 shadow-md border-slate-200">
          {/* Primary Trip Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Destination */}
            <div className="sm:col-span-2">
              <CityAutocomplete
                label="Destination"
                required={true}
                value={formData.destination}
                onChange={(val) => setFormData({ ...formData, destination: val })}
                placeholder="e.g. Coimbatore, Goa, Paris, Jaipur..."
                iconColor="text-rose-500"
              />
            </div>

            {/* Starting Location */}
            <div>
              <CityAutocomplete
                label="Starting Location (Optional)"
                value={formData.startingLocation}
                onChange={(val) => setFormData({ ...formData, startingLocation: val })}
                placeholder="e.g. Chennai, Mumbai, Bangalore..."
                iconColor="text-emerald-500"
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Trip Duration (Days)
              </label>
              <div className="relative">
                <HiOutlineCalendarDays className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={formData.numberOfDays}
                  onChange={(e) => setFormData({ ...formData, numberOfDays: parseInt(e.target.value, 10) || 1 })}
                  className="input-field pl-10"
                />
              </div>
            </div>

            {/* Travelers */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Travelers
              </label>
              <div className="relative">
                <HiOutlineUsers className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={formData.travelers}
                  onChange={(e) => setFormData({ ...formData, travelers: parseInt(e.target.value, 10) || 1 })}
                  className="input-field pl-10"
                />
              </div>
            </div>

            {/* Budget */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Total Budget (₹ INR)
              </label>
              <div className="relative">
                <HiOutlineCurrencyRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  placeholder="e.g. 50000"
                  value={formData.budgetAmount}
                  onChange={(e) => setFormData({ ...formData, budgetAmount: e.target.value })}
                  className="input-field pl-10"
                />
              </div>
            </div>
          </div>

          {/* Travel Style Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              Travel Pace & Style
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {TRAVEL_STYLES.map((style) => (
                <div
                  key={style.id}
                  onClick={() => setFormData({ ...formData, travelStyle: style.id })}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    formData.travelStyle === style.id
                      ? 'border-primary-600 bg-primary-50/60 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{style.icon}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700">
                      {style.badge}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">{style.label}</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{style.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Interests Chips */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Interests & Activities
              </label>
              <span className="text-xs text-slate-400">{formData.interests.length} selected</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map((interest) => {
                const isSelected = formData.interests.includes(interest.id);
                return (
                  <div
                    key={interest.id}
                    onClick={() => toggleInterest(interest.id)}
                    className={`chip ${isSelected ? 'chip-active' : 'chip-inactive'}`}
                  >
                    <span>{interest.icon}</span>
                    <span>{interest.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Constraints & Specific Requests */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Special Constraints or Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={formData.constraints}
              onChange={(e) => setFormData({ ...formData, constraints: e.target.value })}
              placeholder="e.g. Vegetarian food only, preference for beachfront stays, avoid late night travel..."
              className="input-field text-sm resize-none"
            />
          </div>

          {/* Action CTA */}
          <div className="pt-4">
            <Button onClick={handleGenerateItinerary} variant="accent" size="lg" className="w-full">
              <HiOutlineSparkles className="w-5 h-5" />
              Generate Complete Itinerary
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripPlanner;
