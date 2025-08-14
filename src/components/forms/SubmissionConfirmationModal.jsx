import { useState } from "react";
import { X, Send, AlertCircle, Shield, FileText, BookOpen } from "lucide-react";

const SubmissionConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  wordCount,
  prompt,
  isSubmitting,
  isEditing = false,
}) => {
  const [hasMatureContent, setHasMatureContent] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [confirmOriginal, setConfirmOriginal] = useState(false);
  const [shareWinnerContent, setShareWinnerContent] = useState(false);
  const [acknowledgePublicRisk, setAcknowledgePublicRisk] = useState(false);

  if (!isOpen) return null;

  const canSubmit =
    acceptTerms && confirmOriginal && shareWinnerContent && acknowledgePublicRisk && !isSubmitting;

  const handleSubmit = () => {
    if (!canSubmit) return;

    onConfirm({
      hasMatureContent,
      termsAccepted: true,
      originalConfirmed: true,
      shareWinnerContentAccepted: true,
      publicRiskAcknowledged: true,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[95vh] sm:max-h-[85vh] overflow-hidden ring-1 ring-slate-200 dark:ring-gray-600" onClick={(e) => e.stopPropagation()}>
        <div className="overflow-y-auto max-h-[calc(95vh-100px)] sm:max-h-[calc(85vh-120px)]">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-700 dark:to-purple-700 text-white p-4 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center">
                <Send className="h-5 w-5 mr-2" />
                {isEditing ? "Confirmar Actualización" : "Confirmar Envío"}
              </h2>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/20"
                disabled={isSubmitting}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
            {/* Story Info - Compact */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 border border-indigo-200 dark:border-indigo-700 rounded-lg p-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <span className="text-xs text-indigo-600 dark:text-indigo-300 font-medium">Título</span>
                  <p className="font-semibold text-indigo-900 dark:text-indigo-100 text-xs truncate">{title}</p>
                </div>
                <div>
                  <span className="text-xs text-indigo-600 dark:text-indigo-300 font-medium">Palabras</span>
                  <p className="font-semibold text-indigo-900 dark:text-indigo-100 text-xs">{wordCount}</p>
                </div>
                <div>
                  <span className="text-xs text-indigo-600 dark:text-indigo-300 font-medium">Concurso</span>
                  <p className="font-semibold text-indigo-900 dark:text-indigo-100 text-xs truncate">{prompt.title}</p>
                </div>
              </div>
            </div>

            {/* Legal Confirmations - REQUIRED */}
            <div className="bg-gradient-to-br from-pink-50 to-red-50 dark:from-pink-900/30 dark:to-red-900/30 border border-pink-200 dark:border-pink-700 rounded-lg p-3">
              <h3 className="font-semibold text-pink-900 dark:text-pink-100 mb-2 flex items-center text-sm">
                <Shield className="h-4 w-4 mr-1" />
                Confirmaciones Legales
              </h3>

              <div className="space-y-2">
                {/* Original Work Confirmation */}
                <label className="flex items-start gap-2 cursor-pointer p-2 bg-white dark:bg-gray-700 rounded-lg border border-pink-200 dark:border-pink-600 hover:bg-pink-50/50 dark:hover:bg-pink-900/20 transition-colors">
                  <input
                    type="checkbox"
                    checked={confirmOriginal}
                    onChange={(e) => setConfirmOriginal(e.target.checked)}
                    className="mt-1 w-4 h-4 text-pink-600 border-pink-300 rounded focus:ring-pink-500 focus:ring-2"
                    required
                  />
                  <span className="text-xs text-pink-800 dark:text-pink-200">
                    <strong>Historia 100% original y de mi autoría</strong><br />
                    Sin contenido copiado o adaptado
                  </span>
                </label>


                {/* Sharing Authorization for Winners */}
                <label className="flex items-start gap-2 cursor-pointer p-2 bg-white dark:bg-gray-700 rounded-lg border border-pink-200 dark:border-pink-600 hover:bg-pink-50/50 dark:hover:bg-pink-900/20 transition-colors">
                  <input
                    type="checkbox"
                    checked={shareWinnerContent}
                    onChange={(e) => setShareWinnerContent(e.target.checked)}
                    className="mt-1 w-4 h-4 text-pink-600 border-pink-300 rounded focus:ring-pink-500 focus:ring-2"
                    required
                  />
                  <span className="text-xs text-pink-800 dark:text-pink-200">
                    <strong>Autorizo uso promocional si gano</strong><br />
                    Contenido para redes sociales y reconocimiento
                  </span>
                </label>

                {/* Public Risk Acknowledgment */}
                <label className="flex items-start gap-2 cursor-pointer p-2 bg-white dark:bg-gray-700 rounded-lg border border-pink-200 dark:border-pink-600 hover:bg-pink-50/50 dark:hover:bg-pink-900/20 transition-colors">
                  <input
                    type="checkbox"
                    checked={acknowledgePublicRisk}
                    onChange={(e) => setAcknowledgePublicRisk(e.target.checked)}
                    className="mt-1 w-4 h-4 text-pink-600 border-pink-300 rounded focus:ring-pink-500 focus:ring-2"
                    required
                  />
                  <span className="text-xs text-pink-800 dark:text-pink-200">
                    <strong>Entiendo que mi historia será pública</strong><br />
                    Al publicar, otros usuarios podrán leer mi contenido. Publico voluntariamente y Letranido no controla el uso posterior por terceros.
                  </span>
                </label>

                {/* Terms Acceptance - MOVED TO END */}
                <label className="flex items-start gap-2 cursor-pointer p-2 bg-white dark:bg-gray-700 rounded-lg border border-pink-200 dark:border-pink-600 hover:bg-pink-50/50 dark:hover:bg-pink-900/20 transition-colors">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-1 w-4 h-4 text-pink-600 border-pink-300 rounded focus:ring-pink-500 focus:ring-2"
                    required
                  />
                  <span className="text-xs text-pink-800 dark:text-pink-200">
                    <strong>He leído y acepto los términos y condiciones</strong><br />
                    Incluye reglas de originalidad, derechos de autor, responsabilidades y uso de la plataforma.{" "}
                    <a 
                      href="/terms" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="underline hover:text-pink-600 dark:hover:text-pink-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Leer términos completos
                    </a>
                  </span>
                </label>
              </div>

              {(!confirmOriginal || !acceptTerms || !shareWinnerContent || !acknowledgePublicRisk) && (
                <div className="mt-3 p-2 bg-pink-100 dark:bg-pink-900/30 border border-pink-300 dark:border-pink-600 rounded-lg">
                  <p className="text-pink-800 dark:text-pink-200 text-xs flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Acepta todas las confirmaciones para continuar
                  </p>
                </div>
              )}
            </div>

            {/* Content Rating - Optional */}
            <div className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-800/50 dark:to-slate-800/50 border border-gray-200 dark:border-gray-600 rounded-lg p-2.5">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center text-sm">
                <FileText className="h-4 w-4 mr-1" />
                Clasificación de Contenido (Opcional)
              </h3>
              <label className="flex items-start gap-2 cursor-pointer p-2 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-500 hover:bg-gray-50/50 dark:hover:bg-gray-600/50 transition-colors">
                <input
                  type="checkbox"
                  checked={hasMatureContent}
                  onChange={(e) => setHasMatureContent(e.target.checked)}
                  className="mt-1 w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500 focus:ring-2"
                />
                <span className="text-xs text-gray-700 dark:text-gray-300">
                  <strong>Mi historia contiene contenido maduro (18+)</strong><br />
                  <em>Marca solo si incluye: violencia, lenguaje fuerte o temas adultos</em>
                </span>
              </label>
            </div>
          </div>
        </div>


        {/* Footer */}
        <div className="border-t border-slate-200 dark:border-gray-600 bg-slate-50 dark:bg-gray-700 p-3 sm:p-4 rounded-b-2xl">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-700 dark:text-gray-200 bg-white dark:bg-gray-600 border border-slate-300 dark:border-gray-500 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-500 text-sm"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={`flex-1 py-2 px-4 flex items-center justify-center font-medium rounded-lg transition-all text-sm ${
                !canSubmit 
                  ? "opacity-50 cursor-not-allowed bg-slate-300 dark:bg-gray-600 text-slate-500 dark:text-gray-400" 
                  : "bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-700 dark:to-purple-700 text-white hover:from-indigo-700 hover:to-purple-700 dark:hover:from-indigo-800 dark:hover:to-purple-800"
              }`}
            >
              {isSubmitting && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              )}
              <Send className="h-4 w-4 mr-1" />
              {isSubmitting 
                ? (isEditing ? "Actualizando..." : "Enviando...") 
                : (isEditing ? "Actualizar Historia" : "Enviar Historia")
              }
            </button>
          </div>
          {!canSubmit && !isSubmitting && (
            <p className="text-xs text-pink-600 dark:text-pink-300 mt-2 text-center">
              Acepta las confirmaciones legales
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubmissionConfirmationModal;
