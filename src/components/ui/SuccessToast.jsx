import { useState, useEffect } from 'react';
import { CheckCircle, X, Coffee } from 'lucide-react';

const SuccessToast = ({ 
  message, // eslint-disable-line no-unused-vars
  title = "¡Éxito!",
  onClose,
  storyTitle = "",
  onDonate
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
    
    // NUNCA cerrar automáticamente - siempre manual
    // El usuario debe tomar la decisión de cerrar después de leer

    return () => {
      clearTimeout(timer);
    };
  }, []);

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

            {/* Sección de Donación */}
            {onDonate && (
              <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-700">
                <div className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-lg p-3 sm:p-4">
                  {/* Layout responsive: vertical en mobile, horizontal en desktop */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1 text-center sm:text-left">
                      <p className="text-sm sm:text-base font-medium text-orange-900 dark:text-orange-100 mb-1">
                        💝 ¡Gracias por formar parte de Letranido!
                      </p>
                      <p className="text-xs sm:text-sm text-orange-700 dark:text-orange-200 leading-relaxed">
                        Tu donación mantiene todo <strong>gratuito</strong> y sin anuncios para todos los escritores
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        onDonate();
                        handleClose();
                      }}
                      className="self-center sm:self-auto px-6 py-3 sm:px-4 sm:py-2 text-sm sm:text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 sm:gap-1.5 shadow-lg hover:shadow-xl transform hover:scale-105 border border-orange-400 min-w-[120px] sm:min-w-0"
                    >
                      <Coffee className="w-4 h-4 sm:w-3 sm:h-3" />
                      ❤️ Apoyar
                    </button>
                  </div>
                </div>
              </div>
            )}

            
          </div>
        </div>
      </div>
    </>
  );
};

export default SuccessToast;