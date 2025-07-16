import React, { useState } from 'react';
import { X, Flag, AlertTriangle } from 'lucide-react';

const ReportModal = ({ isOpen, onClose, onReport, commentId, commentContent }) => {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setReason('');
    setDescription('');
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!reason) {
      alert('Por favor selecciona una razón para el reporte');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onReport(commentId, reason, description);
      handleClose();
    } catch (error) {
      console.error('Error al reportar:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Flag className="w-5 h-5 text-red-500" />
              <h2 className="text-lg font-semibold text-gray-900">
                Reportar comentario
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Comment preview */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg border-l-4 border-gray-300">
            <p className="text-sm text-gray-700 italic">
              "{commentContent.length > 100 
                ? commentContent.substring(0, 100) + '...' 
                : commentContent}"
            </p>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 mb-4 p-3 bg-yellow-50 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="text-yellow-800 font-medium">
                ¿Estás seguro de que deseas reportar este comentario?
              </p>
              <p className="text-yellow-700 mt-1">
                Los reportes falsos pueden resultar en la suspensión de tu cuenta.
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Reason selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Razón del reporte *
              </label>
              <div className="space-y-2">
                {[
                  { value: 'spam', label: 'Spam o contenido promocional' },
                  { value: 'inappropriate', label: 'Contenido inapropiado' },
                  { value: 'harassment', label: 'Acoso o intimidación' },
                  { value: 'other', label: 'Otro' }
                ].map(option => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="radio"
                      name="reason"
                      value={option.value}
                      checked={reason === option.value}
                      onChange={(e) => setReason(e.target.value)}
                      className="mr-2 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción adicional (opcional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Proporciona más detalles sobre el problema..."
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!reason || isSubmitting}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Reportando...
                  </>
                ) : (
                  <>
                    <Flag className="w-4 h-4" />
                    Reportar
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReportModal;