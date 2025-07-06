import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import WritePrompt from "./pages/WritePrompt";
import Gallery from "./pages/Gallery";
import Profile from "./pages/Profile";
import CurrentContest from "./pages/CurrentContest";
import StoryPage from "./pages/StoryPage";

function App() {
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
