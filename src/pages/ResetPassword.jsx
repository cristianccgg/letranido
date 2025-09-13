// pages/ResetPassword.jsx - Página para restablecer contraseña
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Lock, Loader } from "lucide-react";
import { useGlobalApp } from "../contexts/GlobalAppContext";
import { supabase } from "../lib/supabase";

const ResetPassword = () => {
  console.log("🏠 ResetPassword component mounted");
  console.log("🏠 URL:", window.location.href);
  
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, completePasswordReset } = useGlobalApp();
  
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [validToken, setValidToken] = useState(false);
  const [resetTokens, setResetTokens] = useState(null);

  // Verificar si hay tokens válidos en la URL (pueden estar en hash o query params)
  useEffect(() => {
    console.log("🔍 RESET PAGE: Verificando tokens en ResetPassword");
    console.log("🔍 URL completa:", window.location.href);
    console.log("🔍 Hash:", window.location.hash);
    console.log("🔍 Search params:", window.location.search);
    
    // Intentar obtener de query params primero
    let accessToken = searchParams.get("access_token");
    let refreshToken = searchParams.get("refresh_token");
    let _type = searchParams.get("type");
    
    console.log("🔍 Query params - accessToken:", accessToken);
    console.log("🔍 Query params - refreshToken:", refreshToken);
    console.log("🔍 Query params - type:", _type);
    
    // Si no están en query params, buscar en el hash
    if (!accessToken && window.location.hash) {
      console.log("🔍 Buscando en hash...");
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      accessToken = hashParams.get("access_token");
      refreshToken = hashParams.get("refresh_token");
      _type = hashParams.get("type");
      
      console.log("🔍 Hash params - accessToken:", accessToken ? "FOUND" : "NOT FOUND");
      console.log("🔍 Hash params - refreshToken:", refreshToken ? "FOUND" : "NOT FOUND");
      console.log("🔍 Hash params - type:", _type);
    }
    
    // Si estamos autenticados pero no hay tokens visibles, 
    // significa que Supabase ya los procesó automáticamente
    if (!accessToken && !refreshToken && isAuthenticated) {
      setValidToken(true);
      
      // Obtener la sesión actual para usar sus tokens
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setResetTokens({
            access_token: session.access_token,
            refresh_token: session.refresh_token
          });
        }
      });
      // NO hacer return aquí - queremos que vea el formulario
    }
    
    // Logs removidos para producción
    
    if (accessToken && refreshToken) {
      setValidToken(true);
      setResetTokens({
        access_token: accessToken,
        refresh_token: refreshToken
      });
      // Establecer la sesión con los tokens
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
    } else {
      // INTENTAR RECUPERAR tokens preservados de sessionStorage
      const tempAccessToken = sessionStorage.getItem('temp_access_token');
      const tempRefreshToken = sessionStorage.getItem('temp_refresh_token');
      
      console.log("🔍 Buscando tokens preservados...");
      console.log("🔍 tempAccessToken:", tempAccessToken ? "FOUND" : "NOT FOUND");
      
      if (tempAccessToken) {
        console.log("✅ USANDO tokens preservados de sessionStorage");
        setValidToken(true);
        setResetTokens({
          access_token: tempAccessToken,
          refresh_token: tempRefreshToken
        });
        
        // Establecer sesión con tokens preservados
        supabase.auth.setSession({
          access_token: tempAccessToken,
          refresh_token: tempRefreshToken,
        });
        
        // Limpiar tokens temporales
        sessionStorage.removeItem('temp_access_token');
        sessionStorage.removeItem('temp_refresh_token');
      } else {
        console.log("❌ NO HAY TOKENS VÁLIDOS");
        console.log("❌ accessToken:", accessToken);
        console.log("❌ refreshToken:", refreshToken);
        console.log("❌ isAuthenticated:", isAuthenticated);
        setError("Enlace inválido o expirado. Solicita un nuevo email de recuperación.");
      }
    }
  }, [searchParams, isAuthenticated]);

  // NO redirigir automáticamente - queremos que el usuario cambie su contraseña
  // useEffect(() => {
  //   if (isAuthenticated && !validToken) {
  //     navigate("/profile");
  //   }
  // }, [isAuthenticated, validToken, navigate]);

  const validateForm = () => {
    if (!formData.password) {
      setError("La contraseña es requerida");
      return false;
    }
    
    if (formData.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    console.log("🔄 Iniciando cambio de contraseña SEGURO...");

    try {
      // SEGURIDAD: No usar sesión automática de Supabase
      // Usar solo los tokens del reset para cambiar contraseña
      
      if (!resetTokens || !resetTokens.access_token) {
        throw new Error("No hay tokens válidos para el reset de contraseña");
      }
      
      console.log("🔐 Usando tokens de reset para cambio seguro de contraseña");
      
      // Crear un cliente temporal solo para esta operación
      const { createClient } = await import('@supabase/supabase-js');
      const tempSupabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY,
        {
          global: {
            headers: {
              Authorization: `Bearer ${resetTokens.access_token}`
            }
          }
        }
      );
      
      console.log("🔄 Llamando updateUser con cliente temporal...");
      const { error } = await tempSupabase.auth.updateUser({
        password: formData.password
      });
      
      console.log("📝 Resultado de updateUser:", error ? "ERROR" : "SUCCESS");

      if (error) {
        console.error("Error updating password:", error);
        const friendlyError = getErrorMessage(error);
        setError(friendlyError);
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      setIsLoading(false);
      
      console.log("✅ Contraseña actualizada exitosamente");
      
      // ✅ SEGURIDAD: Completar el reset y limpiar estado temporal
      completePasswordReset();
      
      // SEGURIDAD: Asegurar que no hay sesión automática después del reset
      await supabase.auth.signOut();
      
      // Limpiar cualquier token temporal
      sessionStorage.removeItem('temp_access_token');
      sessionStorage.removeItem('temp_refresh_token');
      
      console.log("🔐 Reset completado de forma segura - usuario debe iniciar sesión");
      
      // Redirigir al login después de 3 segundos
      setTimeout(() => {
        navigate("/");
      }, 3000);
      
    } catch (error) {
      console.error("❌ Error inesperado en cambio de contraseña:", error);
      console.error("❌ Error details:", {
        message: error.message,
        code: error.code,
        status: error.status
      });
      
      const friendlyError = getErrorMessage(error);
      setError(friendlyError);
      setIsLoading(false);
    }
  };

  // Mapear errores específicos de Supabase a mensajes amigables
  const getErrorMessage = (error) => {
    const errorMessage = error?.message || error;
    
    if (errorMessage.includes("New password should be different from the old password")) {
      return "La nueva contraseña debe ser diferente a la anterior.";
    }
    
    if (errorMessage.includes("Password should be at least")) {
      return "La contraseña debe tener al menos 6 caracteres.";
    }
    
    if (errorMessage.includes("Invalid session")) {
      return "Tu sesión ha expirado. Solicita un nuevo email de recuperación.";
    }
    
    if (errorMessage.includes("User not found")) {
      return "Usuario no encontrado. Verifica que el enlace sea correcto.";
    }
    
    if (errorMessage.includes("Invalid refresh token")) {
      return "El enlace ha expirado. Solicita un nuevo email de recuperación.";
    }
    
    // Error genérico
    return "Error al actualizar la contraseña. Intenta nuevamente.";
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(""); // Limpiar error cuando el usuario escribe
  };

  if (!validToken && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-accent-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando enlace...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-accent-50">
        <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md mx-4">
          <div className="text-center">
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              ¡Contraseña actualizada!
            </h1>
            <p className="text-gray-600 mb-6">
              Tu contraseña ha sido actualizada exitosamente. Ahora puedes iniciar sesión con tu nueva contraseña.
            </p>
            <button
              onClick={() => navigate("/")}
              className="btn-primary w-full"
            >
              Ir a iniciar sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-accent-50">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md mx-4">
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Restablecer Contraseña
          </h1>
          <p className="text-gray-600">
            Ingresa tu nueva contraseña
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nueva contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="new-password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                placeholder="••••••••"
                disabled={isLoading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Confirm Password Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirmar nueva contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                placeholder="••••••••"
                disabled={isLoading}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Requirements */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-blue-800 text-sm">
              <strong>Requisitos:</strong>
              <br />
              • Mínimo 6 caracteres
              <br />
              • Ambas contraseñas deben coincidir
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <Loader className="h-5 w-5 animate-spin mr-2" />
                Actualizando contraseña...
              </>
            ) : (
              "Actualizar contraseña"
            )}
          </button>
        </form>

        {/* Back to Login */}
        <div className="text-center mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={() => navigate("/")}
            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            ← Volver al inicio
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;