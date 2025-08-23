import { createContext, useContext, useState } from 'react';
import { useToast } from '../components/ui/Toast';
import SuccessToast from '../components/ui/SuccessToast';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const toastMethods = useToast();
  const [successToast, setSuccessToast] = useState(null);
  
  const showSuccessToast = (title, message, storyTitle, options = {}) => {
    const id = Date.now();
    setSuccessToast({
      id,
      title,
      message,
      storyTitle,
      duration: options.duration || 6000
    });
  };

  const hideSuccessToast = () => {
    setSuccessToast(null);
  };

  const contextValue = {
    ...toastMethods,
    showSuccessToast,
    hideSuccessToast
  };
  
  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {/* Success Toast especial */}
      {successToast && (
        <SuccessToast
          key={successToast.id}
          title={successToast.title}
          message={successToast.message}
          storyTitle={successToast.storyTitle}
          duration={successToast.duration}
          onClose={hideSuccessToast}
        />
      )}
    </ToastContext.Provider>
  );
};

export const useGlobalToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useGlobalToast must be used within a ToastProvider');
  }
  return context;
};