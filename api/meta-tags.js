import { readFileSync } from 'fs';
import { join } from 'path';

// Blog posts data (duplicado aquí para la función de Vercel)
const blogPosts = [
  {
    id: "libros-esenciales-escritores-2025",
    title: "5 Libros Esenciales que Todo Escritor Debe Leer en 2025",
    slug: "libros-esenciales-escritores-2025",
    excerpt: "Una selección curada de los mejores libros sobre escritura creativa disponibles en español. Clásicos atemporales que han transformado a miles de escritores.",
    author: "Equipo Letranido",
    publishedAt: "2025-07-30",
    readTime: "8 min",
    category: "libros",
    tags: ["lectura", "escritura creativa", "libros recomendados", "técnicas narrativas"],
    image: "/src/assets/images/blog-images/libros.jpg",
    featured: true,
    published: true,
  }
];

export default function handler(request, response) {
  const { slug } = request.query;
  const userAgent = request.headers['user-agent'] || '';
  
  // Detectar crawlers de redes sociales
  const isCrawler = /facebookexternalhit|twitterbot|linkedinbot|slackbot|whatsapp/i.test(userAgent);
  
  // Si no es un crawler, redirigir a la SPA normal
  if (!isCrawler) {
    return response.redirect(302, '/');
  }
  
  // Buscar el post
  const post = blogPosts.find(p => p.slug === slug);
  
  if (!post) {
    return response.redirect(302, '/');
  }
  
  // Base URL del sitio
  const baseUrl = 'https://letranido.com';
  const postUrl = `${baseUrl}/recursos/blog/${post.slug}`;
  const imageUrl = `${baseUrl}${post.image}`;
  
  // HTML con meta tags específicos del post
  const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  
  <!-- SEO básico -->
  <title>${post.title} | Letranido</title>
  <meta name="description" content="${post.excerpt}" />
  <meta name="keywords" content="${post.tags.join(', ')}" />
  <meta name="author" content="${post.author}" />
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="article" />
  <meta property="og:url" content="${postUrl}" />
  <meta property="og:title" content="${post.title}" />
  <meta property="og:description" content="${post.excerpt}" />
  <meta property="og:image" content="${imageUrl}" />
  <meta property="og:image:secure_url" content="${imageUrl}" />
  <meta property="og:image:type" content="image/jpeg" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="${post.title}" />
  <meta property="og:site_name" content="Letranido" />
  <meta property="og:locale" content="es_ES" />
  
  <!-- Article specific -->
  <meta property="article:published_time" content="${post.publishedAt}" />
  <meta property="article:author" content="${post.author}" />
  <meta property="article:section" content="Blog" />
  <meta property="article:publisher" content="Letranido" />
  ${post.tags.map(tag => `<meta property="article:tag" content="${tag}" />`).join('\n  ')}
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="${postUrl}" />
  <meta name="twitter:title" content="${post.title}" />
  <meta name="twitter:description" content="${post.excerpt}" />
  <meta name="twitter:image" content="${imageUrl}" />
  <meta name="twitter:image:alt" content="${post.title}" />
  
  <!-- JSON-LD -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "${post.title}",
    "description": "${post.excerpt}",
    "image": {
      "@type": "ImageObject",
      "url": "${imageUrl}",
      "width": 1200,
      "height": 630
    },
    "author": {
      "@type": "Person",
      "name": "${post.author}"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Letranido",
      "logo": {
        "@type": "ImageObject",
        "url": "${baseUrl}/logo.png"
      }
    },
    "datePublished": "${post.publishedAt}",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": "${postUrl}"
    },
    "url": "${postUrl}"
  }
  </script>
  
  <!-- Redirigir a la SPA después de que el crawler lea los meta tags -->
  <script>
    setTimeout(() => {
      window.location.href = '${postUrl}';
    }, 2000);
  </script>
</head>
<body>
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center;">
    <h1>${post.title}</h1>
    <p>${post.excerpt}</p>
    <p>Redirigiendo al artículo completo...</p>
  </div>
</body>
</html>`;

  response.setHeader('Content-Type', 'text/html');
  response.status(200).send(html);
}