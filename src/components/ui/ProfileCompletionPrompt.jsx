import { useState } from "react";
import { X, UserCircle, AlertCircle, CheckCircle } from "lucide-react";

/**
 * Componente que muestra un prompt suave para completar el perfil
 * Se muestra en la página de perfil si falta información
 */
const ProfileCompletionPrompt = ({ user, onDismiss }) => {
  const [isDismissed, setIsDismissed] = useState(false);

  // Calcular completitud del perfil
  const calculateCompletion = () => {
    const checks = {
      hasBio: Boolean(user?.bio && user.bio.trim()),
      hasLocation: Boolean(user?.location && user.location.trim()),
      hasSocialLinks:
        user?.social_links && Object.keys(user.social_links).length > 0,
    };

    const completed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    const percentage = Math.round((completed / total) * 100);

    return {
      ...checks,
      completed,
      total,
      percentage,
      isComplete: percentage === 100,
    };
  };

  const completion = calculateCompletion();

  // No mostrar si está completo o si fue dismisseado
  if (completion.isComplete || isDismissed) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    if (onDismiss) onDismiss();
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-2xl p-6 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className="bg-blue-100 dark:bg-blue-900/40 p-2 rounded-lg">
            <UserCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              Completa tu perfil público
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Los lectores podrán conocerte mejor si completas esta información
            </p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition-colors"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      {/* Barra de progreso */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Progreso del perfil
          </span>
          <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
            {completion.percentage}%
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
          <div
            className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${completion.percentage}%` }}
          ></div>
        </div>
      </div>

      {/* Checklist */}
      <div className="space-y-2 mb-4">
        <div
          className={`flex items-center gap-2 text-sm ${
            completion.hasBio
              ? "text-green-600 dark:text-green-400"
              : "text-gray-600 dark:text-gray-400"
          }`}
        >
          {completion.hasBio ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span>Biografía</span>
        </div>
        <div
          className={`flex items-center gap-2 text-sm ${
            completion.hasLocation
              ? "text-green-600 dark:text-green-400"
              : "text-gray-600 dark:text-gray-400"
          }`}
        >
          {completion.hasLocation ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span>País/ubicación</span>
        </div>
        <div
          className={`flex items-center gap-2 text-sm ${
            completion.hasSocialLinks
              ? "text-green-600 dark:text-green-400"
              : "text-gray-600 dark:text-gray-400"
          }`}
        >
          {completion.hasSocialLinks ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span>Redes sociales</span>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
          💡 <strong>Tip:</strong> Un perfil completo te ayuda a conectar con
          otros escritores y lectores. Puedes controlar qué información mostrar
          usando los controles de privacidad.
        </p>
        <button
          onClick={() => {
            // Scroll a la sección de edición del perfil
            const editButton = document.querySelector(
              '[data-edit-profile-button]'
            );
            if (editButton) {
              editButton.click();
              // Scroll suave hacia el formulario
              setTimeout(() => {
                editButton.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }, 100);
            }
          }}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
        >
          Completar ahora
        </button>
      </div>
    </div>
  );
};

export default ProfileCompletionPrompt;
