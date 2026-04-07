// App.jsx - VERSIÓN COMPLETAMENTE ACTUALIZADA PARA CONTEXTO UNIFICADO
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useParams,
} from "react-router-dom";

const RedirectBlogPost = () => {
  const { postId } = useParams();
  return <Navigate to={`/blog/${postId}`} replace />;
};

import { lazy, Suspense, useState, useEffect } from "react";
import { GlobalAppProvider, useGlobalApp } from "./contexts/GlobalAppContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ToastProvider } from "./contexts/ToastContext";
import ErrorBoundary from "./components/ErrorBoundary/ErrorBoundary";
import { useGoogleAnalytics } from "./hooks/useGoogleAnalytics";
import { useMaintenanceMode } from "./hooks/useMaintenanceMode";
import Layout from "./components/layout/Layout";
import ScrollToTop from "./components/ScrollToTop";
import { ToastContainer } from "./components/ui/Toast";
import { useGlobalToast } from "./hooks/useGlobalToast";
import SocialContainer from "./components/ui/SocialContainer";
import FeedbackModal from "./components/modals/FeedbackModal";
import { Analytics } from "@vercel/analytics/react";
import { FEATURES } from "./lib/config";

// Páginas críticas - carga inmediata
import LandingPage from "./pages/LandingPage";
import CurrentContest from "./pages/CurrentContest";
import StoryPage from "./pages/StoryPage";
import WritePrompt from "./pages/WritePrompt";

