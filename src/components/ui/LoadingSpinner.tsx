import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { LoadingProps } from '../../types';

export const LoadingSpinner: React.FC<LoadingProps> = ({ 
  size = 'lg', 
  text,
  className = '' 
}) => {
  const { isDark } = useTheme();

  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-4'
  };

  const containerClasses = {
    sm: 'gap-2',
    md: 'gap-3',
    lg: 'gap-4'
  };

  if (size === 'lg' && !text) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className={`animate-spin rounded-full border-b-blue-600 border-t-transparent ${sizeClasses[size]} ${className}`} />
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center ${containerClasses[size]} ${className}`}>
      <div className={`animate-spin rounded-full border-b-blue-600 border-t-transparent ${sizeClasses[size]}`} />
      {text && (
        <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          {text}
        </span>
      )}
    </div>
  );
};