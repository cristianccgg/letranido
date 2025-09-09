import { useState } from 'react';
import { useToast } from '../components/ui/Toast';
import SuccessToast from '../components/ui/SuccessToast';
import KofiModal from '../components/modals/KofiModal';
import { ToastContext } from './ToastContextDefinition';

export const ToastProvider = ({ children }) => {
  const toastMethods = useToast();
  const [successToast, setSuccessToast] = useState(null);
  const [kofiModal, setKofiModal] = useState(false);
  
  const showSuccessToast = (title, message, storyTitle, options = {}) => {
    const id = Date.now();
    setSuccessToast({
      id,
      title,
      message,
      storyTitle,
      showDonation: options.showDonation || false
    });
  };

  const hideSuccessToast = () => {
    setSuccessToast(null);
  };

  const showKofiModal = () => {
    setKofiModal(true);
  };

  const hideKofiModal = () => {
    setKofiModal(false);
  };

  const contextValue = {
    ...toastMethods,
    showSuccessToast,
    hideSuccessToast,
    showKofiModal,
    hideKofiModal
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
          onClose={hideSuccessToast}
          onDonate={successToast.showDonation ? showKofiModal : null}
        />
      )}
      {/* Ko-fi Modal */}
      <KofiModal 
        isOpen={kofiModal}
        onClose={hideKofiModal}
      />
    </ToastContext.Provider>
  );
};

