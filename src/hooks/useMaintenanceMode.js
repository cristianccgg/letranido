// hooks/useMaintenanceMode.js - Hook para manejar modo mantenimiento
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useMaintenanceMode = () => {
  const [maintenanceStatus, setMaintenanceStatus] = useState({
    isActive: false,
    message: '',
    estimatedDuration: '',
    activatedAt: null,
    activatedBy: null,
    loading: true,
    error: null
  });

  // Función para obtener el estado de mantenimiento
  const checkMaintenanceStatus = async () => {
    try {
      setMaintenanceStatus(prev => ({ ...prev, loading: true, error: null }));
      
      const { data, error } = await supabase
        .rpc('get_maintenance_status');

      if (error) {
        console.error('Error obteniendo estado de mantenimiento:', error);
        setMaintenanceStatus(prev => ({ 
          ...prev, 
          loading: false, 
          error: 'Error al verificar estado de mantenimiento' 
        }));
        return;
      }

      setMaintenanceStatus({
        isActive: data?.is_active || false,
        message: data?.message || 'Estamos realizando mejoras en el sitio. Volveremos en unos minutos.',
        estimatedDuration: data?.estimated_duration || '10 minutos',
        activatedAt: data?.activated_at,
        activatedBy: data?.activated_by,
        loading: false,
        error: null
      });

    } catch (error) {
      console.error('Error verificando mantenimiento:', error);
      setMaintenanceStatus(prev => ({ 
        ...prev, 
        loading: false, 
        error: 'Error de conexión' 
      }));
    }
  };

  // Función para activar/desactivar mantenimiento (solo admin)
  const toggleMaintenanceMode = async (active, customMessage = null, duration = null, adminEmail = null) => {
    try {
      const { data, error } = await supabase
        .rpc('toggle_maintenance_mode', {
          active,
          custom_message: customMessage,
          duration,
          admin_email: adminEmail
        });

      if (error) {
        console.error('Error cambiando modo mantenimiento:', error);
        return { success: false, error: error.message };
      }

      // Actualizar estado local
      setMaintenanceStatus(prev => ({
        ...prev,
        isActive: data.is_active,
        message: data.message,
        estimatedDuration: data.estimated_duration,
        activatedAt: data.activated_at,
        activatedBy: data.activated_by
      }));

      return { success: true, data };

    } catch (error) {
      console.error('Error toggleando mantenimiento:', error);
      return { success: false, error: 'Error de conexión' };
    }
  };

  // Verificar estado al montar el componente
  useEffect(() => {
    checkMaintenanceStatus();
  }, []);

  // Configurar suscripción en tiempo real para cambios en maintenance_mode
  useEffect(() => {
    const subscription = supabase
      .channel('maintenance_mode_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'maintenance_mode' 
        }, 
        () => {
          console.log('📧 Cambio en modo mantenimiento detectado');
          checkMaintenanceStatus();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    ...maintenanceStatus,
    toggleMaintenanceMode,
    refreshStatus: checkMaintenanceStatus
  };
};