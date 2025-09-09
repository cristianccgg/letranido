import { X, Coffee, Heart } from "lucide-react";

const KofiModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-orange-500 to-yellow-500">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-white/20 rounded-full">
              <Coffee className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Apoyar a Letranido</h2>
              <p className="text-orange-100 text-sm">Tu donación mantiene todo gratuito</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-4">
            <Heart className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Gracias por considerar apoyar nuestro proyecto. Tu donación nos ayuda a mantener
              Letranido funcionando sin anuncios y completamente gratuito para toda la comunidad.
            </p>
          </div>

          {/* Ko-fi iframe */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden">
            <iframe 
              id='kofiframe' 
              src={`https://ko-fi.com/letranido/?hidefeed=true&widget=true&embed=true&preview=true&_=${Date.now()}`} 
              style={{
                border: 'none',
                width: '100%',
                padding: '4px',
                background: '#f9f9f9'
              }}
              height='400' 
              title='Apoyar a Letranido'
              loading="lazy"
            />
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Procesado de forma segura por Ko-fi
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KofiModal;