// pages/MaintenancePage.jsx - Página de mantenimiento elegante
import React, { useState, useEffect } from 'react';
import { RefreshCw, Clock, Wrench, Heart, Twitter, Instagram, Mail } from 'lucide-react';

const MaintenancePage = ({ maintenanceInfo }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [dots, setDots] = useState('');

  // Animación de puntos
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Calcular tiempo estimado si hay fecha de activación
  useEffect(() => {
    if (maintenanceInfo?.activatedAt && maintenanceInfo?.estimatedDuration) {
      const updateCountdown = () => {
        const activated = new Date(maintenanceInfo.activatedAt);
        const duration = maintenanceInfo.estimatedDuration;
        
        // Parseear duración (ej: "30 minutos", "1 hora")
        const durationMatch = duration.match(/(\d+)\s*(minuto|hora|segundo)/i);
        if (durationMatch) {
          const value = parseInt(durationMatch[1]);
          const unit = durationMatch[2].toLowerCase();
          
          let milliseconds = 0;
          if (unit.includes('segundo')) milliseconds = value * 1000;
          else if (unit.includes('minuto')) milliseconds = value * 60 * 1000;
          else if (unit.includes('hora')) milliseconds = value * 60 * 60 * 1000;
          
          const estimatedEnd = new Date(activated.getTime() + milliseconds);
          const now = new Date();
          const diff = estimatedEnd - now;
          
          if (diff > 0) {
            const minutes = Math.floor(diff / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            setTimeLeft(`${minutes}m ${seconds}s`);
          } else {
            setTimeLeft('En cualquier momento');
          }
        }
      };

      updateCountdown();
      const interval = setInterval(updateCountdown, 1000);
      return () => clearInterval(interval);
    }
  }, [maintenanceInfo]);

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Contenedor principal */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-indigo-100 overflow-hidden">
          
          {/* Header con gradiente */}
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-8 text-center">
            <div className="relative">
              {/* Icono animado */}
              <div className="mx-auto w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
                <Wrench className="w-10 h-10 text-white animate-spin" style={{ animationDuration: '3s' }} />
              </div>
              
              {/* Título */}
              <h1 className="text-4xl font-bold text-white mb-4">
                🪶 Letranido
              </h1>
              <p className="text-xl text-white/90 font-medium">
                Estamos mejorando tu experiencia{dots}
              </p>
            </div>
          </div>

          {/* Contenido principal */}
          <div className="p-8 space-y-8">
            
            {/* Mensaje personalizado */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full mb-4">
                <Clock className="w-8 h-8 text-indigo-600" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-800">
                Mantenimiento Programado
              </h2>
              
              <p className="text-lg text-gray-600 leading-relaxed max-w-md mx-auto">
                {maintenanceInfo?.message || 'Estamos realizando mejoras en el sitio. Volveremos en unos minutos.'}
              </p>
            </div>

            {/* Información de tiempo */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
              <div className="flex items-center justify-center space-x-6">
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-1">Tiempo estimado</p>
                  <p className="text-2xl font-bold text-indigo-600">
                    {maintenanceInfo?.estimatedDuration || '10 minutos'}
                  </p>
                </div>
                
                {timeLeft && (
                  <>
                    <div className="w-px h-12 bg-gray-300"></div>
                    <div className="text-center">
                      <p className="text-sm text-gray-500 mb-1">Tiempo restante</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {timeLeft}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Qué estamos haciendo */}
            <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-2xl p-6 border border-green-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                ¿Qué estamos mejorando?
              </h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  Optimizando la experiencia de escritura
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  Mejorando el sistema de concursos
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  Actualizando funcionalidades
                </li>
              </ul>
            </div>

            {/* Botón de actualizar */}
            <div className="text-center">
              <button
                onClick={handleRefresh}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                Actualizar página
              </button>
            </div>

            {/* Redes sociales */}
            <div className="border-t border-gray-200 pt-6">
              <p className="text-center text-gray-500 text-sm mb-4">
                Síguenos para estar al tanto de las actualizaciones
              </p>
              <div className="flex justify-center space-x-4">
                <a href="#" className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="#" className="p-3 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-full hover:from-pink-600 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="mailto:info@letranido.com" className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-full hover:from-purple-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl">
                  <Mail className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-gray-500 text-sm flex items-center justify-center">
                Hecho con <Heart className="w-4 h-4 text-red-500 mx-1" /> por el equipo de Letranido
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaintenancePage;