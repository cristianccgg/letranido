import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { useAuthStore } from "./store/authStore";
import { AppStateProvider, useAppState } from "./contexts/AppStateContext";
import { BadgeNotificationProvider } from "./contexts/BadgeNotificationContext";
import Layout from "./components/layout/Layout";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import WritePrompt from "./pages/WritePrompt";
import Gallery from "./pages/Gallery";
import UnifiedProfile from "./pages/UnifiedProfile";
import CurrentContest from "./pages/CurrentContest";
import StoryPage from "./pages/StoryPage";
import ContestAdminPanel from "./components/admin/ContestAdminPanel";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import CommunityGuidelines from "./pages/CommunityGuidelines";

// ✅ Componente interno que usa el contexto
function AppContent() {
  const { globalLoading, isAuthReady, contestsInitialized } = useAppState();

  // ✅ Mostrar loading hasta que auth Y contests estén listos
  if (globalLoading || !isAuthReady || !contestsInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {!isAuthReady
              ? "Inicializando autenticación..."
              : !contestsInitialized
              ? "Cargando concursos..."
              : "Cargando LiteraLab..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <BadgeNotificationProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/profile" element={<UnifiedProfile />} />
            <Route path="/dashboard" element={<UnifiedProfile />} />
            <Route path="/write/:promptId?" element={<WritePrompt />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/contest/current" element={<CurrentContest />} />
            <Route path="/story/:id" element={<StoryPage />} />
            <Route path="/admin" element={<ContestAdminPanel />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route
              path="/community-guidelines"
              element={<CommunityGuidelines />}
            />
          </Routes>
        </Layout>
      </BadgeNotificationProvider>
    </Router>
  );
}

// ✅ Componente principal que inicializa auth
function App() {
  const { initialize } = useAuthStore();

  // ✅ Inicializar auth UNA sola vez
  useEffect(() => {
    console.log("🎬 [APP] Inicializando auth...");
    initialize();
  }, [initialize]);

  return (
    <AppStateProvider>
      <AppContent />
    </AppStateProvider>
  );
}

export default App;
