// pages/MicroStoryPage.jsx - Página pública de una microhistoria (para compartir)
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Heart, MessageCircle, ArrowLeft, Zap, Calendar } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useGlobalApp } from "../contexts/GlobalAppContext";
import UserCardWithBadges from "../components/ui/UserCardWithBadges";
import FeedStoryComments from "../components/feed/FeedStoryComments";
import SEOHead from "../components/SEO/SEOHead";
import SocialShareDropdown from "../components/ui/SocialShareDropdown";

const MicroStoryPage = () => {
  const { id } = useParams();
  const { user } = useGlobalApp();

  const [story, setStory] = useState(null);
  const [prompt, setPrompt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [commentsCount, setCommentsCount] = useState(0);

  useEffect(() => {
    loadStory();
  }, [id]);

  useEffect(() => {
    if (story && user) {
      checkLike();
    }
  }, [story, user]);

  const loadStory = async () => {
    try {
      setLoading(true);

      // Cargar historia
      const { data: storyData, error } = await supabase
        .from("feed_stories")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !storyData) {
        setNotFound(true);
        return;
      }

      // Cargar nombre del autor
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("display_name")
        .eq("id", storyData.user_id)
        .single();

      // Cargar prompt asociado
      const { data: promptData } = await supabase
        .from("feed_prompts")
        .select("title, prompt_text, start_date, end_date")
        .eq("id", storyData.prompt_id)
        .single();

      setStory({
        ...storyData,
        author: profile?.display_name || "Usuario",
      });
      setLikesCount(storyData.likes_count || 0);
      setCommentsCount(storyData.comments_count || 0);
      setPrompt(promptData || null);
    } catch (err) {
      console.error("Error loading micro story:", err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const checkLike = async () => {
    if (!user || !story) return;
    const { data } = await supabase
      .from("feed_story_likes")
      .select("id")
      .eq("user_id", user.id)
      .eq("story_id", story.id)
      .maybeSingle();
    setIsLiked(!!data);
  };

  const handleLike = async () => {
    if (!user) return;

    // Optimistic update
    const wasLiked = isLiked;
    setIsLiked(!wasLiked);
    setLikesCount((prev) => prev + (wasLiked ? -1 : 1));

    try {
      await supabase.rpc("toggle_feed_story_like", {
        p_user_id: user.id,
        p_story_id: story.id,
      });
    } catch (err) {
      // Rollback
      setIsLiked(wasLiked);
      setLikesCount((prev) => prev + (wasLiked ? 1 : -1));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16 px-4">
        <div className="text-5xl mb-4">📖</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          Historia no encontrada
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Esta microhistoria no existe o fue eliminada por su autor.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 btn-primary"
        >
          <ArrowLeft className="w-4 h-4" />
          Ir a Letranido
        </Link>
      </div>
    );
  }

  const pageTitle = story.title
    ? `${story.title} — ${story.author}`
    : `Microhistoria de ${story.author}`;

  const pageDescription = story.content.slice(0, 160);

  return (
    <>
      <SEOHead
        title={pageTitle}
        description={pageDescription}
        url={`https://letranido.com/microhistoria/${story.id}`}
      />

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Volver */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Letranido
        </Link>

        {/* Badge de microhistoria */}
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
            <Zap className="w-3 h-3" />
            Microhistoria
          </span>
        </div>

        {/* Tarjeta principal */}
        <div className="bg-white dark:bg-dark-800 rounded-2xl border border-purple-100 dark:border-dark-600 shadow-sm overflow-hidden">
          <div className="p-6">
            {/* Autor y fecha */}
            <div className="flex items-center gap-2 flex-wrap mb-4">
              <UserCardWithBadges
                userId={story.user_id}
                userName={story.author}
                userEmail={`${story.author}@mock.com`}
                avatarSize="md"
                badgeSize="xs"
                maxBadges={1}
              />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                • {formatDate(story.created_at)} • {story.word_count} palabras
              </span>
            </div>

            {/* Título */}
            {story.title && (
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 text-center tracking-wide">
                {story.title}
              </h1>
            )}

            {/* Contenido */}
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed text-base">
              {story.content}
            </p>
          </div>

          {/* Prompt del que proviene */}
          {prompt && (
            <div className="mx-6 mb-4 p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800">
              <p className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Prompt — {formatDate(prompt.start_date)}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                "{prompt.prompt_text}"
              </p>
            </div>
          )}

          {/* Acciones */}
          <div className="px-6 py-3 border-t border-gray-100 dark:border-gray-700 flex items-center gap-6">
            <button
              type="button"
              onClick={handleLike}
              disabled={!user}
              title={!user ? "Inicia sesión para dar like" : ""}
              className={`flex items-center gap-2 transition-colors ${
                !user
                  ? "text-gray-400 cursor-not-allowed"
                  : isLiked
                  ? "text-red-500 cursor-pointer"
                  : "text-gray-500 dark:text-gray-400 hover:text-red-500 cursor-pointer"
              }`}
            >
              <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
              {likesCount > 0 && (
                <span className="text-sm font-medium">{likesCount}</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer"
            >
              <MessageCircle className="w-5 h-5" />
              {commentsCount > 0 && (
                <span className="text-sm font-medium">{commentsCount}</span>
              )}
            </button>

            <SocialShareDropdown
              shareData={{
                title: story.title || "Microhistoria en Letranido",
                text: story.title
                  ? `"${story.title}" — microhistoria en Letranido`
                  : "Lee esta microhistoria en Letranido",
                url: `${window.location.origin}/microhistoria/${story.id}`,
              }}
              compact={true}
              direction="up"
              variant="story"
              iconOnly={true}
            />
          </div>

          {/* Comentarios */}
          <FeedStoryComments
            storyId={story.id}
            initialCount={commentsCount}
            onCountChange={setCommentsCount}
            isOpen={showComments}
            onToggleOpen={setShowComments}
          />
        </div>

        {/* CTA para descubrir más */}
        <div className="mt-8 text-center p-6 rounded-2xl bg-linear-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-100 dark:border-purple-800">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            ¿Te gustó esta historia? Hay más en Letranido.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium px-5 py-2 rounded-full text-sm transition-all"
          >
            <Zap className="w-4 h-4" />
            Explorar microhistorias
          </Link>
        </div>
      </div>
    </>
  );
};

export default MicroStoryPage;
