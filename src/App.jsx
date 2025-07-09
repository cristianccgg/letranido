import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect, useRef } from "react";
import { useAuthStore } from "./store/authStore";
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

function App() {
  const { initialize, isLoading, initialized } = useAuthStore();

  // ✅ useRef para evitar múltiples inicializaciones
  const hasInitialized = useRef(false);

  useEffect(() => {
    // ✅ Solo inicializar UNA VEZ
    if (!hasInitialized.current && !initialized) {
      console.log("🚀 [APP] Inicializando auth por primera vez...");
      hasInitialized.current = true;
      initialize();
    } else {
      console.log("🚫 [APP] Auth ya inicializado, saltando...");
    }
  }, []); // ✅ Array vacío - solo al montar el componente

  // Show loading while initializing auth
  if (isLoading || !initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Inicializando...</p>
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
          </Routes>
        </Layout>
      </BadgeNotificationProvider>
    </Router>
  );
}

export default App;
