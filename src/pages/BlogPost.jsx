import React from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Clock, 
  User, 
  Calendar, 
  Tag, 
  Share2,
  BookOpen,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import SEOHead from '../components/SEO/SEOHead';
import AffiliateLink from '../components/ui/AffiliateLink';
import { getPostBySlug, getRecentPosts, categories } from '../data/blogPosts';

const BlogPost = () => {
  const { postId } = useParams();
  const post = getPostBySlug(postId);
  const recentPosts = getRecentPosts(3);

  // If post not found, redirect to blog
  if (!post) {
    return <Navigate to="/recursos/blog" replace />;
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const sharePost = async () => {
    const shareData = {
      title: post.title,
      text: post.excerpt,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Enlace copiado al portapapeles');
    }
  };

  // Process content to render as HTML (improved markdown processing)
  const processContent = (content) => {
    // Split by double newlines to handle paragraphs properly
    let processed = content
      // First handle headers (must be done before paragraph processing)
      .replace(/^# (.+)$/gm, '<h1 class="text-3xl font-bold text-gray-900 mb-6 mt-8 first:mt-0">$1</h1>')
      .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-bold text-gray-900 mb-4 mt-6">$1</h2>')
      .replace(/^### (.+)$/gm, '<h3 class="text-xl font-semibold text-gray-900 mb-3 mt-4">$1</h3>')
      
      // Handle links (before bold and italic processing)
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:text-indigo-800 font-semibold underline transition-colors">$1</a>')
      
      // Handle bold and italic (after links)
      .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-gray-900">$1</strong>')
      .replace(/\*(.+?)\*/g, '<em class="italic text-gray-800">$1</em>')
      
      // Handle lists (process each list as a block)
      .replace(/^- (.+)$/gm, '|||LISTITEM|||$1|||ENDLISTITEM|||')
      
      // Split into blocks and process
      .split('\n\n')
      .map(block => {
        // If it's a header, return as is
        if (block.includes('<h1>') || block.includes('<h2>') || block.includes('<h3>')) {
          return block;
        }
        
        // If it contains list items, create a proper list
        if (block.includes('|||LISTITEM|||')) {
          const listItems = block
            .split('\n')
            .filter(line => line.includes('|||LISTITEM|||'))
            .map(line => line.replace(/\|\|\|LISTITEM\|\|\|(.+)\|\|\|ENDLISTITEM\|\|\|/, '<li class="mb-2 text-gray-700">$1</li>'))
            .join('\n');
          return `<ul class="list-disc list-inside space-y-2 mb-6 ml-4">${listItems}</ul>`;
        }
        
        // Regular paragraphs
        if (block.trim()) {
          return `<p class="mb-4 text-gray-700 leading-relaxed">${block.replace(/\n/g, '<br>')}</p>`;
        }
        
        return '';
      })
      .filter(block => block.trim())
      .join('\n');
      
    return processed;
  };

  const categoryData = categories.find(cat => cat.id === post.category);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <SEOHead
        title={post.title}
        description={post.excerpt}
        keywords={post.tags.join(', ')}
        image={post.image}
        url={`/recursos/blog/${post.slug}`}
        type="article"
        publishedTime={post.publishedAt}
        author={post.author}
      />

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Navigation */}
        <div className="mb-8">
          <Link
            to="/recursos/blog"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al blog
          </Link>
        </div>

        {/* Article Header */}
        <article className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/40 overflow-hidden">
          <div className="p-8 md:p-12">
            {/* Category and meta */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm font-semibold rounded-full">
                  {categoryData?.name}
                </span>
                {post.featured && (
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm font-semibold rounded-full">
                    ⭐ Destacado
                  </span>
                )}
              </div>
              <button
                onClick={sharePost}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Compartir artículo"
              >
                <Share2 className="h-5 w-5" />
              </button>
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
              {post.title}
            </h1>

            {/* Excerpt */}
            <p className="text-xl text-gray-600 mb-6 leading-relaxed">
              {post.excerpt}
            </p>

            {/* Meta information */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 mb-8 pb-8 border-b border-gray-200">
              <span className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {post.author}
              </span>
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {formatDate(post.publishedAt)}
              </span>
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {post.readTime} de lectura
              </span>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-8">
              {post.tags.map(tag => (
                <span 
                  key={tag} 
                  className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full flex items-center gap-1"
                >
                  <Tag className="h-3 w-3" />
                  {tag}
                </span>
              ))}
            </div>

            {/* Content */}
            <div 
              className="max-w-none"
              dangerouslySetInnerHTML={{ 
                __html: processContent(post.content)
              }}
            />


            {/* Author bio */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center">
                  <User className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">{post.author}</h4>
                  <p className="text-gray-600 text-sm">
                    El equipo de Letranido está formado por escritores y lectores apasionados 
                    que se dedican a crear contenido útil para la comunidad de escritores en español.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </article>

        {/* Related Posts */}
        {recentPosts.length > 0 && (
          <div className="mt-16">
            <h3 className="text-2xl font-bold text-gray-900 mb-8">Artículos Recientes</h3>
            <div className="grid md:grid-cols-3 gap-6">
              {recentPosts.filter(p => p.id !== post.id).slice(0, 3).map(relatedPost => (
                <Link
                  key={relatedPost.id}
                  to={`/recursos/blog/${relatedPost.slug}`}
                  className="group bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/40 overflow-hidden hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
                >
                  <div className="p-6">
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">
                      {categories.find(cat => cat.id === relatedPost.category)?.name}
                    </span>
                    
                    <h4 className="text-lg font-bold text-gray-900 mt-3 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
                      {relatedPost.title}
                    </h4>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {relatedPost.excerpt}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {relatedPost.readTime}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(relatedPost.publishedAt)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-16 text-center bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100 rounded-2xl p-8 border border-indigo-200 shadow-xl">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            ¿Te Gustó Este Artículo?
          </h3>
          <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
            Únete a nuestra comunidad de escritores y participa en concursos mensuales 
            donde podrás poner en práctica estos consejos.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/contest/current"
              className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
            >
              <BookOpen className="h-5 w-5 mr-2" />
              Ver Concurso Actual
            </Link>
            <Link
              to="/writing-resources"
              className="inline-flex items-center px-6 py-3 bg-white border border-indigo-200 text-indigo-700 rounded-xl hover:bg-indigo-50 transition-colors"
            >
              <ExternalLink className="h-5 w-5 mr-2" />
              Más Recursos
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogPost;