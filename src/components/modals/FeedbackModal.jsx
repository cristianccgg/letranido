import { useState } from "react";
import { X, MessageCircle, Send, Bug, Lightbulb, Heart, Target, Loader } from "lucide-react";
import { sendFeedback, validateEmail, FEEDBACK_TYPES } from "../../lib/emailjs";

const FeedbackModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    email: '',
    type: '',
    message: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  // Agregar iconos a los tipos de feedback
  const feedbackTypes = FEEDBACK_TYPES.map(type => {
    const iconMap = {
      bug: Bug,
      suggestion: Lightbulb,
      general: Heart,
      contest: Target
    };
    return {
      ...type,
      icon: iconMap[type.id]
    };
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validación básica
    if (!formData.email || !formData.type || !formData.message.trim()) {
      setError('Por favor completa todos los campos');
      setIsLoading(false);
      return;
    }

    // Validación de email
    if (!validateEmail(formData.email)) {
      setError('Por favor ingresa un email válido');
      setIsLoading(false);
      return;
    }

    try {
      const selectedType = feedbackTypes.find(type => type.id === formData.type);
      
      await sendFeedback({
        email: formData.email,
        type: selectedType?.label || formData.type,
        message: formData.message
      });

      setShowSuccess(true);
      setTimeout(() => {
        onClose();
        setShowSuccess(false);
        setFormData({ email: '', type: '', message: '' });
      }, 2000);

    } catch (error) {
      console.error('Error enviando feedback:', error);
      
      // Mensaje de error más específico
      if (error.message.includes('Configuración de EmailJS incompleta')) {
        setError('El sistema de feedback no está configurado correctamente. Por favor contacta al administrador.');
      } else if (error.text && error.text.includes('Invalid template')) {
        setError('Error de configuración del sistema. Por favor intenta más tarde.');
      } else {
        setError('Error al enviar el feedback. Por favor intenta nuevamente o contacta al soporte.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  if (showSuccess) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">¡Feedback enviado!</h3>
          <p className="text-gray-600 dark:text-gray-300">Gracias por ayudarnos a mejorar Letranido</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden ring-1 ring-slate-200 dark:ring-gray-600" onClick={(e) => e.stopPropagation()}>
        <div className="overflow-y-auto max-h-[calc(90vh-60px)]">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-700 dark:to-purple-700 text-white p-4 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold flex items-center">
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Enviar Feedback
                </h2>
                <p className="text-white/90 text-xs mt-1">
                  Ayúdanos a mejorar Letranido
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/20 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Tu email
              </label>
              <input
                type="email"
                name="email"
                autoComplete="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="tu@email.com"
                required
              />
            </div>

            {/* Tipo de feedback */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2 sm:mb-3">
                Tipo de feedback
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-1 gap-2">
                {feedbackTypes.map((type) => {
                  const IconComponent = type.icon;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => handleChange('type', type.id)}
                      className={`p-2 sm:p-3 rounded-lg border-2 text-left transition-all duration-200 hover:scale-105 cursor-pointer ${
                        formData.type === type.id
                          ? `${type.bgColor} border-current ${type.color}`
                          : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-2 sm:gap-3">
                        <IconComponent className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ${formData.type === type.id ? type.color : 'text-gray-400 dark:text-gray-500'}`} />
                        <div className="min-w-0">
                          <div className={`font-medium text-xs sm:text-sm leading-tight ${formData.type === type.id ? type.color : 'text-gray-900 dark:text-gray-100'}`}>
                            {type.label}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">{type.description}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mensaje */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Tu mensaje
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => handleChange('message', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="Cuéntanos qué opinas, qué problema encontraste, o qué sugerencia tienes..."
                required
              />
            </div>

            {/* Error */}
            {error && (
              <div className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                {error}
              </div>
            )}

            {/* Botones */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors font-medium cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-700 dark:to-purple-700 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 dark:hover:from-indigo-800 dark:hover:to-purple-800 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Enviar
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

export default FeedbackModal;