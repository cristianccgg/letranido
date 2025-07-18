import { createRoot } from "react-dom/client";
import { HelmetProvider } from 'react-helmet-async';
import ErrorBoundary from "./components/ErrorBoundary/ErrorBoundary.jsx";
import { overrideConsoleForProduction } from "./lib/console-replacer.js";
import App from "./App.jsx";
import "./index.css";

// Limpiar console logs en producción
overrideConsoleForProduction();

createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </ErrorBoundary>
);
