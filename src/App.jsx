import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { useAuthStore } from "./store/authStore"; // Importar el store
import Layout from "./components/layout/Layout";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import WritePrompt from "./pages/WritePrompt";
import Gallery from "./pages/Gallery";
import Profile from "./pages/Profile";
import CurrentContest from "./pages/CurrentContest";
import StoryPage from "./pages/StoryPage";

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
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/write/:promptId?" element={<WritePrompt />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/profile/:userId?" element={<Profile />} />
          <Route path="/contest/current" element={<CurrentContest />} />
          <Route path="/story/:id" element={<StoryPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
