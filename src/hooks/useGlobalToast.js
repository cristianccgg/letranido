import { useContext } from 'react';
import { ToastContext } from '../contexts/ToastContextDefinition';

export const useGlobalToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useGlobalToast must be used within a ToastProvider');
  }
  return context;
};