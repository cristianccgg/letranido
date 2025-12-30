// components/feed/MicroStoryCard.jsx - Tarjeta de microhistoria estilo red social
import React, { useState } from 'react';
import { Heart, MessageCircle, MoreVertical, Flag } from 'lucide-react';
import { Link } from 'react-router-dom';
import UserAvatar from '../ui/UserAvatar';
import UserCardWithBadges from '../ui/UserCardWithBadges';
import FeedStoryComments from './FeedStoryComments';

const MicroStoryCard = ({ story, onLike, isLiked, currentUserId, onDelete, onReport }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [commentsCount, setCommentsCount] = useState(story.comments_count || 0);
  const isAuthor = currentUserId === story.user_id;

  // Formatear tiempo relativo
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'Ahora';
    if (seconds < 3600) return `Hace ${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `Hace ${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `Hace ${Math.floor(seconds / 86400)}d`;
    return date.toLocaleDateString('es-CO', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-all">
      {/* Header - Autor */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Link to={`/author/${story.author?.id}`} className="shrink-0">
            <UserAvatar user={story.author} size="md" />
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Link
                to={`/author/${story.author?.id}`}
                className="font-bold text-gray-900 dark:text-white hover:underline truncate"
              >
                {story.author?.display_name || 'Usuario'}
              </Link>
              <UserCardWithBadges userId={story.author?.id} compact />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatTimeAgo(story.created_at)} • {story.word_count} palabras
            </p>
          </div>
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
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
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
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
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
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
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
        <h3 className="font-bold text-gray-900 dark:text-white mb-2">
          {story.title}
        </h3>
      )}

      {/* Contenido de la historia */}
      <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap mb-4 leading-relaxed">
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
          className={`flex items-center gap-2 transition-colors ${
            isLiked
              ? 'text-red-500'
              : 'text-gray-500 dark:text-gray-400 hover:text-red-500'
          }`}
        >
          <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
          {story.likes_count > 0 && (
            <span className="text-sm font-medium">{story.likes_count}</span>
          )}
        </button>

        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <MessageCircle className="w-5 h-5" />
          {commentsCount > 0 && (
            <span className="text-sm font-medium">{commentsCount}</span>
          )}
        </div>
      </div>

      {/* Sistema de comentarios expandible */}
      <FeedStoryComments
        storyId={story.id}
        initialCount={commentsCount}
        onCountChange={setCommentsCount}
      />
    </div>
  );
};

export default MicroStoryCard;
