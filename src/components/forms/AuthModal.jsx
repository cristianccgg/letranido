// components/forms/AuthModal.jsx - ACTUALIZADO PARA CONTEXTO GLOBAL
import { useState, useEffect } from "react";
import { X, Eye, EyeOff, User, Mail, Lock, Loader } from "lucide-react";
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
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // ✅ USO DEL CONTEXTO GLOBAL EN LUGAR DE AUTHSTORE
  const { 
    login, 
    register, 
    isLoading, 
    authModalErrors: serverErrors,
    clearAuthModalErrors 
  } = useGlobalApp();

  // ✅ GOOGLE ANALYTICS
  const { trackEvent } = useGoogleAnalytics();

  // Combinar errores del servidor y de validación
  const errors = { ...validationErrors, ...serverErrors };

  // Reset form only when mode actually changes, track previous mode
  const [prevMode, setPrevMode] = useState(mode);
  
  useEffect(() => {
    console.log("🔍 AuthModal useEffect - mode:", mode, "prevMode:", prevMode);
    
    // Solo limpiar si realmente cambió el modo
    if (mode !== prevMode) {
      console.log("🔄 Limpiando formulario - modo cambió de", prevMode, "a", mode);
      setFormData({
        email: "",
        password: "",
        name: "",
        confirmPassword: "",
        emailNotifications: true,
      });
      clearAuthModalErrors();
      setValidationErrors({});
      setShowPassword(false);
      setShowConfirmPassword(false);
      setPrevMode(mode);
    }
  }, [mode, prevMode, clearAuthModalErrors]);

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = "El email es requerido";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "El email no es válido";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "La contraseña es requerida";
    } else if (formData.password.length < 6) {
      newErrors.password = "La contraseña debe tener al menos 6 caracteres";
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
      } else {
        console.log("📧 Enviando registro con emailNotifications:", formData.emailNotifications);
        result = await register(
          formData.email,
          formData.name,
          formData.password,
          formData.emailNotifications
        );
      }

      console.log("🔍 Auth result:", result);
      
      if (result.success) {
        // 📊 TRACK EVENT: User signup (only for register mode)
        if (mode === "register") {
          trackEvent(AnalyticsEvents.USER_SIGNUP, {
            email_notifications: formData.emailNotifications,
            signup_method: 'email'
          });
        }

        console.log("✅ Login exitoso, cerrando modal");
        // Cerrar modal solo en caso de éxito
        onSuccess?.();
        onClose();
      } else {
        console.log("❌ Login falló, manteniendo modal abierto para mostrar errores");
        // NO cerrar el modal en caso de error para que el usuario vea el mensaje
        // El error ya se estableció en el contexto global desde la función login
      }
    } catch (error) {
      console.error("Auth error:", error);
      console.error("❌ Error inesperado en AuthModal");
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
    console.log("🚫 AuthModal no renderiza - isOpen:", isOpen);
    return null;
  }
  
  console.log("✅ AuthModal renderizando - isLoading:", isLoading, "validationErrors:", validationErrors, "serverErrors:", serverErrors);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {mode === "login" ? "Iniciar Sesión" : "Crear Cuenta"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* General Error */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-800 text-sm">{errors.general}</p>
            </div>
          )}

          {/* Name field (only for register) */}
          {mode === "register" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tu nombre de escritor
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-gray-900 bg-white ${
                    errors.name ? "border-red-300 bg-red-50" : "border-gray-300"
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Correo electrónico
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-gray-900 bg-white ${
                  errors.email ? "border-red-300 bg-red-50" : "border-gray-300"
                }`}
                placeholder="tu@email.com"
                disabled={isLoading}
              />
            </div>
            {errors.email && (
              <p className="text-red-600 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          {/* Password field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-gray-900 bg-white ${
                  errors.password
                    ? "border-red-300 bg-red-50"
                    : "border-gray-300"
                }`}
                placeholder="••••••••"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
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

          {/* Confirm Password field (only for register) */}
          {mode === "register" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    handleInputChange("confirmPassword", e.target.value)
                  }
                  className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none ${
                    errors.confirmPassword
                      ? "border-red-300 bg-red-50"
                      : "border-gray-300"
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
            <div className="flex items-start space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <input
                type="checkbox"
                id="emailNotifications"
                checked={formData.emailNotifications}
                onChange={(e) => handleInputChange("emailNotifications", e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-1"
              />
              <div className="flex-1">
                <label htmlFor="emailNotifications" className="text-sm font-medium text-gray-700">
                  📧 Notificaciones por email
                </label>
                <p className="text-xs text-gray-600 mt-1">
                  Acepto recibir emails sobre nuevos concursos, recordatorios y resultados. 
                  Puedes desuscribirte en cualquier momento desde tu perfil o desde los emails.
                </p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <Loader className="h-5 w-5 animate-spin mr-2" />
                {mode === "login" ? "Iniciando sesión..." : "Creando cuenta..."}
              </>
            ) : mode === "login" ? (
              "Iniciar Sesión"
            ) : (
              "Crear Cuenta"
            )}
          </button>

          {/* Mode Toggle */}
          <div className="text-center pt-4 border-t border-gray-200">
            <p className="text-gray-600 text-sm">
              {mode === "login" ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}
              <button
                type="button"
                onClick={() => setMode(mode === "login" ? "register" : "login")}
                className="text-primary-600 hover:text-primary-700 font-medium ml-1"
                disabled={isLoading}
              >
                {mode === "login" ? "Créala aquí" : "Inicia sesión"}
              </button>
            </p>
          </div>

          {/* Terms Notice (only for register) */}
          {mode === "register" && (
            <div className="text-xs text-gray-500 text-center">
              Al crear una cuenta, aceptas nuestros{" "}
              <a href="/terms" className="text-primary-600 hover:underline">
                Términos de Servicio
              </a>{" "}
              y{" "}
              <a href="/privacy" className="text-primary-600 hover:underline">
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
