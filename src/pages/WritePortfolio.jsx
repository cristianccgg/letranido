import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Send, AlertCircle, PenTool, Edit3, Crown } from "lucide-react";
import { useGlobalApp } from "../contexts/GlobalAppContext";
import { usePremiumFeatures } from "../hooks/usePremiumFeatures";
import { useGoogleAnalytics, AnalyticsEvents } from "../hooks/useGoogleAnalytics";
import { FEATURES } from "../lib/config";
import { STORY_CATEGORIES, getCategoryByValue, PORTFOLIO_LIMITS, PORTFOLIO_MESSAGES } from "../lib/portfolio-constants";
import { logger } from "../utils/logger";
import { supabase } from "../lib/supabase";
import AuthModal from "../components/forms/AuthModal";
import LiteraryEditor from "../components/ui/LiteraryEditor";
import PremiumLiteraryEditor from "../components/ui/PremiumLiteraryEditor";
import SEOHead from "../components/SEO/SEOHead";
import { Link } from "react-router-dom";

const WritePortfolio = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editStoryId = searchParams.get("edit");
  
  // Estados del formulario
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("other");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [originalStory, setOriginalStory] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Contexto global
  const { isAuthenticated, user, userStories, refreshUserData } = useGlobalApp();
  
  // Premium features
  const { isPremium, getWordLimit, checkWordLimit } = usePremiumFeatures();
  
  // Analytics
  const { trackEvent } = useGoogleAnalytics();

  // Verificar que el feature esté habilitado
  const isFeatureEnabled = FEATURES.PORTFOLIO_STORIES;

  // Verificar si el usuario puede acceder
  const canAccess = isFeatureEnabled && isPremium;

  // Límite de palabras para historias libres
  const wordLimit = isPremium ? PORTFOLIO_LIMITS.MAX_WORD_COUNT_PREMIUM : PORTFOLIO_LIMITS.MAX_WORD_COUNT_BASIC;

  // Cargar historia para edición
  useEffect(() => {
    const loadStoryForEdit = async () => {
      if (!editStoryId || !isAuthenticated) return;

      try {
        const { data: story, error } = await supabase
          .from('stories')
          .select('*')
          .eq('id', editStoryId)
          .eq('user_id', user.id)
          .is('contest_id', null) // Solo historias libres
          .single();

        if (error) throw error;

        if (story) {
          setTitle(story.title);
          setText(story.content);
          setCategory(story.category || 'other');
          setIsEditing(true);
          setOriginalStory(story);
          logger.info('📝 Historia cargada para edición', { storyId: story.id });
        }
      } catch (error) {
        logger.error('❌ Error cargando historia para edición:', error);
        setError('Error al cargar la historia para edición');
        navigate('/profile?tab=portafolio');
      }
    };

    loadStoryForEdit();
  }, [editStoryId, isAuthenticated, user?.id, navigate]);

  // Actualizar contador de palabras
  useEffect(() => {
    const words = text
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0).length;
    setWordCount(words);
  }, [text]);

  // Función para enviar historia
  const handleSubmit = async () => {
    setError("");

    // Validaciones
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    if (!canAccess) {
      setError(PORTFOLIO_MESSAGES.PREMIUM_REQUIRED);
      return;
    }

    if (!title.trim()) {
      setError("El título es obligatorio");
      return;
    }

    if (title.length > PORTFOLIO_LIMITS.MAX_TITLE_LENGTH) {
      setError(`El título no puede tener más de ${PORTFOLIO_LIMITS.MAX_TITLE_LENGTH} caracteres`);
      return;
    }

    if (!text.trim()) {
      setError("El contenido de la historia es obligatorio");
      return;
    }

    if (wordCount < PORTFOLIO_LIMITS.MIN_WORD_COUNT) {
      setError(`La historia debe tener al menos ${PORTFOLIO_LIMITS.MIN_WORD_COUNT} palabras`);
      return;
    }

    if (!checkWordLimit(wordCount, wordLimit)) {
      setError(PORTFOLIO_MESSAGES.WORD_LIMIT_EXCEEDED);
      return;
    }

    if (!category || category === '') {
      setError(PORTFOLIO_MESSAGES.CATEGORY_REQUIRED);
      return;
    }

    setIsSubmitting(true);

    try {
      // Generar excerpt
      const excerpt = text.replace(/<[^>]*>/g, '').substring(0, 200) + (text.length > 200 ? '...' : '');

      const storyData = {
        title: title.trim(),
        content: text,
        excerpt,
        word_count: wordCount,
        category,
        contest_id: null, // Clave: NULL para historias libres
        user_id: user.id,
        is_mature: false, // Por ahora no permitimos contenido maduro
        updated_at: new Date().toISOString()
      };

      if (isEditing && originalStory) {
        // Actualizar historia existente
        const { data, error } = await supabase
          .from('stories')
          .update(storyData)
          .eq('id', originalStory.id)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;

        trackEvent(AnalyticsEvents.STORY_UPDATED, {
          story_id: data.id,
          word_count: wordCount,
          category,
          is_portfolio: true
        });

        logger.info('✅ Historia del portafolio actualizada', { storyId: data.id });
        
      } else {
        // Crear nueva historia
        const { data, error } = await supabase
          .from('stories')
          .insert([storyData])
          .select()
          .single();

        if (error) throw error;

        trackEvent(AnalyticsEvents.STORY_SUBMITTED, {
          story_id: data.id,
          word_count: wordCount,
          category,
          is_portfolio: true
        });

        logger.info('✅ Nueva historia del portafolio creada', { storyId: data.id });
      }

      // Refrescar datos del usuario
      await refreshUserData();

      // Redirigir al portafolio
      navigate('/profile?tab=portafolio', { 
        state: { 
          message: isEditing ? PORTFOLIO_MESSAGES.SUCCESS_UPDATED : PORTFOLIO_MESSAGES.SUCCESS_PUBLISHED 
        }
      });

    } catch (error) {
      logger.error('❌ Error al enviar historia del portafolio:', error);
      setError('Error al guardar la historia. Por favor, inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mostrar página de acceso denegado si no puede acceder
  if (!isFeatureEnabled || !canAccess) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="text-center">
          <Crown className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Función Premium
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {!isAuthenticated 
              ? "Inicia sesión para acceder a las historias libres"
              : "Necesitas una cuenta Premium para crear historias libres"}
          </p>
          <div className="space-x-4">
            <Link
              to="/"
              className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-100 font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Volver al inicio
            </Link>
            {!isAuthenticated ? (
              <button
                onClick={() => setShowAuthModal(true)}
                className="btn-primary"
              >
                Iniciar Sesión
              </button>
            ) : (
              <Link to="/planes" className="btn-primary">
                Ver Planes Premium
              </Link>
            )}
          </div>
        </div>
        
        {showAuthModal && (
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            defaultMode="login"
          />
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      <SEOHead
        title={isEditing ? "Editar Historia Libre - Letranido" : "Escribir Historia Libre - Letranido"}
        description={isEditing ? "Edita tu historia libre en Letranido" : "Crea una historia libre sin restricciones de retos"}
        keywords="historia libre, escritura creativa, portafolio, premium"
        url="/write/portfolio"
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/profile?tab=portafolio"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <PenTool className="h-6 w-6 mr-2 text-purple-600" />
              {isEditing ? "Editar Historia Libre" : "Nueva Historia Libre"}
              <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                Premium
              </span>
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Libertad total para expresar tu creatividad
            </p>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-6">
        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 mr-3 flex-shrink-0" />
              <p className="text-red-800 dark:text-red-300 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Título */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Título de tu historia
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Un título que capture la esencia de tu historia..."
            maxLength={PORTFOLIO_LIMITS.MAX_TITLE_LENGTH}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {title.length}/{PORTFOLIO_LIMITS.MAX_TITLE_LENGTH} caracteres
          </p>
        </div>

        {/* Categoría */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Categoría
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {STORY_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.emoji} {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Editor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tu historia
          </label>
          {/* Editor Premium para historias libres */}
          {isPremium && FEATURES.PREMIUM_EDITOR ? (
            <PremiumLiteraryEditor
              value={text}
              onChange={setText}
              placeholder="Escribe tu historia aquí... Sin límites de retos, solo tu imaginación."
              className="min-h-[400px]"
              spellCheck={true}
              rows={25}
            />
          ) : (
            <LiteraryEditor
              value={text}
              onChange={setText}
              placeholder="Escribe tu historia aquí... Sin límites de retos, solo tu imaginación."
              className="min-h-[400px]"
            />
          )}
          
          {/* Contador de palabras */}
          <div className="flex items-center justify-between mt-2 text-sm">
            <span className={`font-medium ${
              wordCount > wordLimit ? 'text-red-600' : 
              wordCount > wordLimit * 0.9 ? 'text-yellow-600' : 
              'text-gray-600 dark:text-gray-400'
            }`}>
              {wordCount.toLocaleString()} / {wordLimit.toLocaleString()} palabras
            </span>
            
            {wordCount > wordLimit && (
              <span className="text-red-600 text-xs">
                Has excedido el límite de palabras
              </span>
            )}
          </div>
        </div>

        {/* Botón de envío */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Las historias libres son visibles para toda la comunidad
          </div>
          
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || wordCount === 0 || wordCount > wordLimit || !title.trim()}
            className={`
              flex items-center px-6 py-3 rounded-lg font-medium transition-all duration-300
              ${isSubmitting || wordCount === 0 || wordCount > wordLimit || !title.trim()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 hover:scale-105 shadow-lg'
              }
            `}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                {isEditing ? 'Actualizando...' : 'Publicando...'}
              </>
            ) : (
              <>
                {isEditing ? <Edit3 className="h-4 w-4 mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                {isEditing ? 'Actualizar Historia' : 'Publicar Historia'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Modal de autenticación */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          defaultMode="login"
        />
      )}
    </div>
  );
};

export default WritePortfolio;