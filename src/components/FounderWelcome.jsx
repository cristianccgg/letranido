// components/FounderWelcome.jsx
import React from "react";
import { X, Star, Trophy } from "lucide-react";

const FounderWelcome = ({ isOpen, onClose, badge }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="relative bg-gradient-to-br from-yellow-400 via-orange-400 to-red-400 p-6 rounded-t-lg text-white text-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:text-gray-200"
          >
            <X className="h-6 w-6" />
          </button>

          <div className="text-6xl mb-4">🚀</div>
          <h2 className="text-2xl font-bold mb-2">¡Bienvenido, Fundador!</h2>
          <p className="text-yellow-100">
            Acabas de recibir la insignia más exclusiva de LiteraLab
          </p>
        </div>

        <div className="p-6">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-100 to-orange-100 border-4 border-yellow-300 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🚀</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Insignia de Fundador
            </h3>
            <p className="text-gray-600">
              Eres uno de los miembros fundadores de nuestra comunidad
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h4 className="font-bold text-yellow-800 mb-2">
              Beneficios exclusivos:
            </h4>
            <ul className="text-yellow-700 text-sm space-y-1">
              <li>• Reconocimiento especial en tu perfil</li>
              <li>• Prioridad en futuras funciones beta</li>
              <li>• Badge único que no se puede obtener después</li>
              <li>• Parte de la historia de LiteraLab</li>
            </ul>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold py-3 px-4 rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-colors"
          >
            ¡Empezar a escribir!
          </button>
        </div>
      </div>
    </div>
  );
};

// El componente solo recibe props y no interactúa con el contexto directamente.

export default FounderWelcome;
