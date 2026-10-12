import React, { useState, useEffect } from 'react';
import {
  HiOutlineDocumentArrowDown,
  HiOutlineXMark,
  HiOutlineCheck,
  HiOutlineTableCells,
  HiOutlineArrowDownTray,
} from 'react-icons/hi2';
import toast from 'react-hot-toast';
import { exportRoutePdf, exportRouteCsv } from '../../utils/exportRoutePdf.js';

const ALL_CATEGORY_OPTIONS = [
  { key: 'gas_station', label: 'Petrol Pumps', icon: '⛽' },
  { key: 'restaurants', label: 'Restaurants & Dhabas', icon: '🍽️' },
  { key: 'hotels', label: 'Hotels & Stays', icon: '🏨' },
  { key: 'cafe_24h', label: '24h Tea & Coffee', icon: '☕' },
  { key: 'hospital', label: 'Hospitals', icon: '🏥' },
  { key: 'pharmacy', label: 'Pharmacies', icon: '💊' },
  { key: 'car_repair', label: 'Auto Repair', icon: '🔧' },
  { key: 'tire_shop', label: 'Tyre Shops', icon: '🛞' },
  { key: 'atm', label: 'ATMs', icon: '🏧' },
  { key: 'ev_charging', label: 'EV Charging', icon: '⚡' },
  { key: 'parking', label: 'Parking & Rest', icon: '🅿️' },
  { key: 'attractions', label: 'Attractions', icon: '🏛️' },
];

