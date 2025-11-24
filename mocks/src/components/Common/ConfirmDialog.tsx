import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info';
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  variant = 'danger',
}) => {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: 'text-red-500',
          button: 'bg-red-500 hover:bg-red-600 focus:ring-red-500',
        };
      case 'warning':
        return {
          icon: 'text-yellow-500',
          button: 'bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-500',
        };
      case 'info':
        return {
          icon: 'text-blue-500',
          button: 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-500',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div
      className="
        fixed inset-0 z-50
        flex items-center justify-center
        p-4
        bg-black/60 backdrop-blur-sm
        animate-in fade-in duration-200
      "
      onClick={onCancel}
    >
      <div
        className="
          bg-[#1E1E1E] border border-gray-700
          rounded-lg shadow-2xl
          max-w-md w-full
          animate-in zoom-in-95 duration-200
        "
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={styles.icon}>
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">{title}</h3>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-white transition-colors duration-200"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-gray-300 mb-6 ml-9">{message}</p>

          <div className="flex justify-end gap-3">
            <button
              onClick={onCancel}
              className="
                px-4 py-2
                bg-gray-700 text-white
                rounded-lg
                hover:bg-gray-600
                transition-colors duration-200
                focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-[#1E1E1E]
              "
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`
                px-4 py-2
                text-white rounded-lg
                transition-colors duration-200
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1E1E1E]
                ${styles.button}
              `}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
