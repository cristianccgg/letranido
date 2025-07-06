import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Clock, Send, Save, AlertCircle, PenTool } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import AuthModal from "../components/forms/AuthModal";
import SubmissionConfirmationModal from "../components/forms/SubmissionConfirmationModal";

const WritePrompt = () => {
  const { promptId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [isSaved, setIsSaved] = useState(false);

  // Mock prompt data
  const prompt = {
    id: promptId || 1,
    title: "El último libro de la biblioteca",
    description:
      "Eres el bibliotecario de una biblioteca que está a punto de cerrar para siempre. Solo queda un libro en los estantes. ¿Cuál es y por qué es tan especial?",
    timeLeft: "2 días, 14 horas",
    category: "Ficción",
    maxWords: 1000,
    minWords: 100,
  };

  // Auto-save to localStorage
  useEffect(() => {
    const savedData = localStorage.getItem(`prompt-${prompt.id}`);
    if (savedData) {
      const { title: savedTitle, text: savedText } = JSON.parse(savedData);
      setTitle(savedTitle || "");
      setText(savedText || "");
    }
  }, [prompt.id]);

  useEffect(() => {
    // Count words
    const words = text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0);
    setWordCount(words.length);

    // Auto-save
    const saveData = { title, text };
    localStorage.setItem(`prompt-${prompt.id}`, JSON.stringify(saveData));
    setIsSaved(true);

    const timer = setTimeout(() => setIsSaved(false), 2000);
    return () => clearTimeout(timer);
  }, [text, title, prompt.id]);

  const handleSubmit = () => {
    // Validaciones básicas primero
    if (!title.trim()) {
      alert("Debes escribir un título para tu historia");
      return;
    }

    if (wordCount < prompt.minWords) {
      alert(`Tu texto debe tener al menos ${prompt.minWords} palabras`);
      return;
    }

    if (wordCount > prompt.maxWords) {
      alert(`Tu texto no puede superar las ${prompt.maxWords} palabras`);
      return;
    }

    // Si no está autenticado, mostrar modal de registro
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    // Si está autenticado, mostrar modal de confirmación
    console.log("Abriendo modal de confirmación..."); // Debug
    setShowConfirmationModal(true);
  };

  const handleConfirmSubmission = async ({ hasMatureContent }) => {
    setIsSubmitting(true);

    try {
      // TODO: Enviar a la API con la metadata
      const submissionData = {
        title: title.trim(),
        text: text.trim(),
        promptId: prompt.id,
        wordCount,
        hasMatureContent,
        category: prompt.category,
      };

      console.log("Enviando historia:", submissionData);

      // Simular API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Clear localStorage
      localStorage.removeItem(`prompt-${prompt.id}`);

      // Cerrar modal
      setShowConfirmationModal(false);

      // Redirect to success page or gallery
      navigate("/gallery", {
        state: {
          message:
            "¡Tu historia ha sido enviada exitosamente! Ya está participando en el concurso.",
        },
      });
    } catch (error) {
      alert("Error al enviar tu historia. Intenta nuevamente.");
      console.error("Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    // No auto-enviar, permitir que el usuario revise
    // Opcionalmente mostrar un mensaje de que ya puede enviar
  };

  const getWordCountColor = () => {
    if (wordCount < prompt.minWords) return "text-red-500";
    if (wordCount > prompt.maxWords) return "text-red-500";
    if (wordCount > prompt.maxWords * 0.9) return "text-yellow-500";
    return "text-green-500";
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Prompt Info */}
      <div className="card mb-8">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-medium">
                {prompt.category}
              </span>
              <div className="flex items-center text-gray-500 text-sm">
                <Clock className="h-4 w-4 mr-1" />
                {prompt.timeLeft}
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              {prompt.title}
            </h1>
            <p className="text-gray-600 leading-relaxed">
              {prompt.description}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            Límite: {prompt.minWords} - {prompt.maxWords} palabras
          </div>
          <div className="flex items-center gap-4">
            {isSaved && (
              <div className="flex items-center text-green-600 text-sm">
                <Save className="h-4 w-4 mr-1" />
                Guardado automáticamente
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Writing Area */}
      <div className="card">
        <div className="mb-4">
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Título de tu historia
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Escribe un título llamativo para tu historia..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            maxLength={100}
          />
        </div>

        <div className="mb-6">
          <label
            htmlFor="story"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Tu historia
          </label>
          <textarea
            id="story"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Comienza a escribir tu historia aquí..."
            className="writing-area w-full"
            rows={20}
          />
        </div>

        {/* Word Count & Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`text-sm font-medium ${getWordCountColor()}`}>
              {wordCount} / {prompt.maxWords} palabras
            </div>
            {wordCount < prompt.minWords && (
              <div className="flex items-center text-amber-600 text-sm">
                <AlertCircle className="h-4 w-4 mr-1" />
                Mínimo {prompt.minWords} palabras
              </div>
            )}
            {wordCount > prompt.maxWords && (
              <div className="flex items-center text-red-600 text-sm">
                <AlertCircle className="h-4 w-4 mr-1" />
                Excede el límite por {wordCount - prompt.maxWords} palabras
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/")} className="btn-secondary">
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={
                isSubmitting ||
                !title.trim() ||
                !text.trim() ||
                wordCount < prompt.minWords ||
                wordCount > prompt.maxWords
              }
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <Send className="h-4 w-4 mr-2" />
              {isAuthenticated ? "Enviar historia" : "Registrarse y continuar"}
            </button>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
          <PenTool className="h-5 w-5 mr-2" />
          Consejos para escribir
        </h3>
        <ul className="text-blue-800 text-sm space-y-1">
          <li>• Lee el prompt cuidadosamente e interpreta creativamente</li>
          <li>
            • Enfócate en crear personajes memorables y situaciones interesantes
          </li>
          <li>• Un buen comienzo y final pueden marcar la diferencia</li>
          <li>• Revisa tu ortografía y gramática antes de enviar</li>
        </ul>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
        />
      )}

      {/* Submission Confirmation Modal */}
      {showConfirmationModal && (
        <SubmissionConfirmationModal
          isOpen={showConfirmationModal}
          onClose={() => {
            console.log("Cerrando modal de confirmación"); // Debug
            setShowConfirmationModal(false);
          }}
          onConfirm={handleConfirmSubmission}
          title={title}
          text={text}
          wordCount={wordCount}
          prompt={prompt}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Debug info */}
      {process.env.NODE_ENV === "development" && (
        <div className="fixed bottom-4 right-4 bg-black text-white p-2 rounded text-xs">
          Modal: {showConfirmationModal ? "ABIERTO" : "CERRADO"} | Auth:{" "}
          {isAuthenticated ? "SÍ" : "NO"}
        </div>
      )}
    </div>
  );
};

export default WritePrompt;
