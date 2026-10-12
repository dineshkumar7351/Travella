import React, { useState, useEffect, useRef } from 'react';
import { HiOutlineMapPin, HiOutlineXMark, HiOutlineSparkles, HiOutlineFire } from 'react-icons/hi2';

// Rich database of popular Indian & Global destinations categorized by city, hill station, beach & heritage
const POPULAR_CITIES = [
  // Top Trending Curated Hubs
  { name: 'Ooty (Udhagamandalam)', state: 'Tamil Nadu', country: 'India', tag: 'Queen of Hill Stations', icon: '🌲', trending: true },
  { name: 'Coimbatore', state: 'Tamil Nadu', country: 'India', tag: 'Textile Hub & Western Ghats', icon: '🏙️', trending: true },
  { name: 'Goa', state: 'Goa', country: 'India', tag: 'Baga Beach & Sun', icon: '🏖️', trending: true },
  { name: 'Munnar', state: 'Kerala', country: 'India', tag: 'Tea Plantations & Anamudi', icon: '🍃', trending: true },
  { name: 'Chennai', state: 'Tamil Nadu', country: 'India', tag: 'Metropolis & Marina Beach', icon: '🌊', trending: true },
  { name: 'Manali', state: 'Himachal Pradesh', country: 'India', tag: 'Snow Peaks & Solang', icon: '🏔️', trending: true },
  { name: 'Bangalore (Bengaluru)', state: 'Karnataka', country: 'India', tag: 'Silicon Valley & Gardens', icon: '💻', trending: true },
  { name: 'Jaipur', state: 'Rajasthan', country: 'India', tag: 'Pink City & Hawa Mahal', icon: '🏰', trending: true },
  { name: 'Kodaikanal', state: 'Tamil Nadu', country: 'India', tag: 'Princess of Hill Stations', icon: '🌸', trending: true },
  { name: 'Wayanad', state: 'Kerala', country: 'India', tag: 'Caves & Waterfalls', icon: '🌴', trending: true },
  { name: 'Palakkad', state: 'Kerala', country: 'India', tag: 'Gateway of Kerala & Forts', icon: '🌴', trending: true },
  { name: 'Delhi', state: 'Delhi NCR', country: 'India', tag: 'National Capital & Red Fort', icon: '🏛️', trending: true },

  // O
  { name: 'Ooty Lake & Nilgiri', state: 'Tamil Nadu', country: 'India', tag: 'Toy Train & Botanical Gardens', icon: '🚂' },
  { name: 'Orchha', state: 'Madhya Pradesh', country: 'India', tag: 'Medieval Palaces & Betwa', icon: '🏰' },
  { name: 'Omkareshwar', state: 'Madhya Pradesh', country: 'India', tag: 'Sacred Jyotirlinga Island', icon: '🛕' },
  { name: 'Osian', state: 'Rajasthan', country: 'India', tag: 'Desert Oasis & Sun Temple', icon: '🐫' },
  { name: 'Ongole', state: 'Andhra Pradesh', country: 'India', tag: 'Coastal Andhra District', icon: '🌊' },
  { name: 'Orlando', state: 'Florida', country: 'USA', tag: 'Theme Parks & Disney', icon: '🎢' },
  { name: 'Osaka', state: 'Kansai', country: 'Japan', tag: 'Street Food & Osaka Castle', icon: '🍣' },
  { name: 'Oslo', state: 'Eastern Norway', country: 'Norway', tag: 'Fjords & Viking Museums', icon: '⛵' },
  { name: 'Oxford', state: 'Oxfordshire', country: 'United Kingdom', tag: 'Historic University City', icon: '🎓' },

  // C
  { name: 'Coonoor', state: 'Tamil Nadu', country: 'India', tag: 'Tea Gardens & Sim’s Park', icon: '🍃' },
  { name: 'Cochin (Kochi)', state: 'Kerala', country: 'India', tag: 'Fort Kochi & Backwaters', icon: '🌴' },
  { name: 'Calicut (Kozhikode)', state: 'Kerala', country: 'India', tag: 'Coastal Food Capital', icon: '🏖️' },
  { name: 'Chandigarh', state: 'Punjab & Haryana', country: 'India', tag: 'Planned City & Rock Garden', icon: '🌳' },
  { name: 'Coorg (Madikeri)', state: 'Karnataka', country: 'India', tag: 'Coffee Hill Station & Waterfalls', icon: '⛰️' },
  { name: 'Chikmagalur', state: 'Karnataka', country: 'India', tag: 'Mullayanagiri Peak & Coffee', icon: '☕' },
  { name: 'Corbett (Jim Corbett)', state: 'Uttarakhand', country: 'India', tag: 'National Park & Tigers', icon: '🐅' },
  { name: 'Cuttack', state: 'Odisha', country: 'India', tag: 'Silver City & Mahanadi', icon: '🏛️' },
  { name: 'Chittorgarh', state: 'Rajasthan', country: 'India', tag: 'Historic UNESCO Fortress', icon: '🏰' },
  { name: 'Chidambaram', state: 'Tamil Nadu', country: 'India', tag: 'Nataraja Temple City', icon: '🛕' },
  { name: 'Cairo', state: 'Giza', country: 'Egypt', tag: 'Pyramids of Giza & Nile', icon: '🐪' },
  { name: 'Cape Town', state: 'Western Cape', country: 'South Africa', tag: 'Table Mountain & Coastal', icon: '🏖️' },
  { name: 'Colombo', state: 'Western Province', country: 'Sri Lanka', tag: 'Tropical Coastal Capital', icon: '🌴' },
  { name: 'Chicago', state: 'Illinois', country: 'USA', tag: 'Skyline, Lake & Architecture', icon: '🌆' },
  { name: 'Cancun', state: 'Quintana Roo', country: 'Mexico', tag: 'Caribbean Beaches & Resorts', icon: '🏝️' },

  // M
  { name: 'Mumbai', state: 'Maharashtra', country: 'India', tag: 'Gateway of India & Marine Drive', icon: '🏙️' },
  { name: 'Madurai', state: 'Tamil Nadu', country: 'India', tag: 'Meenakshi Amman Temple', icon: '🛕' },
  { name: 'Mysore (Mysuru)', state: 'Karnataka', country: 'India', tag: 'Mysore Palace & Chamundi', icon: '👑' },
  { name: 'Mangalore (Mangaluru)', state: 'Karnataka', country: 'India', tag: 'Panambur Beach & Port', icon: '🌊' },
  { name: 'Mahabaleshwar', state: 'Maharashtra', country: 'India', tag: 'Strawberry Farms & Viewpoints', icon: '🍓' },
  { name: 'Matheran', state: 'Maharashtra', country: 'India', tag: 'Automobile-Free Hill Station', icon: '🐎' },
  { name: 'Mahabalipuram', state: 'Tamil Nadu', country: 'India', tag: 'Pancha Rathas UNESCO', icon: '🏛️' },
  { name: 'Mathura', state: 'Uttar Pradesh', country: 'India', tag: 'Krishna Janmabhoomi', icon: '🛕' },
  { name: 'Mount Abu', state: 'Rajasthan', country: 'India', tag: 'Nakki Lake & Dilwara Temples', icon: '⛰️' },
  { name: 'Mussoorie', state: 'Uttarakhand', country: 'India', tag: 'Kempty Falls & Mall Road', icon: '🌲' },
  { name: 'Madrid', state: 'Community of Madrid', country: 'Spain', tag: 'Art & Royal Palaces', icon: '🍷' },

  // K
  { name: 'Kochi (Cochin)', state: 'Kerala', country: 'India', tag: 'Chinese Fishing Nets & Mattancherry', icon: '🌴' },
  { name: 'Kolkata', state: 'West Bengal', country: 'India', tag: 'Victoria Memorial & Howrah Bridge', icon: '🎭' },
  { name: 'Kanyakumari', state: 'Tamil Nadu', country: 'India', tag: 'Vivekananda Rock Memorial', icon: '🌅' },
  { name: 'Kasol', state: 'Himachal Pradesh', country: 'India', tag: 'Kheerganga & Parvati Valley', icon: '🏕️' },
  { name: 'Kovalam', state: 'Kerala', country: 'India', tag: 'Lighthouse Beach & Ayurvedic Spas', icon: '🏖️' },
  { name: 'Kedarnath', state: 'Uttarakhand', country: 'India', tag: 'Himalayan Chardham Shrine', icon: '⛰️' },
  { name: 'Kullu', state: 'Himachal Pradesh', country: 'India', tag: 'Valley of Gods & Rafting', icon: '🏞️' },
  { name: 'Khajuraho', state: 'Madhya Pradesh', country: 'India', tag: 'UNESCO Erotic Sculptures', icon: '🛕' },
  { name: 'Kyoto', state: 'Kansai', country: 'Japan', tag: 'Fushimi Inari & Golden Pavilion', icon: '⛩️' },

  // J
  { name: 'Jodhpur', state: 'Rajasthan', country: 'India', tag: 'Mehrangarh Fort & Blue Houses', icon: '👑' },
  { name: 'Jaisalmer', state: 'Rajasthan', country: 'India', tag: 'Golden Fort & Sam Sand Dunes', icon: '🐫' },
  { name: 'Jammu', state: 'Jammu & Kashmir', country: 'India', tag: 'Raghunath Temple & Tawi River', icon: '🛕' },
  { name: 'Jabalpur', state: 'Madhya Pradesh', country: 'India', tag: 'Bhedaghat Marble Rocks', icon: '🌊' },

  // H
  { name: 'Hyderabad', state: 'Telangana', country: 'India', tag: 'Charminar & Golconda Fort', icon: '🍲' },
  { name: 'Hampi', state: 'Karnataka', country: 'India', tag: 'Vijayanagara Stone Chariot', icon: '🏛️' },
  { name: 'Haridwar', state: 'Uttarakhand', country: 'India', tag: 'Har Ki Pauri Ganga Aarti', icon: '🪔' },
  { name: 'Havelock Island (Swaraj Dweep)', state: 'Andaman & Nicobar', country: 'India', tag: 'Radhanagar Beach', icon: '🏝️' },

  // A
  { name: 'Agra', state: 'Uttar Pradesh', country: 'India', tag: 'Taj Mahal & Agra Fort', icon: '🕌' },
  { name: 'Ahmedabad', state: 'Gujarat', country: 'India', tag: 'Sabarmati Ashram & UNESCO City', icon: '🧵' },
  { name: 'Amritsar', state: 'Punjab', country: 'India', tag: 'Golden Temple & Wagah Border', icon: '✨' },
  { name: 'Alleppey (Alappuzha)', state: 'Kerala', country: 'India', tag: 'Vembanad Houseboats & Backwaters', icon: '🛶' },
  { name: 'Ajmer', state: 'Rajasthan', country: 'India', tag: 'Dargah Sharif & Pushkar Lake', icon: '🕌' },
  { name: 'Aurangabad (Chhatrapati Sambhajinagar)', state: 'Maharashtra', country: 'India', tag: 'Ajanta & Ellora Caves', icon: '🗿' },
  { name: 'Amsterdam', state: 'North Holland', country: 'Netherlands', tag: 'Canals & Rijksmuseum', icon: '🚲' },

  // T
  { name: 'Tiruppur', state: 'Tamil Nadu', country: 'India', tag: 'Textile Capital & Knitwear Hub', icon: '🧵', trending: true },
  { name: 'Tirupati', state: 'Andhra Pradesh', country: 'India', tag: 'Tirumala Venkateswara Temple', icon: '🛕' },
  { name: 'Trivandrum (Thiruvananthapuram)', state: 'Kerala', country: 'India', tag: 'Padmanabhaswamy Temple & Kovalam', icon: '🌴' },
  { name: 'Thanjavur', state: 'Tamil Nadu', country: 'India', tag: 'Brihadisvara Chola Temple', icon: '🛕' },
  { name: 'Trichy (Tiruchirappalli)', state: 'Tamil Nadu', country: 'India', tag: 'Rockfort & Ranganathaswamy', icon: '🛕' },
  { name: 'Tirunelveli', state: 'Tamil Nadu', country: 'India', tag: 'Nellaiappar Temple & Halwa', icon: '🛕' },
  { name: 'Tuticorin (Thoothukudi)', state: 'Tamil Nadu', country: 'India', tag: 'Pearl City & Port', icon: '⚓' },
  { name: 'Tokyo', state: 'Kanto', country: 'Japan', tag: 'Shibuya Crossing & Senso-ji', icon: '🍣' },

  // E & D
  { name: 'Erode', state: 'Tamil Nadu', country: 'India', tag: 'Turmeric City & Handlooms', icon: '🌿' },
  { name: 'Dindigul', state: 'Tamil Nadu', country: 'India', tag: 'Rock Fort & Biryani', icon: '🏰' },

  // U
  { name: 'Udaipur', state: 'Rajasthan', country: 'India', tag: 'City Palace & Lake Pichola', icon: '🏰' },
  { name: 'Ujjain', state: 'Madhya Pradesh', country: 'India', tag: 'Mahakaleshwar Jyotirlinga', icon: '🛕' },
  { name: 'Udupi', state: 'Karnataka', country: 'India', tag: 'Sri Krishna Matha & Malpe Beach', icon: '🛕' },

  // S
  { name: 'Salem', state: 'Tamil Nadu', country: 'India', tag: 'Mango City & Steel Hub', icon: '🥭', trending: true },
  { name: 'Shimla', state: 'Himachal Pradesh', country: 'India', tag: 'The Ridge & Jakhoo Temple', icon: '🌲' },
  { name: 'Srinagar', state: 'Jammu & Kashmir', country: 'India', tag: 'Dal Lake Houseboats & Mughal Gardens', icon: '⛵' },
  { name: 'Shillong', state: 'Meghalaya', country: 'India', tag: 'Scotland of the East & Waterfalls', icon: '🌿' },
  { name: 'Surat', state: 'Gujarat', country: 'India', tag: 'Diamond Capital & Dumas Beach', icon: '💎' },
  { name: 'Spiti Valley (Kaza)', state: 'Himachal Pradesh', country: 'India', tag: 'Key Monastery & Chandratal', icon: '🏔️' },
  { name: 'Singapore', state: 'Singapore', country: 'Singapore', tag: 'Gardens by the Bay & Marina Bay', icon: '🦁' },

  // R
  { name: 'Rishikesh', state: 'Uttarakhand', country: 'India', tag: 'Laxman Jhula & River Rafting', icon: '🧘' },
  { name: 'Rameswaram', state: 'Tamil Nadu', country: 'India', tag: 'Ramanathaswamy & Dhanushkodi', icon: '🌉' },
  { name: 'Ranchi', state: 'Jharkhand', country: 'India', tag: 'Dassam & Hundru Falls', icon: '💧' },
  { name: 'Rome', state: 'Lazio', country: 'Italy', tag: 'Colosseum & Vatican City', icon: '🏛️' },

  // N
  { name: 'Nagpur', state: 'Maharashtra', country: 'India', tag: 'Zero Mile & Tadoba Safari', icon: '🍊' },
  { name: 'Nainital', state: 'Uttarakhand', country: 'India', tag: 'Naini Lake & Snow View Point', icon: '⛵' },
  { name: 'Nashik', state: 'Maharashtra', country: 'India', tag: 'Wine Capital & Trimbakeshwar', icon: '🍇' },
  { name: 'New York', state: 'New York', country: 'USA', tag: 'Statue of Liberty & Times Square', icon: '🗽' },

  // L
  { name: 'Leh (Ladakh)', state: 'Ladakh UT', country: 'India', tag: 'Pangong Tso & Khardung La', icon: '🏔️' },
  { name: 'Lonavala', state: 'Maharashtra', country: 'India', tag: 'Tiger’s Leap & Karla Caves', icon: '🌧️' },
  { name: 'Lucknow', state: 'Uttar Pradesh', country: 'India', tag: 'Bara Imambara & Rumi Darwaza', icon: '👑' },
  { name: 'London', state: 'Greater London', country: 'United Kingdom', tag: 'Tower Bridge & Westminster', icon: '💂' },

  // V
  { name: 'Valparai', state: 'Tamil Nadu', country: 'India', tag: 'Tea Plantations & Anamalai', icon: '🍃' },
  { name: 'Varanasi', state: 'Uttar Pradesh', country: 'India', tag: 'Ganga Ghats & Kashi Vishwanath', icon: '🪔' },
  { name: 'Varkala', state: 'Kerala', country: 'India', tag: 'Cliff Beach & Arabian Sea', icon: '🏖️' },
  { name: 'Vellore', state: 'Tamil Nadu', country: 'India', tag: 'Golden Temple & Fort', icon: '🏰' },
  { name: 'Vijayawada', state: 'Andhra Pradesh', country: 'India', tag: 'Kanaka Durga & Prakasam', icon: '🌊' },
  { name: 'Visakhapatnam (Vizag)', state: 'Andhra Pradesh', country: 'India', tag: 'Rishikonda Beach & Hills', icon: '⚓' },
  { name: 'Venice', state: 'Veneto', country: 'Italy', tag: 'Canals & Gondolas', icon: '🎭' },
  { name: 'Vienna', state: 'Vienna', country: 'Austria', tag: 'Classical Music & Palaces', icon: '🎻' },

  // Y & W
  { name: 'Yercaud', state: 'Tamil Nadu', country: 'India', tag: 'Shevaroy Hills & Boating Lake', icon: '⛰️' },
  { name: 'Yelagiri', state: 'Tamil Nadu', country: 'India', tag: 'Serene Hill Station', icon: '🌲' },
  { name: 'Warangal', state: 'Telangana', country: 'India', tag: 'Kakatiya Heritage & Forts', icon: '🏛️' },
  { name: 'Washington D.C.', state: 'District of Columbia', country: 'USA', tag: 'Monuments & Museums', icon: '🏛️' },
];

