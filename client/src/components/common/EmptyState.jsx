import React from 'react';

const EmptyState = ({ icon = '🗺️', title = 'No items found', message = 'Nothing to show here yet.', action }) => {
  return (
    <div className="card p-12 text-center flex flex-col items-center justify-center max-w-lg mx-auto">
      <div className="text-5xl mb-4 p-3 bg-slate-50 rounded-2xl border border-slate-100">{icon}</div>
      <h3 className="text-lg font-bold text-slate-900 mb-1">{title}</h3>
      <p className="text-slate-500 text-sm mb-6 max-w-sm">{message}</p>
      {action && <div>{action}</div>}
    </div>
  );
};

export default EmptyState;
