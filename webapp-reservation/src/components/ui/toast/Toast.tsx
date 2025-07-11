import React from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import type { Toast } from '../../../hooks/useToast';

interface ToastProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

const toastIcons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info
} as const;

const toastStyles = {
  success: {
    light: 'bg-green-50 border-green-200 text-green-800',
    dark: 'bg-green-900/20 border-green-800 text-green-300'
  },
  error: {
    light: 'bg-red-50 border-red-200 text-red-800',
    dark: 'bg-red-900/20 border-red-800 text-red-300'
  },
  warning: {
    light: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    dark: 'bg-yellow-900/20 border-yellow-800 text-yellow-300'
  },
  info: {
    light: 'bg-blue-50 border-blue-200 text-blue-800',
    dark: 'bg-blue-900/20 border-blue-800 text-blue-300'
  }
} as const;

export const ToastComponent: React.FC<ToastProps> = ({ toast, onRemove }) => {
  const Icon = toastIcons[toast.type];
  const isDark = document.documentElement.classList.contains('dark');
  const styles = toastStyles[toast.type];

  return (
    <div 
      className={`
        max-w-md p-4 rounded-lg shadow-lg border animate-in fade-in slide-in-from-top-2 duration-300
        ${isDark ? styles.dark : styles.light}
      `}
    >
      <div className="flex items-start gap-3">
        <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium">{toast.message}</p>
        </div>
        <button
          onClick={() => onRemove(toast.id)}
          className="flex-shrink-0 ml-2 opacity-70 hover:opacity-100 transition-opacity"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <ToastComponent 
          key={toast.id} 
          toast={toast} 
          onRemove={onRemove} 
        />
      ))}
    </div>
  );
};
