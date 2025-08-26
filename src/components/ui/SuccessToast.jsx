import { useState, useEffect } from 'react';
import { CheckCircle, X } from 'lucide-react';

const SuccessToast = ({ 
  message, 
  title = "¡Éxito!",
  duration = 6000, 
  onClose,
  storyTitle = ""
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [showCheck, setShowCheck] = useState(false);

  useEffect(() => {
    // Entrada con delay para animación
    const timer = setTimeout(() => {
      setIsVisible(true);
      // Mostrar check después de que aparezca el toast
      setTimeout(() => setShowCheck(true), 300);
    }, 100);
    
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
    }, 400);
  };

  if (!isVisible && !isLeaving) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className={`
          fixed inset-0 z-50 bg-black/20 backdrop-blur-sm
          transition-opacity duration-300
          ${isVisible && !isLeaving ? 'opacity-100' : 'opacity-0'}
        `}
        onClick={handleClose}
      />

      {/* Toast centrado */}
      <div 
        className={`
          fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[60]
          transition-all duration-400 ease-out
          ${isVisible && !isLeaving 
            ? 'translate-y-[-50%] opacity-100 scale-100' 
            : 'translate-y-[-40%] opacity-0 scale-95'
          }
        `}
      >
        <div className="
          bg-white dark:bg-dark-800 
          border border-green-200 dark:border-green-700
          rounded-xl shadow-2xl
          p-6 sm:p-8 max-w-lg sm:max-w-md w-full mx-3 sm:mx-4
          relative overflow-hidden
        ">
          {/* Gradiente de fondo sutil */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-900/10 dark:to-emerald-900/10" />
          
          {/* Contenido */}
          <div className="relative">
            {/* Botón cerrar */}
            <button
              onClick={handleClose}
              className="absolute -top-2 -right-2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors duration-150"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>

            {/* Icono animado */}
            <div className="flex justify-center mb-4">
              <div className={`
                relative transition-all duration-500 ease-out
                ${showCheck ? 'scale-100 rotate-0' : 'scale-0 rotate-45'}
              `}>
                <div className="
                  w-16 h-16 rounded-full 
                  bg-gradient-to-r from-green-500 to-emerald-500
                  flex items-center justify-center
                  shadow-lg shadow-green-500/25
                ">
                  <CheckCircle className="h-8 w-8 text-white" strokeWidth={2.5} />
                </div>
                
                {/* Círculos animados de fondo */}
                <div className={`
                  absolute inset-0 rounded-full border-2 border-green-300
                  transition-all duration-700 ease-out
                  ${showCheck ? 'scale-150 opacity-0' : 'scale-100 opacity-100'}
                `} />
                <div className={`
                  absolute inset-0 rounded-full border border-green-200
                  transition-all duration-1000 ease-out delay-200
                  ${showCheck ? 'scale-200 opacity-0' : 'scale-100 opacity-100'}
                `} />
              </div>
            </div>

            {/* Título */}
            <h3 className="text-xl font-bold text-center text-green-800 dark:text-green-200 mb-3">
              {title}
            </h3>

            {/* Título de la historia */}
            {storyTitle && (
              <p className="text-center text-gray-700 dark:text-dark-300 font-medium mb-4 text-lg">
                "{storyTitle}"
              </p>
            )}

            {/* Mensaje */}
            <div className="text-center text-gray-600 dark:text-dark-400 leading-relaxed space-y-2">
              <p className="text-green-700 dark:text-green-300 font-medium">
                ✅ Historia enviada y guardada exitosamente
              </p>
              <p className="text-sm">
                📅 Podrá ser <strong>leída cuando comience la votación</strong>
              </p>
              <p className="text-xs text-gray-500 dark:text-dark-500 mt-3 p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
                💡 Realizamos revisión automática para clasificación. Si detectamos contenido adulto, la marcaremos como +18.
              </p>
            </div>

            {/* Barra de progreso */}
            <div className="mt-6">
              <div className="h-1 bg-gray-200 dark:bg-dark-600 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-300 ease-out"
                  style={{
                    width: isVisible && !isLeaving ? '100%' : '0%',
                    transitionDuration: `${duration}ms`
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SuccessToast;