const DownloadRouteModal = ({
  isOpen = false,
  onClose,
  route,
  origin,
  destination,
  places = [],
  travelMode = 'DRIVE',
  activeCategoryFilter = 'all',
  mapContainerRef = null,
}) => {
  // Mode selection: 'all' or 'selected'
  const [filterMode, setFilterMode] = useState('all');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingCsv, setIsGeneratingCsv] = useState(false);

  // Initialize selected categories based on active filter or all
  useEffect(() => {
    if (isOpen) {
      if (activeCategoryFilter && activeCategoryFilter !== 'all') {
        setFilterMode('selected');
        setSelectedCategories([activeCategoryFilter]);
      } else {
        setFilterMode('all');
        setSelectedCategories(ALL_CATEGORY_OPTIONS.map((c) => c.key));
      }
    }
  }, [isOpen, activeCategoryFilter]);

  if (!isOpen) return null;

  const toggleCategory = (key) => {
    setSelectedCategories((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleSelectAllCategories = () => {
    setSelectedCategories(ALL_CATEGORY_OPTIONS.map((c) => c.key));
  };

  const handleClearCategories = () => {
    setSelectedCategories([]);
  };

  // Filter places to export
  const placesToExport =
    filterMode === 'all'
      ? places
      : places.filter((p) => selectedCategories.includes(p.category));

  // Handle PDF Export
  const handleDownloadPdf = async () => {
    if (placesToExport.length === 0) {
      toast.error('Please select at least one category with available places');
      return;
    }

    setIsGeneratingPdf(true);
    const toastId = toast.loading('Generating route map PDF report...');

    try {
      const mapEl = mapContainerRef?.current || document.querySelector('.print-map-wrapper');
      const filename = await exportRoutePdf({
        route,
        origin,
        destination,
        places: placesToExport,
        travelMode,
        mapElement: mapEl,
      });

      toast.success(`Downloaded ${filename}!`, { id: toastId });
      onClose();
    } catch (err) {
      console.error('PDF export error:', err);
      toast.error(
        'Failed to generate PDF map. Please ensure route is fully loaded and try again.',
        { id: toastId }
      );
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Handle CSV Export
  const handleDownloadCsv = () => {
    if (placesToExport.length === 0) {
      toast.error('Please select at least one category with available places');
      return;
    }

    setIsGeneratingCsv(true);
    try {
      const filename = exportRouteCsv({
        route,
        origin,
        destination,
        places: placesToExport,
      });
      toast.success(`Exported ${filename}!`);
      onClose();
    } catch (err) {
      console.error('CSV export error:', err);
      toast.error('Failed to export CSV. Please try again.');
    } finally {
      setIsGeneratingCsv(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-scale-up">
        {/* Modal Header */}
        <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl font-bold">
              🗺️
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">Download Route Map</h3>
              <p className="text-xs text-slate-500">
                Export verified highway services and route navigation map
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm transition-all"
          >
            <HiOutlineXMark className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Journey Snapshot */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs flex items-center justify-between">
            <div className="truncate mr-2">
              <span className="font-extrabold text-slate-900 block truncate">
                {origin?.query?.split(',')[0] || 'Start'} → {destination?.query?.split(',')[0] || 'Destination'}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                {route?.distance} • {route?.duration} • {travelMode}
              </span>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 font-black text-[11px] whitespace-nowrap">
              {placesToExport.length} Places
            </span>
          </div>

          {/* Mode Selector */}
          <div>
            <label className="text-xs font-black uppercase text-slate-400 tracking-wider block mb-2">
              Services to Include:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setFilterMode('all');
                  setSelectedCategories(ALL_CATEGORY_OPTIONS.map((c) => c.key));
                }}
                className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between transition-all ${
                  filterMode === 'all'
                    ? 'border-blue-600 bg-blue-50/50 text-blue-700 shadow-sm'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <span>🌐 All Services</span>
                {filterMode === 'all' && <HiOutlineCheck className="w-4 h-4 text-blue-600" />}
              </button>

              <button
                type="button"
                onClick={() => setFilterMode('selected')}
                className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between transition-all ${
                  filterMode === 'selected'
                    ? 'border-blue-600 bg-blue-50/50 text-blue-700 shadow-sm'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <span>🎯 Selected Categories</span>
                {filterMode === 'selected' && <HiOutlineCheck className="w-4 h-4 text-blue-600" />}
              </button>
            </div>
          </div>

          {/* Category Checkbox Grid (active when filterMode === 'selected') */}
          {filterMode === 'selected' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs pb-1">
                <span className="font-bold text-slate-700">Choose Categories:</span>
                <div className="flex items-center gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={handleSelectAllCategories}
                    className="text-blue-600 hover:underline font-bold"
                  >
                    Select All
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={handleClearCategories}
                    className="text-slate-500 hover:underline font-medium"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 max-h-[190px] overflow-y-auto pr-1">
                {ALL_CATEGORY_OPTIONS.map((cat) => {
                  const isChecked = selectedCategories.includes(cat.key);
                  const count = places.filter((p) => p.category === cat.key).length;

                  return (
                    <label
                      key={cat.key}
                      onClick={() => toggleCategory(cat.key)}
                      className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 cursor-pointer transition-all ${
                        isChecked
                          ? 'border-blue-500 bg-blue-50/30 font-bold text-slate-900'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                      />
                      <span className="text-base">{cat.icon}</span>
                      <span className="flex-1 truncate">{cat.label}</span>
                      <span className="text-[10px] text-slate-400 font-semibold">({count})</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* PDF Specifications Summary */}
          <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-[11px] text-slate-600 space-y-1">
            <span className="font-bold text-blue-900 block">📄 Clean PDF Specifications:</span>
            <ul className="list-disc list-inside space-y-0.5 text-slate-500">
              <li>Header with route summary, travel mode, and date</li>
              <li>High-res map with blue route, Green 'A' and Red 'B' markers</li>
              <li>Categorized markers with legend and table sorted from start to destination</li>
              <li>Contains only route map and along-route services (no itinerary/directions)</li>
            </ul>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* CSV Option */}
          <button
            type="button"
            disabled={isGeneratingCsv || isGeneratingPdf || placesToExport.length === 0}
            onClick={handleDownloadCsv}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            title="Download CSV spreadsheet of selected services"
          >
            <HiOutlineTableCells className="w-4 h-4 text-emerald-600" />
            <span>Download CSV</span>
          </button>

          {/* PDF Download Button */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={isGeneratingPdf || placesToExport.length === 0}
              onClick={handleDownloadPdf}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isGeneratingPdf ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Building PDF...</span>
                </>
              ) : (
                <>
                  <HiOutlineDocumentArrowDown className="w-4 h-4" />
                  <span>Download Route PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DownloadRouteModal;
