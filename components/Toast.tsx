import React, { useEffect } from 'react';
import { CheckCircle2, XCircle, X, AlertCircle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  type: ToastType;
  message: string;
  details?: string;
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ type, message, details, onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-[#00ffa3]" />,
    error: <XCircle className="w-5 h-5 text-red-500" />,
    warning: <AlertCircle className="w-5 h-5 text-yellow-500" />,
    info: <AlertCircle className="w-5 h-5 text-blue-500" />,
  };

  const bgColors = {
    success: 'bg-[#00ffa3]/10 border-[#00ffa3]/30',
    error: 'bg-red-500/10 border-red-500/30',
    warning: 'bg-yellow-500/10 border-yellow-500/30',
    info: 'bg-blue-500/10 border-blue-500/30',
  };

  return (
    <div className="fixed top-4 right-4 z-[100] animate-in slide-in-from-top-5 fade-in">
      <div className={`${bgColors[type]} border rounded-lg p-4 min-w-[320px] max-w-[420px] shadow-2xl backdrop-blur-sm`}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {icons[type]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-white mb-1">{message}</div>
            {details && (
              <div className="text-xs text-gray-400 font-mono whitespace-pre-line">{details}</div>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 text-gray-500 hover:text-white transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Toast;

