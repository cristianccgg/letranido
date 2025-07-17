import { useState } from "react";
import { X, Send, AlertCircle, Shield, FileText, BookOpen } from "lucide-react";

const SubmissionConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  text,
  wordCount,
  prompt,
  isSubmitting,
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto ring-1 ring-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-accent-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center">
              <Send className="h-6 w-6 mr-3" />
              Confirmar envío de historia
            </h2>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-2 rounded-full hover:bg-white/20"
              disabled={isSubmitting}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Story Info - Compact */}
          <div className="bg-gradient-to-br from-primary-50 to-accent-50 border border-primary-200 rounded-xl p-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <span className="text-xs text-primary-600 font-medium">Título</span>
                <p className="font-semibold text-primary-900 text-sm truncate">{title}</p>
              </div>
              <div>
                <span className="text-xs text-primary-600 font-medium">Palabras</span>
                <p className="font-semibold text-primary-900 text-sm">{wordCount}</p>
              </div>
              <div>
                <span className="text-xs text-primary-600 font-medium">Concurso</span>
                <p className="font-semibold text-primary-900 text-sm truncate">{prompt.title}</p>
              </div>
            </div>
          </div>

          {/* Legal Confirmations - REQUIRED */}
          <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-5">
            <h3 className="font-semibold text-red-900 mb-4 flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              ⚖️ Confirmaciones Legales Obligatorias
            </h3>

            <div className="space-y-4">
              {/* Original Work Confirmation */}
              <label className="flex items-start gap-3 cursor-pointer p-3 bg-white rounded-lg border border-red-200 hover:bg-red-50/50 transition-colors">
                <input
                  type="checkbox"
                  checked={confirmOriginal}
                  onChange={(e) => setConfirmOriginal(e.target.checked)}
                  className="mt-1 w-5 h-5 text-red-600 border-red-300 rounded focus:ring-red-500 focus:ring-2"
                  required
                />
                <span className="text-sm text-red-800">
                  <strong>
                    Confirmo que esta historia es 100% original y de mi autoría.
                  </strong>
                  <br />
                  No he copiado, parafraseado o adaptado contenido de otras
                  obras existentes.
                </span>
              </label>

              {/* No AI Confirmation */}
              <label className="flex items-start gap-3 cursor-pointer p-3 bg-white rounded-lg border border-red-200 hover:bg-red-50/50 transition-colors">
                <input
                  type="checkbox"
                  checked={confirmNoAI}
                  onChange={(e) => setConfirmNoAI(e.target.checked)}
                  className="mt-1 w-5 h-5 text-red-600 border-red-300 rounded focus:ring-red-500 focus:ring-2"
                  required
                />
                <span className="text-sm text-red-800">
                  <strong>
                    Confirmo que NO he usado Inteligencia Artificial para
                    escribir esta historia.
                  </strong>
                  <br />
                  Ni ChatGPT, Claude, GPT-4, Copilot, ni ninguna otra IA fue
                  usada para generar el contenido.
                </span>
              </label>

              {/* Terms Acceptance */}
              <label className="flex items-start gap-3 cursor-pointer p-3 bg-white rounded-lg border border-red-200 hover:bg-red-50/50 transition-colors">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-1 w-5 h-5 text-red-600 border-red-300 rounded focus:ring-red-500 focus:ring-2"
                  required
                />
                <span className="text-sm text-red-800">
                  <strong>
                    Acepto los términos y condiciones del concurso.
                  </strong>
                  <br />
                  He leído las reglas y entiendo que Letranido puede mostrar mi
                  historia en la plataforma.
                </span>
              </label>

              {/* NEW: Sharing Authorization for Winners */}
              <label className="flex items-start gap-3 cursor-pointer p-3 bg-white rounded-lg border border-red-200 hover:bg-red-50/50 transition-colors">
                <input
                  type="checkbox"
                  checked={shareWinnerContent}
                  onChange={(e) => setShareWinnerContent(e.target.checked)}
                  className="mt-1 w-5 h-5 text-red-600 border-red-300 rounded focus:ring-red-500 focus:ring-2"
                  required
                />
                <span className="text-sm text-red-800">
                  <strong>
                    Autorizo compartir mi historia, nombre de usuario y fragmentos si gano.
                  </strong>
                  <br />
                  Letranido puede usar mi contenido ganador con fines promocionales, en redes sociales y para reconocimiento público.
                </span>
              </label>
            </div>

            {(!confirmOriginal || !confirmNoAI || !acceptTerms || !shareWinnerContent) && (
              <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded-lg">
                <p className="text-red-800 text-sm flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <strong>
                    Debes aceptar todas las confirmaciones para continuar.
                  </strong>
                </p>
              </div>
            )}
          </div>

          {/* Content Rating */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-5">
            <h3 className="font-semibold text-blue-900 mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Clasificación de Contenido
            </h3>

            <label className="flex items-start gap-3 cursor-pointer p-3 bg-white rounded-lg border border-blue-200 hover:bg-blue-50/50 transition-colors">
              <input
                type="checkbox"
                checked={hasMatureContent}
                onChange={(e) => setHasMatureContent(e.target.checked)}
                className="mt-1 w-5 h-5 text-blue-600 border-blue-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <span className="text-sm text-blue-800">
                <strong>Mi historia contiene contenido maduro (18+)</strong>
                <br />
                Marcar si incluye: violencia intensa, lenguaje fuerte, temas
                adultos, situaciones perturbadoras, etc.
                <br />
                <em>Nota: Contenido sexual explícito no está permitido.</em>
              </span>
            </label>
          </div>

          {/* Warning */}
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <strong>⚠️ Importante:</strong>
                <br />
                • Una vez enviada, no podrás editar tu historia
                <br />
                • Las violaciones a las reglas pueden resultar en
                descalificación
                <br />
                • El contenido inapropiado será removido sin previo aviso
                <br />• Al enviar, confirmas que cumples con todas las reglas
                del concurso
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 bg-slate-50 p-6 rounded-b-2xl">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={onClose}
              className="px-6 py-3 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors font-medium"
              disabled={isSubmitting}
            >
              Cancelar
            </button>

            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={`px-6 py-3 flex items-center font-medium rounded-lg transition-all ${
                !canSubmit 
                  ? "opacity-50 cursor-not-allowed bg-slate-300 text-slate-500" 
                  : "bg-gradient-to-r from-primary-600 to-accent-600 text-white hover:from-primary-700 hover:to-accent-700 shadow-lg hover:shadow-xl"
              }`}
            >
              {isSubmitting && (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
              )}
              <Send className="h-5 w-5 mr-2" />
              {isSubmitting ? "Enviando..." : "Confirmar y enviar historia"}
            </button>
          </div>

          {!canSubmit && !isSubmitting && (
            <p className="text-sm text-red-600 mt-3 text-center">
              Debes aceptar todas las confirmaciones legales para continuar
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubmissionConfirmationModal;
