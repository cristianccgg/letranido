import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { Clock, Send, AlertCircle, PenTool, Edit3 } from "lucide-react";
import { useGlobalApp } from "../contexts/GlobalAppContext";
import {
  useGoogleAnalytics,
  AnalyticsEvents,
} from "../hooks/useGoogleAnalytics";
import { useWritingAnalytics } from "../hooks/useWritingAnalytics";
import { useDraftManager } from "../hooks/useDraftManager";
import { usePremiumFeatures } from "../hooks/usePremiumFeatures";
import { FEATURES } from "../lib/config";
import { logger } from "../utils/logger";
import { supabase } from "../lib/supabase";
import AuthModal from "../components/forms/AuthModal";
import SubmissionConfirmationModal from "../components/forms/SubmissionConfirmationModal";
import LiteraryEditor from "../components/ui/LiteraryEditor";
import SEOHead from "../components/SEO/SEOHead";

const WritePrompt = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { promptId } = useParams(); // ✅ Obtener ID del concurso desde URL
  const editStoryId = searchParams.get("edit");
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [originalStory, setOriginalStory] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [showSaveIndicator, setShowSaveIndicator] = useState(false);

  // ✅ TODO DESDE EL CONTEXTO UNIFICADO
  const {
    currentContest,
    contests, // ✅ Para encontrar concurso específico
    contestsLoading,
    isAuthenticated,
    user,
    submitStory, // ✅ Función integrada en el contexto
    userStories,
    getContestPhase, // ✅ Para verificar si se pueden enviar historias
  } = useGlobalApp();

  // ✅ GOOGLE ANALYTICS
  const { trackEvent } = useGoogleAnalytics();

  // ✅ PREMIUM FEATURES
  const { getWordLimit, checkWordLimit, isPremium, checkMonthlyContestLimit, getUpgradeMessage } = usePremiumFeatures();

  // ✅ DETERMINAR CONCURSO A USAR
  const contestToUse = useMemo(() => {
    // Si hay un promptId en la URL, buscar ese concurso específico
    if (promptId && contests.length > 0) {
      const specificContest = contests.find((c) => c.id === promptId);
      if (specificContest) {
        console.log(
          `📝 Usando concurso específico de URL: "${specificContest.title}"`
        );
        return specificContest;
      }
    }
    // Fallback al concurso actual
    console.log(`📝 Usando concurso actual: "${currentContest?.title}"`);
    return currentContest;
  }, [promptId, contests, currentContest]);

  // ✅ WRITING ANALYTICS
  const {
    startWritingSession,
    trackWordCount,
    trackDraftSaved,
    endWritingSession,
  } = useWritingAnalytics(contestToUse?.id, isEditing);

  // ✅ DRAFT MANAGER
  const { saveDraft, loadDraft, saveTempDraft, clearDraft } = useDraftManager(
    contestToUse?.id
  );

  // ✅ VERIFICAR SI EL CONCURSO PERMITE ENVÍOS
  const contestPhase = useMemo(() => {
    return contestToUse ? getContestPhase(contestToUse) : null;
  }, [contestToUse, getContestPhase]);

  // ✅ VERIFICACIÓN DE PARTICIPACIÓN DIRECTA (Optimizada con useMemo)
  const hasUserParticipated = useMemo(() => {
    return isAuthenticated &&
      contestToUse &&
      userStories.length > 0 &&
      !isEditing
      ? userStories.some((story) => story.contest_id === contestToUse.id)
      : false;
  }, [isAuthenticated, contestToUse, userStories, isEditing]);

  // ✅ CARGAR HISTORIA PARA EDICIÓN
  useEffect(() => {
    if (editStoryId && isAuthenticated) {
      const loadStoryForEdit = async () => {
        try {
          const { data: story, error } = await supabase
            .from("stories")
            .select(
              `
              *,
              contests (
                id,
                title,
                submission_deadline,
                voting_deadline
              )
            `
            )
            .eq("id", editStoryId)
            .eq("user_id", user.id) // Solo cargar si es del usuario actual
            .single();

          if (error) {
            console.error("Error cargando historia para editar:", error);
            alert("No se pudo cargar la historia para editar");
            navigate("/profile");
            return;
          }

          // Verificar que el concurso está en fase de envío
          if (story.contests) {
            const contestPhase =
              new Date() <= new Date(story.contests.submission_deadline)
                ? "submission"
                : "voting";
            if (contestPhase !== "submission") {
              alert("Solo puedes editar historias durante el período de envío");
              navigate("/profile");
              return;
            }
          }

          setOriginalStory(story);
          setTitle(story.title);
          setText(story.content);
          setIsEditing(true);
        } catch (error) {
          console.error("Error inesperado:", error);
          alert("Error cargando la historia");
          navigate("/profile");
        }
      };

      loadStoryForEdit();
    }
  }, [editStoryId, isAuthenticated, user?.id, navigate]);

  // ✅ AUTO-GUARDAR Y CONTEO DE PALABRAS (sin HTML) - OPTIMIZADO PARA EVITAR LOOPS
  useEffect(() => {
    if (!contestToUse?.id) return;

    // Limpiar HTML antes de contar palabras
    const cleanText = text
      .replace(/<\/?[^>]+(>|$)/g, "") // Remover tags HTML
      .replace(/&nbsp;/g, " ") // Convertir espacios no-break
      .trim();

    const words = cleanText.split(/\s+/).filter((word) => word.length > 0);
    const newWordCount = words.length;
    setWordCount(newWordCount);

    // Track word count para analytics (solo si hay cambio significativo)
    if (newWordCount > 0) {
      trackWordCount(newWordCount, title);
    }

    // Auto-guardar con debounce (1000ms para evitar loops)
    const timeoutId = setTimeout(() => {
      // Solo guardar si hay contenido real
      if (title.trim() || text.trim()) {
        saveDraft(title, text);
        trackDraftSaved(newWordCount, title);

        // Mostrar indicador de guardado
        setLastSaved(new Date());
        setShowSaveIndicator(true);
        setTimeout(() => setShowSaveIndicator(false), 2000);
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [text, title, contestToUse?.id]); // ✅ Removidas las funciones de la dependencia

  // ✅ CARGAR BORRADOR Y INICIAR SESIÓN DE ESCRITURA - SOLO UNA VEZ
  useEffect(() => {
    if (!contestToUse?.id || isEditing) return;

    // Flag para evitar loops de carga
    let hasLoaded = false;

    if (!hasLoaded) {
      const draft = loadDraft();
      if (draft.title && !title) setTitle(draft.title);
      if (draft.text && !text) setText(draft.text);
      hasLoaded = true;
    }

    // Iniciar sesión de escritura analytics solo una vez
    startWritingSession();
  }, [contestToUse?.id, isEditing]); // ✅ Removidas las funciones que causan re-renders

  const handleSubmit = async () => {
    // ✅ PREVENIR DOBLES CLICS
    if (isSubmitting) return;

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

    const userWordLimit = getWordLimit();
    if (wordCount > userWordLimit) {
      alert(
        `Tu texto no puede superar las ${userWordLimit} palabras${
          FEATURES.PREMIUM_PLANS && !isPremium() ? ' (Upgrade a premium para 3,000 palabras)' : ''
        }`
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
        saveTempDraft(title, text);
      }
      setShowAuthModal(true);
      return;
    }

    // ✅ VERIFICAR LÍMITE MENSUAL DE CONCURSOS (solo para nuevas historias)
    if (!isEditing) {
      const monthlyLimit = await checkMonthlyContestLimit();
      if (!monthlyLimit.canParticipate) {
        alert(
          `Has alcanzado tu límite de ${monthlyLimit.limit} concurso${
            monthlyLimit.limit > 1 ? 's' : ''
          } por mes. ${
            FEATURES.PREMIUM_PLANS && !isPremium() ? 'Upgrade a premium para concursos ilimitados.' : ''
          }`
        );
        return;
      }
    }

    // ✅ PROCEDER CON CONFIRMACIÓN
    setShowConfirmationModal(true);
  };

  const handleConfirmSubmission = async ({
    hasMatureContent,
    termsAccepted,
    originalConfirmed,
    noAIConfirmed,
    shareWinnerContentAccepted,
  }) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (isEditing && originalStory) {
        // MODO EDICIÓN: Actualizar historia existente
        logger.log("🔄 Actualizando historia:", {
          storyId: originalStory.id,
          userId: user.id,
          title: title.trim(),
          wordCount,
          hasMatureContent,
        });

        const { data: updatedStory, error: updateError } = await supabase
          .from("stories")
          .update({
            title: title.trim(),
            content: text.trim(),
            word_count: wordCount,
            is_mature: hasMatureContent,
          })
          .eq("id", originalStory.id)
          .eq("user_id", user.id)
          .select();

        if (updateError) {
          logger.error("❌ Error actualizando historia:", updateError);
          logger.error("❌ Detalles del error:", {
            message: updateError.message,
            details: updateError.details,
            hint: updateError.hint,
            code: updateError.code,
          });
          alert(`Error actualizando la historia: ${updateError.message}`);
          return;
        }

        if (!updatedStory || updatedStory.length === 0) {
          logger.error("❌ No se encontró la historia para actualizar");
          alert("No se pudo encontrar la historia para actualizar");
          return;
        }

        // Actualizar consentimientos legales
        const { error: consentError } = await supabase
          .from("submission_consents")
          .update({
            terms_accepted: termsAccepted,
            original_confirmed: originalConfirmed,
            no_ai_confirmed: noAIConfirmed,
            share_winner_content_accepted: shareWinnerContentAccepted,
            mature_content_marked: hasMatureContent,
            user_agent: navigator.userAgent,
          })
          .eq("story_id", originalStory.id);

        if (consentError) {
          logger.error("❌ Error actualizando consentimientos:", consentError);
          // No es crítico, continuamos
        }

        // 📊 TRACK EVENT: Story updated
        trackEvent(AnalyticsEvents.STORY_PUBLISHED, {
          contest_id: contestToUse.id,
          word_count: wordCount,
          has_mature_content: hasMatureContent,
          contest_title: contestToUse.title,
          action: "updated",
        });

        // Cerrar modal
        setShowConfirmationModal(false);

        // Redirigir con mensaje
        navigate("/profile", {
          state: { message: "Historia actualizada exitosamente" },
        });
      } else {
        // MODO CREACIÓN: Nueva historia
        const storyData = {
          title: title.trim(),
          content: text.trim(),
          wordCount,
          contestId: contestToUse.id,
          hasMatureContent,
        };

        // ✅ submitStory del contexto actualiza automáticamente userStories
        const result = await submitStory(storyData);

        logger.log("📝 Submit story result:", result);

        if (result.success) {
          logger.log("✅ Story created with ID:", result.storyId);

          // Ahora guardar los consentimientos legales con el story_id
          const { data: consentData, error: consentError } = await supabase
            .from("submission_consents")
            .insert({
              user_id: user.id,
              story_id: result.storyId, // Insertar directamente con story_id
              terms_accepted: termsAccepted,
              original_confirmed: originalConfirmed,
              no_ai_confirmed: noAIConfirmed,
              share_winner_content_accepted: shareWinnerContentAccepted,
              mature_content_marked: hasMatureContent,
              ip_address: null, // Se puede obtener del cliente si es necesario
              user_agent: navigator.userAgent,
            })
            .select()
            .single();

          if (consentError) {
            logger.error("❌ Error guardando consentimientos:", consentError);
            alert(
              "Error guardando los consentimientos legales. Inténtalo de nuevo."
            );
            return;
          }

          logger.log("✅ Consent created with story_id:", consentData.id);

          // 📊 TRACK EVENT: Story published
          trackEvent(AnalyticsEvents.STORY_PUBLISHED, {
            contest_id: contestToUse.id,
            word_count: wordCount,
            has_mature_content: hasMatureContent,
            contest_title: contestToUse.title,
          });

          // Limpiar borrador
          clearDraft();

          // Cerrar modal
          setShowConfirmationModal(false);

          // Finalizar sesión de escritura con éxito
          endWritingSession("completed", wordCount, title);

          // Redirigir al concurso específico con mensaje
          navigate(`/contest/${contestToUse.id}`, {
            state: { message: result.message },
          });
        } else {
          alert(result.error);
        }
      }
    } catch (error) {
      console.error("Error en el proceso de envío:", error);
      alert("Error inesperado. Inténtalo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);

    // Restaurar contenido guardado después del registro
    const draft = loadDraft();
    if (draft.title) setTitle(draft.title);
    if (draft.text) setText(draft.text);
  };

  const getWordCountColor = () => {
    if (!contestToUse) return "text-gray-500 dark:text-dark-400";
    const userWordLimit = getWordLimit();
    
    if (wordCount < contestToUse.min_words)
      return "text-red-500 dark:text-red-400";
    if (wordCount > userWordLimit)
      return "text-red-500 dark:text-red-400";
    if (wordCount > userWordLimit * 0.9)
      return "text-yellow-500 dark:text-yellow-400";
    return "text-green-500 dark:text-green-400";
  };

  const getTimeLeft = () => {
    if (!contestToUse) return "Cargando...";

    const now = new Date();

    // Si es el concurso actual, usar submission_deadline
    if (contestToUse.id === currentContest?.id) {
      if (!contestToUse.submission_deadline) return "Cargando...";
      const deadline = new Date(contestToUse.submission_deadline);
      const diff = deadline - now;

      if (diff <= 0) return "Período de envío cerrado";

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );

      if (days > 0) return `${days} días, ${hours} horas`;
      return `${hours} horas`;
    }

    // Para próximos concursos, mostrar hasta cuándo pueden enviar
    const currentPhase = currentContest
      ? getContestPhase(currentContest)
      : null;
    if (currentPhase === "voting" && contestToUse.voting_deadline) {
      const deadline = new Date(contestToUse.voting_deadline);
      const diff = deadline - now;

      if (diff <= 0) return "Concurso cerrado";

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );

      if (days > 0) return `Disponible por ${days} días, ${hours} horas más`;
      return `Disponible por ${hours} horas más`;
    }

    return "No disponible aún";
  };

  const isSubmissionClosed = () => {
    if (!contestToUse) return true;

    // Si es el concurso actual, usar la fase calculada
    if (contestToUse.id === currentContest?.id) {
      return contestPhase !== "submission";
    }

    // Para próximos concursos: permitir envíos si el concurso actual está en votación
    // y este concurso aún no ha empezado su período de votación
    const currentPhase = currentContest
      ? getContestPhase(currentContest)
      : null;
    if (currentPhase === "voting") {
      const now = new Date();
      const contestVotingDeadline = new Date(contestToUse.voting_deadline);
      // Permitir envíos si aún no ha terminado la votación de este concurso
      return now > contestVotingDeadline;
    }

    // En otros casos, usar la lógica normal
    return contestPhase !== "submission";
  };

  // ✅ LOADING SIMPLIFICADO
  if (contestsLoading || !contestToUse) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-dark-700 rounded w-3/4 mb-4 transition-colors duration-300"></div>
          <div className="h-4 bg-gray-200 dark:bg-dark-700 rounded w-1/2 mb-8 transition-colors duration-300"></div>
          <div className="h-64 bg-gray-200 dark:bg-dark-700 rounded mb-4 transition-colors duration-300"></div>
        </div>
      </div>
    );
  }

  // ✅ ERROR SIMPLIFICADO
  if (!contestToUse) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <div className="text-red-600 dark:text-red-400 mb-4 transition-colors duration-300">
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

  // ✅ VERIFICAR SI YA PARTICIPÓ (pero permitir edición)
  // Si hay editStoryId, esperar a que se procese antes de bloquear
  const shouldBlockForParticipation = hasUserParticipated && !isEditing && !editStoryId;
  if (shouldBlockForParticipation) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <div className="text-green-600 dark:text-green-400 mb-4 transition-colors duration-300">
          <PenTool className="h-12 w-12 mx-auto mb-4" />
          <h2 className="text-xl font-bold">
            ¡Ya participaste en este concurso!
          </h2>
          <p>Tu historia fue enviada exitosamente.</p>
        </div>
        <button
          onClick={() => navigate(`/contest/${contestToUse.id}`)}
          className="btn-primary"
        >
          Ver participaciones
        </button>
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title={isEditing ? "Editar Historia" : "Escribir Historia"}
        description={
          currentContest
            ? `Participa en el concurso de ${currentContest.category} de ${currentContest.month}. Escribe tu historia basada en el prompt: "${currentContest.prompt}"`
            : "Escribe tu historia para el concurso actual de escritura creativa en Letranido."
        }
        keywords="escribir historia, concurso escritura, prompt creativo, participar concurso, letranido"
        url="/write"
        canonicalUrl="https://letranido.com/write"
      />
      <div className="max-w-4xl mx-auto">
        {/* Información del concurso */}
        <div className="bg-white dark:bg-dark-800 shadow-lg rounded-xl p-6 border border-gray-200 dark:border-dark-600 mb-8 transition-colors duration-300">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-primary-100 dark:bg-primary-800/30 text-primary-700 dark:text-primary-300 px-3 py-1 rounded-full text-sm font-medium transition-colors duration-300">
                  {contestToUse.category}
                </span>
                <span className="bg-accent-100 dark:bg-accent-800/30 text-accent-700 dark:text-accent-300 px-2 py-1 rounded text-sm transition-colors duration-300">
                  {contestToUse.month}
                </span>
                <div className="flex items-center text-gray-500 dark:text-dark-400 text-sm transition-colors duration-300">
                  <Clock className="h-4 w-4 mr-1" />
                  {getTimeLeft()}
                </div>
                {isSubmissionClosed() && (
                  <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2 py-1 rounded text-xs font-medium transition-colors duration-300">
                    Cerrado
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-100 mb-3 transition-colors duration-300">
                {isEditing ? "Editando historia" : contestToUse.title}
              </h1>
              {isEditing && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3 mb-3 transition-colors duration-300">
                  <p className="text-blue-800 dark:text-blue-300 text-sm flex items-center transition-colors duration-300">
                    <Edit3 className="h-4 w-4 mr-2" />
                    Estás editando tu historia para:{" "}
                    <strong className="ml-1">{contestToUse.title}</strong>
                  </p>
                </div>
              )}
              <p className="text-gray-600 dark:text-dark-300 leading-relaxed transition-colors duration-300">
                {contestToUse.description}
              </p>
            </div>
          </div>
        </div>

        {/* Área de escritura */}
        <div className="bg-white dark:bg-dark-800 shadow-lg rounded-xl p-6 border border-gray-200 dark:border-dark-600 transition-colors duration-300">
          <div className="mb-4">
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-2 transition-colors duration-300"
            >
              Título de tu historia
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Escribe un título llamativo para tu historia..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-dark-100 placeholder-gray-500 dark:placeholder-dark-400 rounded-lg focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400 outline-none transition-colors duration-300"
              maxLength={100}
              disabled={isSubmissionClosed()}
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="story"
              className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-2 transition-colors duration-300"
            >
              Tu historia
            </label>
            <LiteraryEditor
              value={text}
              onChange={setText}
              placeholder="Comienza a escribir tu historia aquí..."
              disabled={isSubmissionClosed()}
              rows={20}
            />
          </div>

          {/* Contador de palabras y acciones */}
          <div className="space-y-4">
            {/* Información de guardado y validación */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <div
                className={`text-sm font-medium transition-colors duration-300 ${getWordCountColor()}`}
              >
                {wordCount} / {getWordLimit()} palabras
                {FEATURES.PREMIUM_PLANS && !isPremium() && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                    (Premium: 3,000)
                  </span>
                )}
              </div>

              {/* Indicador de guardado */}
              <div className="flex items-center gap-2">
                {showSaveIndicator && (
                  <div className="flex items-center text-green-600 dark:text-green-400 text-sm animate-fade-in">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                    Guardado
                  </div>
                )}
                {lastSaved && !showSaveIndicator && (
                  <div className="text-gray-500 dark:text-gray-400 text-xs">
                    Guardado {lastSaved.toLocaleTimeString()}
                  </div>
                )}
              </div>
              
              {/* Mensajes de validación */}
              {wordCount < contestToUse.min_words && (
                <div className="flex items-center text-amber-600 dark:text-amber-400 text-sm transition-colors duration-300">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  Mínimo {contestToUse.min_words} palabras
                </div>
              )}
              {wordCount > getWordLimit() && (
                <div className="flex items-center text-red-600 dark:text-red-400 text-sm transition-colors duration-300">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  Excede el límite por {wordCount - getWordLimit()} palabras
                  {FEATURES.PREMIUM_PLANS && !isPremium() && (
                    <span className="text-xs ml-2 text-blue-600 dark:text-blue-400">
                      (Upgrade para 3,000)
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:justify-end">
              <button 
                onClick={() => navigate("/")} 
                className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-100 font-medium py-2 px-4 rounded-lg transition-colors text-center"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={
                  isSubmitting ||
                  isSubmissionClosed() ||
                  !title.trim() ||
                  !text.trim() ||
                  wordCount < contestToUse.min_words ||
                  wordCount > getWordLimit() ||
                  (!isEditing && hasUserParticipated)
                }
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
              >
                <Send className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">
                  {isSubmitting
                    ? "Enviando..."
                    : isEditing
                      ? "Actualizar historia"
                      : isAuthenticated
                        ? "Enviar historia"
                        : "Registrarse y continuar"}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Consejos */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-6 transition-colors duration-300">
          {/* CSS para animaciones */}
          <style
            dangerouslySetInnerHTML={{
              __html: `
              @keyframes fade-in {
                0% { opacity: 0; transform: translateY(-5px); }
                100% { opacity: 1; transform: translateY(0); }
              }
              .animate-fade-in {
                animation: fade-in 0.3s ease-out;
              }
            `,
            }}
          />

          <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2 flex items-center transition-colors duration-300">
            <PenTool className="h-5 w-5 mr-2" />
            Consejos para escribir
          </h3>
          <ul className="text-blue-800 dark:text-blue-300 text-sm space-y-1 transition-colors duration-300">
            <li>• Lee el prompt cuidadosamente e interpreta creativamente</li>
            <li>
              • Enfócate en crear personajes memorables y situaciones
              interesantes
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
            isEditing={isEditing}
          />
        )}
      </div>
    </>
  );
};

export default WritePrompt;
