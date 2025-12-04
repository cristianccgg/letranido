// components/ui/WelcomeBanner.jsx - Banner de retos finalizados
import { useState } from "react";
import { X, Sparkles } from "lucide-react";

const WelcomeBanner = () => {
  const [isVisible, setIsVisible] = useState(true);

  // 📝 CONFIGURACIÓN DEL BANNER - Actualizar mensualmente cuando haya reto finalizado
  const BANNER_CONFIG = {
    month: "Noviembre", // 👈 CAMBIAR MES AQUÍ
    enabled: true, // 👈 true = mostrar banner | false = ocultar banner
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // Banner temporal - vuelve a aparecer al refrescar
  };

  const scrollToPodium = () => {
    const winnersSection = document.getElementById("winners-section");
    if (winnersSection) {
      winnersSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  // No mostrar si está deshabilitado o ha sido cerrado
  if (!isVisible || !BANNER_CONFIG.enabled) return null;

  return (
    <div className="bg-linear-to-r from-purple-500 to-indigo-500 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {/* Mensaje principal */}
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-base font-medium">
                <span className="hidden sm:flex items-center gap-2">
                  <Sparkles className="h-4 w-4 shrink-0" />
                  ¡Descubre las historias destacadas de {BANNER_CONFIG.month}!
                </span>
                <span className="sm:hidden flex items-center gap-2">
                  <Sparkles className="h-3 w-3 shrink-0" />
                  Historias destacadas de {BANNER_CONFIG.month}
                </span>
              </p>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0 ml-4">
            {/* Botón para ir al podio */}
            <button
              onClick={scrollToPodium}
              className="inline-flex cursor-pointer items-center px-3 py-1.5 text-xs sm:text-sm font-medium text-white bg-white/20 hover:bg-white/30 rounded-full transition-all duration-200 hover:scale-105 backdrop-blur-sm"
            >
              <span className="hidden sm:inline">Ver Historias Destacadas</span>
              <span className="sm:hidden">Ver Historias</span>
            </button>

            {/* Botón cerrar */}
            <button
              onClick={handleDismiss}
              className="p-1.5 text-white/80 cursor-pointer hover:text-white hover:bg-white/20 rounded-full transition-all duration-200"
              aria-label="Cerrar banner"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeBanner;
