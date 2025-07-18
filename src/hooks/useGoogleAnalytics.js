import { useEffect } from 'react';
import { useGlobalApp } from '../contexts/GlobalAppContext';

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-4NRYHC1FDJ';

export const useGoogleAnalytics = () => {
  const { cookieConsent } = useGlobalApp();

  useEffect(() => {
    if (!cookieConsent) return;

    if (cookieConsent.analytics) {
      // Inicializar Google Analytics solo si se acepta analytics
      if (!window.gtag) {
        // Cargar el script de Google Analytics
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
        document.head.appendChild(script);

        // Inicializar gtag
        window.dataLayer = window.dataLayer || [];
        function gtag(){window.dataLayer.push(arguments);}
        window.gtag = gtag;
        gtag('js', new Date());
        gtag('config', GA_MEASUREMENT_ID);

        console.log('✅ Google Analytics inicializado');
      }
    } else {
      // Si no se acepta analytics, deshabilitar tracking
      if (window.gtag) {
        window.gtag('config', GA_MEASUREMENT_ID, {
          send_page_view: false
        });
        console.log('🚫 Google Analytics deshabilitado');
      }
    }
  }, [cookieConsent]);

  // Función para trackear eventos personalizados
  const trackEvent = (eventName, parameters = {}) => {
    if (cookieConsent?.analytics && window.gtag) {
      window.gtag('event', eventName, parameters);
    }
  };

  // Función para trackear page views
  const trackPageView = (path) => {
    if (cookieConsent?.analytics && window.gtag) {
      window.gtag('config', GA_MEASUREMENT_ID, {
        page_path: path
      });
    }
  };

  return {
    trackEvent,
    trackPageView,
    isAnalyticsEnabled: cookieConsent?.analytics || false
  };
};

// Eventos específicos para Letranido
export const AnalyticsEvents = {
  USER_SIGNUP: 'user_signup',
  STORY_PUBLISHED: 'story_published',
  CONTEST_JOINED: 'contest_joined',
  STORY_READ: 'story_read',
  CONTEST_SUBMISSION: 'contest_submission',
  PROFILE_COMPLETED: 'profile_completed'
};