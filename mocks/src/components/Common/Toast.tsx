import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 4000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'error':
        return <XCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5" />;
      case 'info':
        return <Info className="w-5 h-5" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500/20 border-green-500/50 text-green-400 shadow-green-500/20';
      case 'error':
        return 'bg-red-500/20 border-red-500/50 text-red-400 shadow-red-500/20';
      case 'warning':
        return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400 shadow-yellow-500/20';
      case 'info':
        return 'bg-blue-500/20 border-blue-500/50 text-blue-400 shadow-blue-500/20';
    }
  };

  return (
    <div
      className={`
        fixed top-4 right-4 z-50
        flex items-center gap-3
        px-4 py-3
        rounded-lg border backdrop-blur-sm
        min-w-[300px] max-w-md
        shadow-lg shadow-black/20
        animate-in slide-in-from-right-full duration-300
        ${getStyles()}
      `}
      role="alert"
    >
      {getIcon()}
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        onClick={onClose}
        className="hover:opacity-80 transition-opacity duration-200"
        aria-label="Fechar notificação"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Toast;