let googlePlacesDisabled = false;

const CityAutocomplete = ({
  value = '',
  onChange,
  placeholder = 'Enter city, state, or destination',
  label = '',
  iconColor = 'text-slate-400',
  required = false,
  className = '',
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const debounceTimerRef = useRef(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Click outside listener to dismiss dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter and populate suggestions
  const filterSuggestions = (text) => {
    const clean = (text || '').trim().toLowerCase();

    // If input is empty, show top trending places
    if (!clean) {
      const trending = POPULAR_CITIES.filter((p) => p.trending);
      setSuggestions(trending);
      setIsOpen(true);
      setHighlightIndex(-1);
      return;
    }

    // 1. Search across local directory (name, state, country, tag)
    const matchedLocal = POPULAR_CITIES.filter((item) => {
      const name = item.name.toLowerCase();
      const state = item.state.toLowerCase();
      const country = item.country.toLowerCase();
      const tag = (item.tag || '').toLowerCase();
      return name.includes(clean) || state.includes(clean) || country.includes(clean) || tag.includes(clean);
    });

    // Populate local matches immediately
    setSuggestions(matchedLocal.slice(0, 16));
    setIsOpen(matchedLocal.length > 0);
    setHighlightIndex(-1);

    // 2. Query Google Places (New) AutocompleteSuggestion if available and enabled on API key
    if (window.google?.maps?.importLibrary && !googlePlacesDisabled) {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

      debounceTimerRef.current = setTimeout(async () => {
        if (googlePlacesDisabled) return;
        try {
          const { AutocompleteSuggestion } = await window.google.maps.importLibrary('places');
          if (AutocompleteSuggestion?.fetchAutocompleteSuggestions) {
            const { suggestions } = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
              input: text,
            });

            if (suggestions && suggestions.length > 0) {
              const googleResults = suggestions
                .map((s) => ({
                  name: s.placePrediction?.mainText?.toString() || s.placePrediction?.text?.toString() || '',
                  state: s.placePrediction?.secondaryText?.toString() || '',
                  country: '',
                  tag: 'Google Location',
                  icon: '📍',
                  isGoogle: true,
                }))
                .filter((gr) => gr.name);

              const combined = [...matchedLocal];
              googleResults.forEach((gr) => {
                const grClean = gr.name.toLowerCase();
                if (!combined.some((c) => c.name.toLowerCase().includes(grClean) || grClean.includes(c.name.toLowerCase()))) {
                  combined.push(gr);
                }
              });

              setSuggestions(combined.slice(0, 16));
              setIsOpen(true);
              setHighlightIndex(-1);
            }
          }
        } catch {
          // If Places API (New) returns 403 or is not enabled for this project key, disable it permanently for this session
          googlePlacesDisabled = true;
        }
      }, 200);
    }
  };

  const handleInputChange = (text) => {
    setInputValue(text);
    if (onChange) onChange(text);
    filterSuggestions(text);
  };

  const handleFocus = () => {
    setIsFocused(true);
    filterSuggestions(inputValue);
  };

  const handleSelect = (item) => {
    const formatted = `${item.name}${item.state ? `, ${item.state}` : ''}${item.country ? `, ${item.country}` : ''}`;
    setInputValue(formatted);
    if (onChange) onChange(formatted);
    setIsOpen(false);
    setSuggestions([]);
  };

  const handleClear = () => {
    setInputValue('');
    if (onChange) onChange('');
    filterSuggestions('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      if (highlightIndex >= 0 && highlightIndex < suggestions.length) {
        e.preventDefault();
        handleSelect(suggestions[highlightIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        <HiOutlineMapPin className={`absolute left-3.5 w-4 h-4 ${iconColor} pointer-events-none z-10`} />

        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          className="input-field pl-10 pr-9 w-full bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium text-slate-900 shadow-sm"
        />

        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors z-10"
            title="Clear"
          >
            <HiOutlineXMark className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown Menu */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-2xl border border-slate-200 py-1.5 z-50 animate-slide-up max-h-[380px] overflow-y-auto divide-y divide-slate-100 ring-1 ring-black/5">
          <div className="px-3.5 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center justify-between bg-slate-50/70">
            <span className="flex items-center gap-1.5">
              {!inputValue.trim() ? (
                <>
                  <HiOutlineFire className="w-3.5 h-3.5 text-amber-500" />
                  Trending Destinations
                </>
              ) : (
                <>
                  <HiOutlineSparkles className="w-3.5 h-3.5 text-primary-500" />
                  Matching Places ({suggestions.length})
                </>
              )}
            </span>
            <span className="text-[9px] text-slate-400 font-semibold">Select or Press &crarr;</span>
          </div>

          {suggestions.map((item, idx) => {
            const isHighlighted = idx === highlightIndex;
            return (
              <div
                key={`${item.name}_${idx}`}
                onMouseDown={() => handleSelect(item)}
                onMouseEnter={() => setHighlightIndex(idx)}
                className={`px-3.5 py-2.5 cursor-pointer flex items-center justify-between transition-colors ${
                  isHighlighted ? 'bg-primary-50 text-primary-900 font-bold' : 'hover:bg-slate-50 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-lg flex-shrink-0">{item.icon || '📍'}</span>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-slate-900 leading-snug truncate">{item.name}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {item.state}
                      {item.country ? `, ${item.country}` : ''}
                    </p>
                  </div>
                </div>

                {item.tag && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 flex-shrink-0 ml-2">
                    {item.tag}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CityAutocomplete;
