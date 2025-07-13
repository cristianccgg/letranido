// components/admin/DataCleanupPanel.jsx - Panel para limpiar datos de prueba
import { useState } from "react";
import { Trash2, AlertTriangle, RefreshCw } from "lucide-react";
import { useGlobalApp } from "../../contexts/GlobalAppContext";

const DataCleanupPanel = () => {
  const [loading, setLoading] = useState({
    comments: false,
    likes: false,
    views: false,
    all: false,
  });

  const {
    user,
    clearAllComments,
    clearAllStoryLikes,
    clearAllStoryViews,
    clearAllTestData,
  } = useGlobalApp();

  // Solo mostrar si es admin
  if (!user?.is_admin) {
    return null;
  }

  const handleClearComments = async () => {
    if (!confirm("⚠️ ¿Estás seguro de eliminar TODOS los comentarios? Esta acción no se puede deshacer.")) {
      return;
    }

    setLoading(prev => ({ ...prev, comments: true }));
    try {
      const result = await clearAllComments();
      if (result.success) {
        alert("✅ Todos los comentarios han sido eliminados.");
        window.location.reload(); // Recargar para reflejar cambios
      } else {
        alert("❌ Error: " + result.error);
      }
    } catch (err) {
      alert("❌ Error inesperado: " + err.message);
    } finally {
      setLoading(prev => ({ ...prev, comments: false }));
    }
  };

  const handleClearLikes = async () => {
    if (!confirm("⚠️ ¿Estás seguro de eliminar TODOS los likes de historias? Esta acción no se puede deshacer.")) {
      return;
    }

    setLoading(prev => ({ ...prev, likes: true }));
    try {
      const result = await clearAllStoryLikes();
      if (result.success) {
        alert("✅ Todos los likes han sido eliminados.");
        window.location.reload();
      } else {
        alert("❌ Error: " + result.error);
      }
    } catch (err) {
      alert("❌ Error inesperado: " + err.message);
    } finally {
      setLoading(prev => ({ ...prev, likes: false }));
    }
  };

  const handleClearViews = async () => {
    if (!confirm("⚠️ ¿Estás seguro de eliminar TODAS las vistas de historias? Esta acción no se puede deshacer.")) {
      return;
    }

    setLoading(prev => ({ ...prev, views: true }));
    try {
      const result = await clearAllStoryViews();
      if (result.success) {
        alert("✅ Todas las vistas han sido eliminadas.");
        window.location.reload();
      } else {
        alert("❌ Error: " + result.error);
      }
    } catch (err) {
      alert("❌ Error inesperado: " + err.message);
    } finally {
      setLoading(prev => ({ ...prev, views: false }));
    }
  };

  const handleClearAll = async () => {
    if (!confirm("🚨 ¿ESTÁS COMPLETAMENTE SEGURO de eliminar TODOS los datos de prueba?\n\nEsto incluye:\n- Todos los comentarios\n- Todos los likes\n- Todas las vistas\n\nEsta acción NO se puede deshacer.")) {
      return;
    }

    if (!confirm("🚨 ÚLTIMA CONFIRMACIÓN: Esta acción eliminará TODOS los datos de interacción de usuarios. ¿Continuar?")) {
      return;
    }

    setLoading(prev => ({ ...prev, all: true }));
    try {
      const result = await clearAllTestData();
      if (result.success) {
        alert("✅ Todos los datos de prueba han sido eliminados.");
        window.location.reload();
      } else {
        alert("❌ Error: " + result.error);
      }
    } catch (err) {
      alert("❌ Error inesperado: " + err.message);
    } finally {
      setLoading(prev => ({ ...prev, all: false }));
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="h-5 w-5 text-orange-500" />
        <h3 className="text-lg font-semibold text-gray-900">
          🧹 Limpieza de Datos de Prueba
        </h3>
      </div>

      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-orange-800">
          <strong>⚠️ Solo para desarrollo:</strong> Estos botones eliminan datos reales de la base de datos. 
          Úsalos solo para limpiar datos de prueba durante el desarrollo.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Limpiar Comentarios */}
        <button
          onClick={handleClearComments}
          disabled={loading.comments}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading.comments ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
          Eliminar Comentarios
        </button>

        {/* Limpiar Likes */}
        <button
          onClick={handleClearLikes}
          disabled={loading.likes}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading.likes ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
          Eliminar Likes
        </button>

        {/* Limpiar Vistas */}
        <button
          onClick={handleClearViews}
          disabled={loading.views}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading.views ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
          Eliminar Vistas
        </button>

        {/* Limpiar Todo */}
        <button
          onClick={handleClearAll}
          disabled={loading.all}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 text-white font-medium rounded-lg hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading.all ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
          🚨 Eliminar Todo
        </button>
      </div>

      <div className="mt-4 text-xs text-gray-500">
        <p>
          <strong>Nota:</strong> La página se recargará automáticamente después de limpiar datos para reflejar los cambios.
        </p>
      </div>
    </div>
  );
};

export default DataCleanupPanel;