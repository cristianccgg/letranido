import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Clock, Send, Save, AlertCircle, PenTool } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useContests } from "../hooks/useContests";
import { useStories } from "../hooks/useStories";
import AuthModal from "../components/forms/AuthModal";
import SubmissionConfirmationModal from "../components/forms/SubmissionConfirmationModal";

const WritePrompt = () => {
  const { promptId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  // Hooks para datos
  const {
    currentContest,
    getContestById,
    loading: contestLoading,
  } = useContests();
  const { submitStory, loading: submissionLoading } = useStories();

  // Estado local
  const [prompt, setPrompt] = useState(null);
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState(null);

  // ✅ useRef para evitar loops - solo carga UNA VEZ
  const hasLoadedPrompt = useRef(false);
  const currentPromptId = useRef(null);
  const isMounted = useRef(true); // <--- Añadido

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // ✅ Cargar prompt/concurso - VERSIÓN SIMPLE sin loops
  useEffect(() => {
    const loadPrompt = async () => {
      // Solo ejecutar si cambió el promptId o nunca se ha cargado
      if (hasLoadedPrompt.current && currentPromptId.current === promptId) {
        console.log("⏳ Prompt ya cargado, saltando...");
        return;
      }

      // Si estamos cargando concursos, esperar
      if (contestLoading) {
        console.log("⏳ Esperando a que terminen de cargar los concursos...");
        return;
      }

      console.log("🔍 Cargando prompt para ID:", promptId);

      try {
        if (!isMounted.current) return; // <--- Añadido
        setError(null);

        if (promptId && promptId !== "1") {
          // Solo intentar cargar por ID si es un UUID válido
          const isValidUUID =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
              promptId
            );

          if (isValidUUID) {
            console.log("🎯 Cargando concurso por UUID...");
            const contest = await getContestById(promptId);
            if (!isMounted.current) return; // <--- Añadido
            if (contest) {
              console.log("✅ Concurso cargado por ID:", contest.title);
              setPrompt(contest);
              hasLoadedPrompt.current = true;
              currentPromptId.current = promptId;
              return;
            }
          }
        }

        // Fallback: usar concurso actual
        if (currentContest) {
          if (!isMounted.current) return; // <--- Añadido
          console.log("✅ Usando concurso actual:", currentContest.title);
          setPrompt(currentContest);
          hasLoadedPrompt.current = true;
          currentPromptId.current = promptId;
        } else {
          if (!isMounted.current) return; // <--- Añadido
          console.error("❌ No hay concursos disponibles");
          setError("No hay concursos disponibles");
        }
      } catch (err) {
        if (!isMounted.current) return; // <--- Añadido
        console.error("💥 Error cargando prompt:", err);
        setError(err.message || "Error al cargar el concurso");
      }
    };

    loadPrompt();
  }, [promptId, currentContest?.id, contestLoading, getContestById]);

  // ✅ Reset when promptId changes
  useEffect(() => {
    if (currentPromptId.current !== promptId) {
      console.log("🔄 PromptId cambió, reseteando...");
      hasLoadedPrompt.current = false;
      setPrompt(null);
      setError(null);
    }
  }, [promptId]);

  useEffect(() => {
    if (!prompt?.id) return;

    // Cargar borrador normal
    const savedDraft = localStorage.getItem(`story-draft-${prompt.id}`);
    if (savedDraft) {
      try {
        const { title: savedTitle, text: savedText } = JSON.parse(savedDraft);
        if (savedTitle) setTitle(savedTitle);
        if (savedText) setText(savedText);
      } catch (err) {
        console.error("Error cargando borrador:", err);
      }
    }

    // Si no hay borrador normal, verificar si hay uno temporal (después de registro)
    if (!savedDraft) {
      const tempDraft = localStorage.getItem(`story-draft-temp-${prompt.id}`);
      if (tempDraft) {
        try {
          const { title: savedTitle, text: savedText } = JSON.parse(tempDraft);
          if (savedTitle) setTitle(savedTitle);
          if (savedText) setText(savedText);

          // Mover a borrador normal y limpiar temporal
          localStorage.setItem(`story-draft-${prompt.id}`, tempDraft);
          localStorage.removeItem(`story-draft-temp-${prompt.id}`);
        } catch (err) {
          console.error("Error cargando borrador temporal:", err);
        }
      }
    }
  }, [prompt?.id]);

  // ✅ Auto-guardar en localStorage
  useEffect(() => {
    if (!prompt?.id) return;

    // Contar palabras
    const words = text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0);
    setWordCount(words.length);

    // Auto-guardar solo si hay contenido
    if (title.trim() || text.trim()) {
      const saveData = { title, text };
      localStorage.setItem(
        `story-draft-${prompt.id}`,
        JSON.stringify(saveData)
      );
      setIsSaved(true);

      const timer = setTimeout(() => {
        if (isMounted.current) setIsSaved(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [text, title, prompt?.id]);

  const handleSubmit = () => {
    // Validaciones básicas
    if (!title.trim()) {
      alert("Debes escribir un título para tu historia");
      return;
    }

    if (wordCount < prompt.min_words) {
      alert(`Tu texto debe tener al menos ${prompt.min_words} palabras`);
      return;
    }

    if (wordCount > prompt.max_words) {
      alert(`Tu texto no puede superar las ${prompt.max_words} palabras`);
      return;
    }

    // Verificar autenticación
    if (!isAuthenticated) {
      // Guardar el contenido actual antes de abrir modal de auth
      if (prompt?.id && (title.trim() || text.trim())) {
        const tempDraft = { title, text };
        localStorage.setItem(
          `story-draft-temp-${prompt.id}`,
          JSON.stringify(tempDraft)
        );
      }

      setShowAuthModal(true);
      return;
    }

    // Si está autenticado, proceder normal
    setShowConfirmationModal(true);
  };

  const handleConfirmSubmission = async ({ hasMatureContent }) => {
    const storyData = {
      title: title.trim(),
      content: text.trim(),
      wordCount,
      contestId: prompt.id,
      hasMatureContent,
    };

    console.log("📝 Enviando historia:", storyData);

    const result = await submitStory(storyData);

    if (!isMounted.current) return; // <--- Añadido

    if (result.success) {
      // Limpiar borrador
      localStorage.removeItem(`story-draft-${prompt.id}`);

      // Cerrar modal
      setShowConfirmationModal(false);

      // Redirigir con mensaje de éxito
      navigate("/contest/current", {
        state: {
          message: result.message,
        },
      });
    } else {
      // Mostrar error pero mantener modal abierto
      alert(result.error);
    }
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);

    // Restaurar el contenido guardado después del registro
    const savedDraft = localStorage.getItem(`story-draft-temp-${prompt?.id}`);
    if (savedDraft) {
      try {
        const { title: savedTitle, text: savedText } = JSON.parse(savedDraft);
        if (savedTitle) setTitle(savedTitle);
        if (savedText) setText(savedText);

        // Limpiar el borrador temporal
        localStorage.removeItem(`story-draft-temp-${prompt?.id}`);
      } catch (err) {
        console.error("Error restaurando borrador:", err);
      }
    }
  };

  const getWordCountColor = () => {
    if (!prompt) return "text-gray-500";
    if (wordCount < prompt.min_words) return "text-red-500";
    if (wordCount > prompt.max_words) return "text-red-500";
    if (wordCount > prompt.max_words * 0.9) return "text-yellow-500";
    return "text-green-500";
  };

  const getTimeLeft = () => {
    if (!prompt?.submission_deadline) return "Cargando...";

    const now = new Date();
    const deadline = new Date(prompt.submission_deadline);
    const diff = deadline - now;

    if (diff <= 0) return "Concurso cerrado";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days} días, ${hours} horas`;
    return `${hours} horas`;
  };

  const isSubmissionClosed = () => {
    if (!prompt?.submission_deadline) return false;
    return new Date() > new Date(prompt.submission_deadline);
  };

  // Loading state
  if (contestLoading || !prompt) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="h-64 bg-gray-200 rounded mb-4"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <div className="text-red-600 mb-4">
          <AlertCircle className="h-12 w-12 mx-auto mb-4" />
          <h2 className="text-xl font-bold">Error</h2>
          <p>{error}</p>
        </div>
        <button onClick={() => navigate("/")} className="btn-primary">
          Volver al inicio
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Información del concurso */}
      <div className="card mb-8">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-medium">
                {prompt.category}
              </span>
              <span className="bg-accent-100 text-accent-700 px-2 py-1 rounded text-sm">
                {prompt.month}
              </span>
              <div className="flex items-center text-gray-500 text-sm">
                <Clock className="h-4 w-4 mr-1" />
                {getTimeLeft()}
              </div>
              {isSubmissionClosed() && (
                <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-medium">
                  Cerrado
                </span>
              )}
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
            Límite: {prompt.min_words} - {prompt.max_words} palabras
          </div>
          <div className="flex items-center gap-4">
            {isSaved && (
              <div className="flex items-center text-green-600 text-sm">
                <Save className="h-4 w-4 mr-1" />
                Guardado automáticamente
              </div>
            )}
            <div className="text-sm text-gray-500">
              {prompt.participants_count} participantes
            </div>
          </div>
        </div>
      </div>

      {/* Área de escritura */}
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
            disabled={isSubmissionClosed()}
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
            disabled={isSubmissionClosed()}
          />
        </div>

        {/* Contador de palabras y acciones */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`text-sm font-medium ${getWordCountColor()}`}>
              {wordCount} / {prompt.max_words} palabras
            </div>
            {wordCount < prompt.min_words && (
              <div className="flex items-center text-amber-600 text-sm">
                <AlertCircle className="h-4 w-4 mr-1" />
                Mínimo {prompt.min_words} palabras
              </div>
            )}
            {wordCount > prompt.max_words && (
              <div className="flex items-center text-red-600 text-sm">
                <AlertCircle className="h-4 w-4 mr-1" />
                Excede el límite por {wordCount - prompt.max_words} palabras
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
                submissionLoading ||
                isSubmissionClosed() ||
                !title.trim() ||
                !text.trim() ||
                wordCount < prompt.min_words ||
                wordCount > prompt.max_words
              }
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {submissionLoading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              )}
              <Send className="h-4 w-4 mr-2" />
              {isAuthenticated ? "Enviar historia" : "Registrarse y continuar"}
            </button>
          </div>
        </div>
      </div>

      {/* Consejos */}
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

      {/* Modales */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
        />
      )}

      {showConfirmationModal && (
        <SubmissionConfirmationModal
          isOpen={showConfirmationModal}
          onClose={() => setShowConfirmationModal(false)}
          onConfirm={handleConfirmSubmission}
          title={title}
          text={text}
          wordCount={wordCount}
          prompt={prompt}
          isSubmitting={submissionLoading}
        />
      )}
    </div>
  );
};

export default WritePrompt;
