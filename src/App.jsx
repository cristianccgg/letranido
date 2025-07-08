import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { useAuthStore } from "./store/authStore";
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
  const { initialize, isLoading } = useAuthStore();

  useEffect(() => {
    // Initialize auth state
    initialize();
  }, [initialize]);

  // Show loading while initializing auth
  if (isLoading) {
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

        {/* Layout.jsx ya maneja las notificaciones de badges */}
      </Layout>
    </Router>
  );
}

export default App;
