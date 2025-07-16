// hooks/useNewsletterMigration.js - Hook para migrar newsletter al registrarse
import { useCallback } from 'react';
import { migrateNewsletterToUser } from '../lib/newsletter';

/**
 * Hook para manejar la migración de newsletter cuando un usuario se registra
 * Debe llamarse después de que el usuario se registre exitosamente
 */
export const useNewsletterMigration = () => {
  
  const migrateNewsletter = useCallback(async (email, userId) => {
    try {
      console.log(`🔄 Migrando newsletter para usuario recién registrado: ${email}`);
      
      const result = await migrateNewsletterToUser(email, userId);
      
      if (result.success) {
        console.log(`✅ Newsletter migrado exitosamente: ${result.message}`);
      } else {
        console.error(`❌ Error migrando newsletter: ${result.message}`);
      }
      
      return result;
      
    } catch (error) {
      console.error('Error inesperado migrando newsletter:', error);
      return {
        success: false,
        message: 'Error inesperado migrando newsletter'
      };
    }
  }, []);

  return {
    migrateNewsletter
  };
};