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
  const [confirmNoAI, setConfirmNoAI] = useState(false);
  const [shareWinnerContent, setShareWinnerContent] = useState(false);

  if (!isOpen) return null;

  const canSubmit =
    acceptTerms && confirmOriginal && confirmNoAI && shareWinnerContent && !isSubmitting;

  const handleSubmit = () => {
    if (!canSubmit) return;

    onConfirm({
      hasMatureContent,
      termsAccepted: true,
      originalConfirmed: true,
      noAIConfirmed: true,
      shareWinnerContentAccepted: true,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden ring-1 ring-slate-200" onClick={(e) => e.stopPropagation()}>
        <div className="overflow-y-auto max-h-[calc(85vh-120px)]">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-t-2xl">
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
          <div className="p-4 space-y-4">
            {/* Story Info - Compact */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <span className="text-xs text-indigo-600 font-medium">Título</span>
                  <p className="font-semibold text-indigo-900 text-xs truncate">{title}</p>
                </div>
                <div>
                  <span className="text-xs text-indigo-600 font-medium">Palabras</span>
                  <p className="font-semibold text-indigo-900 text-xs">{wordCount}</p>
                </div>
                <div>
                  <span className="text-xs text-indigo-600 font-medium">Concurso</span>
                  <p className="font-semibold text-indigo-900 text-xs truncate">{prompt.title}</p>
                </div>
              </div>
            </div>

            {/* Legal Confirmations - REQUIRED */}
            <div className="bg-gradient-to-br from-pink-50 to-red-50 border border-pink-200 rounded-lg p-4">
              <h3 className="font-semibold text-pink-900 mb-3 flex items-center text-sm">
                <Shield className="h-4 w-4 mr-1" />
                Confirmaciones Legales
              </h3>

              <div className="space-y-3">
                {/* Original Work Confirmation */}
                <label className="flex items-start gap-2 cursor-pointer p-2 bg-white rounded-lg border border-pink-200 hover:bg-pink-50/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={confirmOriginal}
                    onChange={(e) => setConfirmOriginal(e.target.checked)}
                    className="mt-1 w-4 h-4 text-pink-600 border-pink-300 rounded focus:ring-pink-500 focus:ring-2"
                    required
                  />
                  <span className="text-xs text-pink-800">
                    <strong>Historia 100% original y de mi autoría</strong><br />
                    Sin contenido copiado o adaptado
                  </span>
                </label>

                {/* No AI Confirmation */}
                <label className="flex items-start gap-2 cursor-pointer p-2 bg-white rounded-lg border border-pink-200 hover:bg-pink-50/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={confirmNoAI}
                    onChange={(e) => setConfirmNoAI(e.target.checked)}
                    className="mt-1 w-4 h-4 text-pink-600 border-pink-300 rounded focus:ring-pink-500 focus:ring-2"
                    required
                  />
                  <span className="text-xs text-pink-800">
                    <strong>NO he usado Inteligencia Artificial</strong><br />
                    Sin ChatGPT, Claude, GPT-4, Copilot u otra IA
                  </span>
                </label>

                {/* Terms Acceptance */}
                <label className="flex items-start gap-2 cursor-pointer p-2 bg-white rounded-lg border border-pink-200 hover:bg-pink-50/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-1 w-4 h-4 text-pink-600 border-pink-300 rounded focus:ring-pink-500 focus:ring-2"
                    required
                  />
                  <span className="text-xs text-pink-800">
                    <strong>Acepto términos y condiciones</strong><br />
                    Letranido puede mostrar mi historia en la plataforma
                  </span>
                </label>

                {/* Sharing Authorization for Winners */}
                <label className="flex items-start gap-2 cursor-pointer p-2 bg-white rounded-lg border border-pink-200 hover:bg-pink-50/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={shareWinnerContent}
                    onChange={(e) => setShareWinnerContent(e.target.checked)}
                    className="mt-1 w-4 h-4 text-pink-600 border-pink-300 rounded focus:ring-pink-500 focus:ring-2"
                    required
                  />
                  <span className="text-xs text-pink-800">
                    <strong>Autorizo uso promocional si gano</strong><br />
                    Contenido para redes sociales y reconocimiento
                  </span>
                </label>
              </div>

              {(!confirmOriginal || !confirmNoAI || !acceptTerms || !shareWinnerContent) && (
                <div className="mt-3 p-2 bg-pink-100 border border-pink-300 rounded-lg">
                  <p className="text-pink-800 text-xs flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Acepta todas las confirmaciones para continuar
                  </p>
                </div>
              )}
            </div>

            {/* Content Rating */}
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg p-3">
              <h3 className="font-semibold text-indigo-900 mb-2 flex items-center text-sm">
                <FileText className="h-4 w-4 mr-1" />
                Clasificación
              </h3>
              <label className="flex items-start gap-2 cursor-pointer p-2 bg-white rounded-lg border border-indigo-200 hover:bg-indigo-50/50 transition-colors">
                <input
                  type="checkbox"
                  checked={hasMatureContent}
                  onChange={(e) => setHasMatureContent(e.target.checked)}
                  className="mt-1 w-4 h-4 text-indigo-600 border-indigo-300 rounded focus:ring-indigo-500 focus:ring-2"
                />
                <span className="text-xs text-indigo-800">
                  <strong>Contenido maduro (18+)</strong><br />
                  Violencia, lenguaje fuerte o temas adultos
                </span>
              </label>
            </div>
          </div>
        </div>


        {/* Footer */}
        <div className="border-t border-slate-200 bg-slate-50 p-4 rounded-b-2xl">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 text-sm"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={`flex-1 py-2 px-4 flex items-center justify-center font-medium rounded-lg transition-all text-sm ${
                !canSubmit 
                  ? "opacity-50 cursor-not-allowed bg-slate-300 text-slate-500" 
                  : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700"
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
            <p className="text-xs text-pink-600 mt-2 text-center">
              Acepta las confirmaciones legales
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubmissionConfirmationModal;
