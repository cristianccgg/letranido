import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Clock, Send, AlertCircle, PenTool } from "lucide-react";
import { useGlobalApp } from "../contexts/GlobalAppContext";
import AuthModal from "../components/forms/AuthModal";
import SubmissionConfirmationModal from "../components/forms/SubmissionConfirmationModal";

const WritePrompt = () => {
  const { promptId } = useParams();
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [wordCount, setWordCount] = useState(0);

  // ✅ TODO DESDE EL CONTEXTO UNIFICADO
  const {
    currentContest,
    contestsLoading,
    isAuthenticated,
    user,
    submitStory, // ✅ Función integrada en el contexto
    userStories,
  } = useGlobalApp();

  // ✅ VERIFICACIÓN DE PARTICIPACIÓN DIRECTA
  const hasUserParticipated =
    isAuthenticated && currentContest && userStories.length > 0
      ? userStories.some((story) => story.contest_id === currentContest.id)
      : false;

  // ✅ DETERMINAR CONCURSO A USAR
  const contestToUse = currentContest; // Simplificado: siempre usar el actual

  // ✅ AUTO-GUARDAR Y CONTEO DE PALABRAS
  useEffect(() => {
    if (!contestToUse?.id) return;

    const words = text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0);
    setWordCount(words.length);

    // Auto-guardar solo si hay contenido
    if (title.trim() || text.trim()) {
      const saveData = { title, text };
      localStorage.setItem(
        `story-draft-${contestToUse.id}`,
        JSON.stringify(saveData)
      );
    }
  }, [text, title, contestToUse?.id]);

  // ✅ CARGAR BORRADOR
  useEffect(() => {
    if (!contestToUse?.id) return;

    const savedDraft = localStorage.getItem(`story-draft-${contestToUse.id}`);
    if (savedDraft) {
      try {
        const { title: savedTitle, text: savedText } = JSON.parse(savedDraft);
        if (savedTitle) setTitle(savedTitle);
        if (savedText) setText(savedText);
      } catch (err) {
        console.error("Error cargando borrador:", err);
      }
    }

    // Verificar borrador temporal (después de registro)
    const tempDraft = localStorage.getItem(
      `story-draft-temp-${contestToUse.id}`
    );
    if (tempDraft && !savedDraft) {
      try {
        const { title: savedTitle, text: savedText } = JSON.parse(tempDraft);
        if (savedTitle) setTitle(savedTitle);
        if (savedText) setText(savedText);

        // Mover a borrador normal y limpiar temporal
        localStorage.setItem(`story-draft-${contestToUse.id}`, tempDraft);
        localStorage.removeItem(`story-draft-temp-${contestToUse.id}`);
      } catch (err) {
        console.error("Error cargando borrador temporal:", err);
      }
    }
  }, [contestToUse?.id]);

  const handleSubmit = () => {
    // ✅ VALIDACIONES BÁSICAS
    if (!title.trim()) {
      alert("Debes escribir un título para tu historia");
      return;
    }

    if (wordCount < (contestToUse?.min_words || 100)) {
      alert(
        `Tu texto debe tener al menos ${
          contestToUse?.min_words || 100
        } palabras`
      );
      return;
    }

    if (wordCount > (contestToUse?.max_words || 1000)) {
      alert(
        `Tu texto no puede superar las ${
          contestToUse?.max_words || 1000
        } palabras`
      );
      return;
    }

    // ✅ VERIFICAR PARTICIPACIÓN PREVIA
    if (hasUserParticipated) {
      alert("Ya has enviado una historia para este concurso");
      return;
    }

    // ✅ VERIFICAR AUTENTICACIÓN
    if (!isAuthenticated) {
      // Guardar contenido antes de auth
      if (contestToUse?.id && (title.trim() || text.trim())) {
        const tempDraft = { title, text };
        localStorage.setItem(
          `story-draft-temp-${contestToUse.id}`,
          JSON.stringify(tempDraft)
        );
      }
      setShowAuthModal(true);
      return;
    }

    // ✅ PROCEDER CON CONFIRMACIÓN
    setShowConfirmationModal(true);
  };

  const handleConfirmSubmission = async ({ hasMatureContent }) => {
    const storyData = {
      title: title.trim(),
      content: text.trim(),
      wordCount,
      contestId: contestToUse.id,
      hasMatureContent,
    };

    // ✅ submitStory del contexto actualiza automáticamente userStories
    const result = await submitStory(storyData);

    if (result.success) {
      // Limpiar borrador
      localStorage.removeItem(`story-draft-${contestToUse.id}`);

      // Cerrar modal
      setShowConfirmationModal(false);

      // Redirigir con mensaje
      navigate("/contest/current", {
        state: { message: result.message },
      });
    } else {
      alert(result.error);
    }
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);

    // Restaurar contenido guardado después del registro
    const savedDraft = localStorage.getItem(
      `story-draft-temp-${contestToUse?.id}`
    );
    if (savedDraft) {
      try {
        const { title: savedTitle, text: savedText } = JSON.parse(savedDraft);
        if (savedTitle) setTitle(savedTitle);
        if (savedText) setText(savedText);
        localStorage.removeItem(`story-draft-temp-${contestToUse?.id}`);
      } catch (err) {
        console.error("Error restaurando borrador:", err);
      }
    }
  };

  const getWordCountColor = () => {
    if (!contestToUse) return "text-gray-500";
    if (wordCount < contestToUse.min_words) return "text-red-500";
    if (wordCount > contestToUse.max_words) return "text-red-500";
    if (wordCount > contestToUse.max_words * 0.9) return "text-yellow-500";
    return "text-green-500";
  };

  const getTimeLeft = () => {
    if (!contestToUse?.submission_deadline) return "Cargando...";

    const now = new Date();
    const deadline = new Date(contestToUse.submission_deadline);
    const diff = deadline - now;

    if (diff <= 0) return "Concurso cerrado";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days} días, ${hours} horas`;
    return `${hours} horas`;
  };

  const isSubmissionClosed = () => {
    if (!contestToUse?.submission_deadline) return false;
    return new Date() > new Date(contestToUse.submission_deadline);
  };

  // ✅ LOADING SIMPLIFICADO
  if (contestsLoading || !contestToUse) {
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

  // ✅ ERROR SIMPLIFICADO
  if (!contestToUse) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <div className="text-red-600 mb-4">
          <AlertCircle className="h-12 w-12 mx-auto mb-4" />
          <h2 className="text-xl font-bold">No hay concurso disponible</h2>
          <p>Actualmente no hay concursos abiertos para participar.</p>
        </div>
        <button onClick={() => navigate("/")} className="btn-primary">
          Volver al inicio
        </button>
      </div>
    );
  }

  // ✅ VERIFICAR SI YA PARTICIPÓ
  if (hasUserParticipated) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <div className="text-green-600 mb-4">
          <PenTool className="h-12 w-12 mx-auto mb-4" />
          <h2 className="text-xl font-bold">
            ¡Ya participaste en este concurso!
          </h2>
          <p>Tu historia fue enviada exitosamente.</p>
        </div>
        <button
          onClick={() => navigate("/contest/current")}
          className="btn-primary"
        >
          Ver participaciones
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
                {contestToUse.category}
              </span>
              <span className="bg-accent-100 text-accent-700 px-2 py-1 rounded text-sm">
                {contestToUse.month}
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
              {contestToUse.title}
            </h1>
            <p className="text-gray-600 leading-relaxed">
              {contestToUse.description}
            </p>
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
            className="writing-area w-full py-2 px-4"
            rows={20}
            disabled={isSubmissionClosed()}
          />
        </div>

        {/* Contador de palabras y acciones */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`text-sm font-medium ${getWordCountColor()}`}>
              {wordCount} / {contestToUse.max_words} palabras
            </div>
            {wordCount < contestToUse.min_words && (
              <div className="flex items-center text-amber-600 text-sm">
                <AlertCircle className="h-4 w-4 mr-1" />
                Mínimo {contestToUse.min_words} palabras
              </div>
            )}
            {wordCount > contestToUse.max_words && (
              <div className="flex items-center text-red-600 text-sm">
                <AlertCircle className="h-4 w-4 mr-1" />
                Excede el límite por {wordCount - contestToUse.max_words}{" "}
                palabras
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
                isSubmissionClosed() ||
                !title.trim() ||
                !text.trim() ||
                wordCount < contestToUse.min_words ||
                wordCount > contestToUse.max_words ||
                hasUserParticipated
              }
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
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
          initialMode="register"
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
          prompt={contestToUse}
          isSubmitting={false}
        />
      )}
    </div>
  );
};

export default WritePrompt;
