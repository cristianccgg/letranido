// components/forms/AuthModal.jsx - ACTUALIZADO PARA CONTEXTO GLOBAL
import { useState, useEffect } from "react";
import { X, Eye, EyeOff, User, Mail, Lock, Loader, AlertTriangle } from "lucide-react";
import { useGlobalApp } from "../../contexts/GlobalAppContext"; // ✅ CAMBIADO
import { useGoogleAnalytics, AnalyticsEvents } from "../../hooks/useGoogleAnalytics";

const AuthModal = ({ isOpen, onClose, onSuccess, initialMode = "login" }) => {
  const [mode, setMode] = useState(initialMode);
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    confirmPassword: "",
    emailNotifications: true, // Por defecto habilitado
    termsAccepted: false, // Debe ser aceptado explícitamente
  });
  // const [resetSuccess, setResetSuccess] = useState(false); // Movido al contexto global
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // ✅ USO DEL CONTEXTO GLOBAL EN LUGAR DE AUTHSTORE
  const { 
    login, 
    register, 
    resetPassword,
    isLoading, 
    authModalErrors: serverErrors,
    resetPasswordSuccess,
    clearAuthModalErrors 
  } = useGlobalApp();

  // ✅ GOOGLE ANALYTICS
  const { trackEvent } = useGoogleAnalytics();

  // Combinar errores del servidor y de validación
  const errors = { ...validationErrors, ...serverErrors };

  // Reset form only when mode actually changes, track previous mode
  const [prevMode, setPrevMode] = useState(mode);
  
  useEffect(() => {
    // Solo limpiar si realmente cambió el modo
    if (mode !== prevMode) {
      setFormData({
        email: "",
        password: "",
        name: "",
        confirmPassword: "",
        emailNotifications: true,
        termsAccepted: false,
      });
      clearAuthModalErrors();
      setValidationErrors({});
      setShowPassword(false);
      setShowConfirmPassword(false);
      // setResetSuccess(false); // Ahora está en el contexto global
      setPrevMode(mode);
    }
  }, [mode, prevMode, clearAuthModalErrors]);

  const validateForm = () => {
    const newErrors = {};

    // Email validation (always required)
    if (!formData.email) {
      newErrors.email = "El email es requerido";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "El email no es válido";
    }

    // Password validation (not required for reset-password)
    if (mode !== "reset-password") {
      if (!formData.password) {
        newErrors.password = "La contraseña es requerida";
      } else if (formData.password.length < 6) {
        newErrors.password = "La contraseña debe tener al menos 6 caracteres";
      }
    }

    // Registration-specific validations
    if (mode === "register") {
      if (!formData.name) {
        newErrors.name = "El nombre es requerido";
      } else if (formData.name.length < 2) {
        newErrors.name = "El nombre debe tener al menos 2 caracteres";
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = "Confirma tu contraseña";
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Las contraseñas no coinciden";
      }

      // ✅ VALIDACIÓN LEGAL REQUERIDA
      if (!formData.termsAccepted) {
        newErrors.termsAccepted = "Debes aceptar los términos legales para continuar";
      }
    }

    // Establecer errores de validación en estado local
    setValidationErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }


    try {
      let result;

      if (mode === "login") {
        result = await login(formData.email, formData.password);
      } else if (mode === "register") {
        result = await register(
          formData.email,
          formData.name,
          formData.password,
          formData.emailNotifications,
          formData.termsAccepted
        );
      } else if (mode === "reset-password") {
        result = await resetPassword(formData.email);
      }

      
      if (result.success) {
        console.log("✅ AuthModal - Resultado exitoso para modo:", mode);
        // 📊 TRACK EVENT: User signup (only for register mode)
        if (mode === "register") {
          trackEvent(AnalyticsEvents.USER_SIGNUP, {
            email_notifications: formData.emailNotifications,
            signup_method: 'email'
          });
        }

        if (mode === "reset-password") {
          // setResetSuccess(true); // Ahora se maneja en el contexto global
          // No cerrar modal para mostrar mensaje de éxito
          // El usuario recibirá el email y debe seguir el enlace
        } else {
          // Cerrar modal solo en caso de éxito
          console.log("🚪 AuthModal - Llamando onSuccess y onClose por éxito");
          onSuccess?.();
          onClose();
        }
      } else {
        console.log("❌ AuthModal - Error en resultado, NO cerrando modal:", result.error);
        // NO cerrar el modal en caso de error para que el usuario vea el mensaje
        // El error ya se estableció en el contexto global desde la función login
      }
    } catch (error) {
      console.error("Auth error:", error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear field-specific validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: "" }));
    }

    // Clear general server error when user makes changes
    if (serverErrors.general) {
      clearAuthModalErrors();
    }
  };

  if (!isOpen) {
    return null;
  }
  
  // console.log("✅ AuthModal renderizando - isLoading:", isLoading, "validationErrors:", validationErrors, "serverErrors:", serverErrors);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-dark-800 rounded-xl shadow-2xl w-full max-w-md mx-auto my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-dark-600 flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-100">
            {mode === "login" ? "Iniciar Sesión" : mode === "register" ? "Crear Cuenta" : "Recuperar Contraseña"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors touch-manipulation"
            disabled={isLoading}
            aria-label="Cerrar modal"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-dark-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3 sm:space-y-4">
          {/* Success Message for Reset Password */}
          {mode === "reset-password" && resetPasswordSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-green-800 text-sm">
                ✅ Te hemos enviado un email con instrucciones para restablecer tu contraseña. 
                <br />
                <strong>Revisa tu bandeja de entrada y haz clic en el enlace del email.</strong>
              </p>
            </div>
          )}

          {/* General Error */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-800 text-sm">{errors.general}</p>
            </div>
          )}

          {/* Name field (only for register) */}
          {mode === "register" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-2">
                Tu nombre de escritor
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-dark-500" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-gray-900 dark:text-dark-100 bg-white dark:bg-dark-700 ${
                    errors.name ? "border-red-300 bg-red-50 dark:border-red-600 dark:bg-red-900/20" : "border-gray-300 dark:border-dark-600"
                  }`}
                  placeholder="Tu nombre de escritor"
                  disabled={isLoading}
                />
              </div>
              {errors.name && (
                <p className="text-red-600 text-sm mt-1">{errors.name}</p>
              )}
            </div>
          )}

          {/* Email field */}
          {!(mode === "reset-password" && resetPasswordSuccess) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-2">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-dark-500" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-gray-900 dark:text-dark-100 bg-white dark:bg-dark-700 ${
                    errors.email ? "border-red-300 bg-red-50 dark:border-red-600 dark:bg-red-900/20" : "border-gray-300 dark:border-dark-600"
                  }`}
                  placeholder="tu@email.com"
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className="text-red-600 text-sm mt-1">{errors.email}</p>
              )}
            </div>
          )}

          {/* Password field (not shown for reset-password) */}
          {mode !== "reset-password" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-dark-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-gray-900 dark:text-dark-100 bg-white dark:bg-dark-700 ${
                    errors.password
                      ? "border-red-300 bg-red-50 dark:border-red-600 dark:bg-red-900/20"
                      : "border-gray-300 dark:border-dark-600"
                  }`}
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-dark-500 hover:text-gray-600 dark:hover:text-dark-300"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-600 text-sm mt-1">{errors.password}</p>
              )}
            </div>
          )}

          {/* Instructions for reset password */}
          {mode === "reset-password" && !resetPasswordSuccess && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-blue-800 text-sm">
                📧 Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
              </p>
            </div>
          )}

          {/* Confirm Password field (only for register) */}
          {mode === "register" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-2">
                Confirmar contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-dark-500" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    handleInputChange("confirmPassword", e.target.value)
                  }
                  className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-gray-900 dark:text-dark-100 bg-white dark:bg-dark-700 ${
                    errors.confirmPassword
                      ? "border-red-300 bg-red-50 dark:border-red-600 dark:bg-red-900/20"
                      : "border-gray-300 dark:border-dark-600"
                  }`}
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.confirmPassword}
                </p>
              )}
            </div>
          )}

          {/* Email notifications consent (only for register) */}
          {mode === "register" && (
            <div className="flex items-start space-x-3 p-3 sm:p-4 bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg">
              <input
                type="checkbox"
                id="emailNotifications"
                checked={formData.emailNotifications}
                onChange={(e) => handleInputChange("emailNotifications", e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-1"
              />
              <div className="flex-1">
                <label htmlFor="emailNotifications" className="text-sm font-medium text-gray-700 dark:text-dark-300">
                  📧 Notificaciones por email
                </label>
                <p className="text-xs text-gray-600 dark:text-dark-400 mt-1">
                  Acepto recibir emails sobre nuevos concursos, recordatorios y resultados. 
                  Puedes desuscribirte en cualquier momento desde tu perfil o desde los emails.
                </p>
              </div>
            </div>
          )}

          {/* Terms and Privacy consent (only for register) - REQUIRED */}
          {mode === "register" && (
            <div className="flex items-start space-x-3 p-3 sm:p-4 bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg">
              <input
                type="checkbox"
                id="termsAccepted"
                checked={formData.termsAccepted || false}
                onChange={(e) => handleInputChange("termsAccepted", e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-1 flex-shrink-0"
                required
              />
              <div className="flex-1">
                <label htmlFor="termsAccepted" className="text-sm font-medium text-gray-900 dark:text-dark-100">
                  ⚖️ Aceptación de términos legales <span className="text-red-600">*</span>
                </label>
                <p className="text-xs text-gray-700 dark:text-dark-300 mt-1 leading-relaxed">
                  He leído y acepto los{" "}
                  <a 
                    href="/terms" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 underline font-medium"
                  >
                    Términos de Servicio
                  </a>
                  , la{" "}
                  <a 
                    href="/privacy" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 underline font-medium"
                  >
                    Política de Privacidad
                  </a>
                  {" "}y la{" "}
                  <a 
                    href="/dmca" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 underline font-medium"
                  >
                    Política DMCA
                  </a>
                  . Entiendo que solo puedo publicar contenido 100% original de mi autoría.
                </p>
                {errors.termsAccepted && (
                  <div className="mt-2 flex items-center text-red-600">
                    <AlertTriangle className="h-4 w-4 mr-1 flex-shrink-0" />
                    <p className="text-xs">{errors.termsAccepted}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Submit Button */}
          {!(mode === "reset-password" && resetPasswordSuccess) && (
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <Loader className="h-5 w-5 animate-spin mr-2" />
                  {mode === "login" ? "Iniciando sesión..." : mode === "register" ? "Creando cuenta..." : "Enviando email..."}
                </>
              ) : mode === "login" ? (
                "Iniciar Sesión"
              ) : mode === "register" ? (
                "Crear Cuenta"
              ) : (
                "Enviar email de recuperación"
              )}
            </button>
          )}

          {/* Forgot Password Link (only for login) */}
          {mode === "login" && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setMode("reset-password");
                }}
                className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium"
                disabled={isLoading}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          )}

          {/* Mode Toggle */}
          <div className="text-center pt-4 border-t border-gray-200 dark:border-dark-600">
            <p className="text-gray-600 dark:text-dark-300 text-sm">
              {mode === "login" ? "¿No tienes cuenta?" : mode === "register" ? "¿Ya tienes cuenta?" : "¿Ya recordaste tu contraseña?"}
              <button
                type="button"
                onClick={() => setMode(mode === "login" ? "register" : "login")}
                className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium ml-1"
                disabled={isLoading}
              >
                {mode === "login" ? "Créala aquí" : mode === "register" ? "Inicia sesión" : "Inicia sesión"}
              </button>
            </p>
          </div>

          {/* Terms Notice (only for register) */}
          {mode === "register" && (
            <div className="text-xs text-gray-500 dark:text-dark-400 text-center">
              Al crear una cuenta, aceptas nuestros{" "}
              <a href="/terms" className="text-primary-600 dark:text-primary-400 hover:underline">
                Términos de Servicio
              </a>{" "}
              y{" "}
              <a href="/privacy" className="text-primary-600 dark:text-primary-400 hover:underline">
                Política de Privacidad
              </a>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default AuthModal;
// El componente usa login/register del contexto, no limpia datos.
