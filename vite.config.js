import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // Minify and optimize for production
    minify: 'terser',
    terserOptions: {
      compress: {
        // TEMPORALMENTE DESHABILITADO PARA DIAGNOSTICAR EMAILJS
        // drop_console: ['log', 'info', 'debug'],
        drop_debugger: true,
        // Keep console.error and console.warn for critical issues
        // pure_funcs: ['console.log', 'console.info', 'console.debug']
      }
    },
    // Generate sourcemaps for better debugging
    sourcemap: false,
    // Optimize chunk sizes
    rollupOptions: {
      output: {
        // Manual chunks for better caching
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['lucide-react'],
          supabase: ['@supabase/supabase-js'],
          email: ['resend']
        }
      }
    }
  },
  // Preview server config for testing production builds
  preview: {
    port: 4173,
    host: true
  }
});
