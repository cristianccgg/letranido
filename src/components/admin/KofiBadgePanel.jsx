import { useState } from "react";
import { Heart, UserPlus, UserMinus, Mail, AlertCircle, CheckCircle, Loader } from "lucide-react";
import { supabase } from "../../lib/supabase";

const KofiBadgePanel = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [action, setAction] = useState("assign"); // "assign" o "remove"

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const functionName =
        action === "assign"
          ? "assign_kofi_badge_by_email"
          : "remove_kofi_badge_by_email";

      const { data, error } = await supabase.rpc(functionName, {
        user_email: email.trim().toLowerCase(),
      });

      if (error) throw error;

      setResult(data);

      // Limpiar el campo si fue exitoso
      if (data.success) {
        setEmail("");
      }
    } catch (error) {
      console.error("Error:", error);
      setResult({
        success: false,
        message: `Error al ${action === "assign" ? "asignar" : "remover"} el badge: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 dark:bg-dark-700">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-br from-pink-400 via-rose-500 to-red-500 rounded-lg">
          <Heart className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-100">
            Ko-fi Supporter Badge
          </h2>
          <p className="text-sm text-gray-600 dark:text-dark-400">
            Asignar o remover badge de donantes Ko-fi
          </p>
        </div>
      </div>

      {/* Información del badge */}
      <div className="mb-6 p-4 bg-pink-50 border border-pink-200 rounded-lg dark:bg-pink-900/10 dark:border-pink-800">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-pink-600 dark:text-pink-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-pink-800 dark:text-pink-200">
            <p className="font-semibold mb-1">Proceso manual</p>
            <p>
              Introduce el email del usuario registrado en Letranido para asignarle
              o removerle el badge de Ko-fi Supporter. Verifica la donación en tu
              dashboard de Ko-fi antes de asignar el badge.
            </p>
          </div>
        </div>
      </div>

      {/* Selector de acción */}
      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => {
            setAction("assign");
            setResult(null);
          }}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
            action === "assign"
              ? "bg-pink-500 text-white shadow-md"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-dark-600 dark:text-dark-300"
          }`}
        >
          <UserPlus className="h-4 w-4 inline mr-2" />
          Asignar Badge
        </button>
        <button
          type="button"
          onClick={() => {
            setAction("remove");
            setResult(null);
          }}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
            action === "remove"
              ? "bg-red-500 text-white shadow-md"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-dark-600 dark:text-dark-300"
          }`}
        >
          <UserMinus className="h-4 w-4 inline mr-2" />
          Remover Badge
        </button>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-2"
          >
            <Mail className="h-4 w-4 inline mr-2" />
            Email del Usuario
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="usuario@ejemplo.com"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-dark-600 dark:border-dark-500 dark:text-dark-100"
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !email.trim()}
          className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all ${
            action === "assign"
              ? "bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
              : "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
          } disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg`}
        >
          {loading ? (
            <>
              <Loader className="h-5 w-5 inline mr-2 animate-spin" />
              Procesando...
            </>
          ) : action === "assign" ? (
            <>
              <UserPlus className="h-5 w-5 inline mr-2" />
              Asignar Badge Ko-fi
            </>
          ) : (
            <>
              <UserMinus className="h-5 w-5 inline mr-2" />
              Remover Badge Ko-fi
            </>
          )}
        </button>
      </form>

      {/* Resultado */}
      {result && (
        <div
          className={`mt-6 p-4 rounded-lg border ${
            result.success
              ? "bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800"
              : "bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800"
          }`}
        >
          <div className="flex items-start gap-3">
            {result.success ? (
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p
                className={`font-semibold ${
                  result.success
                    ? "text-green-800 dark:text-green-200"
                    : "text-red-800 dark:text-red-200"
                }`}
              >
                {result.message}
              </p>
              {result.display_name && (
                <p
                  className={`text-sm mt-1 ${
                    result.success
                      ? "text-green-700 dark:text-green-300"
                      : "text-red-700 dark:text-red-300"
                  }`}
                >
                  Usuario: <strong>{result.display_name}</strong> ({result.email})
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Estadísticas (opcional - se puede agregar después) */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-dark-600">
        <p className="text-xs text-gray-500 dark:text-dark-400 text-center">
          💡 Tip: Verifica siempre la donación en tu dashboard de Ko-fi antes de
          asignar el badge
        </p>
      </div>
    </div>
  );
};

export default KofiBadgePanel;
