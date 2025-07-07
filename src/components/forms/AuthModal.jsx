import { useState, useEffect } from "react";
import { X, Mail, Lock, User, Loader } from "lucide-react";
import { useAuthStore } from "../../store/authStore";

const AuthModal = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = "register",
}) => {
  const [mode, setMode] = useState(initialMode);
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    password: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
    }
  }, [isOpen, initialMode]);

  const { login, register, isLoading } = useAuthStore();

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = "El email es requerido";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email inválido";
    }

    if (mode === "register" && !formData.name) {
      newErrors.name = "El nombre es requerido";
    }

    if (!formData.password) {
      newErrors.password = "La contraseña es requerida";
    } else if (mode === "register" && formData.password.length < 6) {
      newErrors.password = "La contraseña debe tener al menos 6 caracteres";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      let result;
      if (mode === "register") {
        result = await register(
          formData.email,
          formData.name,
          formData.password
        );
      } else {
        result = await login(formData.email, formData.password);
      }

      if (result.success) {
        onSuccess();
      } else {
        setErrors({ submit: result.error });
      }
    } catch (error) {
      setErrors({ submit: "Error inesperado. Intenta nuevamente." });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === "register" ? "Crear cuenta" : "Iniciar sesión"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 mb-6">
            {mode === "register"
              ? "Únete a nuestra comunidad de escritores y comparte tus historias"
              : "Bienvenido de vuelta. Ingresa para continuar escribiendo"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none ${
                    errors.email ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="tu@email.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Name (only for register) */}
            {mode === "register" && (
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Nombre de escritor
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none ${
                      errors.name ? "border-red-300" : "border-gray-300"
                    }`}
                    placeholder="Tu nombre público"
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>
            )}

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none ${
                    errors.password ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="••••••••"
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-3 flex items-center justify-center disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader className="animate-spin h-5 w-5 mr-2" />
                  {mode === "register"
                    ? "Creando cuenta..."
                    : "Iniciando sesión..."}
                </>
              ) : mode === "register" ? (
                "Crear cuenta"
              ) : (
                "Iniciar sesión"
              )}
            </button>
          </form>

          {/* Mode Switch */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              {mode === "register"
                ? "¿Ya tienes cuenta?"
                : "¿No tienes cuenta?"}{" "}
              <button
                onClick={() => {
                  setMode(mode === "register" ? "login" : "register");
                  setErrors({});
                  setFormData({ email: "", name: "", password: "" });
                }}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                {mode === "register" ? "Inicia sesión" : "Regístrate gratis"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
