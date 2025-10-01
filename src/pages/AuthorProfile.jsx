import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, BookOpen, Heart, Eye, MapPin, Globe, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import UserAvatar from '../components/ui/UserAvatar';
import SEOHead from '../components/SEO/SEOHead';

const AuthorProfile = () => {
  const { userId } = useParams();
  const [author, setAuthor] = useState(null);
  const [authorStories, setAuthorStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [storiesLoading, setStoriesLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, popular

  // Cargar datos del autor
  useEffect(() => {
    if (userId) {
      loadAuthorProfile();
    }
  }, [userId]);

  const loadAuthorProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Cargando perfil para userId:', userId);

      // Obtener perfil del autor
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('❌ Error perfil:', profileError);
        if (profileError.code === 'PGRST116') {
          setError('Autor no encontrado');
        } else {
          throw profileError;
        }
        return;
      }

      console.log('✅ Perfil encontrado:', profile.display_name);
      setAuthor(profile);
      await loadAuthorStories(profile.id);
    } catch (err) {
      console.error('Error cargando perfil del autor:', err);
      setError('Error al cargar el perfil del autor');
    } finally {
      setLoading(false);
    }
  };

  const loadAuthorStories = async (authorId) => {
    try {
      setStoriesLoading(true);
      console.log('📚 Buscando historias para userId:', authorId);

      // Obtener historias del autor (consulta simplificada)
      const { data, error } = await supabase
        .from('stories')
        .select(`
          id,
          title,
          content,
          excerpt,
          created_at,
          updated_at,
          likes_count,
          views_count,
          user_id,
          contest_id,
          is_featured,
          contest:contests(id, title, phase)
        `)
        .eq('user_id', authorId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error cargando historias:', error);
        throw error;
      }

      console.log('📚 Historias encontradas:', data?.length || 0);
      if (data?.length > 0) {
        console.log('📖 Primera historia:', data[0].title);
      }
      setAuthorStories(data || []);
    } catch (err) {
      console.error('Error cargando historias del autor:', err);
      setAuthorStories([]);
    } finally {
      setStoriesLoading(false);
    }
  };

  // Calcular estadísticas del autor
  const authorStats = useMemo(() => {
    if (!authorStories.length) return { totalStories: 0, totalLikes: 0, totalViews: 0 };

    return {
      totalStories: authorStories.length,
      totalLikes: authorStories.reduce((sum, story) => sum + (story.likes_count || 0), 0),
      totalViews: authorStories.reduce((sum, story) => sum + (story.views_count || 0), 0)
    };
  }, [authorStories]);

  // Ordenar historias según filtro
  const sortedStories = useMemo(() => {
    const stories = [...authorStories];
    
    switch (sortBy) {
      case 'oldest':
        return stories.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      case 'popular':
        return stories.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
      case 'newest':
      default:
        return stories.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
  }, [authorStories, sortBy]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="animate-pulse">
          <div className="h-48 bg-gray-200 rounded-lg mb-6"></div>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <div className="text-6xl mb-4">👤</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{error}</h1>
        <p className="text-gray-600 mb-8">
          El perfil que buscas no existe o no está disponible.
        </p>
        <Link to="/" className="btn-primary">
          Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title={`${author.display_name || author.name} - Perfil de Autor`}
        description={
          author.bio || 
          `Descubre las historias de ${author.display_name || author.name} en Letranido. ${authorStats.totalStories} historias publicadas con ${authorStats.totalLikes} likes recibidos.`
        }
        keywords={`${author.display_name}, autor, escritor, historias, letranido`}
        url={`/author/${userId}`}
      />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Botón de regreso */}
        <Link 
          to="/" 
          className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al inicio
        </Link>

        {/* Header del perfil */}
        <div className="bg-gradient-to-r from-primary-50 to-accent-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-8 mb-8">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <UserAvatar user={author} size="2xl" />
            
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {author.display_name || author.name}
              </h1>
              
              {/* Biografía */}
              {author.bio && (
                <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                  {author.bio}
                </p>
              )}
              
              {/* Información adicional */}
              <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  Miembro desde {new Date(author.created_at).toLocaleDateString('es-ES', { 
                    year: 'numeric', 
                    month: 'long' 
                  })}
                </div>
                
                {author.location && (
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {author.location}
                  </div>
                )}
                
                {author.website && (
                  <div className="flex items-center">
                    <Globe className="w-4 h-4 mr-1" />
                    <a 
                      href={author.website.startsWith('http') ? author.website : `https://${author.website}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:text-blue-600 transition-colors"
                    >
                      {author.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center shadow-sm">
            <div className="flex items-center justify-center mb-2">
              <BookOpen className="w-6 h-6 text-blue-600 mr-2" />
              <span className="text-2xl font-bold text-blue-600">{authorStats.totalStories}</span>
            </div>
            <p className="text-gray-600 dark:text-gray-400">Historias publicadas</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center shadow-sm">
            <div className="flex items-center justify-center mb-2">
              <Heart className="w-6 h-6 text-red-500 mr-2" />
              <span className="text-2xl font-bold text-red-500">{authorStats.totalLikes}</span>
            </div>
            <p className="text-gray-600 dark:text-gray-400">Likes recibidos</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center shadow-sm">
            <div className="flex items-center justify-center mb-2">
              <Eye className="w-6 h-6 text-green-600 mr-2" />
              <span className="text-2xl font-bold text-green-600">{authorStats.totalViews}</span>
            </div>
            <p className="text-gray-600 dark:text-gray-400">Lecturas totales</p>
          </div>
        </div>

        {/* Sección de historias */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Historias ({authorStats.totalStories})
              </h2>
              
              {/* Filtros de ordenamiento */}
              <div className="flex gap-2">
                <button
                  onClick={() => setSortBy('newest')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    sortBy === 'newest' 
                      ? 'bg-primary-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Más recientes
                </button>
                <button
                  onClick={() => setSortBy('popular')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    sortBy === 'popular' 
                      ? 'bg-primary-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Más populares
                </button>
                <button
                  onClick={() => setSortBy('oldest')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    sortBy === 'oldest' 
                      ? 'bg-primary-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Más antiguas
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            {storiesLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="h-32 bg-gray-200 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : sortedStories.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Sin historias aún
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {author.display_name || author.name} aún no ha publicado ninguna historia.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {sortedStories.map((story) => (
                  <div key={story.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <Link 
                        to={`/story/${story.id}`}
                        className="text-xl font-semibold text-gray-900 dark:text-white hover:text-primary-600 transition-colors"
                      >
                        {story.title}
                      </Link>
                      
                      {/* Badge de tipo de historia */}
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        story.contest 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {story.contest ? 'Reto' : 'Historia libre'}
                      </span>
                    </div>
                    
                    {/* Excerpt */}
                    {story.excerpt && (
                      <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                        {story.excerpt}
                      </p>
                    )}
                    
                    {/* Información del reto si aplica */}
                    {story.contest && (
                      <div className="mb-3">
                        <Link 
                          to={`/contest/${story.contest.id}`}
                          className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                        >
                          📝 {story.contest.title}
                        </Link>
                      </div>
                    )}
                    
                    {/* Estadísticas y fecha */}
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center">
                          <Heart className="w-4 h-4 mr-1" />
                          {story.likes_count || 0}
                        </span>
                        <span className="flex items-center">
                          <Eye className="w-4 h-4 mr-1" />
                          {story.views_count || 0}
                        </span>
                      </div>
                      
                      <time dateTime={story.created_at}>
                        {new Date(story.created_at).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </time>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AuthorProfile;