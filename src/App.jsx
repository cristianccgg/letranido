// App.jsx - VERSIÓN COMPLETAMENTE ACTUALIZADA PARA CONTEXTO UNIFICADO
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { GlobalAppProvider, useGlobalApp } from "./contexts/GlobalAppContext";
import { useGoogleAnalytics } from "./hooks/useGoogleAnalytics";
import { useMaintenanceMode } from "./hooks/useMaintenanceMode";
import Layout from "./components/layout/Layout";
import LandingPage from "./pages/LandingPage";
import UnifiedProfile from "./pages/UnifiedProfile";
import WritePrompt from "./pages/WritePrompt";
import ContestHistory from "./pages/ContestHistory"; // ✅ CAMBIADO DE Gallery
import CurrentContest from "./pages/CurrentContest";
import StoryPage from "./pages/StoryPage";
import ContestAdminPanel from "./components/admin/ContestAdminPanel";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import CookiePolicy from "./pages/CookiePolicy";
import CommunityGuidelines from "./pages/CommunityGuidelines";
import EmailUnsubscribe from "./pages/EmailUnsubscribe";
import Preferences from "./pages/Preferences";
import MaintenancePage from "./pages/MaintenancePage";

// ✅ Componente interno que usa el contexto unificado
function AppContent() {
  const { initialized, authInitialized, user } = useGlobalApp();
  const { isActive: maintenanceActive, message, estimatedDuration, activatedAt, loading: maintenanceLoading } = useMaintenanceMode();
  
  // Inicializar Google Analytics cuando el contexto esté listo
  useGoogleAnalytics();

  // 🔧 DEBUG: Agregar logs para entender el estado
  console.log("🔍 AppContent render:", {
    authInitialized,
    initialized,
    maintenanceActive,
    maintenanceLoading,
    showingLoading: !authInitialized || !initialized,
  });

  // ✅ VERIFICAR MODO MANTENIMIENTO PRIMERO
  // Si el mantenimiento está activo, mostrar página de mantenimiento de forma inteligente
  if (!maintenanceLoading && maintenanceActive) {
    const currentPath = window.location.pathname;
    
    // 🔧 DEBUG: Log para troubleshooting
    console.log('🔍 Maintenance check:', {
      currentPath,
      maintenanceActive,
      user: user?.email || 'no user',
      isAdmin: user?.is_admin || false
    });
    
    // Páginas que los admins pueden ver durante mantenimiento
    const adminAllowedPages = [
      '/admin',
      '/maintenance-preview'
    ];
    
    // Páginas que todos pueden ver durante mantenimiento (para testing)
    const publicAllowedPages = [
      '/login',
      '/register', 
      '/auth',
      '/callback',
      '/reset-password',
      '/confirm',
      '/terms',
      '/privacy',
      '/privacy-policy',
      '/cookie-policy',
      '/community-guidelines'
    ];
    
    const isAdminPage = adminAllowedPages.some(page => currentPath.startsWith(page));
    const isPublicAllowedPage = publicAllowedPages.some(page => currentPath.startsWith(page));
    
    // Mostrar página de mantenimiento EXCEPTO:
    // 1. Si es admin en páginas de admin
    // 2. Si es una página pública permitida (login, registro, etc.) - SIEMPRE disponible
    const shouldShowMaintenance = !(
      (user?.is_admin && isAdminPage) || 
      isPublicAllowedPage
    );
    
    if (shouldShowMaintenance) {
      return (
        <MaintenancePage 
          maintenanceInfo={{
            message,
            estimatedDuration,
            activatedAt
          }}
        />
      );
    }
  }

  // ✅ LOADING SIMPLIFICADO - Un solo estado global
  // Solo mostrar loading si auth no está inicializado o si no está inicializado completamente
  if (!authInitialized || !initialized || maintenanceLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-accent-50">
        <div className="text-center">
          <div className="relative">
            {/* Spinner más elegante */}
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600 mx-auto mb-6"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-accent-400 animate-ping"></div>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-800">
              Cargando Letranido
            </h2>
            <p className="text-gray-600">
              {!authInitialized
                ? "Verificando sesión..."
                : !initialized
                  ? "Preparando tu experiencia..."
                  : maintenanceLoading
                    ? "Verificando estado del sistema..."
                    : "Casi listo..."}
            </p>

            {/* Barra de progreso simple */}
            <div className="w-64 mx-auto mt-4">
              <div className="bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-primary-500 to-accent-500 h-2 rounded-full animate-pulse"
                  style={{
                    width: !authInitialized
                      ? "50%"
                      : !initialized
                        ? "75%"
                        : "100%",
                    transition: "width 0.5s ease-in-out",
                  }}
                ></div>
              </div>
            </div>

            <div className="text-xs text-gray-500 mt-4">
              ✨ Una comunidad donde la creatividad no tiene límites
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<LandingPage />} />

          {/* ✅ RUTAS SIMPLIFICADAS - Menos componentes diferentes */}
          <Route path="/profile" element={<UnifiedProfile />} />
          <Route path="/dashboard" element={<UnifiedProfile />} />
          <Route path="/profile/:userId" element={<UnifiedProfile />} />

          <Route path="/write/:promptId?" element={<WritePrompt />} />
          <Route path="/history" element={<ContestHistory />} />
          <Route path="/contest-history" element={<ContestHistory />} />
          <Route path="/contest/current" element={<CurrentContest />} />
          <Route path="/contest/:id" element={<CurrentContest />} />
          <Route path="/story/:id" element={<StoryPage />} />

          {/* Admin */}
          <Route path="/admin" element={<ContestAdminPanel />} />
          <Route path="/maintenance-preview" element={<MaintenancePage maintenanceInfo={{ message, estimatedDuration, activatedAt }} />} />

          {/* Email management */}
          <Route path="/email/unsubscribe" element={<EmailUnsubscribe />} />

          {/* User Preferences */}
          <Route path="/preferences" element={<Preferences />} />

          {/* Legal */}
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/cookie-policy" element={<CookiePolicy />} />
          <Route
            path="/community-guidelines"
            element={<CommunityGuidelines />}
          />

          {/* ✅ RUTA 404 MEJORADA */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

// ✅ Componente 404 simple
function NotFoundPage() {
  const { currentContest } = useGlobalApp();

  return (
    <div className="max-w-2xl mx-auto text-center py-16">
      <div className="text-6xl mb-4">📚</div>
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        Página no encontrada
      </h1>
      <p className="text-gray-600 mb-8">
        La página que buscas no existe o ha sido movida.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <a href="/" className="btn-primary">
          Volver al inicio
        </a>
        {currentContest && (
          <a href="/contest/current" className="btn-secondary">
            Ver concurso actual
          </a>
        )}
        <a href="/history" className="btn-secondary">
          Ver historial de concursos
        </a>
      </div>
    </div>
  );
}

// ✅ COMPONENTE PRINCIPAL SIMPLIFICADO
function App() {
  return (
    <GlobalAppProvider>
      <AppContent />
    </GlobalAppProvider>
  );
}

export default App;
