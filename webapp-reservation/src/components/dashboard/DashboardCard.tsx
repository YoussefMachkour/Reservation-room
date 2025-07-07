// src/components/dashboard/DashboardCard.tsx
// Reusable dashboard card component

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface TrendData {
  value: number;
  isPositive: boolean;
  label?: string;
}

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'indigo' | 'pink';
  subtitle?: string;
  trend?: TrendData;
  onClick?: () => void;
  loading?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'filled';
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  value,
  icon: Icon,
  color = 'blue',
  subtitle,
  trend,
  onClick,
  loading = false,
  className = '',
  size = 'md',
  variant = 'default'
}) => {
  const colorClasses = {
    blue: {
      icon: 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400',
      filled: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800'
    },
    green: {
      icon: 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400',
      filled: 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
    },
    red: {
      icon: 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400',
      filled: 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
    },
    yellow: {
      icon: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400',
      filled: 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800'
    },
    purple: {
      icon: 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400',
      filled: 'bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800'
    },
    indigo: {
      icon: 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400',
      filled: 'bg-indigo-50 dark:bg-indigo-950 border-indigo-200 dark:border-indigo-800'
    },
    pink: {
      icon: 'bg-pink-100 dark:bg-pink-900 text-pink-600 dark:text-pink-400',
      filled: 'bg-pink-50 dark:bg-pink-950 border-pink-200 dark:border-pink-800'
    }
  };

  const sizeClasses = {
    sm: {
      container: 'p-4',
      icon: 'p-2 w-8 h-8',
      iconSize: 'w-4 h-4',
      title: 'text-xs',
      value: 'text-lg',
      subtitle: 'text-xs'
    },
    md: {
      container: 'p-6',
      icon: 'p-3 w-12 h-12',
      iconSize: 'w-6 h-6',
      title: 'text-sm',
      value: 'text-2xl',
      subtitle: 'text-xs'
    },
    lg: {
      container: 'p-8',
      icon: 'p-4 w-16 h-16',
      iconSize: 'w-8 h-8',
      title: 'text-base',
      value: 'text-3xl',
      subtitle: 'text-sm'
    }
  };

  const getVariantClasses = () => {
    const baseClasses = 'rounded-lg shadow-sm border transition-all duration-200';
    
    switch (variant) {
      case 'outline':
        return `${baseClasses} bg-transparent border-2 ${colorClasses[color].filled.split('border-')[1]}`;
      case 'filled':
        return `${baseClasses} ${colorClasses[color].filled}`;
      default:
        return `${baseClasses} bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700`;
    }
  };

  const getInteractiveClasses = () => {
    if (!onClick) return '';
    return 'cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-[0.98]';
  };

  const renderTrend = () => {
    if (!trend) return null;

    const trendIcon = trend.isPositive ? '↗' : '↘';
    const trendColorClass = trend.isPositive 
      ? 'text-green-600 dark:text-green-400' 
      : 'text-red-600 dark:text-red-400';

    return (
      <div className={`flex items-center mt-2 text-xs ${trendColorClass}`}>
        <span className="font-medium">{trendIcon}</span>
        <span className="ml-1 font-medium">{Math.abs(trend.value)}%</span>
        {trend.label && (
          <span className="ml-1 text-gray-500 dark:text-gray-400">
            {trend.label}
          </span>
        )}
      </div>
    );
  };

  const renderLoadingState = () => (
    <div className={`${getVariantClasses()} ${sizeClasses[size].container} ${className}`}>
      <div className="flex items-center justify-between">
        <div className="space-y-2 flex-1">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-16"></div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-12"></div>
          {subtitle && (
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-20"></div>
          )}
        </div>
        <div className={`${sizeClasses[size].icon} bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse`}></div>
      </div>
    </div>
  );

  if (loading) {
    return renderLoadingState();
  }

  return (
    <div 
      className={`${getVariantClasses()} ${getInteractiveClasses()} ${sizeClasses[size].container} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className={`${sizeClasses[size].title} font-medium text-gray-600 dark:text-gray-400 truncate`}>
            {title}
          </p>
          <p className={`${sizeClasses[size].value} font-bold text-gray-900 dark:text-white mt-1`}>
            {value}
          </p>
          {subtitle && (
            <p className={`${sizeClasses[size].subtitle} text-gray-500 dark:text-gray-500 mt-1 truncate`}>
              {subtitle}
            </p>
          )}
          {renderTrend()}
        </div>
        <div className={`${sizeClasses[size].icon} ${colorClasses[color].icon} rounded-lg flex-shrink-0 flex items-center justify-center ml-4`}>
          <Icon className={sizeClasses[size].iconSize} />
        </div>
      </div>
    </div>
  );
};
