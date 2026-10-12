import React from 'react';
import { HiExclamationTriangle } from 'react-icons/hi2';
import Button from './Button';

const ErrorState = ({ message = 'An unexpected error occurred', onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-14 h-14 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-center mb-4 text-rose-500 shadow-sm">
        <HiExclamationTriangle className="w-7 h-7" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-1">Something went wrong</h3>
      <p className="text-slate-500 text-sm max-w-md mb-6">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="secondary">
          Try Again
        </Button>
      )}
    </div>
  );
};

export default ErrorState;
