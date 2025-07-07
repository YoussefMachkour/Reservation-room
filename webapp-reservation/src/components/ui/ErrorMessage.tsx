import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import { ErrorProps } from '../../types';

export const ErrorMessage: React.FC<ErrorProps> = ({ 
  error, 
  onRetry,
  className = '' 
}) => {
  if (!error) return null;

  return (
    <div className={`mb-4 p-4 rounded-lg bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800 ${className}`}>
      <div className="flex items-start">
        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
            Something went wrong
          </p>
          <p className="text-sm text-red-700 dark:text-red-300">
            {error}
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 text-sm font-medium text-red-800 dark:text-red-200 hover:text-red-900 dark:hover:text-red-100 underline"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
};