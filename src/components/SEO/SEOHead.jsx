import { Helmet } from 'react-helmet-async';

const SEOHead = ({
  title,
  description,
  keywords,
  image,
  url,
  type = 'website',
  author,
  publishedTime,
  modifiedTime,
  canonicalUrl
}) => {
  // Configuración por defecto
  const defaultTitle = 'Letranido - Tu nido creativo de escritura';
  const defaultDescription = 'Participa en retos mensuales de escritura y conecta con una comunidad apasionada por las historias. Recibe feedback real, mantén tus derechos y crece como escritor.';
  const defaultKeywords = 'escritura creativa, retos de escritura, comunidad escritores, historias originales, ficción, narrativa, letranido';
  const defaultImage = '/OG_image.png';
  const baseUrl = import.meta.env.VITE_SITE_URL || 'https://www.letranido.com';
  
  const siteTitle = title ? `${title} | Letranido` : defaultTitle;
  const siteDescription = description || defaultDescription;
  const siteKeywords = keywords || defaultKeywords;
  // Asegurar que la imagen esté completamente especificada
  const siteImage = image 
    ? (image.startsWith('http') ? image : `${baseUrl}${image}`)
    : `${baseUrl}${defaultImage}`;
  const siteUrl = url ? `${baseUrl}${url}` : baseUrl;
  const canonical = canonicalUrl || siteUrl;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{siteTitle}</title>
      <meta name="description" content={siteDescription} />
      <meta name="keywords" content={siteKeywords} />
      <meta name="author" content={author || 'Letranido'} />
      <meta name="robots" content="index, follow" />
      <meta name="language" content="es" />
      <meta name="copyright" content="© 2024 Letranido" />
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonical} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={siteUrl} />
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={siteDescription} />
      <meta property="og:image" content={siteImage} />
      <meta property="og:image:secure_url" content={siteImage} />
      <meta property="og:image:type" content="image/jpeg" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={title || 'Letranido - Comunidad de Escritura Creativa'} />
      <meta property="og:site_name" content="Letranido" />
      <meta property="og:locale" content="es_ES" />
      <meta property="og:locale:alternate" content="en_US" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={siteUrl} />
      <meta name="twitter:title" content={siteTitle} />
      <meta name="twitter:description" content={siteDescription} />
      <meta name="twitter:image" content={siteImage} />
      <meta name="twitter:image:alt" content={title || 'Letranido - Comunidad de Escritura Creativa'} />
      <meta name="twitter:creator" content="@letranido" />
      <meta name="twitter:site" content="@letranido" />

      {/* Pinterest specific meta tags */}
      <meta name="pinterest:card" content="summary_large_image" />
      <meta name="pinterest-rich-pin" content="true" />
      <meta property="og:see_also" content={siteUrl} />
      
      {/* Article specific meta (for contest pages, stories, etc.) */}
      {type === 'article' && (
        <>
          {publishedTime && (
            <meta property="article:published_time" content={publishedTime} />
          )}
          {modifiedTime && (
            <meta property="article:modified_time" content={modifiedTime} />
          )}
          {author && (
            <meta property="article:author" content={author} />
          )}
          <meta property="article:section" content="Blog" />
          <meta property="article:publisher" content="Letranido" />
          {keywords && keywords.split(', ').slice(0, 5).map(tag => (
            <meta key={tag} property="article:tag" content={tag.trim()} />
          ))}
        </>
      )}
      
      {/* Additional SEO tags */}
      <meta name="theme-color" content="#4f46e5" />
      <meta name="msapplication-TileColor" content="#4f46e5" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="Letranido" />
      
      {/* JSON-LD Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(type === 'article' ? {
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": title,
          "description": siteDescription,
          "image": {
            "@type": "ImageObject",
            "url": siteImage,
            "width": 1200,
            "height": 630
          },
          "author": {
            "@type": "Person",
            "name": author || "Equipo Letranido"
          },
          "publisher": {
            "@type": "Organization",
            "name": "Letranido",
            "logo": {
              "@type": "ImageObject",
              "url": `${baseUrl}/logo.png`
            }
          },
          "datePublished": publishedTime,
          "dateModified": modifiedTime || publishedTime,
          "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": siteUrl
          },
          "url": siteUrl,
          "keywords": keywords
        } : {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Letranido",
          "description": defaultDescription,
          "url": baseUrl,
          "logo": `${baseUrl}/logo.png`,
          "sameAs": [
            "https://twitter.com/letranido",
            "https://instagram.com/letranido"
          ],
          "publisher": {
            "@type": "Organization",
            "name": "Letranido",
            "logo": {
              "@type": "ImageObject",
              "url": `${baseUrl}/logo.png`
            }
          },
          "potentialAction": {
            "@type": "SearchAction",
            "target": {
              "@type": "EntryPoint",
              "urlTemplate": `${baseUrl}/search?q={search_term_string}`
            },
            "query-input": "required name=search_term_string"
          }
        })}
      </script>
    </Helmet>
  );
};

export default SEOHead;