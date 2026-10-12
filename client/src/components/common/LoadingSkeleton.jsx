import React from 'react';

const LoadingSkeleton = ({ type = 'cards', count = 3, className = '' }) => {
  const items = Array.from({ length: count });

  if (type === 'cards') {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
        {items.map((_, i) => (
          <div key={i} className="card p-6 animate-pulse space-y-4">
            <div className="h-44 bg-slate-200 rounded-xl w-full" />
            <div className="h-5 bg-slate-200 rounded w-3/4" />
            <div className="h-4 bg-slate-200 rounded w-1/2" />
            <div className="h-4 bg-slate-200 rounded w-5/6" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'itinerary') {
    return (
      <div className={`space-y-6 ${className}`}>
        {items.map((_, i) => (
          <div key={i} className="card p-6 animate-pulse space-y-5">
            <div className="h-6 bg-slate-200 rounded w-1/3" />
            <div className="space-y-4">
              <div className="flex gap-4 items-center">
                <div className="w-16 h-4 bg-slate-200 rounded" />
                <div className="flex-1 h-14 bg-slate-200 rounded-xl" />
              </div>
              <div className="flex gap-4 items-center">
                <div className="w-16 h-4 bg-slate-200 rounded" />
                <div className="flex-1 h-14 bg-slate-200 rounded-xl" />
              </div>
              <div className="flex gap-4 items-center">
                <div className="w-16 h-4 bg-slate-200 rounded" />
                <div className="flex-1 h-14 bg-slate-200 rounded-xl" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-3 animate-pulse ${className}`}>
      {items.map((_, i) => (
        <div key={i} className="h-4 bg-slate-200 rounded w-full" />
      ))}
    </div>
  );
};

export default LoadingSkeleton;
