import { useState, useEffect } from 'react';
import { CheckCircle, X, Coffee } from 'lucide-react';
import Badge from './Badge';

const KOFI_SUPPORTER_BADGE = {
  id: 'kofi_supporter',
  name: 'Ko-fi Supporter ☕',
  icon: 'heart',
};

const SuccessToast = ({
  message, // eslint-disable-line no-unused-vars
  title = "¡Éxito!",
  onClose,
  storyTitle = "",
  userName = "",
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
          bg-white dark:bg-gray-800
          border border-accent-200 dark:border-accent-700
          rounded-xl shadow-2xl
          p-6 sm:p-8 max-w-lg sm:max-w-md w-full mx-3 sm:mx-4
          relative overflow-hidden
        ">
          {/* Gradiente de fondo sutil */}
          <div className="absolute inset-0 bg-gradient-to-br from-accent-50/50 to-primary-50/50 dark:from-accent-900/10 dark:to-primary-900/10" />
          
          {/* Contenido */}
          <div className="relative">
            {/* Botón cerrar */}
            <button
              onClick={handleClose}
              className="absolute -top-2 -right-2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </button>

            {/* Icono animado */}
            <div className="flex justify-center mb-4">
              <div className={`
                relative transition-all duration-500 ease-out
                ${showCheck ? 'scale-100 rotate-0' : 'scale-0 rotate-45'}
              `}>
                <div className="
                  w-16 h-16 rounded-full
                  bg-gradient-to-r from-accent-500 to-primary-500
                  flex items-center justify-center
                  shadow-lg shadow-accent-500/25
                ">
                  <CheckCircle className="h-8 w-8 text-white" strokeWidth={2.5} />
                </div>

                {/* Círculos animados de fondo */}
                <div className={`
                  absolute inset-0 rounded-full border-2 border-accent-300
                  transition-all duration-700 ease-out
                  ${showCheck ? 'scale-150 opacity-0' : 'scale-100 opacity-100'}
                `} />
                <div className={`
                  absolute inset-0 rounded-full border border-accent-200
                  transition-all duration-1000 ease-out delay-200
                  ${showCheck ? 'scale-200 opacity-0' : 'scale-100 opacity-100'}
                `} />
              </div>
            </div>

            {/* Título */}
            <h3 className="text-xl font-bold text-center text-accent-800 dark:text-accent-200 mb-3">
              {title}
            </h3>

            {/* Título de la historia */}
            {storyTitle && (
              <p className="text-center text-gray-700 dark:text-gray-300 font-medium mb-1 text-lg">
                "{storyTitle}"
              </p>
            )}

            {/* Mensaje */}
            <p className="text-center text-xs text-gray-400 dark:text-gray-500 mb-2">
              Se podrá leer al iniciar la votación · revisamos contenido para marcar +18 si aplica
            </p>

            {/* Sección de Donación */}
            {onDonate && (
              <div className="mt-4 pt-4 border-t border-accent-200 dark:border-accent-700">
                <div className="bg-gradient-to-r from-accent-50 to-primary-50 dark:from-accent-900/20 dark:to-primary-900/20 rounded-lg p-3 sm:p-4">
                  <div className="flex flex-col gap-3 text-center">
                    <p className="text-sm font-medium text-accent-900 dark:text-accent-100">
                      💝 Considera una donación mínima para mantener Letranido gratuito
                    </p>

                    {userName && (
                      <>
                        <p className="text-xs text-accent-700 dark:text-accent-200">
                          Además, tendrás esta insignia junto a tu nombre:
                        </p>

                        {/* Vista previa: nombre de usuario con el badge Ko-fi */}
                        <div className="flex items-center justify-center gap-2 bg-white/60 dark:bg-black/20 rounded-lg py-2 px-3">
                          <span className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                            {userName}
                          </span>
                          <Badge badge={KOFI_SUPPORTER_BADGE} size="sm" showDescription={false} />
                        </div>
                      </>
                    )}

                    <p className="text-xs text-accent-700 dark:text-accent-200 leading-relaxed">
                      Activa por <strong>30 días</strong> y suma <strong>+50 de karma</strong> al instante
                    </p>

                    <button
                      onClick={() => {
                        window.open('https://ko-fi.com/A0A71KQSH9', '_blank');
                        handleClose();
                      }}
                      className="self-center px-6 py-3 text-sm font-bold text-white bg-accent-600 hover:bg-accent-700 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl border border-accent-500 cursor-pointer"
                    >
                      <Coffee className="w-4 h-4" />
                      Donar y desbloquear insignia
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