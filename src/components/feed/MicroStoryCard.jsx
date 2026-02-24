// components/feed/MicroStoryCard.jsx - Tarjeta de microhistoria estilo red social
import { useState } from "react";
import { Heart, MessageCircle, MoreVertical, Flag } from "lucide-react";
import UserCardWithBadges from "../ui/UserCardWithBadges";
import FeedStoryComments from "./FeedStoryComments";

const MicroStoryCard = ({
  story,
  onLike,
  isLiked,
  currentUserId,
  onDelete,
  onReport,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentsCount, setCommentsCount] = useState(story.comments_count || 0);
  const isAuthor = currentUserId === story.user_id;

  // Formatear tiempo relativo
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return "Ahora";
    if (seconds < 3600) return `Hace ${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `Hace ${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `Hace ${Math.floor(seconds / 86400)}d`;
    return date.toLocaleDateString("es-CO", { month: "short", day: "numeric" });
  };

  return (
    <div className="bg-white dark:bg-dark-800 rounded-xl border border-purple-100 dark:border-dark-600 p-4 hover:shadow-md hover:border-purple-200 dark:hover:border-dark-500 transition-all">
      {/* Header - Autor */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap">
          <UserCardWithBadges
            userId={story.user_id}
            userName={story.author}
            userEmail={`${story.author}@mock.com`}
            avatarSize="md"
            badgeSize="xs"
            maxBadges={1}
            className="flex shrink-0"
          />
          <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
            • {formatTimeAgo(story.created_at)} • {story.word_count} palabras
          </span>
        </div>

        {/* Menú de opciones */}
        <div className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors cursor-pointer"
          >
            <MoreVertical className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10 min-w-[150px]">
              {isAuthor && onDelete && (
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onDelete(story.id);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                >
                  Eliminar
                </button>
              )}
              {!isAuthor && onReport && (
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onReport(story.id);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 cursor-pointer"
                >
                  <Flag className="w-4 h-4" />
                  Reportar
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Título (opcional) */}
      {story.title && (
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-lg text-center tracking-wide">
          {story.title}
        </h3>
      )}

      {/* Contenido de la microhistoria */}
      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed text-base text-left mb-4">
        {story.content}
      </p>

      {/* Acciones */}
      <div className="flex items-center gap-6 pt-2 border-t border-gray-100 dark:border-gray-700">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onLike && onLike(story.id);
          }}
          className={`flex items-center gap-2 transition-colors cursor-pointer ${
            isLiked
              ? "text-red-500"
              : "text-gray-500 dark:text-gray-400 hover:text-red-500"
          }`}
        >
          <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
          {story.likes_count > 0 && (
            <span className="text-sm font-medium">{story.likes_count}</span>
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
      </div>

      {/* Sistema de comentarios expandible */}
      <FeedStoryComments
        storyId={story.id}
        initialCount={commentsCount}
        onCountChange={setCommentsCount}
        isOpen={showComments}
        onToggleOpen={setShowComments}
      />
    </div>
  );
};

export default MicroStoryCard;
