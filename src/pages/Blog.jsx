import React from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Clock, 
  User, 
  Star,
  ArrowRight,
  Calendar,
  Tag,
  Share2
} from 'lucide-react';
import SEOHead from '../components/SEO/SEOHead';
import { categories, getPublishedPosts } from '../data/blogPosts';

const Blog = () => {
  const publishedPosts = getPublishedPosts();

  // Funciones para compartir en redes sociales
  const shareOnFacebook = (post) => {
    const url = `${window.location.origin}/recursos/blog/${post.slug}`;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
  };

  const shareOnTwitter = (post) => {
    const url = `${window.location.origin}/recursos/blog/${post.slug}`;
    const text = `${post.title} - ${post.excerpt}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
  };

  const shareOnLinkedIn = (post) => {
    const url = `${window.location.origin}/recursos/blog/${post.slug}`;
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
  };

  const shareOnPinterest = (post) => {
    const url = `${window.location.origin}/recursos/blog/${post.slug}`;
    const description = `${post.title} - ${post.excerpt}`;
    window.open(`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&description=${encodeURIComponent(description)}`, '_blank');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <SEOHead
        title="Blog de Recursos para Escritores"
        description="Descubre reseñas de libros, herramientas digitales, cursos de escritura y recursos especializados para mejorar tu craft como escritor."
        keywords="blog escritores, reseñas libros escritura, herramientas escritores, cursos escritura creativa, recursos literarios"
        url="/recursos/blog"
      />

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Simple Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 tracking-tight">
            Blog
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Recursos y recomendaciones para escritores
          </p>
        </div>

        {/* Blog Posts */}
        <div className="space-y-8">
          {publishedPosts.map(post => (
            <Link
              key={post.id}
              to={`/recursos/blog/${post.slug}`}
              className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/40 overflow-hidden hover:shadow-2xl hover:scale-[1.01] transition-all duration-300 block"
            >
              <div className="md:flex">
                {/* Image */}
                <div className="md:w-1/3">
                  <div className="h-48 md:h-full bg-gradient-to-br from-indigo-100 to-purple-200 relative overflow-hidden">
                    <img 
                      src={post.image} 
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 to-purple-200 items-center justify-center hidden">
                      <BookOpen className="h-12 w-12 text-indigo-600" />
                    </div>
                  </div>
                </div>
                
                {/* Content */}
                <div className="md:w-2/3 p-8">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">
                      {categories.find(cat => cat.id === post.category)?.name}
                    </span>
                    {post.featured && (
                      <Star className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-indigo-600 transition-colors">
                    {post.title}
                  </h3>
                  
                  <p className="text-gray-600 mb-6 line-clamp-3">
                    {post.excerpt}
                  </p>
                  
                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {post.tags.slice(0, 3).map(tag => (
                      <span 
                        key={tag} 
                        className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full flex items-center gap-1"
                      >
                        <Tag className="h-3 w-3" />
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Botones de compartir */}
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-sm text-gray-500 font-medium">Compartir:</span>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          shareOnFacebook(post);
                        }}
                        className="w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center transition-colors"
                        title="Compartir en Facebook"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          shareOnTwitter(post);
                        }}
                        className="w-8 h-8 bg-black hover:bg-gray-800 text-white rounded-full flex items-center justify-center transition-colors"
                        title="Compartir en Twitter/X"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          shareOnLinkedIn(post);
                        }}
                        className="w-8 h-8 bg-blue-700 hover:bg-blue-800 text-white rounded-full flex items-center justify-center transition-colors"
                        title="Compartir en LinkedIn"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          shareOnPinterest(post);
                        }}
                        className="w-8 h-8 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center transition-colors"
                        title="Compartir en Pinterest"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.719-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.163-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.749-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24c6.624 0 11.99-5.367 11.99-11.987C24.007 5.367 18.641.001.017 0z"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {post.author}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {post.readTime}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(post.publishedAt)}
                      </span>
                    </div>
                    <ArrowRight className="h-5 w-5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Navigation back to resources */}
        <div className="mt-16 text-center">
          <Link
            to="/writing-resources"
            className="inline-flex items-center px-8 py-4 bg-white/80 backdrop-blur-sm rounded-xl border border-indigo-200 text-indigo-700 font-semibold hover:bg-indigo-50 hover:shadow-lg hover:scale-105 transition-all duration-300"
          >
            <BookOpen className="h-5 w-5 mr-3" />
            Volver a Recursos de Escritura
            <ArrowRight className="h-5 w-5 ml-3" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Blog;