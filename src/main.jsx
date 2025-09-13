import { createRoot } from "react-dom/client";
import { HelmetProvider } from 'react-helmet-async';
import ErrorBoundary from "./components/ErrorBoundary/ErrorBoundary.jsx";
import { overrideConsoleForProduction } from "./lib/console-replacer.js";
import { initEmailJS } from "./lib/emailjs.js";
import App from "./App.jsx";
import "./index.css";

// Limpiar console logs en producción - TEMPORALMENTE DESACTIVADO PARA DEBUG
// overrideConsoleForProduction();

// Inicializar EmailJS
initEmailJS();

createRoot(document.getElementById("root")).render(
  <HelmetProvider>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </HelmetProvider>
);
