import React, { forwardRef } from 'react';
import { LucideIcon } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
  onRightIconClick?: () => void;
  variant?: 'default' | 'filled' | 'outlined';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  onRightIconClick,
  variant = 'default',
  className = '',
  id,
  ...props
}, ref) => {
  const { isDark } = useTheme();
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  const baseInputClasses = 'w-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500';
  
  const variantClasses = {
    default: `border rounded-lg ${
      error 
        ? 'border-red-300 bg-red-50 dark:border-red-600 dark:bg-red-900/20'
        : isDark 
          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
    }`,
    filled: `border-0 rounded-lg ${
      error
        ? 'bg-red-50 dark:bg-red-900/20'
        : isDark
          ? 'bg-gray-700 text-white placeholder-gray-400'
          : 'bg-gray-100 text-gray-900 placeholder-gray-500'
    }`,
    outlined: `border-2 rounded-lg bg-transparent ${
      error
        ? 'border-red-300 dark:border-red-600'
        : isDark
          ? 'border-gray-600 text-white placeholder-gray-400'
          : 'border-gray-300 text-gray-900 placeholder-gray-500'
    }`
  };

  const paddingClasses = LeftIcon 
    ? (RightIcon ? 'pl-10 pr-10 py-3' : 'pl-10 pr-4 py-3')
    : (RightIcon ? 'pl-4 pr-10 py-3' : 'px-4 py-3');

  return (
    <div className="w-full">
      {label && (
        <label 
          htmlFor={inputId}
          className={`block text-sm font-medium mb-2 ${
            isDark ? 'text-gray-300' : 'text-gray-700'
          }`}
        >
          {label}
        </label>
      )}
      
      <div className="relative">
        {LeftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <LeftIcon className={`w-5 h-5 ${
              error 
                ? 'text-red-400'
                : isDark 
                  ? 'text-gray-400' 
                  : 'text-gray-500'
            }`} />
          </div>
        )}
        
        <input
          ref={ref}
          id={inputId}
          className={`${baseInputClasses} ${variantClasses[variant]} ${paddingClasses} ${className}`}
          {...props}
        />
        
        {RightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <button
              type="button"
              onClick={onRightIconClick}
              className={`${
                onRightIconClick ? 'cursor-pointer hover:text-gray-700 dark:hover:text-gray-300' : 'pointer-events-none'
              }`}
            >
              <RightIcon className={`w-5 h-5 ${
                error 
                  ? 'text-red-400'
                  : isDark 
                    ? 'text-gray-400' 
                    : 'text-gray-500'
              }`} />
            </button>
          </div>
        )}
      </div>
      
      {(error || helperText) && (
        <div className="mt-1">
          {error ? (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          ) : helperText ? (
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{helperText}</p>
          ) : null}
        </div>
      )}
    </div>
  );
});