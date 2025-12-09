import React from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import {
  ArrowLeft,
  Clock,
  User,
  Calendar,
  Tag,
  BookOpen,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import SEOHead from "../components/SEO/SEOHead";
import { getPostBySlug, getRecentPosts, categories } from "../data/blogPosts";

const BlogPost = () => {
  const { postId } = useParams();
  const post = getPostBySlug(postId);
  const recentPosts = getRecentPosts(3);

  // If post not found, redirect to blog
  if (!post) {
    return <Navigate to="/recursos/blog" replace />;
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Funciones para compartir en redes sociales
  const shareOnFacebook = () => {
    const url = window.location.href;
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      "_blank"
    );
  };

  const shareOnTwitter = () => {
    const url = window.location.href;
    const text = `${post.title} - ${post.excerpt}`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      "_blank"
    );
  };

  const shareOnLinkedIn = () => {
    const url = window.location.href;
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      "_blank"
    );
  };

  const shareOnPinterest = () => {
    const url = window.location.href;
    const description = `${post.title} - ${post.excerpt}`;
    window.open(
      `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&description=${encodeURIComponent(description)}`,
      "_blank"
    );
  };

  // Process content to render as HTML (improved markdown processing)
  const processContent = (content) => {
    // Remove first h1 title to avoid duplication with page title
    const withoutFirstTitle = content.replace(/^# .+\n\n?/, "");

    // Split by double newlines to handle paragraphs properly
    let processed = withoutFirstTitle
      // Handle headers (start with h2 since h1 is removed)
      .replace(
        /^# (.+)$/gm,
        '<h2 class="text-2xl font-bold text-gray-900 dark:text-dark-100 mb-4 mt-6">$1</h2>'
      )
      .replace(
        /^## (.+)$/gm,
        '<h2 class="text-2xl font-bold text-gray-900 dark:text-dark-100  mb-4 mt-6">$1</h2>'
      )
      .replace(
        /^### (.+)$/gm,
        '<h3 class="text-xl font-semibold text-gray-900 dark:text-dark-100  mb-3 mt-4">$1</h3>'
      )

      // Handle links (before bold and italic processing)
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, url) => {
        // Internal links (start with /) stay in same tab
        if (url.startsWith("/")) {
          return `<a href="${url}" class="text-indigo-600 hover:text-indigo-800 dark:text-indigo-200 dark:hover:text-indigo-100 font-semibold underline transition-colors">${text}</a>`;
        }
        // External links open in new tab
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:text-indigo-800 dark:text-indigo-200 dark:hover:text-indigo-100 font-semibold underline transition-colors">${text}</a>`;
      })

      // Handle bold and italic (after links)
      .replace(
        /\*\*(.+?)\*\*/g,
        '<strong class="font-bold text-gray-900 dark:text-dark-100 ">$1</strong>'
      )
      .replace(
        /\*(.+?)\*/g,
        '<em class="italic text-gray-800 dark:text-dark-200 ">$1</em>'
      )

      // Handle lists (process each list as a block)
      .replace(/^- (.+)$/gm, "|||LISTITEM|||$1|||ENDLISTITEM|||")

      // Split into blocks and process
      .split("\n\n")
      .map((block) => {
        // If it's a header, return as is
        if (
          block.includes("<h1>") ||
          block.includes("<h2>") ||
          block.includes("<h3>")
        ) {
          return block;
        }

        // If it contains list items, create a proper list
        if (block.includes("|||LISTITEM|||")) {
          const listItems = block
            .split("\n")
            .filter((line) => line.includes("|||LISTITEM|||"))
            .map((line) =>
              line.replace(
                /\|\|\|LISTITEM\|\|\|(.+)\|\|\|ENDLISTITEM\|\|\|/,
                '<li class="mb-2 text-gray-700 dark:text-dark-200 ">$1</li>'
              )
            )
            .join("\n");
          return `<ul class="list-disc list-inside space-y-2 mb-6 ml-4">${listItems}</ul>`;
        }

        // Regular paragraphs
        if (block.trim()) {
          return `<p class="mb-4 text-gray-700 dark:text-dark-200  leading-relaxed">${block.replace(/\n/g, "<br>")}</p>`;
        }

        return "";
      })
      .filter((block) => block.trim())
      .join("\n");

    return processed;
  };

  const categoryData = categories.find((cat) => cat.id === post.category);

  return (
    <div className="min-h-screen">
      <SEOHead
        title={`${post.title} | Blog Letranido - Recursos para Escritores`}
        description={`${post.excerpt} ⭐ Guía completa en Letranido | ${post.readTime} de lectura | Tips y recursos para escritores creativos`}
        keywords={`${post.tags.join(", ")}, escritura creativa, recursos escritores, letranido, guías escritura, ${post.category}`}
        image={
          post.image
            ? `https://letranido.com${post.image}`
            : `https://letranido.com/letranido-og.png`
        }
        url={`/recursos/blog/${post.slug}`}
        canonicalUrl={`https://letranido.com/recursos/blog/${post.slug}`}
        type="article"
        publishedTime={post.publishedAt}
        modifiedTime={post.updatedAt || post.publishedAt}
        author={post.author}
      />

      {/* JSON-LD Schema Markup para SEO */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: post.title,
          description: post.excerpt,
          image: post.image
            ? `https://letranido.com${post.image}`
            : `https://letranido.com/letranido-og.png`,
          author: {
            "@type": "Organization",
            name: post.author,
            url: "https://letranido.com",
          },
          publisher: {
            "@type": "Organization",
            name: "Letranido",
            logo: {
              "@type": "ImageObject",
              url: "https://letranido.com/letranido-logo.png",
            },
          },
          datePublished: post.publishedAt,
          dateModified: post.updatedAt || post.publishedAt,
          wordCount: Math.round(post.content.length / 6),
          articleSection: categoryData?.name || "Recursos",
          keywords: post.tags.join(", "),
          url: `https://letranido.com/recursos/blog/${post.slug}`,
          mainEntityOfPage: {
            "@type": "WebPage",
            "@id": `https://letranido.com/recursos/blog/${post.slug}`,
          },
          about: {
            "@type": "Thing",
            name: "Escritura Creativa",
          },
          inLanguage: "es-ES",
        })}
      </script>

      <section className="min-h-screen ">
        <div className="max-w-6xl mx-auto px-4 py-12">
          {/* Navigation */}
          <div className="mb-8">
            <Link
              to="/recursos/blog"
              className="inline-flex items-center text-indigo-600 hover:text-indigo-800 dark:text-indigo-200 dark:hover:text-indigo-100 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al blog
            </Link>
          </div>

          {/* Article Header */}
          <article className="bg-white/20 dark:bg-dark-900 backdrop-blur-md rounded-2xl shadow-xl border border-white/30 overflow-hidden">
            {/* Featured Image */}
            {post.image && (
              <div className="w-full h-64 md:h-96 overflow-hidden">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="p-8 md:p-12">
              {/* Category and meta */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm font-semibold rounded-full">
                    {categoryData?.name}
                  </span>
                </div>
                <div className="flex gap-2 justify-center sm:justify-end">
                  <button
                    onClick={shareOnFacebook}
                    className="w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center transition-colors"
                    title="Compartir en Facebook"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </button>

                  <button
                    onClick={shareOnTwitter}
                    className="w-8 h-8 bg-black hover:bg-gray-800 text-white rounded-full flex items-center justify-center transition-colors"
                    title="Compartir en Twitter/X"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </button>

                  <button
                    onClick={shareOnLinkedIn}
                    className="w-8 h-8 bg-blue-700 hover:bg-blue-800 text-white rounded-full flex items-center justify-center transition-colors"
                    title="Compartir en LinkedIn"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                  </button>

                  <button
                    onClick={shareOnPinterest}
                    className="w-8 h-8 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center transition-colors"
                    title="Compartir en Pinterest"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.719-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.163-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.749-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24c6.624 0 11.99-5.367 11.99-11.987C24.007 5.367 18.641.001.017 0z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-dark-100 mb-4 leading-tight">
                {post.title}
              </h1>

              {/* Excerpt */}
              <p className="text-xl text-gray-600 dark:text-dark-200 mb-6 leading-relaxed">
                {post.excerpt}
              </p>

              {/* Meta information */}
              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 dark:text-dark-300 mb-8 pb-8 border-b border-gray-200">
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
                {post.tags.slice(0, 3).map((tag) => (
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
                  __html: processContent(post.content),
                }}
              />

              {/* Share Section */}
              <div className="mt-12 pt-8 border-t border-gray-200">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-300 mb-4">
                    ¿Te gustó este artículo? ¡Compártelo!
                  </h3>
                  <div className="flex justify-center gap-3 mb-4">
                    <button
                      onClick={shareOnFacebook}
                      className="w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center transition-colors shadow-lg hover:shadow-xl"
                      title="Compartir en Facebook"
                    >
                      <svg
                        className="w-6 h-6"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    </button>

                    <button
                      onClick={shareOnTwitter}
                      className="w-12 h-12 bg-black hover:bg-gray-800 text-white rounded-full flex items-center justify-center transition-colors shadow-lg hover:shadow-xl"
                      title="Compartir en Twitter/X"
                    >
                      <svg
                        className="w-6 h-6"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    </button>

                    <button
                      onClick={shareOnLinkedIn}
                      className="w-12 h-12 bg-blue-700 hover:bg-blue-800 text-white rounded-full flex items-center justify-center transition-colors shadow-lg hover:shadow-xl"
                      title="Compartir en LinkedIn"
                    >
                      <svg
                        className="w-6 h-6"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                    </button>

                    <button
                      onClick={shareOnPinterest}
                      className="w-12 h-12 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center transition-colors shadow-lg hover:shadow-xl"
                      title="Compartir en Pinterest"
                    >
                      <svg
                        className="w-6 h-6"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.719-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.163-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.749-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24c6.624 0 11.99-5.367 11.99-11.987C24.007 5.367 18.641.001.017 0z" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-dark-300">
                    Ayúdanos a llegar a más escritores compartiendo este
                    contenido
                  </p>
                </div>
              </div>

              {/* Author bio */}
              <div className="mt-12 pt-8 border-t border-gray-200">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center">
                    <User className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-dark-200 mb-2">
                      {post.author}
                    </h4>
                    <p className="text-gray-600 dark:text-dark-300 text-sm">
                      El equipo de Letranido está formado por escritores y
                      lectores apasionados que se dedican a crear contenido útil
                      para la comunidad de escritores en español.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </article>

          {/* Related Posts */}
          {recentPosts.length > 0 && (
            <div className="mt-16">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-dark-100 mb-8">
                Artículos Recientes
              </h3>
              <div className="grid md:grid-cols-3 gap-6">
                {recentPosts
                  .filter((p) => p.id !== post.id)
                  .slice(0, 3)
                  .map((relatedPost) => (
                    <Link
                      key={relatedPost.id}
                      to={`/recursos/blog/${relatedPost.slug}`}
                      className="group bg-white/20 dark:bg-dark-800 backdrop-blur-md rounded-xl shadow-lg border border-white/30 overflow-hidden hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
                    >
                      <div className="p-6">
                        <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">
                          {
                            categories.find(
                              (cat) => cat.id === relatedPost.category
                            )?.name
                          }
                        </span>

                        <h4 className="text-lg font-bold text-gray-900 dark:text-dark-100 mt-3 mb-2 dark:group-hover:text-indigo-300 group-hover:text-indigo-600 transition-colors line-clamp-2">
                          {relatedPost.title}
                        </h4>

                        <p className="text-gray-600 dark:text-dark-300 text-sm mb-4 line-clamp-3">
                          {relatedPost.excerpt}
                        </p>

                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-dark-300">
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
          <div className="mt-16 text-center bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100 dark:from-dark-800 dark:via-dark-600 dark:to-dark-800 rounded-2xl p-8 border border-indigo-200 dark:border-indigo-500 shadow-xl">
            <h3 className="text-2xl font-bold text-gray-900 mb-4 dark:text-dark-100">
              ¿Te Gustó Este Artículo?
            </h3>
            <p className="text-gray-700 mb-6 max-w-2xl mx-auto dark:text-dark-300">
              Únete a nuestra comunidad de escritores y participa en retos
              mensuales donde podrás poner en práctica estos consejos.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/contest/current"
                className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
              >
                <BookOpen className="h-5 w-5 mr-2" />
                Ver Reto Actual
              </Link>
              <Link
                to="/blog"
                className="inline-flex items-center px-6 py-3 bg-white border border-indigo-200 text-indigo-700 rounded-xl hover:bg-indigo-50 transition-colors"
              >
                <ExternalLink className="h-5 w-5 mr-2" />
                Ver Más Posts
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BlogPost;
