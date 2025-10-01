import { Link } from 'react-router-dom';
import UserAvatar from './UserAvatar';

/**
 * Componente para enlazar al perfil público de un autor
 * @param {Object} author - Objeto del autor con id, display_name, name, etc.
 * @param {string} variant - Estilo del enlace ('simple', 'with-avatar', 'card')
 * @param {string} className - Clases CSS adicionales
 * @param {boolean} showAvatar - Mostrar avatar (solo para variant 'with-avatar')
 */
const AuthorLink = ({ 
  author, 
  variant = 'simple', 
  className = '', 
  showAvatar = false,
  avatarSize = 'sm'
}) => {
  if (!author || !author.id) {
    return <span className="text-gray-500">Autor desconocido</span>;
  }

  const authorName = author.display_name || author.name || 'Usuario';
  const authorUrl = `/author/${author.id}`;

  // Variante simple - solo texto enlazado
  if (variant === 'simple') {
    return (
      <Link 
        to={authorUrl}
        className={`text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors ${className}`}
        title={`Ver perfil de ${authorName}`}
      >
        {authorName}
      </Link>
    );
  }

  // Variante con avatar
  if (variant === 'with-avatar') {
    return (
      <Link 
        to={authorUrl}
        className={`flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors ${className}`}
        title={`Ver perfil de ${authorName}`}
      >
        {showAvatar && <UserAvatar user={author} size={avatarSize} />}
        <span className="font-medium">{authorName}</span>
      </Link>
    );
  }

  // Variante card - para uso en listas más elaboradas
  if (variant === 'card') {
    return (
      <Link 
        to={authorUrl}
        className={`flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${className}`}
        title={`Ver perfil de ${authorName}`}
      >
        <UserAvatar user={author} size={avatarSize} />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 dark:text-white truncate">
            {authorName}
          </p>
          {author.bio && (
            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
              {author.bio}
            </p>
          )}
        </div>
      </Link>
    );
  }

  return null;
};

export default AuthorLink;