import { createRoot } from "react-dom/client";
import { HelmetProvider } from 'react-helmet-async';
import ErrorBoundary from "./components/ErrorBoundary/ErrorBoundary.jsx";
import { overrideConsoleForProduction } from "./lib/console-replacer.js";
import { initEmailJS } from "./lib/emailjs.js";
import App from "./App.jsx";
import "./index.css";

// TEMPORALMENTE HABILITAR LOGS PARA DIAGNOSTICAR EMAILJS
// overrideConsoleForProduction();

console.log("🔧 DEBUG: Verificando variables de entorno EmailJS");
console.log("🔧 VITE_EMAILJS_SERVICE_ID:", import.meta.env.VITE_EMAILJS_SERVICE_ID || "UNDEFINED");
console.log("🔧 VITE_EMAILJS_TEMPLATE_ID:", import.meta.env.VITE_EMAILJS_TEMPLATE_ID || "UNDEFINED");
console.log("🔧 VITE_EMAILJS_PUBLIC_KEY:", import.meta.env.VITE_EMAILJS_PUBLIC_KEY ? "SET" : "UNDEFINED");

// Inicializar EmailJS
initEmailJS();

createRoot(document.getElementById("root")).render(
  <HelmetProvider>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </HelmetProvider>
);