// Páginas menos críticas - lazy loading
const UnifiedProfile = lazy(() => import("./pages/UnifiedProfile"));
const ContestHistory = lazy(() => import("./pages/ContestHistory"));
const ContestAdminPanel = lazy(
  () => import("./components/admin/ContestAdminPanel")
);
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const DMCA = lazy(() => import("./pages/DMCA"));
const CookiePolicy = lazy(() => import("./pages/CookiePolicy"));
const CommunityGuidelines = lazy(() => import("./pages/CommunityGuidelines"));
const EmailUnsubscribe = lazy(() => import("./pages/EmailUnsubscribe"));
const Preferences = lazy(() => import("./pages/Preferences"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const MaintenancePage = lazy(() => import("./pages/MaintenancePage"));
const FAQ = lazy(() => import("./pages/FAQ"));
const HowItWorks = lazy(() => import("./pages/HowItWorks"));
const WritingResources = lazy(() => import("./pages/WritingResources"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const PremiumPlans = lazy(() => import("./pages/PremiumPlans"));
const WritePortfolio = lazy(() => import("./pages/WritePortfolio"));
const FreeStories = lazy(() => import("./pages/FreeStories"));
const AllStories = lazy(() => import("./pages/AllStories"));
const Support = lazy(() => import("./pages/Support"));
const AuthorProfile = lazy(() => import("./pages/AuthorProfile"));
const MicroStoryPage = lazy(() => import("./pages/MicroStoryPage"));

// ✅ Componente interno que usa el contexto unificado
function AppContent() {
  const { initialized, authInitialized, user, forceLogoutIfResetPending } = useGlobalApp();
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const {
    isActive: maintenanceActive,
    message,
    estimatedDuration,
    activatedAt,
    loading: maintenanceLoading,
  } = useMaintenanceMode();
  const { toasts, removeToast } = useGlobalToast();

  // Inicializar Google Analytics cuando el contexto esté listo
  useGoogleAnalytics();

  // ✅ GUARD DE SEGURIDAD PARA PASSWORD RESET
  // Verificar si el usuario está intentando salir de reset-password sin completar el cambio
  useEffect(() => {
    if (authInitialized) {
      forceLogoutIfResetPending();
    }
  }, [authInitialized, forceLogoutIfResetPending]);

  // ✅ VERIFICAR MODO MANTENIMIENTO PRIMERO
  // Si el mantenimiento está activo, mostrar página de mantenimiento de forma inteligente
  if (!maintenanceLoading && maintenanceActive) {
    const currentPath = window.location.pathname;

    // Páginas que los admins pueden ver durante mantenimiento
    const adminAllowedPages = ["/admin", "/maintenance-preview"];

    // Páginas que todos pueden ver durante mantenimiento (para testing)
    const publicAllowedPages = [
      "/login",
      "/register",
      "/auth",
      "/callback",
      "/reset-password",
      "/confirm",
      "/terms",
      "/privacy",
      "/privacy-policy",
      "/cookie-policy",
      "/community-guidelines",
      // Páginas esenciales para testing durante mantenimiento
      "/write",
      "/profile",
      "/dashboard",
      "/contest",
      "/story",
      "/preferences",
    ];

    const isAdminPage = adminAllowedPages.some((page) =>
      currentPath.startsWith(page)
    );
    const isPublicAllowedPage = publicAllowedPages.some((page) =>
      currentPath.startsWith(page)
    );

    // Mostrar página de mantenimiento EXCEPTO:
    // 1. Si estamos en desarrollo (localhost)
    // 2. Si es admin en páginas de admin
    // 3. Si es una página pública permitida (login, registro, etc.) - SIEMPRE disponible
    const isDevelopment = import.meta.env.DEV;
    const shouldShowMaintenance = !(
      isDevelopment ||  // Localhost siempre funciona
      (user?.is_admin && isAdminPage) ||
      isPublicAllowedPage
    );

    if (shouldShowMaintenance) {
      return (
        <MaintenancePage
          maintenanceInfo={{
            message,
            estimatedDuration,
            activatedAt,
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
      <ScrollToTop />
      <Layout onFeedbackClick={() => setShowFeedbackModal(true)}>
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          }
        >
          <SocialContainer onFeedbackClick={() => setShowFeedbackModal(true)} />
          <Routes>
            <Route path="/" element={<LandingPage />} />

            {/* ✅ RUTAS PRINCIPALES - Con canonical URLs */}
            <Route path="/profile" element={<UnifiedProfile />} />
            <Route path="/profile/:userId" element={<UnifiedProfile />} />
            
            {/* ✅ RUTAS DE PERFILES PÚBLICOS */}
            <Route path="/author/:userId" element={<AuthorProfile />} />

            {/* ✅ RUTA DE MICROHISTORIAS */}
            <Route path="/microhistoria/:id" element={<MicroStoryPage />} />

            {/* Redirects para evitar contenido duplicado */}
            <Route
              path="/dashboard"
              element={<Navigate to="/profile" replace />}
            />

            {/* Rutas para historias libres (específicas primero) */}
            {FEATURES.PORTFOLIO_STORIES && (
              <>
                <Route path="/stories" element={<FreeStories />} />
                <Route path="/write/portfolio" element={<WritePortfolio />} />
              </>
            )}
            
            {/* Ruta para ver todas las historias */}
            <Route path="/historias" element={<AllStories />} />
            
            {/* Ruta para escribir en retos (genérica después) */}
            <Route path="/write/:promptId?" element={<WritePrompt />} />

            {/* Ruta principal para historial */}
            <Route path="/contest-history" element={<ContestHistory />} />

            {/* Redirect para evitar contenido duplicado */}
            <Route
              path="/history"
              element={<Navigate to="/contest-history" replace />}
            />

            <Route path="/contest/current" element={<CurrentContest />} />
            <Route path="/contest/:id" element={<CurrentContest />} />
            <Route path="/story/:id" element={<StoryPage />} />

            {/* Admin */}
            <Route path="/admin" element={<ContestAdminPanel />} />
            <Route
              path="/maintenance-preview"
              element={
                <MaintenancePage
                  maintenanceInfo={{ message, estimatedDuration, activatedAt }}
                />
              }
            />

            {/* User Preferences */}
            <Route path="/preferences" element={<Preferences />} />

            {/* Password Reset */}
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* FAQ */}
            <Route path="/faq" element={<FAQ />} />

            {/* Support */}
            <Route path="/apoyar" element={<Support />} />

            {/* How It Works */}
            <Route path="/como-funciona" element={<HowItWorks />} />

            {/* Writing Resources */}
            <Route path="/writing-resources" element={<WritingResources />} />

            {/* Blog */}
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:postId" element={<BlogPost />} />
            <Route
              path="/recursos/blog"
              element={<Navigate to="/blog" replace />}
            />
            <Route
              path="/recursos/blog/:postId"
              element={<RedirectBlogPost />}
            />

            {/* Premium Plans - Solo visible en desarrollo */}
            {FEATURES.PREMIUM_PLANS && (
              <Route path="/planes" element={<PremiumPlans />} />
            )}
            {FEATURES.BETA_ROUTES && (
              <Route path="/planes-beta" element={<PremiumPlans />} />
            )}

            {/* Legal - Con rutas canónicas */}
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/dmca" element={<DMCA />} />
            <Route path="/cookie-policy" element={<CookiePolicy />} />
            <Route
              path="/community-guidelines"
              element={<CommunityGuidelines />}
            />

            {/* Redirect para evitar contenido duplicado */}
            <Route
              path="/privacy-policy"
              element={<Navigate to="/privacy" replace />}
            />

            {/* ✅ RUTA 404 MEJORADA */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </Layout>

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      
      {/* Feedback Modal */}
      <FeedbackModal 
        isOpen={showFeedbackModal} 
        onClose={() => setShowFeedbackModal(false)} 
      />
      
      {/* Vercel Analytics */}
      <Analytics />
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
          <a 
            href="/contest/current" 
            className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-100 font-medium py-2 px-4 rounded-lg transition-colors inline-block text-center"
          >
            Ver reto actual
          </a>
        )}
        <a 
          href="/contest-history" 
          className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-100 font-medium py-2 px-4 rounded-lg transition-colors inline-block text-center"
        >
          Ver historial de retos
        </a>
      </div>
    </div>
  );
}

// ✅ COMPONENTE PRINCIPAL SIMPLIFICADO
function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <GlobalAppProvider>
          <ToastProvider>
            <AppContent />
          </ToastProvider>
        </GlobalAppProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
