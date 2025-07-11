import { useState } from "react";
import { X, Send, AlertCircle, Shield, FileText } from "lucide-react";

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

  if (!isOpen) return null;

  const canSubmit =
    acceptTerms && confirmOriginal && confirmNoAI && !isSubmitting;

  const handleSubmit = () => {
    if (!canSubmit) return;

    onConfirm({
      hasMatureContent,
      termsAccepted: true,
      originalConfirmed: true,
      noAIConfirmed: true,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <Send className="h-5 w-5 mr-2 text-primary-600" />
              Confirmar envío de historia
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isSubmitting}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Story Preview */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Vista previa:</h3>
            <div className="mb-2">
              <span className="text-sm text-gray-600">Título: </span>
              <span className="font-medium">{title}</span>
            </div>
            <div className="mb-2">
              <span className="text-sm text-gray-600">Palabras: </span>
              <span className="font-medium">{wordCount}</span>
            </div>
            <div className="mb-2">
              <span className="text-sm text-gray-600">Concurso: </span>
              <span className="font-medium">{prompt.title}</span>
            </div>
            <div className="mt-3 p-3 bg-white border border-gray-200 rounded text-sm text-gray-700 max-h-32 overflow-y-auto">
              {text.substring(0, 200)}...
            </div>
          </div>

          {/* Legal Confirmations - REQUIRED */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-semibold text-red-900 mb-4 flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              ⚖️ Confirmaciones Legales Obligatorias
            </h3>

            <div className="space-y-3">
              {/* Original Work Confirmation */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmOriginal}
                  onChange={(e) => setConfirmOriginal(e.target.checked)}
                  className="mt-1 w-4 h-4 text-red-600 border-red-300 rounded focus:ring-red-500"
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
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmNoAI}
                  onChange={(e) => setConfirmNoAI(e.target.checked)}
                  className="mt-1 w-4 h-4 text-red-600 border-red-300 rounded focus:ring-red-500"
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
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 text-red-600 border-red-300 rounded focus:ring-red-500"
                  required
                />
                <span className="text-sm text-red-800">
                  <strong>
                    Acepto los términos y condiciones del concurso.
                  </strong>
                  <br />
                  He leído las reglas y entiendo que LiteraLab puede mostrar mi
                  historia en la plataforma.
                </span>
              </label>
            </div>

            {(!confirmOriginal || !confirmNoAI || !acceptTerms) && (
              <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded">
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
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Clasificación de Contenido
            </h3>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={hasMatureContent}
                onChange={(e) => setHasMatureContent(e.target.checked)}
                className="mt-1 w-4 h-4 text-blue-600 border-blue-300 rounded focus:ring-blue-500"
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
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
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
        <div className="border-t border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              className="btn-secondary"
              disabled={isSubmitting}
            >
              Cancelar
            </button>

            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={`btn-primary flex items-center ${
                !canSubmit ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isSubmitting && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              )}
              <Send className="h-4 w-4 mr-2" />
              {isSubmitting ? "Enviando..." : "Confirmar y enviar historia"}
            </button>
          </div>

          {!canSubmit && !isSubmitting && (
            <p className="text-sm text-red-600 mt-2 text-center">
              Debes aceptar todas las confirmaciones legales para continuar
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubmissionConfirmationModal;
