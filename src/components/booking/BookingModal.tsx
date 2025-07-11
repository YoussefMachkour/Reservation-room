import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { BookingForm } from './form/BookingForm';
import type { Space } from '../../types/space';
import type { BookingFormData } from '../../types/booking';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  space: Space;
  onSubmit: (data: BookingFormData) => Promise<void>;
  isLoading?: boolean;
  error?: string;
  initialData?: Partial<BookingFormData>;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  space,
  onSubmit,
  isLoading,
  error,
  initialData
}) => {
  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>

          {/* Content */}
          <div className="p-6">
            <BookingForm
              space={space}
              onSubmit={onSubmit}
              onCancel={onClose}
              isLoading={isLoading}
              error={error}
              initialData={initialData}
            />
          </div>
        </div>
      </div>
    </div>
  );
};