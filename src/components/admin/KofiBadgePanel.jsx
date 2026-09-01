import { useState, useEffect, useCallback } from "react";
import { Heart, UserPlus, UserMinus, Mail, AlertCircle, CheckCircle, Loader, Search, Clock, Users } from "lucide-react";
import { supabase } from "../../lib/supabase";

const KofiBadgePanel = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState(null);
  const [result, setResult] = useState(null);
  const [action, setAction] = useState("assign"); // "assign" o "remove"

  const [supporters, setSupporters] = useState([]);
  const [supportersLoading, setSupportersLoading] = useState(true);

  const loadSupporters = useCallback(async () => {
    setSupportersLoading(true);
    try {
      const { data, error } = await supabase.rpc("list_kofi_supporters");
      if (error) throw error;
      setSupporters(data || []);
    } catch (error) {
      console.error("Error cargando supporters Ko-fi:", error);
      setSupporters([]);
    } finally {
      setSupportersLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSupporters();
  }, [loadSupporters]);

  const handleCheckStatus = async () => {
    if (!email.trim()) return;
    setChecking(true);
    setStatus(null);
    setResult(null);

    try {
      const { data, error } = await supabase.rpc("get_kofi_badge_status_by_email", {
        user_email: email.trim().toLowerCase(),
      });

      if (error) throw error;
      setStatus(data);
    } catch (error) {
      console.error("Error:", error);
      setStatus({
        success: false,
        message: `Error al consultar el estado: ${error.message}`,
      });
    } finally {
      setChecking(false);
    }
  };

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
      setStatus(null);

      // Limpiar el campo si fue exitoso y refrescar el listado
      if (data.success) {
        setEmail("");
        loadSupporters();
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
              El badge Ko-fi Supporter dura 30 días desde la última donación registrada.
              Cada vez que alguien dona de nuevo, usa &ldquo;Registrar Donación&rdquo; para
              renovarlo y sumar karma — no hace falta remover nada entre donaciones.
              Verifica siempre la donación en tu dashboard de Ko-fi antes de registrarla.
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
          Registrar Donación
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
          <div className="flex gap-2">
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setStatus(null);
              }}
              placeholder="usuario@ejemplo.com"
              required
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-dark-600 dark:border-dark-500 dark:text-dark-100"
              disabled={loading}
            />
            <button
              type="button"
              onClick={handleCheckStatus}
              disabled={checking || loading || !email.trim()}
              title="Consultar estado actual del badge"
              className="px-4 py-2 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-dark-600 dark:text-dark-200 dark:hover:bg-dark-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {checking ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Estado actual del badge para este email */}
        {status && status.success && (
          <div className="p-3 rounded-lg border bg-gray-50 border-gray-200 dark:bg-dark-600/50 dark:border-dark-500 text-sm">
            {status.has_badge ? (
              <div className="flex items-start gap-2">
                <Clock className={`h-4 w-4 shrink-0 mt-0.5 ${status.is_active ? "text-pink-500" : "text-gray-400"}`} />
                <div className="text-gray-700 dark:text-dark-200">
                  <p>
                    <strong>{status.display_name}</strong> — Badge{" "}
                    {status.is_active ? (
                      <span className="text-pink-600 dark:text-pink-400 font-medium">activo</span>
                    ) : (
                      <span className="text-gray-500 font-medium">vencido</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-dark-400 mt-0.5">
                    Expira: {new Date(status.expires_at).toLocaleDateString("es-CO")} · Donaciones registradas: {status.donation_count}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-gray-600 dark:text-dark-300">
                <strong>{status.display_name}</strong> aún no tiene el badge Ko-fi Supporter.
              </p>
            )}
          </div>
        )}
        {status && status.success === false && (
          <p className="text-sm text-red-600 dark:text-red-400">{status.message}</p>
        )}

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
              Registrar Donación
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

      {/* Listado de supporters registrados */}
      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-dark-600">
        <div className="flex items-center justify-between mb-3">
          <h3 className="flex items-center gap-2 font-semibold text-gray-800 dark:text-dark-100">
            <Users className="h-4 w-4" />
            Supporters registrados ({supporters.length})
          </h3>
          <button
            type="button"
            onClick={loadSupporters}
            disabled={supportersLoading}
            className="text-xs text-pink-600 dark:text-pink-400 hover:underline disabled:opacity-50"
          >
            {supportersLoading ? "Cargando..." : "Refrescar"}
          </button>
        </div>

        {supportersLoading ? (
          <div className="flex items-center justify-center py-8 text-gray-400">
            <Loader className="h-5 w-5 animate-spin" />
          </div>
        ) : supporters.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-dark-400 text-center py-4">
            Aún no hay ningún usuario con el badge Ko-fi Supporter.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 dark:text-dark-400 border-b border-gray-200 dark:border-dark-600">
                  <th className="py-2 pr-3 font-medium">Usuario</th>
                  <th className="py-2 pr-3 font-medium">Estado</th>
                  <th className="py-2 pr-3 font-medium">Última donación</th>
                  <th className="py-2 pr-3 font-medium">Vence</th>
                  <th className="py-2 pr-3 font-medium text-right">Donaciones</th>
                </tr>
              </thead>
              <tbody>
                {supporters.map((s) => (
                  <tr
                    key={s.user_id}
                    className="border-b border-gray-100 dark:border-dark-700 last:border-0"
                  >
                    <td className="py-2 pr-3">
                      <div className="font-medium text-gray-800 dark:text-dark-100">
                        {s.display_name}
                      </div>
                      <div className="text-xs text-gray-400">{s.email}</div>
                    </td>
                    <td className="py-2 pr-3">
                      {s.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300">
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 dark:bg-dark-600 dark:text-dark-400">
                          Vencido
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-3 text-gray-600 dark:text-dark-300">
                      {s.last_donation_at
                        ? new Date(s.last_donation_at).toLocaleDateString("es-CO")
                        : "—"}
                    </td>
                    <td className="py-2 pr-3 text-gray-600 dark:text-dark-300">
                      {s.expires_at
                        ? new Date(s.expires_at).toLocaleDateString("es-CO")
                        : "—"}
                    </td>
                    <td className="py-2 pr-3 text-right font-medium text-gray-700 dark:text-dark-200">
                      {s.donation_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-dark-600">
        <p className="text-xs text-gray-500 dark:text-dark-400 text-center">
          💡 Tip: Verifica siempre la donación en tu dashboard de Ko-fi antes de
          registrarla
        </p>
      </div>
    </div>
  );
};

export default KofiBadgePanel;
