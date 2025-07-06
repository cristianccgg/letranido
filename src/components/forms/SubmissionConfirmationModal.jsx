import { useState } from "react";
import {
  X,
  AlertTriangle,
  Send,
  FileText,
  Clock,
  Users,
  CheckCircle,
} from "lucide-react";

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
  const [hasConfirmed, setHasConfirmed] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = () => {
    onConfirm({ hasMatureContent });
  };

  const canSubmit = hasConfirmed && !isSubmitting;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Send className="h-6 w-6 text-primary-600 mr-3" />
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Confirmar envío
                </h2>
                <p className="text-gray-600 text-sm">
                  Revisa tu historia antes de enviarla al concurso
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Story Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-blue-600" />
              Resumen de tu historia
            </h3>

            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-700">
                  Título:
                </span>
                <p className="text-gray-900 font-medium">{title}</p>
              </div>

              <div>
                <span className="text-sm font-medium text-gray-700">
                  Prompt:
                </span>
                <p className="text-gray-600 text-sm italic">"{prompt.title}"</p>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-2">
                <div className="text-center">
                  <div className="text-lg font-bold text-primary-600">
                    {wordCount}
                  </div>
                  <div className="text-xs text-gray-500">Palabras</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">
                    {prompt.category}
                  </div>
                  <div className="text-xs text-gray-500">Categoría</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">
                    {Math.ceil(wordCount / 200)}min
                  </div>
                  <div className="text-xs text-gray-500">Lectura aprox.</div>
                </div>
              </div>
            </div>
          </div>

          {/* Story Preview */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">
              Vista previa del texto:
            </h4>
            <div className="max-h-32 overflow-y-auto bg-gray-50 p-3 rounded text-sm text-gray-700 leading-relaxed">
              {text.substring(0, 300)}
              {text.length > 300 && "..."}
            </div>
          </div>

          {/* Content Rating */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start">
              <input
                type="checkbox"
                id="matureContent"
                checked={hasMatureContent}
                onChange={(e) => setHasMatureContent(e.target.checked)}
                className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <div className="ml-3">
                <label
                  htmlFor="matureContent"
                  className="font-medium text-amber-800 cursor-pointer"
                >
                  Mi historia contiene contenido para adultos
                </label>
                <p className="text-amber-700 text-sm mt-1">
                  Marca esta casilla si tu historia incluye lenguaje fuerte,
                  violencia, contenido sexual o temas que podrían no ser
                  apropiados para menores de edad.
                </p>
                {hasMatureContent && (
                  <div className="mt-2 bg-amber-100 border border-amber-300 rounded p-2">
                    <p className="text-amber-800 text-xs flex items-center">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Tu historia será marcada como "Contenido Maduro" en la
                      galería
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Important Notice */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="ml-3">
                <h4 className="font-medium text-red-800 mb-1">
                  ⚠️ Importante - Lee antes de enviar
                </h4>
                <ul className="text-red-700 text-sm space-y-1">
                  <li>
                    • Una vez enviada, <strong>no podrás editar</strong> tu
                    historia
                  </li>
                  <li>
                    • Tu historia será <strong>pública</strong> y otros usuarios
                    podrán leerla
                  </li>
                  <li>
                    • Solo puedes enviar{" "}
                    <strong>una historia por concurso</strong>
                  </li>
                  <li>
                    • El texto debe ser <strong>original</strong> y de tu
                    autoría
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Final Confirmation */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <input
                type="checkbox"
                id="finalConfirmation"
                checked={hasConfirmed}
                onChange={(e) => setHasConfirmed(e.target.checked)}
                className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <div className="ml-3">
                <label
                  htmlFor="finalConfirmation"
                  className="font-medium text-blue-800 cursor-pointer"
                >
                  He revisado mi historia y confirmo que quiero enviarla al
                  concurso
                </label>
                <p className="text-blue-700 text-sm mt-1">
                  Al marcar esta casilla, confirmas que has leído las reglas del
                  concurso y que tu historia cumple con todos los requisitos.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="btn-secondary disabled:opacity-50"
            >
              Volver a editar
            </button>

            <div className="flex items-center gap-3">
              {canSubmit && (
                <div className="flex items-center text-green-600 text-sm">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Listo para enviar
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center px-6"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Enviar al concurso
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmissionConfirmationModal;
