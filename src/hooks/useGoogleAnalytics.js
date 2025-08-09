import { useEffect } from "react";
import { useGlobalApp } from "../contexts/GlobalAppContext";

const GA_MEASUREMENT_ID =
  import.meta.env.VITE_GA_MEASUREMENT_ID || "G-4NRYHC1FDJ";

export const useGoogleAnalytics = () => {
  const { cookieConsent } = useGlobalApp();

  useEffect(() => {
    if (!cookieConsent) return;

    if (cookieConsent.analytics) {
      // Inicializar Google Analytics solo si se acepta analytics
      if (!window.gtag) {
        // Cargar el script de Google Analytics
        const script = document.createElement("script");
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
        document.head.appendChild(script);

        // Inicializar gtag
        window.dataLayer = window.dataLayer || [];
        function gtag() {
          window.dataLayer.push(arguments);
        }
        window.gtag = gtag;
        gtag("js", new Date());
        gtag("config", GA_MEASUREMENT_ID);

        console.log("✅ Google Analytics inicializado");
      }
    } else {
      // Si no se acepta analytics, deshabilitar tracking
      if (window.gtag) {
        window.gtag("config", GA_MEASUREMENT_ID, {
          send_page_view: false,
        });
        console.log("🚫 Google Analytics deshabilitado");
      }
    }
  }, [cookieConsent]);

  // Función para trackear eventos personalizados
  const trackEvent = (eventName, parameters = {}) => {
    if (cookieConsent?.analytics && window.gtag) {
      window.gtag("event", eventName, parameters);
    }
  };

  // Función para trackear page views
  const trackPageView = (path) => {
    if (cookieConsent?.analytics && window.gtag) {
      window.gtag("config", GA_MEASUREMENT_ID, {
        page_path: path,
      });
    }
  };

  return {
    trackEvent,
    trackPageView,
    isAnalyticsEnabled: cookieConsent?.analytics || false,
  };
};

// Eventos específicos para Letranido
export const AnalyticsEvents = {
  // Autenticación y usuarios
  USER_SIGNUP: "user_signup",
  USER_LOGIN: "user_login",
  PROFILE_COMPLETED: "profile_completed",
  
  // Escritura y creación
  STORY_PUBLISHED: "story_published",
  STORY_DRAFT_SAVED: "story_draft_saved",
  WRITING_STARTED: "writing_started",
  WRITING_ABANDONED: "writing_abandoned",
  WRITING_TIME_SPENT: "writing_time_spent",
  STORY_WORD_COUNT_MILESTONE: "story_word_count_milestone",
  
  // Lectura y engagement
  STORY_READ: "story_read",
  STORY_READ_COMPLETE: "story_read_complete",
  STORY_READ_TIME: "story_read_time",
  STORY_SCROLL_DEPTH: "story_scroll_depth",
  
  // Concursos
  CONTEST_JOINED: "contest_joined",
  CONTEST_SUBMISSION: "contest_submission",
  CONTEST_VIEWED: "contest_viewed",
  CONTEST_DEADLINE_WARNING: "contest_deadline_warning",
  
  // Interacciones sociales
  STORY_LIKED: "story_liked",
  COMMENT_POSTED: "comment_posted",
  
  // Navegación y UX
  SEARCH_PERFORMED: "search_performed",
  FILTER_APPLIED: "filter_applied",
  GALLERY_BROWSED: "gallery_browsed",
};
