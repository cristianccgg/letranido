import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X, Heart } from 'lucide-react';

const Toast = ({ 
  message, 
  type = 'info', // 'success', 'error', 'info', 'vote'
  duration = 4000, 
  onClose,
  position = 'top-right' // 'top-right', 'top-center', 'bottom-right', 'bottom-center'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Entrada con delay para animación
    const timer = setTimeout(() => setIsVisible(true), 100);
    
    // Auto-close
    const closeTimer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => {
      clearTimeout(timer);
      clearTimeout(closeTimer);
    };
  }, [duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300);
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'vote':
        return <Heart className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'vote':
        return 'bg-gradient-to-r from-red-50 to-pink-50 border-red-200 text-red-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top-center':
        return 'top-4 left-1/2 transform -translate-x-1/2';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-center':
        return 'bottom-4 left-1/2 transform -translate-x-1/2';
      default:
        return 'top-4 right-4';
    }
  };

  if (!isVisible && !isLeaving) return null;

  return (
    <div 
      className={`
        fixed ${getPositionClasses()} z-50 
        max-w-sm w-full mx-4 sm:mx-0
        transform transition-all duration-300 ease-in-out
        ${isVisible && !isLeaving 
          ? 'translate-y-0 opacity-100 scale-100' 
          : 'translate-y-2 opacity-0 scale-95'
        }
      `}
    >
      <div className={`
        ${getColors()}
        border rounded-lg shadow-lg backdrop-blur-sm
        p-4 flex items-start gap-3
        hover:shadow-xl transition-shadow duration-200
      `}>
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-relaxed">
            {message}
          </p>
        </div>
        
        <button
          onClick={handleClose}
          className="flex-shrink-0 ml-2 p-1 rounded-md hover:bg-white/50 transition-colors duration-150"
          aria-label="Cerrar notificación"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

// Hook para gestionar múltiples toasts
const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info', options = {}) => {
    const id = Date.now() + Math.random();
    const toast = {
      id,
      message,
      type,
      ...options
    };
    
    setToasts(prev => [...prev, toast]);
    
    // Auto-remove si no se especifica duración infinita
    if (options.duration !== Infinity) {
      setTimeout(() => {
        removeToast(id);
      }, options.duration || 4000);
    }

    return id;
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const success = (message, options) => addToast(message, 'success', options);
  const error = (message, options) => addToast(message, 'error', options);
  const info = (message, options) => addToast(message, 'info', options);
  const vote = (message, options) => addToast(message, 'vote', options);

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    info,
    vote
  };
};

// Componente contenedor para múltiples toasts
const ToastContainer = ({ toasts, onRemove, position = 'top-right' }) => {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          style={{
            zIndex: 50 + index
          }}
          className="pointer-events-auto"
        >
          <Toast
            {...toast}
            position={position}
            onClose={() => onRemove(toast.id)}
          />
        </div>
      ))}
    </div>
  );
};

export default Toast;
export { useToast, ToastContainer };